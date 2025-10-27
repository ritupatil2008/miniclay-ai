const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

const app = express();
app.use(express.json());
app.use(express.static('.'));

// Configuration from environment
const config = {
  zoom: {
    accountId: process.env.ZOOM_ACCOUNT_ID,
    clientId: process.env.ZOOM_CLIENT_ID,
    clientSecret: process.env.ZOOM_CLIENT_SECRET
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
    baseUrl: process.env.OPENROUTER_BASE_URL
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY
  },
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY
  },
  bot: {
    name: process.env.BOT_NAME || 'Rohan - Sales Exec',
    personality: process.env.BOT_PERSONALITY || 'You are Rohan, a helpful sales executive AI assistant.'
  }
};

// Global state for active meetings
const activeMeetings = new Map();

// Configure multer for audio uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Generate OAuth access token (optional - not required for Video SDK)
async function getAccessToken() {
  const tokenUrl = 'https://zoom.us/oauth/token';
  const auth = Buffer.from(`${config.zoom.clientId}:${config.zoom.clientSecret}`).toString('base64');
  try {
    const response = await axios.post(
      tokenUrl,
      'grant_type=account_credentials&account_id=' + config.zoom.accountId,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.log('⚠️ OAuth token not available (using Video SDK only):', error.message);
    return null; // Not critical for Video SDK
  }
}

// Generate Video SDK JWT
function generateSdkJwt(meetingId) {
  const payload = {
    app_key: config.zoom.clientId,
    tpc: meetingId,
    role_type: 0, // 0 for participant
    user_identity: config.bot.name,
    session_key: meetingId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiry
  };
  return jwt.sign(payload, config.zoom.clientSecret, { header: { alg: 'HS256', typ: 'JWT' } });
}

// Process audio with AssemblyAI
async function transcribeAudio(audioBuffer) {
  try {
    // Upload audio to AssemblyAI
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', audioBuffer, {
      headers: {
        'authorization': config.assemblyai.apiKey,
        'content-type': 'application/octet-stream'
      }
    });
    
    const audioUrl = uploadResponse.data.upload_url;
    
    // Start transcription
    const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
      audio_url: audioUrl,
      language_detection: true,
      speaker_labels: true
    }, {
      headers: {
        'authorization': config.assemblyai.apiKey,
        'content-type': 'application/json'
      }
    });
    
    const transcriptId = transcriptResponse.data.id;
    
    // Poll for completion
    let transcript = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (!transcript && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'authorization': config.assemblyai.apiKey }
      });
      
      if (statusResponse.data.status === 'completed') {
        transcript = statusResponse.data;
        break;
      }
      
      attempts++;
    }
    
    return transcript;
  } catch (error) {
    console.error('Transcription error:', error.message);
    return null;
  }
}

// Generate AI response using OpenRouter
async function generateAIResponse(transcript, context = '') {
  try {
    const messages = [
      {
        role: 'system',
        content: `${config.bot.personality}\n\nContext: ${context}\n\nRespond naturally to the conversation. Keep responses concise and professional.`
      },
      {
        role: 'user',
        content: `Meeting transcript: ${transcript}`
      }
    ];
    
    const response = await axios.post(`${config.openrouter.baseUrl}/chat/completions`, {
      model: config.openrouter.model,
      messages: messages,
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.openrouter.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI response error:', error.message);
    return "I'm processing that information. Could you please repeat?";
  }
}

// Generate speech using ElevenLabs
async function generateSpeech(text) {
  try {
    const response = await axios.post('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }, {
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': config.elevenlabs.apiKey
      },
      responseType: 'arraybuffer'
    });
    
    return response.data;
  } catch (error) {
    console.error('TTS error:', error.message);
    return null;
  }
}

// API endpoint to handle meeting join
app.post('/join-meeting', async (req, res) => {
  let { meetingId, password, joinLink } = req.body;
  console.log(`Received: meetingId=${meetingId}, password=${password}, joinLink=${joinLink}`);

  // Extract meetingId from joinLink if provided
  if (joinLink) {
    const match = joinLink.match(/\/j\/(\d+)/);
    if (match) meetingId = match[1];
    const pwdMatch = joinLink.match(/pwd=([^&]+)/);
    if (pwdMatch) password = pwdMatch[1];
  }

  if (!meetingId) {
    return res.status(400).json({ error: 'Meeting ID or valid join link required' });
  }

  try {
    console.log('Generating SDK JWT...');
    const sdkJwt = generateSdkJwt(meetingId);
    console.log('✅ SDK JWT generated.');

    // Try to get OAuth token (optional)
    const accessToken = await getAccessToken();
    if (accessToken) {
      console.log('✅ OAuth access token generated.');
    } else {
      console.log('ℹ️ Using Video SDK only (OAuth not required).');
    }

    // Initialize meeting state
    activeMeetings.set(meetingId, {
      id: meetingId,
      password: password || '',
      sdkJwt,
      botName: config.bot.name,
      participants: [],
      conversationHistory: [],
      isActive: false,
      lastActivity: Date.now()
    });

    res.json({ 
      meetingId, 
      password: password || '', 
      sdkJwt, 
      botName: config.bot.name,
      status: 'ready'
    });
  } catch (error) {
    console.error('❌ Failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to process audio and generate response
app.post('/process-audio/:meetingId', upload.single('audio'), async (req, res) => {
  const { meetingId } = req.params;
  const meeting = activeMeetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  try {
    console.log(`Processing audio for meeting ${meetingId}...`);
    
    // Read audio file
    const audioBuffer = fs.readFileSync(req.file.path);
    
    // Transcribe audio
    console.log('Transcribing audio...');
    const transcript = await transcribeAudio(audioBuffer);
    
    if (!transcript || !transcript.text) {
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }
    
    console.log('Transcript:', transcript.text);
    
    // Generate AI response
    console.log('Generating AI response...');
    const context = meeting.conversationHistory.slice(-3).join(' ');
    const aiResponse = await generateAIResponse(transcript.text, context);
    
    console.log('AI Response:', aiResponse);
    
    // Generate speech
    console.log('Generating speech...');
    const audioResponse = await generateSpeech(aiResponse);
    
    // Update meeting state
    meeting.conversationHistory.push(transcript.text);
    meeting.lastActivity = Date.now();
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      transcript: transcript.text,
      response: aiResponse,
      audio: audioResponse ? Buffer.from(audioResponse).toString('base64') : null,
      speakers: transcript.utterances || []
    });
    
  } catch (error) {
    console.error('❌ Audio processing failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get meeting status
app.get('/meeting-status/:meetingId', (req, res) => {
  const { meetingId } = req.params;
  const meeting = activeMeetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  
  res.json({
    meetingId: meeting.id,
    isActive: meeting.isActive,
    participants: meeting.participants,
    conversationHistory: meeting.conversationHistory,
    lastActivity: meeting.lastActivity
  });
});

// API endpoint to leave meeting
app.post('/leave-meeting/:meetingId', (req, res) => {
  const { meetingId } = req.params;
  const meeting = activeMeetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  
  activeMeetings.delete(meetingId);
  console.log(`Meeting ${meetingId} ended`);
  
  res.json({ status: 'left', meetingId });
});

// WebSocket endpoint for real-time communication
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'join-meeting') {
        const { meetingId } = data;
        const meeting = activeMeetings.get(meetingId);
        
        if (meeting) {
          meeting.isActive = true;
          ws.meetingId = meetingId;
          ws.send(JSON.stringify({ type: 'joined', meetingId }));
        }
      }
      
      if (data.type === 'audio-data') {
        const { meetingId, audioData } = data;
        const meeting = activeMeetings.get(meetingId);
        
        if (meeting && ws.meetingId === meetingId) {
          // Process audio in real-time
          const audioBuffer = Buffer.from(audioData, 'base64');
          const transcript = await transcribeAudio(audioBuffer);
          
          if (transcript && transcript.text) {
            const aiResponse = await generateAIResponse(transcript.text);
            const audioResponse = await generateSpeech(aiResponse);
            
            ws.send(JSON.stringify({
              type: 'response',
              transcript: transcript.text,
              response: aiResponse,
              audio: audioResponse ? Buffer.from(audioResponse).toString('base64') : null
            }));
          }
        }
      }
      
    } catch (error) {
      console.error('WebSocket error:', error.message);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (ws.meetingId) {
      const meeting = activeMeetings.get(ws.meetingId);
      if (meeting) {
        meeting.isActive = false;
      }
    }
  });
});

// Cleanup inactive meetings every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [meetingId, meeting] of activeMeetings) {
    if (now - meeting.lastActivity > 30 * 60 * 1000) { // 30 minutes
      activeMeetings.delete(meetingId);
      console.log(`Cleaned up inactive meeting ${meetingId}`);
    }
  }
}, 5 * 60 * 1000);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 MiniClay AI Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running at ws://localhost:8080`);
  console.log(`🤖 Bot Name: ${config.bot.name}`);
  console.log(`🧠 AI Model: ${config.openrouter.model}`);
  console.log(`🎤 TTS: ElevenLabs`);
  console.log(`📝 STT: AssemblyAI`);
  console.log(`Open http://localhost:3000 to access the popup.`);
});
