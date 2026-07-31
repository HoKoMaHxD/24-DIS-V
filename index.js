const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const { StreamConnection, streamLivestreamVideo } = require('@dank074/discord-video-stream');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(require('ffmpeg-static'));
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

        console.log("[~] Processing and streaming video with FFmpeg to prevent Error 2015...");

        // استخدام FFmpeg لمعالجة الفيديو وضبط الإطارات والدقة لتتطابق مع معايير ديسكورد
        const command = ffmpeg(VIDEO_PATH)
            .inputOptions([
                '-stream_loop -1', // تكرار الفيديو للأبد بلا توقف
                '-re'
            ])
            .outputOptions([
                '-map 0:v:0',
                '-f mpegts',
                '-codec:v libx264',
                '-pix_fmt yuv420p',
                '-r 30',          // تثبيت معدل الإطارات على 30 لتجنب خطأ 2015
                '-g 60',
                '-b:v 1000k',
                '-an'             // إلغاء الصوت لمنع التعارض
            ]);

        // ربط المعالج مباشرة ببث ديسكورد
        streamLivestreamVideo(command, streamConnection);
        
        console.log("[+] Camera is OFFICIALLY ON and video is streaming perfectly!");

    } catch (error) {
        console.error("[-] Stream Execution Error:", error);
    }
});

client.login(TOKEN);
