const { Client } = require('@xhayper/discord-rpc');
require('dotenv').config();

const rpcClient = new Client({ clientId: process.env.DISCORD_CLIENT_ID });
const PI_URL = process.env.PI_URL;

async function checkTurntable() {
    try {
        const response = await fetch(PI_URL);
        const data = await response.json();

        //data.track will be null if the needle is lifted
        if (!data.track) {
            rpcClient.user?.clearActivity();
            console.log('Needle lifted. Cleared Discord status.');
        } else {
            const startTime = data.track.confirmedAt;

            //build base payload without the end time
            const activityPayload = {
                type: 2,
                details: data.track.title,
                state: data.track.album ? `${data.track.artist}` : `by ${data.track.artist}`,
                largeImageKey: data.track.artworkUrl || 'vinyl_icon',
                largeImageText: data.track.album,
                startTimestamp: startTime,
            };

            //only add the endTimestamp if duration actually exists
            if (data.track.duration) {
                activityPayload.endTimestamp = startTime + parseInt(data.track.duration, 10);
            }

            rpcClient.user?.setActivity(activityPayload);
            console.log(`Pushed to Discord: ${data.track.title} by ${data.track.artist}`);
        }
    } catch (err) {
        console.error("Could not reach the Pi. Make sure backend is running.");
    }
}

rpcClient.on('ready', () => {
    console.log(`Connected to Discord as ${rpcClient.user.username}`);
    console.log('Polling turntable status from the network...');
    setInterval(checkTurntable, 5000);
});

rpcClient.login().catch(console.error);
