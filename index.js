const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const VideoModule = require('@dank074/discord-video-stream');
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

    // التأكد من وجود ملف الفيديو قبل البدء
    if (!fs.existsSync(VIDEO_PATH)) {
        console.error("[-] CRITICAL ERROR: 'video.mp4' file not found in the project root!");
        return;
    }

    console.log("[~] Initializing Native Voice Connection...");
    
    const voiceConnection = new VideoModule.VoiceConnection(
        GUILD_ID, 
        client.user.id,
        () => {},
        (err) => {}
    );

    client.on('raw', (packet) => {
        if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.guild_id === GUILD_ID && packet.d.user_id === client.user.id) {
            voiceConnection.setSession(packet.d.session_id);
        }
        if (packet.t === 'VOICE_SERVER_UPDATE' && packet.d.guild_id === GUILD_ID) {
            voiceConnection.setTokens(packet.d.endpoint, packet.d.token);
            voiceConnection.start(); 
        }
    });

    console.log("[~] Sending OP 4 to join the voice channel...");
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

    const checkReady = setInterval(() => {
        if (voiceConnection.udp) {
            clearInterval(checkReady);
            console.log("[~] UDP Tunnel Established Successfully!");

            setTimeout(() => {
                console.log("[~] Finalizing connection and Video Status...");
                try {
                    if (typeof voiceConnection.setVideoStatus === 'function') {
                        voiceConnection.setVideoStatus(true);
                    }

                    // استخدام أداة البث الرسمية مع إجبار التكرار (Loop) ليعمل الفيديو بلا توقف
                    const streamConnection = new VideoModule.StreamConnection(voiceConnection);
                    
                    console.log("[~] Starting continuous video streaming...");
                    
                    // دالة لتشغيل الفيديو بصيغة متوافقة تماماً وتتجاوز مشكلة التحميل
                    const startStreaming = () => {
                        try {
                            VideoModule.streamLivestreamVideo(VIDEO_PATH, streamConnection);
                        } catch (err) {
                            VideoModule.streamLivestreamVideo(VIDEO_PATH, voiceConnection);
                        }
                    };

                    startStreaming();
                    
                    // إعادة تشغيل الفيديو تلقائياً لو انتهى لضمان عدم توقف البث
                    setInterval(() => {
                        try {
                            startStreaming();
                        } catch (e) {}
                    }, 30000); // إعادة محاولة الضخ كل 30 ثانية لتجنب التوقف

                    console.log("[+] Camera is ON and video loop is active!");
                    
                } catch (e) {
                    console.error("[-] Stream Error:", e);
                }
            }, 2000);
        }
    }, 500); 
});

client.login(TOKEN);
