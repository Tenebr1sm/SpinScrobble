require('dotenv').config(); 
const express = require('express');

// Imports the two functions from your new last-fm service folder
const lastfmAuth = require('./last-fm/auth'); 
const { processSample } = require('./sample-processor');

const app = express();
const port = 3000;

app.use(express.json());

// Route 1: Send the user to the Last.fm login screen
app.get('/login', (req, res) => {
  res.redirect(lastfmAuth.getLoginUrl());
});

// Route 2: Catch the redirect and the token from Last.fm
app.get('/callback', async (req, res) => {
  const token = req.query.token;
  
  if (!token) {
    return res.status(400).send('Authentication failed: No token provided.');
  }

  try {
    // Pass the token to your auth service to handle the exchange
    const { sessionKey, username } = await lastfmAuth.getSessionKey(token);
    
    console.log('\n--- AUTHENTICATION SUCCESS ---');
    console.log(`User: ${username}`);
    console.log(`Session Key (sk): ${sessionKey}`);
    console.log('Copy this Session Key into your .env file!\n');
    
    res.send(`Successfully authenticated as ${username}! You can close this tab and check your VS Code terminal.`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to exchange token for session key.');
  }
});

// Python bridge route
app.post('/api/sample', async (req, res) => {
    const { filepath, timestamp } = req.body;

    if (!filepath || !timestamp) {
        return res.status(400).json({ error: 'Missing filepath or timestamp' });
    }

    try {
        const validationResult = await processSample(filepath, timestamp);
        res.json({ status: 'processed', validation: validationResult });
    } catch (err) {
        console.error('[BACKEND] Error processing sample:', err);
        res.status(500).json({ error: 'Failed to process sample' });
    }
});

// Server intialization
app.listen(port, () => {
  console.log(`SpinScrobble backend listening on port ${port}`);
  console.log(`Auth server running. Open http://localhost:${port}/login in your browser to authenticate.`);
});

/* 
run node server.js
open localhost:3000/login
copy session key into .env file
ex: LASTFM_SESSION_KEY=whateverthekeyis
kill server
run node test-scrobble.js
it should show up in scrobble profile. will send apis in dms
*/