const axios = require('axios');
require('dotenv').config({ path: './config.env' });

async function testMiniClayAI() {
  console.log('🧪 Testing MiniClay AI System...\n');
  
  // Test 1: Check environment variables
  console.log('1. Checking environment variables...');
  const requiredVars = [
    'OPENROUTER_API_KEY',
    'ELEVENLABS_API_KEY', 
    'ASSEMBLYAI_API_KEY',
    'ZOOM_CLIENT_ID'
  ];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: ${process.env[varName].substring(0, 10)}...`);
    } else {
      console.log(`   ❌ ${varName}: Not found`);
    }
  }
  
  // Test 2: Test OpenRouter API
  console.log('\n2. Testing OpenRouter API...');
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Rohan, a helpful sales executive AI assistant.'
        },
        {
          role: 'user',
          content: 'Hello, can you introduce yourself?'
        }
      ],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   ✅ OpenRouter API working');
    console.log(`   Response: ${response.data.choices[0].message.content}`);
  } catch (error) {
    console.log('   ❌ OpenRouter API failed:', error.message);
  }
  
  // Test 3: Test ElevenLabs API
  console.log('\n3. Testing ElevenLabs API...');
  try {
    const response = await axios.post('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
      text: 'Hello, this is a test.',
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }, {
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      responseType: 'arraybuffer'
    });
    
    console.log('   ✅ ElevenLabs API working');
    console.log(`   Audio size: ${response.data.byteLength} bytes`);
  } catch (error) {
    console.log('   ❌ ElevenLabs API failed:', error.message);
  }
  
  // Test 4: Test AssemblyAI API
  console.log('\n4. Testing AssemblyAI API...');
  try {
    const response = await axios.get('https://api.assemblyai.com/v2/transcript', {
      headers: {
        'authorization': process.env.ASSEMBLYAI_API_KEY
      }
    });
    
    console.log('   ✅ AssemblyAI API working');
    console.log(`   API accessible`);
  } catch (error) {
    console.log('   ❌ AssemblyAI API failed:', error.message);
  }
  
  // Test 5: Test Zoom API
  console.log('\n5. Testing Zoom API...');
  try {
    const auth = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      'https://zoom.us/oauth/token',
      'grant_type=account_credentials&account_id=' + process.env.ZOOM_ACCOUNT_ID,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('   ✅ Zoom API working');
    console.log(`   Access token generated`);
  } catch (error) {
    console.log('   ❌ Zoom API failed:', error.message);
  }
  
  console.log('\n🎉 MiniClay AI System Test Complete!');
  console.log('\nTo start the AI server, run: node miniclay-ai.js');
  console.log('Then open: http://localhost:3000/miniclay-frontend.html');
}

testMiniClayAI().catch(console.error);
