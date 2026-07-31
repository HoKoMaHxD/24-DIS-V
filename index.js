const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
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
    
    // فحص المتغيرات قبل الدخول
    if (!GUILD_ID || !CHANNEL_ID) {
        console.error("[-] ERROR: GUILD_ID or CHANNEL_ID is missing or undefined!");
        return;
    }
    
    try {
        console.log("[~] Joining voice channel as a Streamer...");
        
        // استخدام أداة البث المخصصة لإجبار ديسكورد على إظهار الكاميرا
        const streamConn = new StreamConnection(client);
        
        await streamConn.joinVoiceChannel(GUILD_ID, CHANNEL_ID);
        console.log("[~] Successfully entered the room!");
        
        // سحب مسار البث مباشرة من الكائن
        const udp = streamConn.udp || (streamConn.voiceConnection ? streamConn.voiceConnection.udp : null);
        
        if (!udp) {
            throw new Error("Could not find the UDP connection for video.");
        }

        console.log("[~] Starting the video broadcast...");
        streamLivestreamVideo(VIDEO_PATH, udp);
        console.log("[+] Camera is ON and visible!");
        
    } catch (error) {
        console.error("[-] Error Details:", error);
    }
});

client.login(TOKEN);
