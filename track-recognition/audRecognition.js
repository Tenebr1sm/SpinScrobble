
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { scrobbleToFm } = require('./test-scrobble.js');
require('dotenv').config();

const API_KEY = process.env.audD_key

const filePath = path.join(__dirname, 'samples', 'testSample8.mp4');
const data = {
    'api_token': `${API_KEY}`,
    'file': fs.createReadStream(filePath),
    'return': 'apple_music,spotify,musicbrainz,deezer',
};

async function uploadToAud () {
    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.audd.io/',
            data: data,
            headers: {'Content-Type': 'multipart/form-data'},
        })

        console.log("Stuff I need for call scrobble: \n" , response.data.result.artist,  `\n`, response.data.result.title, `\n`, response.data.result.album);

        scrobbleToFm(response.data.result.artist, response.data.result.title, response.data.result.album);
    } catch (error) {
        console.log(error);
    }
}

uploadToAud();


