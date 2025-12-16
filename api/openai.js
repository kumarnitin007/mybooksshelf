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
    const { prompt, model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 1500, mode = 'json' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get API key from environment variables
    // Use OPENAI_API_KEY (without VITE_ prefix) to keep it server-side only
    // VITE_ prefixed variables are exposed to the browser, which is a security risk!
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      console.error('OpenAI API key not found in environment variables');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY in Vercel environment variables (Settings → Environment Variables).'
      });
    }

    const trimmedKey = apiKey.trim();
    console.log(`Making OpenAI API request (model: ${model}, mode: ${mode})`);

    // Determine system message based on mode
    const systemMessage = mode === 'text' 
      ? 'You are an expert writing coach and educator. Provide detailed, constructive feedback in a clear, well-formatted manner.'
      : mode === 'json'
      ? 'You are an expert writing coach and educator. Always respond with valid JSON only. Do not include any text before or after the JSON object.'
      : 'You are a helpful book recommendation assistant. Always respond with valid JSON only.';

    // Make request to OpenAI API
    // Vercel's serverless functions run on their infrastructure, so no proxy/SSL issues
    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens
    };

    // Add response_format for JSON mode (required for structured JSON responses)
    if (mode === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trimmedKey}`
      },
      body: JSON.stringify(requestBody)
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
    
    // If mode is 'text', extract and return just the text content
    if (mode === 'text' && data.choices && data.choices[0] && data.choices[0].message) {
      return res.status(200).json({
        text: data.choices[0].message.content,
        usage: data.usage
      });
    }
    
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

