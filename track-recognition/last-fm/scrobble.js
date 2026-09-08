const axios = require('axios');
const { generateSignature } = require('./signature');
require('dotenv').config();

const API_KEY = process.env.LASTFM_API_KEY;
const SESSION_KEY = process.env.LASTFM_SESSION_KEY;
const API_URL = 'http://ws.audioscrobbler.com/2.0/';

/**
 * Triggers the "Listening Now" status on the user's Last.fm profile.
 * Call this immediately when the audio API identifies a song.
 */
async function setNowPlaying(artist, track, album = '') {
  const params = {
    method: 'track.updateNowPlaying',
    api_key: API_KEY,
    sk: SESSION_KEY,
    artist: artist,
    track: track
  };

  if (album) params.album = album;

  // Generate the MD5 signature and attach it to the payload
  params.api_sig = generateSignature(params);

  // Last.fm expects application/x-www-form-urlencoded data for POST requests
  const formData = new URLSearchParams(params);

  try {
    await axios.post(API_URL, formData.toString());
    console.log(`[Last.fm] Now Playing: ${track} by ${artist}`);
  } catch (err) {
    console.error('[Last.fm] Now Playing Error:', err.response ? err.response.data.message : err.message);
  }
}

/**
 * Permanently logs a track to the user's database.
 * Call this ONLY after the song has finished playing, or after 4 minutes.
 * @param {number} startTimestamp - The exact UTC UNIX timestamp of when the song STARTED playing.
 */
async function scrobbleTrack(artist, track, startTimestamp, album = '') {
  const params = {
    method: 'track.scrobble',
    api_key: API_KEY,
    sk: SESSION_KEY,
    artist: artist,
    track: track,
    timestamp: startTimestamp 
  };

  if (album) params.album = album;

  params.api_sig = generateSignature(params);
  const formData = new URLSearchParams(params);

  try {
    await axios.post(API_URL, formData.toString());
    console.log(`[Last.fm] Successfully scrobbled: ${track} by ${artist}`);
  } catch (err) {
    console.error('[Last.fm] Scrobble Error:', err.response ? err.response.data.message : err.message);
  }
}

module.exports = {
  setNowPlaying,
  scrobbleTrack
};