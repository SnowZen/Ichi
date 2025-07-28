// Simple test script to verify production build works
import { spawn } from 'child_process';

console.log('🧪 Testing production build...');

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = '3001';

// Start the server
const server = spawn('node', ['dist/server/node-build.mjs'], {
  stdio: 'pipe',
  env: process.env
});

let output = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log(data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.error('ERROR:', data.toString().trim());
});

// Test for 3 seconds then kill
setTimeout(() => {
  server.kill();
  
  if (output.includes('server running on port')) {
    console.log('✅ Production server test passed!');
    process.exit(0);
  } else {
    console.log('❌ Production server test failed!');
    process.exit(1);
  }
}, 3000);
