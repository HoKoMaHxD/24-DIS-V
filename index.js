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
    
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error(`[-] ERROR: Account is not in the server with ID: ${GUILD_ID}`);
        return;
    }

    try {
        console.log("[~] Preparing video streaming modules...");
        
        // 1. تجهيز أداة الاتصال بالروم
        const voiceConnection = new VideoModule.VoiceConnection(GUILD_ID, client);
        
        // 2. تجهيز نفق مسار الفيديو
        const streamConnection = new VideoModule.StreamConnection(voiceConnection);
        
        console.log("[~] Entering the voice channel with Camera enabled...");
        
        // 3. إجبار ديسكورد على إدخال الحساب بصلاحية الكاميرا
        guild.shard.send({
            op: 4,
            d: {
                guild_id: GUILD_ID,
                channel_id: CHANNEL_ID,
                self_mute: false,
                self_deaf: false,
                self_video: true
            }
        });
        
        // 4. الانتظار 5 ثوانٍ لكي يتمكن ديسكورد من إنشاء مسار البث بنجاح
        console.log("[~] Waiting 5 seconds for Discord handshake...");
        await new Promise(r => setTimeout(r, 5000)); 
        
        // 5. تأكيد تفعيل حالة الفيديو للحساب
        if (typeof voiceConnection.setVideoStatus === 'function') {
            voiceConnection.setVideoStatus(true);
        }
        
        console.log("[~] Broadcasting video...");
        
        // 6. تشغيل الفيديو وتمريره عبر النفق الذي أنشأناه
        try {
            VideoModule.streamLivestreamVideo(VIDEO_PATH, streamConnection);
        } catch (e) {
            console.log("[~] Fallback to voiceConnection for streaming...");
            VideoModule.streamLivestreamVideo(VIDEO_PATH, voiceConnection);
        }

        console.log("[+] Camera is ON and visible in the room!");
        
    } catch (error) {
        console.error("[-] Error Details:", error);
    }
});

client.login(TOKEN);
