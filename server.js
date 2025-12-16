// Simple Express server to proxy OpenAI API calls
// Run with: node server.js
// This solves CORS issues during development

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import https from 'https';
import http from 'http';

// Use node-fetch for all Node.js versions
// node-fetch v3 is ESM-only and works with this setup
dotenv.config();

// Handle proxy and SSL certificate issues
// Corporate proxies often intercept SSL connections, causing certificate errors
const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;

// Create HTTPS agent that handles proxy and SSL certificate issues
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' || process.env.ALLOW_INSECURE_SSL === 'true',
  // For proxy scenarios, we often need to allow self-signed certificates
  // This is common when behind corporate proxies
});

// If behind a proxy or SSL certificate issues persist, disable verification
// This is common in corporate environments
if (proxyUrl || process.env.ALLOW_INSECURE_SSL === 'true' || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  httpsAgent.options.rejectUnauthorized = false;
  if (!proxyUrl && process.env.ALLOW_INSECURE_SSL === 'true') {
    console.warn('⚠️  SSL certificate verification disabled');
  }
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    hasApiKey: !!(process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY)
  });
});

app.post('/api/openai', async (req, res) => {
  try {
    const { prompt, model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 1500, mode = 'json' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      console.error('OpenAI API key not found in environment variables');
      console.error('Checked: VITE_OPENAI_API_KEY and OPENAI_API_KEY');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Make sure VITE_OPENAI_API_KEY is set in .env file.',
        details: 'The server could not find the API key in environment variables.'
      });
    }

    let trimmedKey = apiKey.trim();
    
    // Remove quotes if present (common .env file issue)
    if ((trimmedKey.startsWith('"') && trimmedKey.endsWith('"')) || 
        (trimmedKey.startsWith("'") && trimmedKey.endsWith("'"))) {
      trimmedKey = trimmedKey.slice(1, -1).trim();
    }
    
    // Validate API key format
    if (!trimmedKey.startsWith('sk-')) {
      return res.status(500).json({ 
        error: 'Invalid API key format',
        details: 'OpenAI API keys must start with "sk-". Please check your .env file.'
      });
    }
    
    // Check for duplicate "sk-" prefix (common mistake)
    if (trimmedKey.startsWith('sk-sk-')) {
      trimmedKey = trimmedKey.substring(3); // Remove the first "sk-"
    }

    // Make the fetch call with better error handling
    let response;
    try {
      // Determine system message based on mode
      const systemMessage = mode === 'text' 
        ? 'You are an expert writing coach and educator. Provide detailed, constructive feedback in a clear, well-formatted manner.'
        : mode === 'json'
        ? 'You are an expert writing coach and educator. Always respond with valid JSON only. Do not include any text before or after the JSON object.'
        : 'You are a helpful book recommendation assistant. Always respond with valid JSON only.';
      
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
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedKey}`
        },
        body: JSON.stringify(requestBody),
        agent: httpsAgent
      });
    } catch (fetchError) {
      console.error('Error connecting to OpenAI API:', fetchError.message);
      
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        return res.status(500).json({ 
          error: 'Network error: Could not connect to OpenAI API',
          details: fetchError.message
        });
      }
      
      if (fetchError.code === 'SELF_SIGNED_CERT_IN_CHAIN' || 
          fetchError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
          fetchError.message?.includes('certificate') ||
          fetchError.message?.includes('SSL')) {
        return res.status(500).json({ 
          error: 'SSL Certificate error',
          details: 'Set ALLOW_INSECURE_SSL=true in .env file for proxy compatibility (development only)'
        });
      }
      
      throw fetchError;
    }

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // If we can't parse the error response, use status text
      }
      
      const errorMessage = errorData.error?.message || errorData.error || `OpenAI API error: ${response.statusText}`;
      
      if (response.status === 401) {
        console.error('OpenAI API authentication failed');
      } else {
        console.error('OpenAI API error:', errorMessage);
      }
      
      return res.status(response.status).json({
        error: errorMessage,
        status: response.status
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
    
    res.json(data);
  } catch (error) {
    console.error('Error proxying OpenAI request:', error.message);
    res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 OpenAI proxy server running on http://localhost:${PORT}`);
  const hasApiKey = !!(process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  if (!hasApiKey) {
    console.warn('⚠️  API key not configured. Set VITE_OPENAI_API_KEY in .env file');
  }
});

