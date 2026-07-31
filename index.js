const express = require('express');
const VideoModule = require('@dank074/discord-video-stream');

const app = express();
app.get('/', (req, res) => res.send('Scanning API...'));

app.listen(process.env.PORT || 3000, () => {
    console.log("\n========== API SCANNER ==========");
    try {
        console.log("StreamConn Methods:", Object.getOwnPropertyNames(VideoModule.StreamConnection.prototype));
        console.log("VoiceConn Methods:", Object.getOwnPropertyNames(VideoModule.VoiceConnection.prototype));
    } catch (e) {
        console.log("Error reading methods:", e.message);
    }
    console.log("=================================\n");
});
