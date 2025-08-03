const { createClient } = require('@supabase/supabase-js');

// Environment variables for Supabase URL and Key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log environment variable status for debugging
console.log('Supabase URL available:', !!SUPABASE_URL);
console.log('Supabase Service Role Key available:', !!SUPABASE_SERVICE_ROLE_KEY);

let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
} catch (error) {
  console.error('Error creating Supabase client:', error);
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check if Supabase client was initialized correctly
    if (!supabase) {
      console.error('Supabase client not initialized');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Database connection not initialized', 
          supabaseUrlAvailable: !!SUPABASE_URL,
          supabaseKeyAvailable: !!SUPABASE_SERVICE_ROLE_KEY
        })
      };
    }

    const data = JSON.parse(event.body);
    const { query, user_id, source = 'unknown' } = data;
    const ip_address = event.headers['x-forwarded-for'] || event.headers['client-ip'] || null;
    const user_agent = event.headers['user-agent'] || null;
    
    console.log('Processing search log:', { query, source, ip_address: !!ip_address });
    
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid search query' })
      };
    }

    const { error, data: insertedData } = await supabase.from('search_logs').insert([
      {
        query,
        user_id: user_id || null,
        ip_address,
        user_agent,
        source
      }
    ]).select();

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    console.log('Search log saved successfully');
    

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
