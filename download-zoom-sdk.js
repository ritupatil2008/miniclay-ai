const https = require('https');
const fs = require('fs');
const path = require('path');

// Multiple SDK URLs to try
const sdkUrls = [
  'https://source.zoom.us/videosdk/2.22.5/lib/zoomus-websdk.umd.min.js',
  'https://source.zoom.us/videosdk/2.20.0/lib/zoomus-websdk.umd.min.js',
  'https://source.zoom.us/videosdk/latest/lib/zoomus-websdk.umd.min.js'
];

const outputFile = 'zoomus-websdk.umd.min.js';

async function downloadSDK(url) {
  return new Promise((resolve, reject) => {
    console.log(`Trying to download from: ${url}`);
    
    const file = fs.createWriteStream(outputFile);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Successfully downloaded SDK from ${url}`);
          resolve(true);
        });
      } else {
        console.log(`❌ Failed to download from ${url}. Status: ${response.statusCode}`);
        fs.unlink(outputFile, () => {}); // Delete the file on error
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      console.log(`❌ Network error downloading from ${url}:`, err.message);
      fs.unlink(outputFile, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function downloadZoomSDK() {
  console.log('🔄 Attempting to download Zoom Video SDK...\n');
  
  for (const url of sdkUrls) {
    try {
      await downloadSDK(url);
      
      // Verify the downloaded file
      const stats = fs.statSync(outputFile);
      if (stats.size > 1000) { // Should be at least 1KB
        console.log(`✅ SDK downloaded successfully! Size: ${stats.size} bytes`);
        console.log(`📁 Saved as: ${path.resolve(outputFile)}`);
        return true;
      } else {
        console.log('❌ Downloaded file is too small, trying next URL...');
        fs.unlinkSync(outputFile);
      }
    } catch (error) {
      console.log(`❌ Failed to download from ${url}:`, error.message);
      continue;
    }
  }
  
  console.log('❌ All download attempts failed');
  return false;
}

// Run the download
downloadZoomSDK().then((success) => {
  if (success) {
    console.log('\n🎉 Zoom SDK is now available locally!');
    console.log('The frontend will automatically use the local version if CDN fails.');
  } else {
    console.log('\n⚠️ Could not download SDK locally.');
    console.log('The frontend will try to load from CDN only.');
  }
}).catch(console.error);
