const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const { Streamer } = require('@dank074/discord-video-stream');

// إعداد خادم الويب لمنع السكون
const app = express();
app.get('/', (req, res) => res.send('Bot is Streaming 24/7!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));

// إعداد الحساب
const client = new Client({ checkUpdate: false });
const streamer = new Streamer(client);

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const VIDEO_PATH = "./video.mp4"; 

client.on('ready', async () => {
    console.log(`[+] Logged in as ${client.user.tag}`);
    try {
        await streamer.joinVoice(GUILD_ID, CHANNEL_ID);
        const stream = streamer.createStream();
        stream.playVideo(VIDEO_PATH, true); // true لتكرار الفيديو
        console.log("[+] Camera is ON!");
    } catch (error) {
        console.error("[-] Error:", error);
    }
});

client.login(TOKEN);
