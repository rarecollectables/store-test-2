// Test script for admin email sending
require('dotenv').config({ path: '../../.env' });
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Test email data
const testData = {
  to: process.env.GMAIL_USER, // Send to yourself for testing
  customerName: 'Test Customer',
  orderNumber: 'TEST-' + Math.floor(Math.random() * 10000),
  trackingCode: 'TRACK123456',
  trackingUrl: 'https://tracking.example.com/TRACK123456',
  shippingAddress: {
    name: 'Test Customer',
    line1: '123 Test Street',
    city: 'Test City',
    postcode: 'TE1 1ST'
  }
};

// Create a reusable transporter object using Gmail SMTP
const createTransporter = () => {
  // Check for required Gmail credentials
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error('Gmail credentials missing. Please set GMAIL_USER and GMAIL_PASS environment variables.');
  }
  
  console.log(`Using Gmail account: ${process.env.GMAIL_USER}`);
  
  return nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
    debug: true, // Enable debug output
    logger: true // Log information to the console
  });
};

// Load and compile the email template
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, `${templateName}.hbs`);
  try {
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

// Send an order update email
const sendOrderUpdateEmail = async () => {
  try {
    console.log('Loading order update template...');
    const orderUpdateTemplate = loadTemplate('order-update-email');
    
    // Prepare order data for the template
    const orderData = {
      customerName: testData.customerName,
      orderNumber: testData.orderNumber,
      items: [
        { name: 'Test Product 1', quantity: 1, price: '19.99' },
        { name: 'Test Product 2', quantity: 2, price: '29.99' }
      ],
      total: '79.97',
      trackingCode: testData.trackingCode,
      trackingUrl: testData.trackingUrl,
      shippingAddress: `${testData.shippingAddress.name}<br>${testData.shippingAddress.line1}<br>${testData.shippingAddress.city}, ${testData.shippingAddress.postcode}`,
      relatedProducts: [
        {
          name: 'Related Product 1',
          image: 'https://via.placeholder.com/150',
          url: 'https://example.com/product1'
        }
      ],
      year: new Date().getFullYear()
    };
    
    // Generate HTML from template
    console.log('Generating email HTML from template...');
    const html = orderUpdateTemplate(orderData);
    
    // Generate a plain-text version
    const text = `Hi ${orderData.customerName},\n\nYour order #${orderData.orderNumber} is on its way!\nTracking code: ${orderData.trackingCode}\nTrack your order: ${orderData.trackingUrl}\n\nThank you for shopping with Rare Collectables!`;
    
    // Create transporter
    console.log('Creating email transporter...');
    const transporter = createTransporter();
    
    // Prepare email data
    const mailOptions = {
      from: `"Rare Collectables" <${process.env.GMAIL_USER}>`,
      to: testData.to,
      subject: 'Your Order Update from Rare Collectables',
      text: text,
      html: html,
      replyTo: 'rarecollectablessales@gmail.com'
    };
    
    // Add BCC if configured
    if (process.env.ORDER_BCC_EMAIL) {
      mailOptions.bcc = process.env.ORDER_BCC_EMAIL;
    }
    
    // Send email
    console.log(`Sending test email to ${testData.to}...`);
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result);
    return { success: true, message: 'Email sent successfully', result };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: `Failed to send email: ${error.message}`, error };
  }
};

// Send an inbox-friendly email
const sendInboxFriendlyEmail = async () => {
  try {
    console.log('Creating email transporter for inbox-friendly email...');
    const transporter = createTransporter();
    
    // Prepare email content
    const subject = 'Quick update about your order';
    const htmlContent = `
    <div style="font-family:Arial,sans-serif; color:#333;">
      <p>Hi ${testData.customerName},</p>
      
      <p>I wanted to let you know that your order #${testData.orderNumber} is on its way to you now.</p>
      
      <p>You can track your package with this tracking number: <strong>${testData.trackingCode}</strong></p>
      
      <p>If you have any questions about your order or need any help, please don't hesitate to reply to this email directly.</p>
      
      <p>Thanks for shopping with us!</p>
      
      <p>Best regards,<br>
      Sarah<br>
      Rare Collectables</p>
    </div>
    `;
    
    const textContent = `Hi ${testData.customerName},

I wanted to let you know that your order #${testData.orderNumber} is on its way to you now.

You can track your package with this tracking number: ${testData.trackingCode}

If you have any questions about your order or need any help, please don't hesitate to reply to this email directly.

Thanks for shopping with us!

Best regards,
Sarah
Rare Collectables`;
    
    // Send the email
    console.log(`Sending inbox-friendly test email to ${testData.to}...`);
    const result = await transporter.sendMail({
      to: testData.to,
      from: `"Rare Collectables" <${process.env.GMAIL_USER}>`,
      subject: subject,
      text: textContent,
      html: htmlContent
    });
    
    console.log('Inbox-friendly email sent successfully:', result);
    return { success: true, message: 'Inbox-friendly email sent successfully', result };
  } catch (error) {
    console.error('Error sending inbox-friendly email:', error);
    return { success: false, message: `Failed to send inbox-friendly email: ${error.message}`, error };
  }
};

// Run the tests
const runTests = async () => {
  console.log('Starting email tests...');
  
  // Test order update email
  console.log('\n=== Testing Order Update Email ===');
  const orderUpdateResult = await sendOrderUpdateEmail();
  console.log('Order Update Email Test Result:', orderUpdateResult.success ? 'SUCCESS' : 'FAILED');
  
  // Test inbox-friendly email
  console.log('\n=== Testing Inbox-Friendly Email ===');
  const inboxFriendlyResult = await sendInboxFriendlyEmail();
  console.log('Inbox-Friendly Email Test Result:', inboxFriendlyResult.success ? 'SUCCESS' : 'FAILED');
  
  console.log('\n=== Email Tests Complete ===');
  return {
    orderUpdate: orderUpdateResult,
    inboxFriendly: inboxFriendlyResult
  };
};

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('All tests completed.');
      process.exit(results.orderUpdate.success && results.inboxFriendly.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

module.exports = {
  sendOrderUpdateEmail,
  sendInboxFriendlyEmail,
  runTests
};
