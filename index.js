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
    
    // تأسيس الاتصال الآمن بدون استهلاك الذاكرة
    const voiceConnection = new VideoModule.VoiceConnection(
        GUILD_ID, 
        client.user.id,
        () => {},
        (err) => { console.error("[-] Voice Connection Error:", err); }
    );

    // سحب البيانات من ديسكورد
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
    // الدخول للروم الصوتي
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
                    // إضاءة علامة الكاميرا الخضراء
                    if (typeof voiceConnection.setVideoStatus === 'function') {
                        voiceConnection.setVideoStatus(true);
                    }

                    console.log("[~] Wrapping connection in Stream Wrapper...");
                    
                    // التعديل السحري: هنا نقوم بتغليف الاتصال لكي يتعرف عليه مشغل الفيديو!
                    const streamWrapper = new VideoModule.StreamConnection(voiceConnection);

                    // رقعة حماية أخيرة: لو كانت المكتبة تعاني من نقص، نعوضه يدوياً
                    if (!streamWrapper.udp || typeof streamWrapper.udp.sendVideoFrame !== 'function') {
                        console.log("[~] Forcing Video Packetizer injection...");
                        try {
                            const packetizer = new VideoModule.VideoPacketizerH264(voiceConnection);
                            if (!streamWrapper.udp) streamWrapper.udp = voiceConnection.udp;
                            streamWrapper.udp.sendVideoFrame = (frame) => {
                                if (typeof packetizer.sendFrame === 'function') packetizer.sendFrame(frame);
                                else if (typeof packetizer.onFrame === 'function') packetizer.onFrame(frame);
                            };
                        } catch(e) {}
                    }

                    console.log("[~] Starting the video broadcast...");
                    // تشغيل البث وتمريره عبر "الغلاف" الصحيح بدلاً من الاتصال الخام
                    VideoModule.streamLivestreamVideo(VIDEO_PATH, streamWrapper);
                    
                    console.log("[+] Camera is OFFICIALLY ON and rendering video in the room!");
                    
                } catch (e) {
                    console.error("[-] Stream Error:", e);
                }
            }, 2000);
        }
    }, 500); 
});

client.login(TOKEN);
