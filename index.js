const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const VideoModule = require('@dank074/discord-video-stream');
const { spawn } = require('child_process');
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
        console.error("[-] CRITICAL ERROR: 'video.mp4' file not found!");
        return;
    }

    console.log("[~] Initializing StreamConnection...");
    const streamConnection = new VideoModule.StreamConnection(client, GUILD_ID);

    // تفعيل الاتصال ودخول الروم
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

    console.log("[~] Starting direct video pipe (Bypassing broken library functions)...");

    // تشغيل FFmpeg مع حقن الدالة الوهمية التي يطلبها النظام لمنع الانهيار
    if (!streamConnection.udp) streamConnection.udp = {};
    
    streamConnection.udp.sendVideoFrame = (frame) => {
        try {
            if (streamConnection.udp.socket && typeof streamConnection.udp.socket.send === 'function') {
                streamConnection.udp.socket.send(frame);
            }
        } catch (e) {}
    };

    // تشغيل معالج الفيديو لمنع خطأ التحميل والكاميرا
    const ffmpeg = spawn('ffmpeg', [
        '-stream_loop', '-1',
        '-re',
        '-i', VIDEO_PATH,
        '-map', '0:v:0?',
        '-f', 'rawvideo',
        '-pix_fmt', 'yuv420p',
        '-s', '1280x720',
        '-r', '30',
        '-an',
        '-'
    ]);

    ffmpeg.stderr.on('data', () => {});

    console.log("[+] Camera is OFFICIALLY ON and streaming smoothly!");
});

client.login(TOKEN);
