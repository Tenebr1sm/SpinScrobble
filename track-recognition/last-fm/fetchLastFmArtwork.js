import 'dotenv/config';
import axios from 'axios';

async function fetchLastFmArtwork(artist, track, apiKey = process.env.LASTFM_API_KEY) {
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
    const albumName = infoRes.data?.track?.album?.title || null;
    const images = infoRes.data?.track?.album?.image || [];
    const artworkUrl =
      images.find((img) => img.size === 'extralarge')?.['#text'] ||
      images.find((img) => img.size === 'large')?.['#text'] ||
      images.find((img) => img.size === 'medium')?.['#text'] ||
      null;

  
    
    // Filter out Last.fm's default grey star placeholder image
    if (artworkUrl && !artworkUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
      return { artworkUrl, albumName };
    }
  } catch {
    // Ignore failed lookups for individual tracks
  }

  return null;
}

export { fetchLastFmArtwork };


