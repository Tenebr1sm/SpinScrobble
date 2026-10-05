// test-scrobble.js
const lastfm = require('./last-fm');


function scrobbleToFm(artistName, trackName, albumName){
  // current UNIX timestamp in seconds
  const startTime = Math.floor(Date.now() / 1000);

  // Artist, Song, Album
  lastfm.setNowPlaying(`${artistName}`, `${trackName}`, `${albumName}`);

  return lastfm.scrobbleTrack(`${artistName}`, `${trackName}`, startTime, `${albumName}`);

};


module.exports = { scrobbleToFm };
