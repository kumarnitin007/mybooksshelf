// Vercel serverless function for OpenAI API proxy
// This replaces the Express server for production deployment

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { prompt, model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 1500 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from environment variables
    // Vercel automatically provides process.env variables
    const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      console.error('OpenAI API key not found in environment variables');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set VITE_OPENAI_API_KEY or OPENAI_API_KEY in Vercel environment variables.'
      });
    }

    const trimmedKey = apiKey.trim();
    console.log(`Making OpenAI API request (model: ${model})`);

    // Make request to OpenAI API
    // Vercel's serverless functions run on their infrastructure, so no proxy/SSL issues
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trimmedKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful book recommendation assistant. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens
      })
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // If we can't parse the error response, use status text
      }
      
      const errorMessage = errorData.error?.message || errorData.error || `OpenAI API error: ${response.statusText}`;
      console.error('OpenAI API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      
      return res.status(response.status).json({
        error: errorMessage,
        status: response.status,
        details: errorData
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying OpenAI request:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: 'An unexpected error occurred while processing the OpenAI request.'
    });
  }
}

