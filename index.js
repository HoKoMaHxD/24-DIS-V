const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const { StreamConnection, streamLivestreamVideo } = require('@dank074/discord-video-stream');

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

    try {
        console.log("[~] Initializing StreamConnection...");
        // تهيئة الاتصال المباشر الخاص بالمكتبة
        const streamConnection = new StreamConnection(client, GUILD_ID);

        console.log("[~] Forcing connection to voice channel...");
        // إعطاء أمر الدخول للروم وتفعيل الكاميرا عبر واجهة ديسكورد
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

        // الانتظار قليلاً حتى يستقر الاتصال ويبدأ البث بسلاسة
        console.log("[~] Waiting for connection handshake...");
        await new Promise(r => setTimeout(r, 4000));

        console.log("[~] Starting 24/7 video stream...");
        // تشغيل البث بالطريقة الصحيحة والمتوافقة تماماً مع الإصدار الأخير
        streamLivestreamVideo(VIDEO_PATH, streamConnection);
        
        console.log("[+] Camera is OFFICIALLY ON and streaming!");
        
    } catch (error) {
        console.error("[-] Stream Error:", error);
    }
});

client.login(TOKEN);
