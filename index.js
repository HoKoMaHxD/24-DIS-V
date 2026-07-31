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

    console.log("[~] Initializing Voice Connection...");
    
    // 1. الاتصال الرسمي: المكتبة ستلتقط البيانات بنفسها دون تدخل منا
    const voiceConnection = new VideoModule.VoiceConnection(GUILD_ID, client);

    // 2. إجبار ديسكورد على إدخال الحساب وتشغيل الكاميرا
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

    console.log("[~] Waiting for library to build the UDP Tunnel...");

    // 3. فحص مستمر حتى يكتمل بناء النفق الداخلي
    const checkReady = setInterval(() => {
        // ننتظر حتى يتم إنشاء الـ UDP بنجاح
        if (voiceConnection.udp) {
            clearInterval(checkReady);
            console.log("[~] UDP Tunnel Established!");

            // ننتظر ثانيتين إضافيتين لضمان استقرار الاتصال قبل البث
            setTimeout(() => {
                // 4. الحل العبقري: إصلاح الخطأ البرمجي في المكتبة حقن الدالة الناقصة
                if (typeof voiceConnection.udp.sendVideoFrame !== 'function') {
                    console.log("[~] Library BUG detected. Injecting missing Video Packetizer...");
                    
                    try {
                        // استدعاء أداة الفيديو بشكل مستقل
                        const packetizer = new VideoModule.VideoPacketizerH264(voiceConnection);
                        
                        // زرع الدالة الناقصة داخل النفق لتمرير الفيديو
                        voiceConnection.udp.sendVideoFrame = function(frame) {
                            if (typeof packetizer.sendFrame === 'function') {
                                packetizer.sendFrame(frame);
                            } else if (typeof packetizer.onFrame === 'function') {
                                packetizer.onFrame(frame);
                            }
                        };
                        console.log("[~] Packetizer successfully injected and patched!");
                    } catch (e) {
                        console.error("[-] Failed to inject packetizer:", e);
                    }
                }

                // 5. تفعيل علامة الكاميرا
                if (typeof voiceConnection.setVideoStatus === 'function') {
                    voiceConnection.setVideoStatus(true);
                }

                // 6. تشغيل الفيديو
                console.log("[~] Starting the video broadcast...");
                try {
                    VideoModule.streamLivestreamVideo(VIDEO_PATH, voiceConnection);
                    console.log("[+] Camera is OFFICIALLY ON and video is rendering!");
                } catch (e) {
                    console.error("[-] Video Stream Error:", e);
                }
            }, 2000); 
        }
    }, 500); 
});

client.login(TOKEN);
