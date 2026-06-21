// ============================================================
// WhatsApp Bot - Cloud Version (Render.com)
// ============================================================
// Yeh server cloud par chalega 24x7. QR code ek WEB PAGE par
// dikhega (terminal ki zarurat nahi) - bas browser me URL kholo.
// ============================================================

const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const http = require('http');

const PORT = process.env.PORT || 3000;
const DELAY_MS = 4000; // har message ke beech delay

let isReady = false;
let isSending = false;
let lastQR = null; // latest QR code (as data-url image)
let statusMsg = 'Starting up...';

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '/opt/render/project/src/.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

client.on('qr', async (qr) => {
  statusMsg = 'QR Code ready! Scan karo neeche diye gaye QR ko.';
  lastQR = await QRCode.toDataURL(qr);
  console.log('QR code generated - open the web page to scan it.');
});

client.on('ready', () => {
  isReady = true;
  lastQR = null;
  statusMsg = '✅ WhatsApp Connected! Bot ready hai.';
  console.log(statusMsg);
});

client.on('authenticated', () => {
  statusMsg = '🔐 Authenticated, connecting...';
});

client.on('auth_failure', (msg) => {
  statusMsg = '❌ Auth failed: ' + msg;
  console.log(statusMsg);
});

client.on('disconnected', (reason) => {
  isReady = false;
  statusMsg = '⚠️ Disconnected: ' + reason;
  console.log(statusMsg);
});

client.initialize();

// ---------------- HTTP server ----------------
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Home page - shows QR or status
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="refresh" content="5">
        <title>WhatsApp Bot Status</title>
        <style>
          body{font-family:sans-serif;text-align:center;padding:40px;background:#111;color:#fff;}
          img{max-width:280px;border:8px solid #fff;border-radius:8px;margin-top:20px;}
          .status{font-size:18px;margin-top:20px;padding:14px;border-radius:8px;background:#222;}
        </style>
      </head>
      <body>
        <h2>📱 WhatsApp Bot</h2>
        <div class="status">${statusMsg}</div>
        ${lastQR ? `<img src="${lastQR}" />` : ''}
        ${isReady ? '<p style="color:lightgreen;font-size:20px;">✅ Connected &amp; Ready</p>' : ''}
        <p style="color:#888;font-size:12px;margin-top:30px;">Page har 5 second me refresh hoti hai</p>
      </body>
      </html>
    `);
    return;
  }

  // Health check / status as JSON
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready: isReady, status: statusMsg }));
    return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    if (!isReady) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'WhatsApp ready nahi hai abhi. Pehle web page khol ke QR scan karo.' }));
      return;
    }
    if (isSending) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Pehle wali request chal rahi hai.' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let list;
      try { list = JSON.parse(body); } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid data' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, count: list.length }));
      sendQueue(list);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

async function sendQueue(list) {
  isSending = true;
  console.log(`📋 ${list.length} messages bhejne ka order mila...`);

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    let phone = (item.phone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const chatId = phone + '@c.us';

    try {
      await client.sendMessage(chatId, item.message);
      console.log(`✅ [${i + 1}/${list.length}] Sent to ${phone}`);
    } catch (err) {
      console.log(`❌ [${i + 1}/${list.length}] FAILED for ${phone} -> ${err.message}`);
    }

    if (i < list.length - 1) {
      await new Promise(res => setTimeout(res, DELAY_MS));
    }
  }
  console.log('🎉 Sab messages bhej diye gaye!');
  isSending = false;
}

server.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// Self-ping to reduce sleep frequency while active (optional helper)
setInterval(() => {
  console.log('💓 Heartbeat - bot is alive. Status:', statusMsg);
}, 10 * 60 * 1000);
