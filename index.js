const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('انقطع الاتصال، جاري إعادة المحاولة...');
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🌸 تم اتصال بوت YUI بنجاح يا فردوس! البوت يعمل الآن 🤍');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const messageType = Object.keys(msg.message)[0];
        let text = "";

        if (messageType === 'conversation') {
            text = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            text = msg.message.extendedTextMessage.text;
        }

        const sender = msg.key.remoteJid;
        const pushName = msg.pushName || "صديقي/صديقتي";

        if (text.trim() === '.اوامر') {
            const menuText = `「 🌸╎اهـلًا بِـڪ يـا @${pushName} فـيِ قـائِـمـة الأوامِــر الـخـَاصَـه بــ YUI ♡
⊱ ٠ ٠ ─๋︩︪─ ┈═⤣💐⤤═— ─๋︩︪─ ┈ ─๋︩︪─ ╮
╮┈ ─๋︩︪──ׅ─ׅ┈ ─๋︩︪☇ـ
│⤣ ۬♡ـ˖ ⟨ قـائِـمـة الأوامِــر 🌸 ┇
┤└┈ ─๋︩︪──ׅ─ׅ┈ ─๋︩︪☇ـ
┘─ׅ─ׅ┈ ─๋︩︪──ׅ─ׅ─ׅ┈ ─๋︩︪☇ـ
│⤣ ۬♡ـ˖ ⟨ 𝐘𝐔𝐈 🧚🏼‍♀️ ┇
╯┈ ─๋︩︪──ׅ─ׅ┈ ─๋︩︪☇ـ
⊱ ٠ ٠ ─๋︩︪─ ┈═⤣💐⤤═— ─๋︩︪─ ┈ ─๋︩︪─ ╯

^᪲᪲ 𝐁𝐘 : 𝐘𝐔𝐈 ♡`;

            await sock.sendMessage(sender, { 
                text: menuText,
                mentions: [msg.key.participant || sender]
            });
        }
    });
}

startBot();
