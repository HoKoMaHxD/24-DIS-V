const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
// استدعاء الأدوات الجديدة بالأسماء الصحيحة التي ظهرت في الفحص
const { StreamConnection, streamLivestreamVideo } = require('@dank074/discord-video-stream');

const app = express();
app.get('/', (req, res) => res.send('Bot is Streaming 24/7!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));

const client = new Client({ checkUpdate: false });

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const VIDEO_PATH = "./video.mp4"; 

client.on('ready', async () => {
    console.log(`[+] Logged in as ${client.user.tag}`);
    
    try {
        console.log("[~] Joining voice channel...");
        // استخدام StreamConnection بدلاً من Streamer
        const connection = new StreamConnection(client);
        
        // الدخول للروم الصوتي (بنينا شرطاً احتياطياً ليتوافق مع أي تعديل للمكتبة)
        if (connection.joinVoiceChannel) {
            await connection.joinVoiceChannel(GUILD_ID, CHANNEL_ID);
        } else {
            await connection.joinVoice(GUILD_ID, CHANNEL_ID);
        }
        
        console.log("[~] Creating stream connection...");
        const udp = await connection.createStream();
        
        console.log("[~] Starting the video broadcast...");
        // بث الفيديو باستخدام الأداة الجديدة
        streamLivestreamVideo(VIDEO_PATH, udp);
        
        console.log("[+] Camera is ON!");
    } catch (error) {
        console.error("[-] Error:", error);
    }
});

client.login(TOKEN);
