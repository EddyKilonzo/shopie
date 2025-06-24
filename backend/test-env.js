require('dotenv').config();

console.log('=== Environment Variables Test ===');
console.log('APP_RESET_URL:', process.env.APP_RESET_URL);
console.log('APP_URL:', process.env.APP_URL);
console.log('APP_LOGIN_URL:', process.env.APP_LOGIN_URL);
console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? '***SET***' : '***NOT SET***');
console.log('');

// Test the reset URL generation
const resetToken = 'test-token-123';
const appResetUrl = process.env.APP_RESET_URL;
const resetUrl = appResetUrl || `http://localhost:3000/reset-password?token=${resetToken}`;

console.log('Reset URL generation test:');
console.log('APP_RESET_URL from env:', appResetUrl);
console.log('Final reset URL:', resetUrl); 