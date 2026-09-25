const path = require('path');
const { uploadToAud } = require('./audd-client.js');
const { SongValidator } = require('./song-validator.js');
const { scrobbleToFm } = require('./lastfm-client.js');

const validator = new SongValidator({
        requiredMatches: 3,
        timecodeTolerance: 12
});

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
        console.log('\n*** NEW CONFIRMED TRACK ***');
        console.log(`${track.artist} - ${track.title}`);
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


module.exports = { processSample };