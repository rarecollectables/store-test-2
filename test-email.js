// Simple script to test email sending with Gmail credentials
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for Gmail credentials
console.log('=== Gmail Email Test ===');
console.log('Please enter your Gmail credentials:');

rl.question('Gmail Username: ', (username) => {
  rl.question('Gmail Password/App Password: ', (password) => {
    console.log('\nRunning email test with provided credentials...');
    
    try {
      // Run the test script with environment variables set
      const result = execSync(`GMAIL_USER="${username}" GMAIL_PASS="${password}" node netlify/functions/testAdminEmail.js`, {
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('Test execution failed:', error.message);
    }
    
    rl.close();
  });
});

// Handle CTRL+C
rl.on('SIGINT', () => {
  console.log('\nTest cancelled.');
  rl.close();
  process.exit(0);
});
