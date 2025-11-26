// Test script to check API endpoints
const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\n=== Testing ${method} ${path} ===`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${body}`);
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', (e) => {
      console.error(`\n=== Error testing ${method} ${path} ===`);
      console.error(e.message);
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting API endpoint tests...\n');

  try {
    // Test 1: GET /api/foods
    await testEndpoint('/api/foods');
    
    // Test 2: GET /api/foods with search
    await testEndpoint('/api/foods?search=chicken');
    
    // Test 3: GET /api/logs (should fail without params)
    await testEndpoint('/api/logs');
    
    // Test 4: GET /api/daily-summary (should fail without params)
    await testEndpoint('/api/daily-summary');
    
    // Test 5: GET /api/recommend (should fail without params)
    await testEndpoint('/api/recommend');
    
    console.log('\n=== All tests completed ===');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

runTests();
