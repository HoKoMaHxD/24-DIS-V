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

    console.log("[~] Hooking into Discord Voice API...");
    
    // 1. تجهيز أدوات الاتصال بالروم
    const voiceConnection = new VideoModule.VoiceConnection(GUILD_ID, client);
    const streamConnection = new VideoModule.StreamConnection(voiceConnection);

    // 2. التنصت على ديسكورد وسحب الأرقام السرية لإنشاء النفق
    client.on('raw', async (packet) => {
        // سحب أيدي الجلسة (Session ID)
        if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.user_id === client.user.id && packet.d.guild_id === GUILD_ID) {
            console.log("[~] Voice Session ID captured!");
            voiceConnection.setSession(packet.d.session_id);
        }
        
        // سحب مفتاح السيرفر (Endpoint & Token)
        if (packet.t === 'VOICE_SERVER_UPDATE' && packet.d.guild_id === GUILD_ID) {
            console.log("[~] Voice Server Endpoint captured!");
            voiceConnection.setTokens(packet.d.endpoint, packet.d.token);
            
            console.log("[~] Establishing internal Voice WebSocket...");
            // 3. بدء الاتصال الداخلي الموثوق
            voiceConnection.start(); 
            
            // 4. الانتظار 4 ثوانٍ حتى يتم بناء النفق بنجاح قبل بث الفيديو
            setTimeout(() => {
                try {
                    console.log("[~] Sending Video Status (ON)...");
                    voiceConnection.setVideoStatus(true);
                    
                    console.log("[~] Pushing video data through the stream...");
                    VideoModule.streamLivestreamVideo(VIDEO_PATH, streamConnection);
                    
                    console.log("[+] Camera is OFFICIALLY ON! You should see it now.");
                } catch (e) {
                    console.error("[-] Stream Error:", e);
                }
            }, 4000); 
        }
    });

    console.log("[~] Forcing connection to voice channel...");
    // 5. إعطاء أمر الدخول للروم لتفعيل عملية السحب
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
