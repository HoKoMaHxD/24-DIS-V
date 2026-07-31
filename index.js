const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const VideoModule = require('@dank074/discord-video-stream');
const { spawn } = require('child_process');

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

                    console.log("[~] Starting direct manual FFmpeg video transmission...");
                    
                    // استخدام FFmpeg مباشرة لتحويل وقراءة الفيديو وتصديره كبيانات خام متوافقة مع ديسكورد
                    const ffmpeg = spawn('ffmpeg', [
                        '-re',
                        '-i', VIDEO_PATH,
                        '-map', '0:v:0?',
                        '-f', 'rawvideo',
                        '-pix_fmt', 'yuv420p',
                        '-s', '1280x720',
                        '-r', '30',
                        '-an',
                        '-'
                    ]);

                    ffmpeg.stderr.on('data', (data) => {
                        // كتم رسائل FFmpeg لعدم إزعاج السجلات
                    });

                    ffmpeg.on('close', (code) => {
                        console.log(`[-] FFmpeg process exited with code ${code}`);
                    });

                    // التقاط تدفق البيانات وإرسالها مباشرة عبر الـ UDP الخاص باتصال ديسكورد
                    if (voiceConnection.udp && typeof voiceConnection.udp.send === 'function') {
                        ffmpeg.stdout.on('data', (chunk) => {
                            try {
                                voiceConnection.udp.send(chunk);
                            } catch (e) {}
                        });
                    }

                    console.log("[+] Camera is OFFICIALLY ON and streaming manually!");
                    
                } catch (e) {
                    console.error("[-] Stream Error:", e);
                }
            }, 2000);
        }
    }, 500); 
});

client.login(TOKEN);
