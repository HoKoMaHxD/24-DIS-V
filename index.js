const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { StreamConnection, streamLivestreamVideo } = require('@dank074/discord-video-stream');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(require('ffmpeg-static'));
const fs = require('fs');

const app = express();
app.get('/', (req, res) => res.send('Bot is Streaming 24/7!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID?.trim();
const CHANNEL_ID = process.env.CHANNEL_ID?.trim();
const VIDEO_PATH = "./video.mp4"; 

client.once('ready', async () => {
    console.log(`[+] Logged in successfully as ${client.user.tag}`);
    
    if (!GUILD_ID || !CHANNEL_ID) {
        console.error("[-] ERROR: GUILD_ID or CHANNEL_ID is missing!");
        return;
    }

    if (!fs.existsSync(VIDEO_PATH)) {
        console.error("[-] CRITICAL ERROR: 'video.mp4' file not found!");
        return;
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error("[-] ERROR: Bot/Account is not in the specified Server!");
        return;
    }

    try {
        console.log("[~] Initializing StreamConnection...");
        const streamConnection = new StreamConnection(client, GUILD_ID);

        console.log("[~] Joining voice channel...");
        await streamConnection.joinChannel(CHANNEL_ID);

        console.log("[~] Starting optimized FFmpeg stream...");

        const command = ffmpeg(VIDEO_PATH)
            .inputOptions([
                '-stream_loop -1',
                '-re'
            ])
            .outputOptions([
                '-map 0:v:0',
                '-f mpegts',
                '-codec:v libx264',
                '-profile:v baseline',
                '-level 3.0',
                '-pix_fmt yuv420p',
                '-s 1280x720',
                '-r 30',
                '-g 60',
                '-b:v 800k',
                '-an'
            ]);

        streamLivestreamVideo(command, streamConnection);
        
        console.log("[+] SUCCESS: Account joined the room and camera stream is live!");

    } catch (error) {
        console.error("[-] Stream Execution Error:", error);
    }
});

process.on('unhandledRejection', () => {});

client.login(TOKEN);
