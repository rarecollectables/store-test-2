// netlify/functions/inbox-friendly-order-email.js
// A more inbox-friendly version of the order emails using Gmail SMTP
require('dotenv').config({ path: '../../.env' });
const nodemailer = require('nodemailer');

// Create a reusable transporter object using Gmail SMTP
const createTransporter = () => {
  // Check for required Gmail credentials
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error('Gmail credentials missing. Please set GMAIL_USER and GMAIL_PASS environment variables.');
  }
  
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

exports.handler = async function(event) {
  // Get the to_email from query or environment for manual test
  const to_email = (event.queryStringParameters && event.queryStringParameters.to_email) || process.env.ORDER_BCC_EMAIL;
  if (!to_email) {
    return { statusCode: 400, body: 'Missing to_email' };
  }
  
  // Get the email type (update, arriving-today, or delivered)
  const emailType = (event.queryStringParameters && event.queryStringParameters.type) || 'update';
  
  // Get order details from query parameters or use mock data
  const orderNumber = (event.queryStringParameters && event.queryStringParameters.order_number) || 'ORDER-' + Math.floor(Math.random() * 10000);
  const customerName = (event.queryStringParameters && event.queryStringParameters.customer_name) || 'Customer';
  const trackingCode = (event.queryStringParameters && event.queryStringParameters.tracking_code) || 'TRACK-' + Math.floor(Math.random() * 10000);
  const customMessage = (event.queryStringParameters && event.queryStringParameters.custom_message) || '';
  
  // Prepare email content based on type
  let subject, htmlContent, textContent;
  
  if (emailType === 'arriving-today') {
    // Order arriving today email
    subject = 'Your order is arriving today';
    
    htmlContent = `
    <div style="font-family:Arial,sans-serif; color:#333;">
      <p>Hi ${customerName},</p>
      
      <p>Just a quick note to let you know that your order #${orderNumber} is scheduled to arrive today!</p>
      
      <p>I wanted to make sure you're aware so you can keep an eye out for the delivery.</p>
      
      <p>If you have any questions or need any help, please reply to this email directly.</p>
      
      <p>Have a great day!</p>
      
      <p>Best regards,<br>
      Sarah<br>
      Rare Collectables</p>
    </div>
    `;
    
    textContent = `Hi ${customerName},

Just a quick note to let you know that your order #${orderNumber} is scheduled to arrive today!

I wanted to make sure you're aware so you can keep an eye out for the delivery.

If you have any questions or need any help, please reply to this email directly.

Have a great day!

Best regards,
Sarah
Rare Collectables`;
  } else if (emailType === 'delivered') {
    // Order delivered email
    subject = 'Has your order arrived safely?';
    
    htmlContent = `
    <div style="font-family:Arial,sans-serif; color:#333;">
      <p>Hi ${customerName},</p>
      
      <p>Great news! Your order #${orderNumber} has been delivered.</p>
      
      <p>I just wanted to check that everything arrived safely and that you're happy with your items.</p>
      
      <p>If you have any questions or need any help with your purchase, please reply to this email directly - I'm here to help.</p>
      
      <p>Thanks again for your order!</p>
      
      <p>Best regards,<br>
      Sarah<br>
      Rare Collectables</p>
    </div>
    `;
    
    textContent = `Hi ${customerName},

Great news! Your order #${orderNumber} has been delivered.

I just wanted to check that everything arrived safely and that you're happy with your items.

If you have any questions or need any help with your purchase, please reply to this email directly - I'm here to help.

Thanks again for your order!

Best regards,
Sarah
Rare Collectables`;
  } else {
    // Order update/shipping email
    subject = 'Quick update about your order';
    
    htmlContent = `
    <div style="font-family:Arial,sans-serif; color:#333;">
      <p>Hi ${customerName},</p>
      
      <p>I wanted to let you know that your order #${orderNumber} is on its way to you now.</p>
      
      <p>You can track your package with this tracking number: <strong>${trackingCode}</strong></p>
      
      <p>If you have any questions about your order or need any help, please don't hesitate to reply to this email directly.</p>
      
      <p>Thanks for shopping with us!</p>
      
      <p>Best regards,<br>
      Sarah<br>
      Rare Collectables</p>
    </div>
    `;
    
    textContent = `Hi ${customerName},

I wanted to let you know that your order #${orderNumber} is on its way to you now.

You can track your package with this tracking number: ${trackingCode}

If you have any questions about your order or need any help, please don't hesitate to reply to this email directly.

Thanks for shopping with us!

Best regards,
Sarah
Rare Collectables`;
  }

  // Add custom message if provided
  if (customMessage) {
    const customMessageHtml = `<p>${customMessage}</p>`;
    const customMessageText = `\n\n${customMessage}`;
    
    // Add custom message before the signature
    htmlContent = htmlContent.replace('<p>Best regards,<br>', `${customMessageHtml}\n\n<p>Best regards,<br>`);
    textContent = textContent.replace('\n\nBest regards,', `${customMessageText}\n\nBest regards,`);
  }

  // Create transporter for Gmail SMTP
  const transporter = createTransporter();
  
  // Send the email using Gmail SMTP
  const result = await transporter.sendMail({
    to: to_email,
    from: `"Sarah Wilson" <${process.env.GMAIL_USER}>`,
    subject: subject,
    text: textContent,
    html: htmlContent
  });
  
  console.log('Email sent via Gmail SMTP:', result);

  return { 
    statusCode: 200, 
    body: JSON.stringify({
      success: true,
      message: `Sent inbox-friendly ${emailType} email to ${to_email}`
    })
  };
};
