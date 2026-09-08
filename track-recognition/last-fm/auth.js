const axios = require('axios');
// Import the hashing utility (we will create this file next)
const { generateSignature } = require('./signature'); 

// Ensure you have a .env file set up with your actual API key
const API_KEY = process.env.LASTFM_API_KEY;

// This must exactly match the route you create in your Express app
const CALLBACK_URL = 'http://localhost:3000/callback'; 

/**
 * Step 1: Generates the Last.fm OAuth login URL
 */
function getLoginUrl() {
  return `http://www.last.fm/api/auth/?api_key=${API_KEY}&cb=${CALLBACK_URL}`;
}

/**
 * Step 3: Exchanges the 60-minute token for a permanent Session Key (sk)
 */
async function getSessionKey(token) {
  const params = {
    method: 'auth.getSession',
    api_key: API_KEY,
    token: token
  };

  // The signature must be generated and attached before sending the request
  params.api_sig = generateSignature(params);

  try {
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: { ...params, format: 'json' }
    });
    
    // Return the session key and the username for the UI
    return {
      sessionKey: response.data.session.key,
      username: response.data.session.name
    };
  } catch (err) {
    throw new Error(`Session Exchange Failed: ${err.response ? err.response.data.message : err.message}`);
  }
}

module.exports = {
  getLoginUrl,
  getSessionKey
};