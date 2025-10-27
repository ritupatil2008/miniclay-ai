const https = require('https');
const fs = require('fs');

const sdkUrl = 'https://source.zoom.us/videosdk/2.22.5/lib/zoomus-websdk.umd.min.js';
const outputFile = 'zoomus-websdk.umd.min.js';

console.log('Downloading Zoom Video SDK...');

const file = fs.createWriteStream(outputFile);
https.get(sdkUrl, (response) => {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ Zoom SDK downloaded successfully as zoomus-websdk.umd.min.js');
      console.log('You can now use the local version if CDN fails.');
    });
  } else {
    console.log('❌ Failed to download SDK. Status:', response.statusCode);
  }
}).on('error', (err) => {
  console.log('❌ Download failed:', err.message);
  fs.unlink(outputFile, () => {}); // Delete the file on error
});
