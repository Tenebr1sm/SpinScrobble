const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.audD_key
const path = require('path');


async function uploadToAud (filePath) {
    try {
        const data = {
            'api_token': `${API_KEY}`,
            'file': fs.createReadStream(filePath),
            'return': 'apple_music,spotify,musicbrainz,deezer',
        };

        const response = await axios({
            method: 'post',
            url: 'https://api.audd.io/',
            data: data,
            headers: {'Content-Type': 'multipart/form-data'},
        });

        if (response.data.status !== 'success') {
            console.error('audD returned an error:', response.data);
            return null;
        }

        if (!response.data.result) {
            console.log('[BACKEND] AudD could not identify this audio sample.');
            return null;
        }

        return response.data.result;

    } catch (error) {
        console.error(`failed to recognize ${filePath}:`, error.response?.data ?? error.message);
        throw error;
    }
}

module.exports = { uploadToAud };


