# 🤖 MiniClay AI - Intelligent Meeting Assistant

MiniClay AI is a sophisticated meeting assistant that joins Zoom meetings as a distinct participant, listens to conversations, processes them with AI, and responds using natural speech synthesis. It mimics Otter.ai's functionality while running completely locally on a $0 budget.

## ✨ Features

- **🎭 Distinct Bot Identity**: Joins as "Rohan - Sales Exec" (not your personal Zoom ID)
- **🎤 Real-time Audio Processing**: Listens to meeting conversations using AssemblyAI
- **🧠 AI-Powered Responses**: Processes conversations with OpenRouter's GPT-4
- **🗣️ Natural Speech Synthesis**: Responds using ElevenLabs TTS
- **📡 Real-time Communication**: WebSocket-based live interaction
- **💰 $0 Budget**: Uses free tiers and local hosting
- **🔒 Secure**: All API keys stored in environment variables

## 🚀 Quick Start

### Prerequisites
- Node.js (LTS version)
- Zoom API credentials
- OpenRouter API key
- ElevenLabs API key
- AssemblyAI API key

### Installation

1. **Clone/Download the project**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `config.env` and update with your API keys
   - Ensure all required APIs are configured

4. **Test the system**:
   ```bash
   node test-miniclay.js
   ```

5. **Start the AI server**:
   ```bash
   node miniclay-ai.js
   ```

6. **Open the frontend**:
   - Navigate to `http://localhost:3000/miniclay-frontend.html`

## 🎯 How to Use

### 1. Join a Meeting
- Enter your Zoom Meeting ID, password (if required), or full join link
- Click "🚀 Join Meeting"
- The bot will join as "Rohan - Sales Exec"

### 2. Start AI Assistant
- Click "🎙️ Start Listening" to begin audio capture
- The AI will process conversations in real-time
- Responses are generated and spoken automatically

### 3. Monitor Conversations
- View real-time conversation logs
- See AI responses and transcriptions
- Monitor participant activity

### 4. Leave Meeting
- Click "🚪 Leave Meeting" when done
- All connections and recordings stop automatically

## 🏗️ Architecture

### Backend (`miniclay-ai.js`)
- **Express Server**: Handles HTTP requests and serves frontend
- **WebSocket Server**: Real-time communication with frontend
- **Zoom Integration**: Joins meetings using Video SDK
- **AI Processing**: OpenRouter GPT-4 for conversation analysis
- **Audio Processing**: AssemblyAI for speech-to-text
- **TTS Generation**: ElevenLabs for text-to-speech

### Frontend (`miniclay-frontend.html`)
- **Modern UI**: Clean, responsive interface
- **Real-time Audio**: Microphone access and recording
- **WebSocket Client**: Live communication with backend
- **Conversation Log**: Real-time chat display
- **Audio Playback**: Plays AI-generated responses

### Configuration (`config.env`)
- **API Keys**: All external service credentials
- **Bot Settings**: Name, personality, and behavior
- **Zoom Credentials**: Account ID, Client ID, Client Secret

## 🔧 API Integration

### OpenRouter (AI Processing)
- **Model**: GPT-4
- **Purpose**: Conversation analysis and response generation
- **Rate Limits**: Based on your OpenRouter plan

### ElevenLabs (Text-to-Speech)
- **Voice**: Professional male voice
- **Model**: eleven_monolingual_v1
- **Quality**: High-quality speech synthesis

### AssemblyAI (Speech-to-Text)
- **Features**: Real-time transcription, speaker detection
- **Language**: Auto-detection
- **Accuracy**: High-accuracy speech recognition

### Zoom Video SDK
- **Integration**: Programmatic meeting joining
- **Authentication**: OAuth2 with JWT tokens
- **Features**: Participant management, audio streaming

## 📊 System Requirements

- **Node.js**: v16+ (LTS recommended)
- **Memory**: 512MB+ RAM
- **Storage**: 100MB+ free space
- **Network**: Stable internet connection
- **Browser**: Chrome (recommended for Zoom SDK)

## 🔒 Security & Privacy

- **API Keys**: Stored in environment variables, never committed
- **Audio Data**: Processed in real-time, not stored permanently
- **Meeting Access**: Uses your Zoom credentials, no data sharing
- **Local Processing**: All processing happens on your machine

## 🐛 Troubleshooting

### Common Issues

1. **"ZoomVideo is not defined"**
   - Check internet connection
   - Try refreshing the page
   - Use Chrome browser

2. **"Failed to get access token"**
   - Verify Zoom API credentials
   - Check Account ID format
   - Ensure credentials are active

3. **"Audio processing failed"**
   - Check microphone permissions
   - Verify AssemblyAI API key
   - Ensure stable internet connection

4. **"AI response failed"**
   - Check OpenRouter API key
   - Verify API quota/limits
   - Check internet connectivity

### Debug Mode
- Open browser console (F12) for detailed logs
- Check terminal output for server logs
- Use `node test-miniclay.js` to verify all APIs

## 🚀 Advanced Features

### Custom Bot Personality
Edit `config.env`:
```
BOT_PERSONALITY=You are a specialized AI assistant for [your domain]. Provide expert advice and insights.
```

### Voice Customization
Modify ElevenLabs voice settings in `miniclay-ai.js`:
```javascript
voice_settings: {
  stability: 0.5,      // 0-1, higher = more stable
  similarity_boost: 0.5 // 0-1, higher = more similar to original
}
```

### Meeting Analytics
The system tracks:
- Participant count
- Conversation history
- Response times
- Audio quality metrics

## 📈 Performance Optimization

- **Audio Chunk Size**: Adjust recording intervals (default: 1 second)
- **AI Response Length**: Limit max_tokens for faster responses
- **Memory Management**: Automatic cleanup of inactive meetings
- **Connection Pooling**: Efficient API request handling

## 🔄 Updates & Maintenance

### Regular Updates
- Check for API changes monthly
- Update dependencies quarterly
- Monitor API quotas and limits

### Backup Strategy
- Export conversation logs
- Backup configuration files
- Document custom modifications

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs and terminal output
3. Test individual APIs with `test-miniclay.js`
4. Verify all environment variables are set correctly

## 🎉 Success Metrics

Your MiniClay AI is working correctly when:
- ✅ Bot joins meetings as "Rohan - Sales Exec"
- ✅ Audio is captured and transcribed accurately
- ✅ AI generates relevant, contextual responses
- ✅ Speech synthesis plays responses clearly
- ✅ Conversation logs update in real-time

---

**MiniClay AI** - Your intelligent meeting companion, powered by cutting-edge AI technology! 🤖✨
