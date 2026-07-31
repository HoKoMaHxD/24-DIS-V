const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const { Streamer } = require('@dank074/discord-video-stream');
const fs = require('fs');

const app = express();
app.get('/', (req, res) => res.send('Bot is Streaming 24/7!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));

const client = new Client({ checkUpdate: false });

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID?.trim();
const CHANNEL_ID = process.env.CHANNEL_ID?.trim();
const VIDEO_PATH = "./video.mp4"; 

client.on('ready', async () => {
    console.log(`[+] Logged in as ${client.user.tag}`);
    
    if (!GUILD_ID || !CHANNEL_ID) {
        console.error("[-] ERROR: GUILD_ID or CHANNEL_ID is missing!");
        return;
    }

    if (!fs.existsSync(VIDEO_PATH)) {
        console.error("[-] CRITICAL ERROR: 'video.mp4' file not found in the project root!");
        return;
    }

    try {
        console.log("[~] Initializing Official Streamer Module...");
        const streamer = new Streamer(client);

        console.log("[~] Joining voice channel...");
        await streamer.joinVoice(GUILD_ID, CHANNEL_ID);
        
        console.log("[~] Creating video stream tunnel...");
        const ffmpegArgs = [
            '-stream_loop', '-1',
            '-re',
            '-i', VIDEO_PATH,
            '-map', '0:v:0?',
            '-pix_fmt', 'yuv420p',
            '-r', '30',
            '-g', '60',
            '-b:v', '1000k',
            '-f', 'mpegts',
            '-'
        ];

        // بدء البث المباشر الم توافق مع ديسكورد لمنع خطأ 2015
        await streamer.streamVideo(VIDEO_PATH);
        console.log("[+] Camera and Video Stream are OFFICIALLY LIVE!");

    } catch (error) {
        console.error("[-] Stream Execution Error:", error);
    }
});

client.login(TOKEN);
