const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const VideoModule = require('@dank074/discord-video-stream');

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

    console.log("[~] Establishing Strict Voice Connection Bridge...");
    
    // 1. إنشاء الاتصال الصوتي وربطه بالسيرفر
    const voiceConnection = new VideoModule.VoiceConnection(GUILD_ID, client);

    // 2. بناء "الجسر": التقاط بيانات ديسكورد السرية وتمريرها للمكتبة لبناء نفق الـ UDP
    client.on('raw', async (packet) => {
        // التقاط بيانات الجلسة وتمريرها
        if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.guild_id === GUILD_ID && packet.d.user_id === client.user.id) {
            console.log("[~] Captured Session Data. Forwarding to library...");
            if (typeof voiceConnection.handleSession === 'function') {
                voiceConnection.handleSession(packet.d);
            }
        }
        
        // التقاط تصاريح السيرفر وتمريرها
        if (packet.t === 'VOICE_SERVER_UPDATE' && packet.d.guild_id === GUILD_ID) {
            console.log("[~] Captured Server Handshake. Forwarding to library...");
            if (typeof voiceConnection.handleReady === 'function') {
                voiceConnection.handleReady(packet.d);
            }

            console.log("[~] Handshake successful! Waiting 5 seconds for UDP tunneling...");
            
            // 3. الانتظار حتى تنتهي المكتبة من بناء النفق الداخلي للفيديو
            setTimeout(() => {
                try {
                    // تفعيل زر الكاميرا
                    if (typeof voiceConnection.setVideoStatus === 'function') {
                        voiceConnection.setVideoStatus(true);
                    }

                    // التحقق من أن النفق تم بناؤه وأنه يحتوي على أداة sendVideoFrame
                    if (!voiceConnection.udp || typeof voiceConnection.udp.sendVideoFrame !== 'function') {
                        console.error("[-] ERROR: UDP Tunnel was not built properly by the library.");
                        return;
                    }

                    console.log("[~] UDP Tunnel Verified! Initiating Video Broadcast...");
                    
                    // 4. تشغيل البث وتمريره عبر النفق السليم
                    VideoModule.streamLivestreamVideo(VIDEO_PATH, voiceConnection);
                    
                    console.log("[+] Camera is OFFICIALLY ON and video is rendering!");
                    
                } catch (e) {
                    console.error("[-] Video Stream Error:", e);
                }
            }, 5000);
        }
    });

    console.log("[~] Forcing Discord to connect to the voice channel...");
    // 5. إعطاء أمر الدخول للروم لتشغيل الجسر الذي بنيناه
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
});

client.login(TOKEN);
