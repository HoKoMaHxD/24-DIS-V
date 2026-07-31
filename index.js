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

    // --- النظام الأول: استخدام أداة البث الرسمية (Go Live) إن وُجدت ---
    if (VideoModule.Streamer) {
        console.log("[~] Official Streamer API detected. Initializing Go Live...");
        const streamer = new VideoModule.Streamer(client);
        try {
            await streamer.joinVoice(GUILD_ID, CHANNEL_ID);
            console.log("[~] Voice Channel Joined! Creating Stream...");
            const streamConn = await streamer.createStream();
            
            console.log("[~] Broadcasting video...");
            VideoModule.streamLivestreamVideo(VIDEO_PATH, streamConn);
            console.log("[+] Stream is OFFICIALLY ON!");
        } catch (e) {
            console.error("[-] Streamer API Error:", e);
        }
        return; 
    }

    // --- النظام الثاني: حقن الكاميرا بالقوة (Search & Rescue Patch) ---
    console.log("[~] Initializing Native Voice Connection for Camera...");
    const voiceConnection = new VideoModule.VoiceConnection(
        GUILD_ID, 
        client.user.id,
        () => {},
        (err) => { console.error("[-] Voice Connection Error:", err); }
    );

    client.on('raw', (packet) => {
        if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.guild_id === GUILD_ID && packet.d.user_id === client.user.id) {
            voiceConnection.setSession(packet.d.session_id);
        }
        if (packet.t === 'VOICE_SERVER_UPDATE' && packet.d.guild_id === GUILD_ID) {
            voiceConnection.setTokens(packet.d.endpoint, packet.d.token);
            voiceConnection.start(); 
        }
    });

    console.log("[~] Sending OP 4 to join the voice channel...");
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

    const checkReady = setInterval(() => {
        if (voiceConnection.udp) {
            clearInterval(checkReady);
            console.log("[~] UDP Tunnel Established Successfully!");

            setTimeout(() => {
                console.log("[~] Finalizing connection and Video Status...");
                try {
                    if (typeof voiceConnection.setVideoStatus === 'function') {
                        voiceConnection.setVideoStatus(true);
                    }

                    // هنا يحدث السحر: البحث عن الدالة المفقودة وحقنها
                    if (typeof voiceConnection.udp.sendVideoFrame !== 'function') {
                        console.log("[~] Missing sendVideoFrame. Initiating Search & Rescue Patch...");
                        let patched = false;
                        
                        // البحث في كل ملفات المكتبة عن الوظيفة المطلوبة
                        for (const key in VideoModule) {
                            try {
                                const proto = VideoModule[key].prototype;
                                if (proto && typeof proto.sendVideoFrame === 'function') {
                                    console.log(`[~] Found sendVideoFrame inside: ${key}`);
                                    voiceConnection.udp.sendVideoFrame = proto.sendVideoFrame.bind(voiceConnection.udp);
                                    patched = true;
                                    break;
                                }
                            } catch (e) {}
                        }
                        
                        if (!patched) {
                            console.log("[-] CRITICAL: Could not find sendVideoFrame in library files!");
                        } else {
                            console.log("[~] Function injected successfully!");
                        }
                    }

                    console.log("[~] Starting the video broadcast...");
                    VideoModule.streamLivestreamVideo(VIDEO_PATH, voiceConnection);
                    console.log("[+] Camera is OFFICIALLY ON and rendering video in the room!");
                    
                } catch (e) {
                    console.error("[-] Stream Error:", e);
                }
            }, 2000);
        }
    }, 500); 
});

client.login(TOKEN);
