const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const VideoModule = require('@dank074/discord-video-stream');
const { spawn } = require('child_process');
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
        console.error("[-] CRITICAL: 'video.mp4' file not found!");
        return;
    }

    console.log("[~] Initializing Native Voice Connection...");
    
    const voiceConnection = new VideoModule.VoiceConnection(
        GUILD_ID, 
        client.user.id,
        () => {},
        (err) => {}
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

                    console.log("[~] Launching FFmpeg live video pipe to bypass loading screen...");

                    // تشغيل FFmpeg لبث الفيديو بصيغة حية تتوافق مع ديسكورد وتعمل بلا توقف (Loop)
                    const ffmpeg = spawn('ffmpeg', [
                        '-stream_loop', '-1', // تكرار الفيديو للأبد
                        '-re',
                        '-i', VIDEO_PATH,
                        '-map', '0:v:0?',
                        '-f', 'rawvideo',
                        '-pix_fmt', 'yuv420p',
                        '-s', '1280x720',
                        '-r', '30',
                        '-an', // إلغاء الصوت لتجنب مشاكل التوافق
                        '-'
                    ]);

                    ffmpeg.stderr.on('data', (data) => {
                        // إخفاء السجلات غير الضرورية
                    });

                    ffmpeg.on('close', (code) => {
                        console.log(`[-] FFmpeg stream process closed with code ${code}`);
                    });

                    // ضخ بيانات الفيديو مباشرة إلى نفق الاتصال فور خروجها من المعالج
                    if (voiceConnection.udp) {
                        const udpSocket = voiceConnection.udp.socket || voiceConnection.udp;
                        
                        ffmpeg.stdout.on('data', (chunk) => {
                            try {
                                if (typeof voiceConnection.udp.send === 'function') {
                                    voiceConnection.udp.send(chunk);
                                } else if (voiceConnection.udp.conn && typeof voiceConnection.udp.conn.send === 'function') {
                                    voiceConnection.udp.conn.send(chunk);
                                }
                            } catch (e) {}
                        });
                    }

                    console.log("[+] Camera is ON and live video streaming is active!");
                    
                } catch (e) {
                    console.error("[-] Stream Error:", e);
                }
            }, 2000);
        }
    }, 500); 
});

client.login(TOKEN);
