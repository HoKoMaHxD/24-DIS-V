const express = require('express');
const VideoModule = require('@dank074/discord-video-stream');

const app = express();
app.get('/', (req, res) => res.send('Debugging Mode'));

app.listen(process.env.PORT || 3000, () => {
    console.log("\n=========================================");
    console.log("MODULE TYPE:", typeof VideoModule);
    console.log("MODULE CONTENTS:", Object.keys(VideoModule));
    
    if (VideoModule.default) {
        console.log("DEFAULT CONTENTS:", Object.keys(VideoModule.default));
    }
    console.log("=========================================\n");
});
