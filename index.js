const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const { StreamConnection, streamLivestreamVideo } = require('@dank074/discord-video-stream');
const fs = require('fs');

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

    if (!fs.existsSync(VIDEO_PATH)) {
        console.error("[-] CRITICAL ERROR: 'video.mp4' file not found in the project root!");
        return;
    }

    try {
        console.log("[~] Initializing StreamConnection...");
        const streamConnection = new StreamConnection(client);

        console.log("[~] Joining voice channel...");
        await streamConnection.joinVoiceChannel(GUILD_ID, CHANNEL_ID);
        
        console.log("[~] Starting video stream broadcast...");
        streamLivestreamVideo(VIDEO_PATH, streamConnection);
        
        console.log("[+] Camera is OFFICIALLY ON and streaming successfully!");

    } catch (error) {
        console.error("[-] Stream Execution Error:", error);
    }
});

client.login(TOKEN);
