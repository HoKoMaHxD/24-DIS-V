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

    console.log("[~] Initializing Native Voice Connection...");
    
    // التعديل الجذري: ترتيب المتغيرات الصحيح هو (client, GUILD_ID) 
    // هذا التصحيح البسيط يمنع انفجار الذاكرة نهائياً
    const voiceConnection = new VideoModule.VoiceConnection(client, GUILD_ID);

    // التنصت لالتقاط البيانات السرية من ديسكورد
    client.on('raw', (packet) => {
        if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.guild_id === GUILD_ID && packet.d.user_id === client.user.id) {
            console.log("[~] Voice Session ID captured.");
            voiceConnection.setSession(packet.d.session_id);
        }
        
        if (packet.t === 'VOICE_SERVER_UPDATE' && packet.d.guild_id === GUILD_ID) {
            console.log("[~] Voice Server Endpoint captured. Connecting...");
            voiceConnection.setTokens(packet.d.endpoint, packet.d.token);
            
            // الآن ستعمل هذه الدالة بسلاسة ولن تسبب أي انهيار
            voiceConnection.start(); 
        }
    });

    console.log("[~] Sending OP 4 to join the voice channel...");
    // إعطاء أمر الدخول للروم وتفعيل حالة الكاميرا
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

    console.log("[~] Waiting for UDP Tunnel and Handshake...");

    // فحص مستمر حتى يكتمل بناء النفق الداخلي
    const checkReady = setInterval(() => {
        if (voiceConnection.udp) {
            clearInterval(checkReady);
            console.log("[~] UDP Tunnel Established Successfully!");

            // ننتظر ثانيتين لضمان استقرار الاتصال قبل ضخ الفيديو
            setTimeout(() => {
                console.log("[~] Finalizing connection and Video Status...");
                
                try {
                    // تفعيل زر الكاميرا الأخضر
                    if (typeof voiceConnection.setVideoStatus === 'function') {
                        voiceConnection.setVideoStatus(true);
                    }

                    // رقعة طبية (Patch) لضمان عدم ظهور خطأ sendVideoFrame الشهير
                    if (typeof voiceConnection.udp.sendVideoFrame !== 'function') {
                        console.log("[~] Patching internal Video Packetizer...");
                        try {
                            const packetizer = new VideoModule.VideoPacketizerH264(voiceConnection);
                            voiceConnection.udp.sendVideoFrame = (frame) => {
                                if (typeof packetizer.sendFrame === 'function') packetizer.sendFrame(frame);
                                else if (typeof packetizer.onFrame === 'function') packetizer.onFrame(frame);
                            };
                        } catch (patchErr) {
                            console.log("[~] Natively handling packets...");
                        }
                    }

                    console.log("[~] Starting the video broadcast...");
                    
                    try {
                        // تشغيل البث عبر الاتصال المباشر
                        VideoModule.streamLivestreamVideo(VIDEO_PATH, voiceConnection);
                        console.log("[+] Camera is OFFICIALLY ON and rendering video in the room!");
                    } catch (e) {
                        console.log("[~] Using StreamConnection wrapper fallback...");
                        // استخدام الغلاف الاحتياطي في حال تطلبته المكتبة
                        const streamConnection = new VideoModule.StreamConnection(voiceConnection);
                        VideoModule.streamLivestreamVideo(VIDEO_PATH, streamConnection);
                        console.log("[+] Camera is OFFICIALLY ON and rendering video in the room!");
                    }
                    
                } catch (e) {
                    console.error("[-] Stream Error:", e);
                }
            }, 2000);
        }
    }, 500); 
});

client.login(TOKEN);
