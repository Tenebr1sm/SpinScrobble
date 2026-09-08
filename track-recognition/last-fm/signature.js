const crypto = require('crypto');
require('dotenv').config(); // pulls key

const API_SECRET = process.env.LASTFM_API_SECRET;

function generateSignature(params) {
  // Last.fm requires parameters to be sorted alphabetically
  const keys = Object.keys(params).sort();
  let sigString = '';
  
  keys.forEach(key => {
    // The Last.fm API specification dictates that 'format' and 'callback' 
    // must be excluded from the signature generation.
    if (key !== 'format' && key !== 'callback') {
      sigString += key + params[key];
    }
  });
  
  // Append your shared secret to the end of the string
  sigString += API_SECRET;
  
  // Generate and return the MD5 hash
  return crypto.createHash('md5').update(sigString, 'utf8').digest('hex');
}

module.exports = { generateSignature };