const path = require('path');
const { uploadToAud } = require('./audd-client.js');
const { SongValidator } = require('./song-validator.js');
const { scrobbleToFm } = require('./lastfm-client.js');

const validator = new SongValidator({
        requiredMatches: 3,
        timecodeTolerance: 12
});

let currentTrack = null;

function getArtworkUrl(track) {
    const appleArtwork = track.apple_music?.artwork?.url;
    const artworkUrl = track.spotify?.album?.images?.[0]?.url
        ?? (appleArtwork
            ? appleArtwork.replace('{w}', '600').replace('{h}', '600')
            : null)
        ?? track.deezer?.album?.cover_big
        ?? track.artwork;

    return typeof artworkUrl === 'string' ? artworkUrl : null;
} // returns atwork for track, first spotify, then apple music, ect. returns nothing if theres no valid artwork url. 

async function processSample(filePath, capturedAt) {
    console.log('\n================================');
    console.log('File:', path.basename(filePath));

    console.log('Capture timestamp:', capturedAt);

    let track;

    try {
        track = await uploadToAud(filePath);
    } catch (error) {
        console.log('Skipping validation. AudD request failed');
        return null;
    }

    if (!track) {
        console.log('AudD did not recognize a track.');
        const validation = validator.process(null, capturedAt);
        console.log('Validation:', validation);

        return validation;
    }

    console.log('Recognized:',`${track.artist} - ${track.title}`);
    console.log('Timecode:', track.timecode);

    const validation = validator.process(track, capturedAt);

    if (validation.accepted && validation.newTrack) {
        currentTrack = {
            artist: track.artist,
            title: track.title,
            album: track.album ?? track.spotify?.album?.name ?? track.apple_music?.album ?? null,
            artworkUrl: getArtworkUrl(track),
            confirmedAt: capturedAt
        }; // update the current track for the dashboard

        console.log('\n*** NEW CONFIRMED TRACK ***');
        console.log(`${currentTrack.artist} - ${currentTrack.title}`);

        try {
            await scrobbleToFm(
                currentTrack.artist,
                currentTrack.title,
                currentTrack.album ?? ''
            );
        } catch (e) {
            console.error('Last.fm submission failed: ', e);
        }

    }

    console.log('Validation result:');

    console.log({
        accepted:validation.accepted,
        newTrack:validation.newTrack,
        reason: validation.reason,
        matches: validation.matches,
        elapsedReal: validation.elapsedReal,
        elapsedTrack: validation.elapsedTrack,
        difference: validation.difference
    });

    return validation;
}

function getCurrentTrack() {
    return currentTrack;
} // keeps track of the last confirmed track
// so that the dashboard can display it.

module.exports = { processSample, getCurrentTrack };
