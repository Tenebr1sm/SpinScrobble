// test-scrobble.js
const lastfm = require('./last-fm');


function scrobbleToFm(artistName, trackName, albumName){
  // current UNIX timestamp in seconds
  const startTime = Math.floor(Date.now() / 1000);

  console.log(`Album name: ${typeof artistName}\n
    Track name: ${typeof trackName}\n 
    Album name: ${typeof albumName}\n`);


  // Artist, Song, Album
  lastfm.setNowPlaying(`${artistName}`, `${trackName}`, `${albumName}`);

  // Simulate song finishing
  setTimeout(() => {
    lastfm.scrobbleTrack(`${artistName}`, `${trackName}`, startTime, `${albumName}`);
  }, 5000);
};


module.exports = { scrobbleToFm };
