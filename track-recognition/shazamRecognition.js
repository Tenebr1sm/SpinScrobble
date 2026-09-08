const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config()

const API_KEY = process.env.shazam_key
const filePath = path.join(__dirname, 'samples', 'testSample3.mp3');

async function postToShazam () {
    try {
        const form = new FormData();
        
        form.append('file', fs.createReadStream(filePath));
        
        const response = await axios({
            method: 'post',
            url: 'https://shazam-api.com/api/v2/recognize',
            data: form,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
            },
        });

        console.log('results URL:', response.data.resultsUrl); 
        getFromShazam(response.data.resultsUrl);

    } catch (error) {
        console.log(error);
    }
}

async function getFromShazam(url) {

    const pollTime = 7000;

    console.log(`Checking results, 7 second delay in request...`);
    setTimeout(async () => {
            try {
                const response = await axios({
                    method: 'get',
                    url: `https://shazam-api.com${url}`,
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                    }, 
                });

                console.log(response.data);
                const data = response.data;
                console.log(`Status: ${data.status}`);

                return data;

            } catch (error) {
                console.log(error);
            }

        }, pollTime);
}


postToShazam();
