import React, { useState, useEffect } from 'react';
import '../styles/email-admin.css'; // CSS file for email admin UI

// Email templates available in the system
const TEMPLATES = [
  { 
    value: 'order-confirmation', 
    label: 'Order Confirmation',
    description: 'Send an order confirmation email with order details',
    icon: '📦'
  },
  { 
    value: 'order-update', 
    label: 'Order Update / Tracking', 
    description: 'Send tracking information and order status updates',
    icon: '🚚'
  },
  { 
    value: 'enquiry-reply', 
    label: 'Enquiry Reply',
    description: 'Reply to customer inquiries and questions',
    icon: '💬'
  },
  { 
    value: 'inbox-friendly-update', 
    label: 'Inbox-Friendly: Order Update',
    description: 'Simple, text-focused update that lands in primary inbox',
    icon: '📨'
  },
  { 
    value: 'inbox-friendly-arriving', 
    label: 'Inbox-Friendly: Arriving Today',
    description: 'Notify customer their order is arriving today',
    icon: '📅'
  },
  { 
    value: 'inbox-friendly-delivered', 
    label: 'Inbox-Friendly: Order Delivered',
    description: 'Follow up after delivery to ensure satisfaction',
    icon: '✅'
  },
];

export default function AdminEmailsPage() {
  // Basic email fields
  const [to, setTo] = useState('');
  const [template, setTemplate] = useState('order-confirmation');
  const [subject, setSubject] = useState('');
  const [orderData, setOrderData] = useState(''); // JSON string for order/enquiry
  
  // UI state
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1: Template, 2: Details, 3: Preview
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  
  // Fields for all email types
  const [customerName, setCustomerName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    line1: '',
    city: '',
    postcode: ''
  });
  const [customMessage, setCustomMessage] = useState('');
  
  // Selected template details
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  
  // Determine if we're using an inbox-friendly template
  const isInboxFriendly = template.startsWith('inbox-friendly-');

  // Update selected template when template value changes
  useEffect(() => {
    const found = TEMPLATES.find(t => t.value === template);
    if (found) {
      setSelectedTemplate(found);
    }
  }, [template]);

  // Update JSON data when fields change
  useEffect(() => {
    if (isInboxFriendly) {
      const data = {
        customerName,
        id: orderNumber,
        trackingCode,
        customMessage
      };
      setOrderData(JSON.stringify(data, null, 2));
    } else if (template === 'order-update') {
      // Format data for order update template
      const data = {
        to,
        order: {
          customerName,
          id: orderNumber,
          items: [
            { name: 'Sample Item', quantity: 1, price: '19.99' }
          ],
          total: '19.99',
          shipping_address: shippingAddress
        },
        trackingCode,
        trackingUrl,
        relatedProducts: []
      };
      setOrderData(JSON.stringify(data, null, 2));
    }
  }, [isInboxFriendly, template, customerName, orderNumber, trackingCode, trackingUrl, shippingAddress, customMessage, to]);
  
  // Handle template selection
  const handleTemplateSelect = (templateValue) => {
    setTemplate(templateValue);
    setShowTemplateSelector(false);
    setActiveStep(2);
  };
  
  // Go back to template selection
  const handleBackToTemplates = () => {
    setShowTemplateSelector(true);
    setActiveStep(1);
  };
  
  // Move to preview step
  const handleShowPreview = () => {
    setActiveStep(3);
  };
  
  // Go back to details step
  const handleBackToDetails = () => {
    setActiveStep(2);
  };

  const handleSend = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault(); // Prevent full page reload
    }
    setStatus({ type: 'info', message: 'Preparing to send email...' });
    setLoading(true);
    
    // Scroll to the status message area
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
    try {
      let data;
      
      if (isInboxFriendly) {
        // Use the dedicated fields for inbox-friendly emails
        data = {
          customerName,
          id: orderNumber,
          trackingCode,
          customMessage
        };
      } else {
        // Use the JSON textarea for other templates
        try {
          data = orderData ? JSON.parse(orderData) : {};
        } catch (jsonError) {
          setStatus({
            type: 'error',
            message: 'Invalid JSON data. Please check your format.'
          });
          setLoading(false);
          return;
        }
      }
      
      // Add custom message to data if provided
      if (customMessage && !isInboxFriendly) {
        data.customMessage = customMessage;
      }
      
      const payload = {
        to,
        template,
        subject,
        data,
        emailProvider: 'gmail' // Explicitly specify we're using Gmail SMTP
      };
      
      // Show sending animation
      setStatus({
        type: 'info',
        message: 'Sending email via Gmail SMTP...'
      });
      
      const res = await fetch('/.netlify/functions/sendAdminEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      // First check if the response is OK
      if (!res.ok) {
        setStatus({
          type: 'error',
          message: `Server error: ${res.status} ${res.statusText}`
        });
        console.error('Server error:', res.status, res.statusText);
        setLoading(false);
        return;
      }
      
      // Get the raw text first
      const responseText = await res.text();
      console.log('Raw response:', responseText);
      
      // Check if the response is HTML (common when Netlify functions aren't properly served)
      if (responseText.trim().startsWith('<!DOCTYPE html>')) {
        setStatus({
          type: 'error',
          message: 'Error: Netlify functions not available. Make sure you are running with netlify dev.'
        });
        console.error('Received HTML instead of JSON. Netlify functions may not be properly configured.');
        setLoading(false);
        return;
      }
      
      // Then try to parse as JSON
      let result = null;
      try {
        result = JSON.parse(responseText);
      } catch (err) {
        setStatus({
          type: 'error',
          message: 'Failed to parse response as JSON.'
        });
        console.error('Failed to parse response as JSON:', err);
        console.error('Raw response was:', responseText);
        setLoading(false);
        return;
      }
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: `Email sent successfully to ${to}!`
        });
        
        // Reset form if successful
        if (activeStep === 3) {
          // Reset form after successful send from preview
          setTimeout(() => {
            handleBackToTemplates();
            setTo('');
            setSubject('');
            setCustomerName('');
            setOrderNumber('');
            setTrackingCode('');
            setCustomMessage('');
            setOrderData('');
          }, 2000);
        }
      } else {
        setStatus({
          type: 'error',
          message: 'Failed: ' + (result.error || 'Unknown error')
        });
      }
      
      if (result.logs) {
        console.log('Email send logs:', result.logs);
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };


  // Render the template selection step
  const renderTemplateSelector = () => {
    return (
      <div className="email-template-grid">
        {TEMPLATES.map((tmpl) => (
          <div 
            key={tmpl.value} 
            className="email-template-card" 
            onClick={() => handleTemplateSelect(tmpl.value)}
          >
            <div className="template-icon">{tmpl.icon}</div>
            <h3>{tmpl.label}</h3>
            <p>{tmpl.description}</p>
          </div>
        ))}
      </div>
    );
  };

  // Render the email details form
  const renderEmailDetailsForm = () => {
    return (
      <div className="email-details-form">
        <div className="form-header">
          <button 
            type="button" 
            className="back-button" 
            onClick={handleBackToTemplates}
          >
            ← Back to templates
          </button>
          <h2>{selectedTemplate.label}</h2>
          <div className="template-badge">
            <span className="template-icon">{selectedTemplate.icon}</span>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="email-to">Recipient Email:</label>
            <input
              id="email-to"
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email-subject">Subject (optional):</label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Leave blank to use default subject"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Email Content</h3>
          
          {isInboxFriendly ? (
            <div className="inbox-friendly-fields">
              <div className="form-group">
                <label htmlFor="customer-name">Customer Name:</label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer's full name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="order-number">Order Number:</label>
                <input
                  id="order-number"
                  type="text"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  placeholder="ORDER-12345"
                  required
                />
              </div>
              
              {(template === 'inbox-friendly-update' || template === 'order-update') && (
                <div className="form-group">
                  <label htmlFor="tracking-code">Tracking Code:</label>
                  <input
                    id="tracking-code"
                    type="text"
                    value={trackingCode}
                    onChange={e => setTrackingCode(e.target.value)}
                    placeholder="TRACK-67890"
                  />
                </div>
              )}
              
              {template === 'order-update' && (
                <>
                  <div className="form-group">
                    <label htmlFor="tracking-url">Tracking URL:</label>
                    <input
                      id="tracking-url"
                      type="text"
                      value={trackingUrl}
                      onChange={e => setTrackingUrl(e.target.value)}
                      placeholder="https://tracking-provider.com/track/TRACK-67890"
                    />
                  </div>
                  
                  <div className="form-section">
                    <h3>Shipping Address</h3>
                    <div className="form-group">
                      <label htmlFor="shipping-name">Name:</label>
                      <input
                        id="shipping-name"
                        type="text"
                        value={shippingAddress.name}
                        onChange={e => setShippingAddress({...shippingAddress, name: e.target.value})}
                        placeholder="Customer Name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="shipping-line1">Address Line:</label>
                      <input
                        id="shipping-line1"
                        type="text"
                        value={shippingAddress.line1}
                        onChange={e => setShippingAddress({...shippingAddress, line1: e.target.value})}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="shipping-city">City:</label>
                      <input
                        id="shipping-city"
                        type="text"
                        value={shippingAddress.city}
                        onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})}
                        placeholder="London"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="shipping-postcode">Postcode:</label>
                      <input
                        id="shipping-postcode"
                        type="text"
                        value={shippingAddress.postcode}
                        onChange={e => setShippingAddress({...shippingAddress, postcode: e.target.value})}
                        placeholder="SW1A 1AA"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label htmlFor="custom-message">Custom Message (optional):</label>
                <textarea
                  id="custom-message"
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  rows={3}
                  placeholder="Add a personal message here..."
                />
              </div>
              
              <div className="json-preview">
                <h4>Generated Data:</h4>
                <pre>{orderData}</pre>
              </div>
            </div>
          ) : (
            <div className="standard-email-fields">
              <div className="form-group">
                <label htmlFor="custom-message">Custom Message (optional):</label>
                <textarea
                  id="custom-message"
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  rows={3}
                  placeholder="Add a personal message here..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="order-data">Order/Enquiry Data (JSON):</label>
                <textarea
                  id="order-data"
                  value={orderData}
                  onChange={e => setOrderData(e.target.value)}
                  rows={5}
                  placeholder='{"customerName":"Jane Doe","id":"ORDER123", ...}'
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="preview-button" 
            onClick={handleShowPreview}
            disabled={!to || (isInboxFriendly && (!customerName || !orderNumber))}
          >
            Preview Email
          </button>
        </div>
      </div>
    );
  };

  // Render the email preview and send step
  const renderEmailPreview = () => {
    // Ensure we can scroll to see all content
    useEffect(() => {
      // Reset scroll position when showing preview
      window.scrollTo(0, 0);
    }, []);
    
    return (
      <div className="email-preview">
        <div className="form-header">
          <button 
            type="button" 
            className="back-button" 
            onClick={handleBackToDetails}
          >
            ← Back to details
          </button>
          <h2>Email Preview</h2>
        </div>

        <div className="preview-container">
          <div className="preview-header">
            <div className="preview-field">
              <span className="field-label">From:</span>
              <span className="field-value">Rare Collectables &lt;rarecollectablessales@gmail.com&gt;</span>
            </div>
            <div className="preview-field">
              <span className="field-label">To:</span>
              <span className="field-value">{to}</span>
            </div>
            <div className="preview-field">
              <span className="field-label">Subject:</span>
              <span className="field-value">{subject || selectedTemplate.label}</span>
            </div>
          </div>

          <div className="preview-content">
            <div className="preview-template">
              <h3>Template: {selectedTemplate.label}</h3>
              <p className="template-description">{selectedTemplate.description}</p>
              
              {isInboxFriendly ? (
                <div className="preview-data">
                  <p><strong>Customer Name:</strong> {customerName}</p>
                  <p><strong>Order Number:</strong> {orderNumber}</p>
                  {trackingCode && <p><strong>Tracking Code:</strong> {trackingCode}</p>}
                  {customMessage && (
                    <div className="custom-message">
                      <h4>Custom Message:</h4>
                      <p>{customMessage}</p>
                    </div>
                  )}
                </div>
              ) : template === 'order-update' ? (
                <div className="preview-data">
                  <p><strong>Customer Name:</strong> {customerName}</p>
                  <p><strong>Order Number:</strong> {orderNumber}</p>
                  <p><strong>Tracking Code:</strong> {trackingCode}</p>
                  <p><strong>Tracking URL:</strong> {trackingUrl}</p>
                  
                  <div className="shipping-address">
                    <h4>Shipping Address:</h4>
                    <p>{shippingAddress.name}<br/>
                    {shippingAddress.line1}<br/>
                    {shippingAddress.city}{shippingAddress.postcode ? ', ' + shippingAddress.postcode : ''}</p>
                  </div>
                  
                  {customMessage && (
                    <div className="custom-message">
                      <h4>Custom Message:</h4>
                      <p>{customMessage}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="preview-data">
                  <h4>Order Data:</h4>
                  <pre>{orderData}</pre>
                  {customMessage && (
                    <div className="custom-message">
                      <h4>Custom Message:</h4>
                      <p>{customMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="send-button" 
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">Sending...</span>
            ) : (
              <span>Send Email via Gmail</span>
            )}
          </button>
        </div>

        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.type === 'success' && <span className="status-icon">✓</span>}
            {status.type === 'error' && <span className="status-icon">✗</span>}
            {status.type === 'info' && <span className="status-icon">ℹ</span>}
            <span>{status.message}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="email-admin-container" style={{ height: 'auto', minHeight: '100vh' }}>
      <div className="email-admin-header">
        <h1>Email Center</h1>
        <p className="provider-badge">Using Gmail SMTP</p>
      </div>

      <div className="email-admin-content">
        {showTemplateSelector ? (
          <>
            <div className="step-indicator">
              <div className="step active">1. Select Template</div>
              <div className="step">2. Enter Details</div>
              <div className="step">3. Preview & Send</div>
            </div>
            {renderTemplateSelector()}
          </>
        ) : activeStep === 2 ? (
          <>
            <div className="step-indicator">
              <div className="step completed">1. Select Template</div>
              <div className="step active">2. Enter Details</div>
              <div className="step">3. Preview & Send</div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleShowPreview(); }}>
              {renderEmailDetailsForm()}
            </form>
          </>
        ) : (
          <>
            <div className="step-indicator">
              <div className="step completed">1. Select Template</div>
              <div className="step completed">2. Enter Details</div>
              <div className="step active">3. Preview & Send</div>
            </div>
            {renderEmailPreview()}
          </>
        )}
      </div>

      <div className="email-admin-footer">
        <div className="info-box">
          <h4>About Email Templates</h4>
          <p>
            {isInboxFriendly ? 
              'Inbox-friendly emails are designed to land in the primary inbox rather than promotions tab. They use a personal tone, minimal formatting, and avoid marketing language.' : 
              'Standard email templates include rich formatting and branding elements. They work best for order confirmations and updates with tracking information.'}
          </p>
        </div>
      </div>
    </div>
  );
}
