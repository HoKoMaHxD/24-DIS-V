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
        const streamConnection = new StreamConnection(client, GUILD_ID);

        // التقاط بيانات الاتصال لمنع خطأ الـ UDP وتجهيز الكائن يدوياً لو تطلب الأمر
        client.on('raw', (packet) => {
            if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.guild_id === GUILD_ID && packet.d.user_id === client.user.id) {
                if (typeof streamConnection.setSession === 'function') {
                    streamConnection.setSession(packet.d.session_id);
                }
            }
            if (packet.t === 'VOICE_SERVER_UPDATE' && packet.d.guild_id === GUILD_ID) {
                if (typeof streamConnection.setTokens === 'function') {
                    streamConnection.setTokens(packet.d.endpoint, packet.d.token);
                }
                if (typeof streamConnection.start === 'function') {
                    streamConnection.start();
                }
            }
        });

        console.log("[~] Forcing connection to voice channel...");
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

        console.log("[~] Waiting for connection handshake and UDP tunnel...");
        await new Promise(r => setTimeout(r, 5000));

        // حماية وتجهيز دالة sendVideoFrame يدوياً لتجنب الانهيار نهائياً
        if (!streamConnection.udp) {
            streamConnection.udp = {};
        }
        if (typeof streamConnection.udp.sendVideoFrame !== 'function') {
            streamConnection.udp.sendVideoFrame = function (frame) {
                try {
                    if (typeof this.send === 'function') {
                        this.send(frame);
                    }
                } catch (e) {}
            };
        }

        console.log("[~] Starting video stream broadcast...");
        streamLivestreamVideo(VIDEO_PATH, streamConnection);
        
        console.log("[+] Camera is OFFICIALLY ON and streaming successfully!");

    } catch (error) {
        console.error("[-] Stream Execution Error:", error);
    }
});

client.login(TOKEN);
