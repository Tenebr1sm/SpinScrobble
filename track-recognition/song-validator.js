class SongValidator {
    constructor(options = {}) {
        this.requiredMatches = options.requiredMatches ?? 3;
        this.timecodeTolerance = options.timecodeTolerance ?? 4;
        this.candidate = null;
        this.currentTrack = null;
    }

    process(track, capturedAt) {
        if (!track) {
            return {
                accepted: false,
                reason: 'No track'
            };
        }

        const id = this.getTrackId(track);
        const timecode = this.parseTimecode(track.timecode);

        if (timecode === null) {
            return {
                accepted: false,
                reason: 'Missing or invalid timecode'
            };
        }

        // CASE 1: We currently don't have a candidate. 
        if (!this.candidate) {
            this.setCandidate(
                id,
                track,
                timecode,
                capturedAt
            );

            return {
                accepted: false,
                reason: 'New candidate',
                matches: 1
            };
        }

        //CASE 2: AudD returned a different song. Start over with this song as the new candidate.
        if (this.candidate.id !== id) {
            this.setCandidate(
                id,
                track,
                timecode,
                capturedAt
            );

            return {
                accepted: false,
                reason: 'Different track detected',
                matches: 1
            };
        }

        //Same song as previous candidate. Now checking AudD timecode vs real time progression.
        //calculating real time that has passed since last recording
        const elapsedReal = (capturedAt - this.candidate.lastCapturedAt) / 1000;
        
        //calculating the change in playback position from the last recognition
        const elapsedTrack = timecode - this.candidate.lastTimecode;
        
        //Getting absolute valute of the difference between elapsed times to check if timecodes make sense. 
        const difference = Math.abs(elapsedReal - elapsedTrack);


        //CASE 3: AudD recognizes the same song, but the playback position is sooner or later than expected
        if (difference > this.timecodeTolerance) {
            this.setCandidate(
                id,
                track,
                timecode,
                capturedAt
            );

            return {
                accepted: false,
                reason: 'elapsed time is not within the threshold',
                matches: 1,
                elapsedReal,
                elapsedTrack,
                difference
            };
        }

        //CASE 4: subsequent match found, so it increments the matches counter and updates times
        this.candidate.matches++;
        this.candidate.track = track;
        this.candidate.lastTimecode = timecode;
        this.candidate.lastCapturedAt = capturedAt;

        //checking if enough confirmations were recevied
        if (this.candidate.matches < this.requiredMatches) {
            return {
                accepted: false,
                reason: 'Waiting for confirmation',
                matches: this.candidate.matches,
                elapsedReal,
                elapsedTrack,
                difference
            };
        }

        //track has three matches, and timecodes line up. Listing this as a confirmed track
        const alreadyConfirmed = this.currentTrack?.id === id;

        this.currentTrack = {
            id,
            track
        };

        return {
            accepted: true,
            newTrack: !alreadyConfirmed,
            reason: alreadyConfirmed
                ? 'Track still confirmed'
                : 'New track confirmed',
            matches: this.candidate.matches,
            track,
            elapsedReal,
            elapsedTrack,
            difference
        };
    }

    setCandidate(id, track, timecode, capturedAt) {
        this.candidate = {
            id,
            track,
            matches: 1,
            lastTimecode: timecode,
            lastCapturedAt: capturedAt
        };
    }

    getTrackId(track) {
        //attempting to use an ID from the response before falling back to artist + title
        if (track.spotify?.id) {
            return `spotify:${track.spotify.id}`;
        }

        //normalized artist + title returned if ID is not found
        const artist = track.artist?.trim().toLowerCase();
        const title = track.title?.trim().toLowerCase();

        return `${artist}:${title}`;
    }

    //returns timecode in total number of seconds
    parseTimecode(timecode) {
        if (!timecode || typeof timecode !== 'string') {
            return null;
        }

        const parts = timecode.split(':').map(Number);

        if (parts.some(Number.isNaN)) {
            return null;
        }

        //MM:SS
        if (parts.length === 2) {
            return (parts[0] * 60 + parts[1]);
        }

        //HH:MM:SS
        if (parts.length === 3) {
            return (parts[0] * 3600 + parts[1] * 60 + parts[2]);
        }

        return null;
    }


    reset() {
        this.candidate = null;
    }


    getCurrentTrack() {
        return this.currentTrack?.track ?? null;
    }
}

module.exports = {
    SongValidator
};