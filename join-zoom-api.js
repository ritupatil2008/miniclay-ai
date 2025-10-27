const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.static('.')); // Serve index.html

// Zoom API credentials
const accountId = 'rSgJEIk6TNSqT2phX-xvGg';
const clientId = 'dAM94lkvTT6ygaXIXVgBQ';
const clientSecret = 'al3Fo361YTrp05tCGD2SGc1oPShD2ks5';
const botName = 'Rohan - Sales Exec';
const durationMinutes = 5;

// Generate OAuth access token
async function getAccessToken() {
  const tokenUrl = 'https://zoom.us/oauth/token';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  try {
    const response = await axios.post(
      tokenUrl,
      'grant_type=account_credentials&account_id=' + accountId,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to get access token: ' + error.message);
  }
}

// Generate Video SDK JWT
function generateSdkJwt(meetingId) {
  const payload = {
    app_key: clientId,
    tpc: meetingId,
    role_type: 0, // 0 for participant (guest-like, like Otter)
    user_identity: botName,
    session_key: meetingId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiry
  };
  return jwt.sign(payload, clientSecret, { header: { alg: 'HS256', typ: 'JWT' } });
}

// API endpoint to handle form submission
app.post('/join-meeting', async (req, res) => {
  let { meetingId, password, joinLink } = req.body;
  console.log(`Received request: meetingId=${meetingId}, password=${password}, joinLink=${joinLink}`);

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
    console.log('Generating access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token generated.');

    console.log('Generating SDK JWT...');
    const sdkJwt = generateSdkJwt(meetingId);
    console.log('✅ SDK JWT generated.');

    // Send JWT and meeting details to frontend
    res.json({ meetingId, password: password || '', sdkJwt, botName });
  } catch (error) {
    console.error('❌ Failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT} at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
  console.log('Open http://localhost:3000 to access the popup.');
});
