// Import the authentication functions
const auth = require('./auth');

// Import the playback functions (we will write these next in scrobble.js)
const scrobble = require('./scrobble');

// Export everything as a single, organized package
module.exports = {
  // Auth methods
  getLoginUrl: auth.getLoginUrl,
  getSessionKey: auth.getSessionKey,
  
  // Scrobble methods
  setNowPlaying: scrobble.setNowPlaying,
  scrobbleTrack: scrobble.scrobbleTrack
};