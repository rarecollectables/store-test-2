// Netlify serverless function to send order confirmation emails
const nodemailer = require('nodemailer');

// Configure email transporter
const createTransporter = () => {
  // Use environment variables for email configuration
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Format order items into HTML
const formatOrderItems = (items) => {
  if (!items || !Array.isArray(items)) return '<p>No items in order</p>';
  
  return items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">
        ${item.name || item.title || 'Product'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: center;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">
        £${(item.price || 0).toFixed(2)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e5e5; text-align: right;">
        £${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
      </td>
    </tr>
  `).join('');
};

// Generate HTML email template
const generateEmailHTML = (order) => {
  const orderDate = order.date ? new Date(order.date).toLocaleDateString() : 'N/A';
  const orderItems = formatOrderItems(order.items);
  const orderTotal = order.total ? `£${order.total.toFixed(2)}` : 'N/A';
  const orderNumber = order.id || `ORD-${Date.now()}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #BFA054; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 10px; border-bottom: 2px solid #BFA054; }
        .total-row { font-weight: bold; border-top: 2px solid #BFA054; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Confirmation</h1>
      </div>
      <div class="content">
        <p>Thank you for your order with Rare Collectables!</p>
        <p>We're pleased to confirm that your order has been received and is being processed.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding: 10px;"><strong>Total:</strong></td>
              <td style="text-align: right; padding: 10px;">${orderTotal}</td>
            </tr>
          </tbody>
        </table>
        
        <h2>Shipping Information</h2>
        <p>
          ${order.address ? `
            ${order.address.name || ''}<br>
            ${order.address.line1 || ''}<br>
            ${order.address.line2 ? order.address.line2 + '<br>' : ''}
            ${order.address.city || ''}, ${order.address.state || ''} ${order.address.postal_code || ''}<br>
            ${order.address.country || ''}
          ` : 'No shipping information provided'}
        </p>
        
        <p>If you have any questions about your order, please contact our customer service team.</p>
        <p>Thank you for shopping with us!</p>
      </div>
      <div class="footer">
        <p>Rare Collectables Ltd. | All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};

// Netlify function handler
exports.handler = async (event, context) => {
  // Log the function invocation
  console.log('Order confirmation email function invoked');
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }
  
  try {
    // Parse the request body
    const { email, order } = JSON.parse(event.body);
    
    // Validate required fields
    if (!email || !order) {
      console.error('Missing required fields: email or order');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: email or order' }),
      };
    }
    
    console.log(`Sending order confirmation to ${email}`);
    
    // Create email transporter
    const transporter = createTransporter();
    
    // Generate email content
    const htmlContent = generateEmailHTML(order);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'orders@rarecollectables.com',
      to: email,
      subject: `Order Confirmation - ${order.id || 'New Order'}`,
      html: htmlContent,
    });
    
    console.log('Email sent successfully:', info.messageId);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Order confirmation email sent successfully' }),
    };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error sending order confirmation email',
        error: error.message
      }),
    };
  }
};
