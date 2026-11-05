require('dotenv').config();
const express = require('express');
const axios = require('axios');

const lastfmAuth = require('./last-fm/auth');
const { processSample, getCurrentTrack } = require('./sample-processor');

const app = express();
const port = 3000;

// Track hardware state so lifting the needle clears the dashboard
let turntableState = 'NEEDLE_LIFTED';
let isTrackClearedByLift = false;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});


// Route to get the current track for the dashboard
app.get('/api/current-track', (req, res) => {
  const activeTrack = isTrackClearedByLift ? null : getCurrentTrack();
  res.json({
    track: activeTrack,
    turntableState,
  });
});

// Hardware state bridge route (called when needle is lifted/dropped/playing)
app.post('/api/state', (req, res) => {
  const { state } = req.body;
  if (state) {
    turntableState = state;
    if (state === 'NEEDLE_LIFTED') {
      isTrackClearedByLift = true;
    }
  }
  res.json({ status: 'ok', turntableState });
});

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
    const { sessionKey, username } = await lastfmAuth.getSessionKey(token);

    console.log('\n--- AUTHENTICATION SUCCESS ---');
    console.log(`User: ${username}`);
    console.log(`Session Key (sk): ${sessionKey}`);
    console.log('Copy this Session Key into your .env file!\n');

    res.send(
      `Successfully authenticated as ${username}! You can close this tab and check your VS Code terminal.`
    );
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
    if (validationResult && validationResult.accepted) {
      isTrackClearedByLift = false;
      turntableState = 'TRACK_PLAYING';
    }
    res.json({ status: 'processed', validation: validationResult });
  } catch (err) {
    console.error('[BACKEND] Error processing sample:', err);
    res.status(500).json({ error: 'Failed to process sample' });
  }
});

// Helper that uses ONLY the Last.fm API (track.getInfo) to get the album cover
async function fetchLastFmArtwork(artist, track, apiKey) {
  try {
    const infoRes = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getInfo',
        artist,
        track,
        api_key: apiKey,
        autocorrect: 1,
        format: 'json',
      },
      timeout: 4000,
    });

    const images = infoRes.data?.track?.album?.image || [];
    const coverUrl =
      images.find((img) => img.size === 'extralarge')?.['#text'] ||
      images.find((img) => img.size === 'large')?.['#text'] ||
      images.find((img) => img.size === 'medium')?.['#text'] ||
      null;

    // Filter out Last.fm's default grey star placeholder image
    if (coverUrl && !coverUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
      return coverUrl;
    }
  } catch {
    // Ignore failed lookups for individual tracks
  }

  return null;
}

// Helper to call Last.fm track.getSimilar
async function querySimilarTracks(artist, track, apiKey) {
  const res = await axios.get('https://ws.audioscrobbler.com/2.0/', {
    params: {
      method: 'track.getSimilar',
      artist,
      track,
      api_key: apiKey,
      autocorrect: 1,
      limit: 8,
      format: 'json',
    },
  });
  const list = res.data?.similartracks?.track;
  return Array.isArray(list) ? list : [];
}

// Route to fetch similar track recommendations + Last.fm album artwork
app.get('/api/recommendations', async (req, res) => {
  const { artist, track } = req.query;
  const apiKey = process.env.LASTFM_API_KEY;

  if (!artist || !track || !apiKey) {
    return res.json({ recommendations: [] });
  }

  try {
    // 1. Try track.getSimilar with the exact artist & track from AudD
    let rawTracks = await querySimilarTracks(artist, track, apiKey);

    // 2. If Last.fm still has no track-level similarity matrix, use artist.getSimilar
    //    and fetch the #1 top track from each similar artist (includes real % match scores!)
    if (rawTracks.length === 0) {
      const simArtistsRes = await axios.get('https://ws.audioscrobbler.com/2.0/', {
        params: {
          method: 'artist.getSimilar',
          artist,
          api_key: apiKey,
          autocorrect: 1,
          limit: 8,
          format: 'json',
        },
      });

      const similarArtists = simArtistsRes.data?.similarartists?.artist || [];
      if (Array.isArray(similarArtists) && similarArtists.length > 0) {
        const artistTopTracks = await Promise.all(
          similarArtists.slice(0, 8).map(async (simArtist) => {
            try {
              const artistTopRes = await axios.get(
                'https://ws.audioscrobbler.com/2.0/',
                {
                  params: {
                    method: 'artist.getTopTracks',
                    artist: simArtist.name,
                    api_key: apiKey,
                    autocorrect: 1,
                    limit: 1,
                    format: 'json',
                  },
                  timeout: 4000,
                }
              );
              const topTrack = artistTopRes.data?.toptracks?.track?.[0];
              if (!topTrack) return null;

              return {
                name: topTrack.name,
                artist: { name: simArtist.name },
                url: topTrack.url,
                match: simArtist.match, // Similarity score from artist.getSimilar
              };
            } catch {
              return null;
            }
          })
        );

        rawTracks = artistTopTracks.filter(Boolean);
      }
    }

    // 5. Enrich the 8 recommended tracks with Last.fm album cover art
    const recommendations = await Promise.all(
      rawTracks.slice(0, 8).map(async (item) => {
        const recTitle = item.name;
        const recArtist = item.artist?.name || artist;
        const artworkUrl = await fetchLastFmArtwork(recArtist, recTitle, apiKey);

        return {
          title: recTitle,
          artist: recArtist,
          url: item.url,
          artworkUrl,
          match: item.match ? Math.round(Number(item.match) * 100) : null,
        };
      })
    );

    res.json({ recommendations });
  } catch (err) {
    console.error('[BACKEND] Error fetching recommendations:', err.message);
    res.json({ recommendations: [] });
  }
});

// Server initialization
app.listen(port, '0.0.0.0', () => {
  console.log(`SpinScrobble backend listening on port ${port} (all interfaces)`);
  console.log(
    `Auth server running. Open http://localhost:${port}/login in your browser to authenticate.`
  );
});