// Netlify function to handle sending admin-triggered emails
require('dotenv').config({ path: '../../.env' });
const sendOrderUpdateEmail = require('./sendOrderUpdateEmail');
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

// Import the inbox-friendly email handler
const { handler: inboxFriendlyEmailHandler } = require('./inbox-friendly-order-email');

// You can add more templates here as needed
const TEMPLATES = {
  'order-confirmation': {
    subject: 'Your Order Confirmation from Rare Collectables',
    handler: sendOrderUpdateEmail,
  },
  'order-update': {
    subject: 'Your Order Update from Rare Collectables',
    handler: sendOrderUpdateEmail,
  },
  'enquiry-reply': {
    subject: 'Reply to Your Enquiry from Rare Collectables',
    handler: async ({ to, subject, data, customMessage }) => {
      // Create a transporter using Gmail SMTP
      const transporter = createTransporter();
      
      // Prepare the message content
      const messageText = data.text || data.message || 'Thank you for contacting us.';
      const messageHtml = data.html || `<p>${data.message || 'Thank you for contacting us.'}</p>`;
      
      // Add custom message if provided
      const finalText = customMessage ? `${messageText}\n\n${customMessage}` : messageText;
      const finalHtml = customMessage ? `${messageHtml}<p>${customMessage}</p>` : messageHtml;
      
      // Send email using Nodemailer
      return transporter.sendMail({
        from: `"Rare Collectables" <${process.env.GMAIL_USER}>`,
        to,
        subject: subject || 'Reply to Your Enquiry',
        text: finalText,
        html: finalHtml
      });
    }
  },
  // Inbox-friendly email templates
  'inbox-friendly-update': {
    subject: 'Quick update about your order',
    handler: async ({ to, data }) => {
      // Create a mock event object for the inbox-friendly handler
      const mockEvent = {
        queryStringParameters: {
          to_email: to,
          type: 'update',
          order_number: data.id || data.orderNumber || 'ORDER-' + Math.floor(Math.random() * 10000),
          customer_name: data.customerName || data.name || 'Customer',
          tracking_code: data.trackingCode || ''
        }
      };
      return inboxFriendlyEmailHandler(mockEvent);
    }
  },
  'inbox-friendly-arriving': {
    subject: 'Your order is arriving today',
    handler: async ({ to, data }) => {
      // Create a mock event object for the inbox-friendly handler
      const mockEvent = {
        queryStringParameters: {
          to_email: to,
          type: 'arriving-today',
          order_number: data.id || data.orderNumber || 'ORDER-' + Math.floor(Math.random() * 10000),
          customer_name: data.customerName || data.name || 'Customer'
        }
      };
      return inboxFriendlyEmailHandler(mockEvent);
    }
  },
  'inbox-friendly-delivered': {
    subject: 'Has your order arrived safely?',
    handler: async ({ to, data }) => {
      // Create a mock event object for the inbox-friendly handler
      const mockEvent = {
        queryStringParameters: {
          to_email: to,
          type: 'delivered',
          order_number: data.id || data.orderNumber || 'ORDER-' + Math.floor(Math.random() * 10000),
          customer_name: data.customerName || data.name || 'Customer'
        }
      };
      return inboxFriendlyEmailHandler(mockEvent);
    }
  }
};

exports.handler = async function(event) {
  const logs = [];
  function log(msg, obj) {
    if (obj !== undefined) {
      logs.push(msg + ' ' + JSON.stringify(obj));
    } else {
      logs.push(msg);
    }
  }
  if (event.httpMethod !== 'POST') {
    log('Method not allowed');
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    log('Incoming event.body:', event.body);
    const { to, template, subject, data } = JSON.parse(event.body);
    log('Parsed payload:', { to, template, subject, data });
    if (!to || !template || !TEMPLATES[template]) {
      log('Missing required fields or unknown template.');
      return { statusCode: 400, body: 'Missing required fields or unknown template.' };
    }
    const handler = TEMPLATES[template].handler;
    const emailSubject = subject || TEMPLATES[template].subject;
    log('Using template:', template);
    let sendResult = null;
    // For order templates, pass data as order/orderData
    if (template === 'order-confirmation' || template === 'order-update') {
      sendResult = await handler({
        to,
        order: data,
        subject: emailSubject,
        trackingCode: data.trackingCode,
        trackingUrl: data.trackingUrl,
        relatedProducts: data.relatedProducts || []
      });
      log('Order email send result:', sendResult);
    } else if (template === 'enquiry-reply') {
      sendResult = await handler({ 
        to, 
        subject: emailSubject, 
        data,
        customMessage: data.customMessage || ''
      });
      log('Enquiry email send result:', sendResult);
    } else if (template.startsWith('inbox-friendly-')) {
      try {
        // Create a custom event with all the data we need
        const mockEvent = {
          queryStringParameters: {
            to_email: to,
            type: template.replace('inbox-friendly-', ''),
            order_number: data.id || data.orderNumber || 'ORDER-' + Math.floor(Math.random() * 10000),
            customer_name: data.customerName || data.name || 'Customer',
            tracking_code: data.trackingCode || '',
            custom_message: data.customMessage || ''
          }
        };
        
        // Call the inbox-friendly handler directly
        const result = await inboxFriendlyEmailHandler(mockEvent);
        log('Inbox-friendly email sent successfully to:', to);
        
        // Return the actual result
        sendResult = result;
      } catch (inboxError) {
        log('Error sending inbox-friendly email:', inboxError);
        throw new Error(`Failed to send inbox-friendly email: ${inboxError.message}`);
      }
    }
    return { statusCode: 200, body: JSON.stringify({ success: true, logs }) };
  } catch (err) {
    log('Error:', err.message);
    log('Stack:', err.stack);
    return { statusCode: 500, body: JSON.stringify({ error: err.message, logs }) };
  }
};
