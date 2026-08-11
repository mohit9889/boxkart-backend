const https = require('https');

const TARGET_URL = process.env.TARGET_URL || 'https://box-engine.onrender.com';

const endpoints = [
  { path: '/health', expectedStatus: 200 },
  { path: '/health/ready', expectedStatus: 200 },
  { path: '/api/reference', expectedStatus: 200 }
];

async function checkEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${TARGET_URL}${endpoint.path}`;
    console.log(`Checking ${url}...`);

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === endpoint.expectedStatus) {
          console.log(`✅ ${endpoint.path} returned ${res.statusCode}`);
          resolve(true);
        } else {
          console.error(`❌ ${endpoint.path} failed with status ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error(`❌ Error checking ${endpoint.path}: ${err.message}`);
      resolve(false);
    });
  });
}

async function runSmokeTests() {
  console.log(`Starting smoke tests against ${TARGET_URL}\n`);
  
  let allPassed = true;
  for (const endpoint of endpoints) {
    const passed = await checkEndpoint(endpoint);
    if (!passed) {
      allPassed = false;
    }
  }

  console.log('\n--- Smoke Test Results ---');
  if (allPassed) {
    console.log('🟢 All endpoints are healthy.');
    process.exit(0);
  } else {
    console.error('🔴 Smoke tests failed.');
    process.exit(1);
  }
}

runSmokeTests();
