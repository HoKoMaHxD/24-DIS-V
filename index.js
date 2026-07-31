const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const { Streamer } = require('@dank074/discord-video-stream');

// إعداد صفحة الويب لمنع السكون
const app = express();
app.get('/', (req, res) => res.send('Video Stream is Live 24/7!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));

// إعداد حساب الديسكورد والبث
const client = new Client({ checkUpdate: false });
const streamer = new Streamer(client);

// جلب البيانات من Environment Variables لحمايتها
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
