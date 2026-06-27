const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const http = require('http');

const PORT = process.env.PORT || 3000;
const DELAY_MS = 4000;

let isReady = false;
let isSending = false;
let lastQR = null;
let statusMsg = 'Starting up... please wait.';

// Render par Chrome ka path
const CHROME_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: CHROME_PATH,
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
  statusMsg = '📱 QR Code ready! Neeche scan karo.';
  lastQR = await QRCode.toDataURL(qr);
  console.log('QR generated - open web page to scan');
});

client.on('ready', () => {
  isReady = true;
  lastQR = null;
  statusMsg = '✅ WhatsApp Connected! Bot ready hai.';
  console.log(statusMsg);
});

client.on('authenticated', () => {
  statusMsg = '🔐 Authenticated, connecting...';
  console.log(statusMsg);
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

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="refresh" content="5">
        <title>WhatsApp Bot</title>
        <style>
          body{font-family:sans-serif;text-align:center;padding:30px;background:#111;color:#fff;}
          .status{font-size:18px;margin:20px auto;padding:14px;border-radius:8px;background:#222;max-width:400px;}
          img{max-width:280px;border:8px solid #fff;border-radius:8px;margin-top:20px;}
        </style>
      </head>
      <body>
        <h2>📱 WhatsApp Bot Status</h2>
        <div class="status">${statusMsg}</div>
        ${lastQR ? <p>Phone se scan karo:</p><img src="${lastQR}" /> : ''}
        ${isReady ? '<p style="color:lightgreen;font-size:22px;margin-top:20px;">✅ Connected & Ready!<br>Ab GSRM app me button dabao.</p>' : ''}
        <p style="color:#555;font-size:12px;margin-top:30px;">Page har 5 second me auto-refresh hoti hai</p>
      </body>
      </html>
    `);
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready: isReady, status: statusMsg }));
    return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    if (!isReady) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Bot ready nahi hai. Pehle web page khol ke QR scan karo.' }));
      return;
    }
    if (isSending) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Pehle wali request chal rahi hai, thodi der ruko.' }));
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

  res.writeHead(404); res.end('Not found');
});

async function sendQueue(list) {
  isSending = true;
  console.log(📋 ${list.length} messages bhejne ka order mila...);
  for (let i = 0; i < list.length; i++) {
    let phone = (list[i].phone || '').replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    try {
      await client.sendMessage(phone + '@c.us', list[i].message);
      console.log(✅ [${i+1}/${list.length}] Sent to ${phone});
    } catch (err) {
      console.log(❌ [${i+1}/${list.length}] FAILED ${phone}: ${err.message});
    }
    if (i < list.length - 1) await new Promise(r => setTimeout(r, DELAY_MS));
  }
  console.log('🎉 Done!');
  isSending = false;
}

server.listen(PORT, () => console.log(🌐 Server on port ${PORT}));
