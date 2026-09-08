
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config()

const API_KEY = process.env.audD_key


const filePath = path.join(__dirname, 'samples', 'testSample2.mp4');
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

        console.log(response.data);
    } catch (error) {
        console.log(error);
    }
}

uploadToAud();


