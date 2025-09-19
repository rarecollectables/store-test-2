import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Save an order to the Supabase database
 * @param {Object} order - The order object to save
 * @returns {Promise<Object>} - The saved order with database ID
 */
export const saveOrderToDatabase = async (order) => {
  try {
    // Generate a UUID for the database record
    const dbId = uuidv4();
    
    // Log the Supabase connection status
    console.log('Supabase client status check before saving order');
    try {
      const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        console.error('Error details:', JSON.stringify(testError));
      } else {
        console.log('Database connection test successful, found', testData?.length || 0, 'records');
      }
    } catch (testErr) {
      console.error('Error testing database connection:', testErr);
      console.error('Error details:', JSON.stringify(testErr));
    }
    
    // Format the order for database storage according to the schema
    const orderRecord = {
      id: dbId,
      // user_id will be null for guest orders
      status: 'confirmed', // Always set status to 'confirmed' for successful orders
      // amount is used in the schema
      amount: parseFloat(order.total || 0),
      shipping_address: order.shipping_address || (order.address ? JSON.stringify(order.address) : null),
      billing_address: order.billing_address || (order.billing ? JSON.stringify(order.billing) : null),
      payment_method: order.payment_method || order.paymentMethod || 'card',
      created_at: order.date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment_intent_id: order.payment_intent_id || order.paymentIntentId || null,
      currency: order.currency || 'GBP', // Default currency
      contact_email: order.contact_email || order.email || order.contact?.email || null,
      product_image: order.product_image || (order.items && order.items.length > 0 ? order.items[0].image_url || order.items[0].image_path || null : null),
      quantity: order.quantity || (order.items ? order.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0) : 0),
      // Add metadata field for additional order information
      metadata: {
        order_number: order.id || `ORD-${new Date().getTime()}`,
        items_count: order.items?.length || 0,
        customer_name: order.contact?.name || null,
        payment_status: 'completed',
        // Include payment method in metadata
        payment_method: order.payment_method || order.paymentMethod || 'card',
        // Include items metadata with ring sizes
        items_metadata: order.items?.map(item => ({
          id: item.id,
          name: item.title || item.name,
          selectedSize: item.selectedSize || null,
          quantity: item.quantity,
          price: item.price,
          // Include any customization data if present
          ...(item.customization ? { customization: item.customization } : {})
        })) || []
      }
    };

    console.log('Saving order to database with record:', JSON.stringify(orderRecord, null, 2));

    // Insert the order into the database
    const { data, error } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (error) {
      console.error('Error saving order to database:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check for common issues
      if (error.code === '23502') {
        console.error('Missing required field - check the schema and data');
      } else if (error.code === '23505') {
        console.error('Unique constraint violation - duplicate key');
      } else if (error.code === '42P01') {
        console.error('Table does not exist - check table name');
      } else if (error.code === '42703') {
        console.error('Column does not exist - check field names');
      } else if (error.code === '42601') {
        console.error('Syntax error - check SQL syntax');
      } else if (error.code === '28000') {
        console.error('Authorization error - check permissions');
      }
      
      throw error;
    }

    console.log('Order saved successfully:', data);
    
    // Now insert order items into the order_items table
    if (order.items && order.items.length > 0) {
      try {
        console.log(`Inserting ${order.items.length} items into order_items table for order ${dbId}`);
        
        // Prepare order items for insertion
        const orderItems = order.items.map(item => ({
          id: uuidv4(),
          order_id: dbId,
          product_id: item.id || item.product_id,
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
          name: item.title || item.name || 'Product',
          image_url: item.image_url || item.image_path || item.image || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        // Insert all order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) {
          console.error('Error saving order items to database:', itemsError);
          // Don't throw error here, we still want to return the order
        } else {
          console.log(`Successfully inserted ${orderItems.length} order items`);
        }
      } catch (itemsErr) {
        console.error('Failed to save order items:', itemsErr);
        // Don't throw error here, we still want to return the order
      }
    }
    
    return data;
  } catch (error) {
    console.error('Failed to save order to database:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Try to log the current Supabase configuration
    try {
      const configInfo = {
        hasUrl: !!supabase.supabaseUrl,
        hasKey: !!supabase.supabaseKey,
      };
      console.log('Supabase config check:', configInfo);
    } catch (configErr) {
      console.error('Error checking Supabase config:', configErr);
    }
    
    // Return the original order if database save fails
    // This allows the app to continue functioning with localStorage only
    return order;
  }
};

/**
 * Get orders for a specific customer from the database
 * @param {string} email - Customer email
 * @returns {Promise<Array>} - Array of orders
 */
export const getCustomerOrders = async (email) => {
  if (!email) return [];
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }

    // Transform database records to match the app's order format
    return data.map(record => ({
      id: record.order_number,
      date: record.created_at,
      total: record.total_amount,
      discount: record.discount_amount,
      coupon: record.metadata ? JSON.parse(record.metadata)?.coupon || null : null,
      status: record.status,
      paymentIntentId: record.payment_intent_id,
      paymentMethod: record.payment_method,
      contact: {
        email: record.customer_email,
        name: record.customer_name,
        phone: record.customer_phone
      },
      address: record.shipping_address ? JSON.parse(record.shipping_address) : null,
      items: record.items ? JSON.parse(record.items) : []
    }));
  } catch (error) {
    console.error('Failed to fetch customer orders:', error);
    return [];
  }
};
