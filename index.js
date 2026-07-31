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
    
    // 1. إنشاء الاتصال الصوتي
    const voiceConnection = new VideoModule.VoiceConnection(GUILD_ID, client);

    // 2. التقاط البيانات السرية من ديسكورد لتأسيس النفق بشكل سليم
    client.on('raw', (packet) => {
        if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.guild_id === GUILD_ID && packet.d.user_id === client.user.id) {
            console.log("[~] Voice Session ID captured.");
            voiceConnection.setSession(packet.d.session_id);
        }
        
        if (packet.t === 'VOICE_SERVER_UPDATE' && packet.d.guild_id === GUILD_ID) {
            console.log("[~] Voice Server Endpoint captured. Connecting...");
            voiceConnection.setTokens(packet.d.endpoint, packet.d.token);
            
            // 3. بدء الاتصال الداخلي الموثوق (هذا يمنع خطأ "send" الأخير)
            voiceConnection.start();
        }
    });

    console.log("[~] Sending OP 4 to join the voice channel...");
    // 4. إعطاء أمر الدخول للروم
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

    // 5. فحص مستمر حتى يكتمل بناء النفق الداخلي
    const checkReady = setInterval(() => {
        if (voiceConnection.udp) {
            clearInterval(checkReady);
            console.log("[~] UDP Tunnel Established Successfully!");

            // ننتظر ثانية واحدة لضمان استقرار الاتصال قبل البث
            setTimeout(() => {
                console.log("[~] Setting up Video Packetizer (Stream Wrapper)...");
                
                // 6. السر هنا: تغليف الاتصال بأداة البث لتركيب مسار الفيديو بشكل صحيح
                const streamConnection = new VideoModule.StreamConnection(voiceConnection);

                try {
                    console.log("[~] Turning on Camera Status...");
                    voiceConnection.setVideoStatus(true);
                } catch (e) {
                    console.error("[-] Status Error:", e.message);
                }

                console.log("[~] Starting the video broadcast...");
                try {
                    // 7. تمرير أداة streamConnection بدلاً من voiceConnection لتجنب خطأ sendVideoFrame
                    VideoModule.streamLivestreamVideo(VIDEO_PATH, streamConnection);
                    console.log("[+] Camera is OFFICIALLY ON and rendering video in the room!");
                } catch (e) {
                    console.error("[-] Video Stream Error:", e);
                }
            }, 1000);
        }
    }, 500); 
});

client.login(TOKEN);
