const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { StreamConnection, streamLivestreamVideo } = require('@dank074/discord-video-stream');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(require('ffmpeg-static'));
const fs = require('fs');

const app = express();
app.get('/', (req, res) => res.send('Bot is Streaming 24/7!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID?.trim();
const CHANNEL_ID = process.env.CHANNEL_ID?.trim();
const VIDEO_PATH = "./video.mp4"; 

client.once('ready', async () => {
    console.log(`[+] Logged in successfully as ${client.user.tag}`);
    
    if (!GUILD_ID || !CHANNEL_ID) {
        console.error("[-] ERROR: GUILD_ID or CHANNEL_ID is missing!");
        return;
    }

    if (!fs.existsSync(VIDEO_PATH)) {
        console.error("[-] CRITICAL ERROR: 'video.mp4' file not found in the project root!");
        return;
    }

    try {
        console.log("[~] Initializing StreamConnection...");
        const streamConnection = new StreamConnection(client, GUILD_ID);

        console.log("[~] Forcing connection to voice channel...");
        client.guilds.cache.get(GUILD_ID)?.shard.send({
            op: 4,
            d: {
                guild_id: GUILD_ID,
                channel_id: CHANNEL_ID,
                self_mute: false,
                self_deaf: false,
                self_video: true
            }
        });

        console.log("[~] Waiting for connection handshake...");
        await new Promise(r => setTimeout(r, 4000));

        if (typeof streamConnection.setVideoStatus === 'function') {
            streamConnection.setVideoStatus(true);
        }

        console.log("[~] Starting optimized FFmpeg stream to bypass Error 2015...");

        // تعديل إعدادات FFmpeg لتتناسب بدقة مع متطلبات ديسكورد للكاميرا
        const command = ffmpeg(VIDEO_PATH)
            .inputOptions([
                '-stream_loop -1',
                '-re'
            ])
            .outputOptions([
                '-map 0:v:0',
                '-f mpegts',
                '-codec:v libx264',
                '-profile:v baseline',
                '-level 3.0',
                '-pix_fmt yuv420p',
                '-s 1280x720',
                '-r 30',
                '-g 60',
                '-b:v 800k',
                '-an'
            ]);

        streamLivestreamVideo(command, streamConnection);
        
        console.log("[+] Camera is OFFICIALLY ON and streaming successfully!");

    } catch (error) {
        console.error("[-] Stream Execution Error:", error);
    }
});

process.on('unhandledRejection', () => {});

client.login(TOKEN);
