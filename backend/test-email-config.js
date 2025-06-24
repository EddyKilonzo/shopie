require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('=== Email Configuration Test ===');
console.log('Environment variables:');
console.log('MAIL_HOST:', process.env.MAIL_HOST);
console.log('MAIL_PORT:', process.env.MAIL_PORT);
console.log('MAIL_SECURE:', process.env.MAIL_SECURE);
console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? '***SET***' : '***NOT SET***');
console.log('MAIL_FROM:', process.env.MAIL_FROM);
console.log('');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

// Test connection
async function testConnection() {
  try {
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Test sending email
    console.log('Testing email sending...');
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || '"Test" <test@example.com>',
      to: process.env.MAIL_USER, // Send to yourself for testing
      subject: 'Test Email from Shopie',
      text: 'This is a test email to verify your email configuration is working.',
      html: '<h1>Test Email</h1><p>This is a test email to verify your email configuration is working.</p>',
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testConnection(); 