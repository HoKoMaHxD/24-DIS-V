const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const VideoModule = require('@dank074/discord-video-stream');

// إعداد خادم الويب لمنع السكون
const app = express();
app.get('/', (req, res) => res.send('Bot is Streaming 24/7!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));

// إعداد الحساب
const client = new Client({ checkUpdate: false });

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const VIDEO_PATH = "./video.mp4"; 

client.on('ready', async () => {
    console.log(`[+] Logged in as ${client.user.tag}`);
    
    try {
        console.log("[~] Joining voice channel...");
        
        // 1. استخدام VoiceConnection بدلاً من StreamConnection للدخول
        const voiceConnection = new VideoModule.VoiceConnection(client);
        
        // 2. الدخول للروم بذكاء (للتوافق مع أي تغيير في اسم الدالة)
        if (typeof voiceConnection.joinVoiceChannel === 'function') {
            await voiceConnection.joinVoiceChannel(GUILD_ID, CHANNEL_ID);
        } else if (typeof voiceConnection.joinVoice === 'function') {
            await voiceConnection.joinVoice(GUILD_ID, CHANNEL_ID);
        } else if (typeof voiceConnection.connect === 'function') {
            await voiceConnection.connect(GUILD_ID, CHANNEL_ID);
        }
        
        console.log("[~] Creating stream connection...");
        
        // 3. إنشاء مسار نقل الفيديو
        let udp;
        if (typeof voiceConnection.createStream === 'function') {
            udp = await voiceConnection.createStream();
        } else {
            const streamConnection = new VideoModule.StreamConnection(voiceConnection);
            udp = await streamConnection.createStream();
        }
        
        console.log("[~] Starting the video broadcast...");
        
        // 4. تشغيل الفيديو في الكاميرا
        VideoModule.streamLivestreamVideo(VIDEO_PATH, udp);
        console.log("[+] Camera is ON!");
        
    } catch (error) {
        console.error("[-] Error Details:", error);
    }
});

client.login(TOKEN);
