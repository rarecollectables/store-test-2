const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

// DEBUG: Log contents of function directory
try {
  console.log('Function directory contents:', fs.readdirSync(__dirname));
} catch (e) {
  console.log('Could not read function directory:', e.message);
}

// Gmail configuration
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || GMAIL_USER;

// Check if Gmail configuration is available
if (!GMAIL_USER) {
  console.error('Missing Gmail username. Please set GMAIL_USER environment variable.');
}

if (!GMAIL_PASS) {
  console.error('Missing Gmail password. Please set GMAIL_PASS environment variable.');
}

// Create a transporter object using Gmail SMTP
console.log('Using Gmail SMTP service');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  },
  debug: true,
  logger: true // Log to console
});

// Verify SMTP connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP connection verification failed:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Debug email configuration (don't log full password in production)
console.log('Email configuration:', {
  service: 'gmail',
  user: GMAIL_USER,
  passExists: !!GMAIL_PASS
});

// Load and compile the email template once
const templateSource = fs.readFileSync(path.join(__dirname, 'order-update-email.hbs'), 'utf8');
const orderUpdateTemplate = handlebars.compile(templateSource);

/**
 * Send an order update email with tracking and related products
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {Object} params.order - Order object with all details
 * @param {string} params.trackingCode - Tracking code for the order
 * @param {string} params.trackingUrl - Tracking URL for the order
 * @param {Array} params.relatedProducts - Array of related product objects { name, image, url }
 */
async function sendOrderUpdateEmail({ to, order, trackingCode, trackingUrl, relatedProducts }) {
  if (!to) throw new Error('Recipient email required');
  if (!order) throw new Error('Order details required');

  const orderData = {
    customerName: order.customerName || order.name || order.shipping_address?.name || 'Customer',
    orderNumber: order.id || order.orderNumber || order.payment_intent_id || 'N/A',
    items: (order.items || order.products || []).map(item => ({
      name: item.name || item.title,
      quantity: item.quantity,
      price: (typeof item.price === 'number' ? item.price : parseFloat(item.price || '0')).toFixed(2)
    })),
    total: (typeof order.total === 'number' ? order.total : parseFloat(order.total || order.amount || '0')).toFixed(2),
    trackingCode: trackingCode || order.trackingCode || '',
    trackingUrl: trackingUrl || order.trackingUrl || '',
    shippingAddress: order.shipping_address
      ? `${order.shipping_address.name || ''}<br>${order.shipping_address.line1 || ''}<br>${order.shipping_address.city || ''}${order.shipping_address.postcode ? ', ' + order.shipping_address.postcode : ''}`
      : '',
    relatedProducts: relatedProducts || [],
    year: new Date().getFullYear()
  };

  const html = orderUpdateTemplate(orderData);

  // Optionally: generate a plain-text version
  const text = `Hi ${orderData.customerName},\n\nYour order #${orderData.orderNumber} is on its way!\nTracking code: ${orderData.trackingCode}\nTrack your order: ${orderData.trackingUrl}\n\nThank you for shopping with Rare Collectables!`;

  // Prepare email data for Mailgun
  const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'no-reply@rarecollectables.com';
  const fromName = 'Rare Collectables';
  const from = `${fromName} <${fromEmail}>`;
  
  const emailData = {
    from: from,
    to: to,
    subject: 'Your Order Update from Rare Collectables',
    text: text,
    html: html,
    'h:Reply-To': 'rarecollectablessales@gmail.com'
  };
  
  // Add BCC if configured
  if (process.env.ORDER_BCC_EMAIL) {
    emailData.bcc = process.env.ORDER_BCC_EMAIL;
  }
  
  console.log(`Sending email to ${to} via Gmail SMTP`);
  
  // Prepare email data for Nodemailer
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: to,
    subject: 'Your Order Update from Rare Collectables',
    text: text,
    html: html,
    replyTo: 'rarecollectablessales@gmail.com'
  };
  
  // Add BCC if configured
  if (process.env.ORDER_BCC_EMAIL) {
    mailOptions.bcc = process.env.ORDER_BCC_EMAIL;
  }
  
  // Send email using Nodemailer
  return transporter.sendMail(mailOptions)
    .then(result => {
      console.log('Email sent successfully via SMTP:', result);
      return result;
    })
    .catch(error => {
      console.error('Error sending email via SMTP:', error);
      throw error;
    });
}

module.exports = sendOrderUpdateEmail;
