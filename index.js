const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const VideoModule = require('@dank074/discord-video-stream');

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
        
        const voiceConnection = new VideoModule.VoiceConnection(client);
        if (typeof voiceConnection.joinVoiceChannel === 'function') {
            await voiceConnection.joinVoiceChannel(GUILD_ID, CHANNEL_ID);
        } else if (typeof voiceConnection.connect === 'function') {
            await voiceConnection.connect(GUILD_ID, CHANNEL_ID);
        }
        
        console.log("[~] Searching for UDP Stream internal object...");
        
        let udp;
        
        if (voiceConnection.udp) {
            udp = voiceConnection.udp;
        } else if (voiceConnection.voiceConnection && voiceConnection.voiceConnection.udp) {
            udp = voiceConnection.voiceConnection.udp;
        }
        
        if (!udp) {
            const proto = Object.getPrototypeOf(voiceConnection);
            const methods = Object.getOwnPropertyNames(proto).filter(m => typeof proto[m] === 'function');
            for (let m of methods) {
                if (m.toLowerCase().includes('stream') || m.toLowerCase().includes('udp')) {
                    try {
                        const result = await voiceConnection[m]();
                        if (result && typeof result === 'object') { udp = result; break; }
                    } catch (e) {}
                }
            }
        }
        
        if (!udp) {
            for (const key in voiceConnection) {
                const val = voiceConnection[key];
                if (val && val.constructor && val.constructor.name === 'VoiceUdp') {
                    udp = val;
                    break;
                }
            }
        }
        
        if (!udp && typeof VideoModule.StreamConnection === 'function') {
            const streamConn = new VideoModule.StreamConnection(voiceConnection);
            if (typeof streamConn.createStream === 'function') {
                udp = await streamConn.createStream();
            } else if (streamConn.udp) {
                udp = streamConn.udp;
            }
        }

        if (!udp) {
            throw new Error("Failed to extract the UDP Stream Connection.");
        }

        console.log("[~] Starting the video broadcast...");
        VideoModule.streamLivestreamVideo(VIDEO_PATH, udp);
        console.log("[+] Camera is ON!");
        
    } catch (error) {
        console.error("[-] Error Details:", error);
    }
});

client.login(TOKEN);
