const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const VideoModule = require('@dank074/discord-video-stream');

const app = express();
app.get('/', (req, res) => res.send('Bot is Streaming 24/7!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready!'));

const client = new Client({ checkUpdate: false });

// إضافة .trim() لمسح أي مسافات زائدة مخفية في الأرقام
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID?.trim();
const CHANNEL_ID = process.env.CHANNEL_ID?.trim();
const VIDEO_PATH = "./video.mp4"; 

client.on('ready', async () => {
    console.log(`[+] Logged in as ${client.user.tag}`);
    
    // 1. فحص شامل للأرقام والصلاحيات قبل محاولة الدخول
    if (!GUILD_ID || !CHANNEL_ID) {
        console.error("[-] ERROR: GUILD_ID or CHANNEL_ID is missing in Render Environment!");
        return;
    }
    
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error(`[-] ERROR: Account is not in the server with ID: ${GUILD_ID}`);
        return;
    }
    
    const channel = guild.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.error(`[-] ERROR: Cannot find the voice channel ${CHANNEL_ID}. Check if the ID is correct and the account has permission to see it.`);
        return;
    }

    try {
        console.log("[~] Joining voice channel...");
        
        const voiceConnection = new VideoModule.VoiceConnection(client);
        
        // أوامر تفعيل الكاميرا والمايك
        const options = { selfVideo: true, selfDeaf: false, selfMute: false };
        
        let joined = false;
        
        // 2. الدخول للروم بالطريقة المتوافقة مع المكتبة
        if (typeof voiceConnection.joinVoiceChannel === 'function') {
            await voiceConnection.joinVoiceChannel(GUILD_ID, CHANNEL_ID, options);
            joined = true;
        } else if (typeof voiceConnection.connect === 'function') {
            await voiceConnection.connect(GUILD_ID, CHANNEL_ID, options);
            joined = true;
        }

        // 3. طريقة الإجبار عبر واجهة ديسكورد مباشرة (في حال تعنتت المكتبة)
        if (!joined) {
            console.log("[~] Forcing connection directly via Discord API...");
            guild.shard.send({
                op: 4,
                d: {
                    guild_id: GUILD_ID,
                    channel_id: CHANNEL_ID,
                    self_mute: false,
                    self_deaf: false,
                    self_video: true
                }
            });
        }
        
        console.log("[~] Searching for UDP Stream internal object...");
        
        // 4. استخراج مسار الفيديو بذكاء (وهذا الجزء نجح معنا سابقاً)
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
        console.log("[+] Camera is ON and visible!");
        
    } catch (error) {
        console.error("[-] Error Details:", error);
    }
});

client.login(TOKEN);
