//Normalizes song or artist name, and returns the resulting string  
function normalizeText(text, isTitle = false) {
    if (!text) return "";
    let cleaned = text.toLowerCase().trim();

    if (isTitle) {
        
        const structuralIndex = cleaned.search(/(?:\s+-\s*|\s*[\(\[][^)]*)/);
        if (structuralIndex !== -1) {
            cleaned = cleaned.substring(0, structuralIndex);
        }
    }

    return cleaned.replace(/[-_.:|()[\]]/g, ' ').replace(/\s+/g, ' ').trim();
}

/*
 * CASE 1: Direct MusicBrainz Recording ID Match
 * CASE 2: Checking filtered MusicBrainz release group frequency, and comparing 
 * CASE 3: Fallback regex text normalization
 */
function areTracksIdentical(response1, response2) {
    
    const track1 = response1?.result || response1;
    const track2 = response2?.result || response2;

    if (!track1 || !track2) return false;

    const mbData1 = Array.isArray(track1.musicbrainz) ? track1.musicbrainz : (track1.musicbrainz ? [track1.musicbrainz] : []);
    const mbData2 = Array.isArray(track2.musicbrainz) ? track2.musicbrainz : (track2.musicbrainz ? [track2.musicbrainz] : []);

    // This block is completely skipped if AudD returns no MusicBrainz data
    if (mbData1.length > 0 && mbData2.length > 0) {
        
        //CASE 1: Direct Recording ID Check
        const ids1 = new Set(mbData1.map(item => item?.id).filter(Boolean));
        const hasMatchingRecordingId = mbData2.some(item => item?.id && ids1.has(item.id));
        
        if (hasMatchingRecordingId) return true;

        //CASE 2: Filtered Release Group Frequency Check and comparison 
        const rgFrequencyMap1 = {};
        
        mbData1.forEach(rec => {
            if (Array.isArray(rec?.releases)) {
                rec.releases.forEach(rel => {
                    if (rel?.status === 'Official') {
                        const rgId = rel?.['release-group']?.id;

                        if (rgId) {
                            rgFrequencyMap1[rgId] = (rgFrequencyMap1[rgId] || 0) + 1;
                        }
                    }
                });
            }
        });

        let highestSharedFrequency = 0;
        let matchedRgId = null;

        mbData2.forEach(rec => {
            if (Array.isArray(rec?.releases)) {
                rec.releases.forEach(rel => {
                    if (rel?.status === 'Official') {
                        const rgId = rel?.['release-group']?.id;
                        if (rgId && rgFrequencyMap1[rgId]) {
                            if (rgFrequencyMap1[rgId] > highestSharedFrequency) {
                                highestSharedFrequency = rgFrequencyMap1[rgId];
                                matchedRgId = rgId;
                            }
                        }
                    }
                });
            }
        });

        if (matchedRgId) {
            const title1 = normalizeText(track1.title, true);
            const title2 = normalizeText(track2.title, true);
            
            // Validate that they are the same song on that official release group
            if (title1 === title2) return true;
        }
    }

    // CASE 3: Text normalization fallback
    if (!track1.artist || !track1.title || !track2.artist || !track2.title) {
        return false;
    }

    const artist1 = normalizeText(track1.artist, false);
    const artist2 = normalizeText(track2.artist, false);
    
    if (artist1 !== artist2) return false;

    const title1 = normalizeText(track1.title, true);
    const title2 = normalizeText(track2.title, true);

    return title1 === title2;
}

module.exports = {
    normalizeText,
    areTracksIdentical
};



