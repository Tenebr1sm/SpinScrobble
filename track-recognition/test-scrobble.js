// test-scrobble.js
const lastfm = require('./last-fm');

// current UNIX timestamp in seconds
const startTime = Math.floor(Date.now() / 1000);

// Artist, Song, Album
lastfm.setNowPlaying('Nas', 'The World Is Yours', 'Illmatic');

// Simulate song finishing
setTimeout(() => {
  lastfm.scrobbleTrack('Nas', 'The World Is Yours', startTime, 'Illmatic');
}, 5000);