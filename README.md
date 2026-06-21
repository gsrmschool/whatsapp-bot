# WhatsApp Bot - Cloud Setup (Render.com - FREE)

## SETUP (sirf ek baar karna hai)

### Step 1: GitHub account banao
1. Browser me jao: github.com
2. "Sign up" par click karo, email/password se account banao

### Step 2: Naya Repository banao
1. Login karne ke baad, top-right "+" icon → "New repository"
2. Naam do: `whatsapp-bot` (kuch bhi naam de sakte ho)
3. "Public" select karo
4. "Create repository" dabao

### Step 3: Files upload karo
1. Apni nayi repository ke page par "uploading an existing file" wala link dikhega - usse click karo
2. Yeh 3 files (jo maine di hain) drag-and-drop karo:
   - `send.js`
   - `package.json`
   - `render.yaml`
3. Neeche "Commit changes" green button dabao

### Step 4: Render.com par account banao
1. Browser me jao: render.com
2. "Get Started" → "Sign up with GitHub" (GitHub se hi login karo, easy hai)
3. Permission allow karo

### Step 5: Naya Web Service banao
1. Render dashboard me "New +" button → "Web Service"
2. Apni GitHub repository (`whatsapp-bot`) connect karo - list me dikhegi, "Connect" dabao
3. Settings:
   - Name: `whatsapp-bot` (ya kuch bhi)
   - Region: Singapore (India ke sabse paas)
   - Branch: main
   - Runtime: Node
   - Build Command: `npm install` (already bhara hoga)
   - Start Command: `node send.js` (already bhara hoga)
   - Instance Type: **Free** select karo
4. Neeche "Create Web Service" dabao

### Step 6: Deploy hone do
- 2-5 minute lagega, logs me progress dikhega
- "Live" status green dikhega jab ready ho

### Step 7: QR Scan karo
1. Upar apni service ka URL milega (jaise `https://whatsapp-bot-xxxx.onrender.com`)
2. Us URL ko browser me kholo
3. QR code dikhega
4. Phone se WhatsApp → Linked Devices → Link a Device → scan karo
5. Page automatically refresh hoga, "✅ Connected & Ready" dikhega

### Step 8: GSRM/Attendance app me URL update karo
Apna service URL mujhe do (jaise `https://whatsapp-bot-xxxx.onrender.com`), main aapke
GSRM aur Attendance app me yeh URL daal dunga taaki "Send All via Bot" button isi
se connect ho.

---

## ROZANA KA KAAM
1. GSRM ya Attendance app browser me kholo
2. Content taiyar karo
3. "🚀 Send All via Bot" button dabao

## AGAR SESSION SPIN-DOWN HO JAYE (15 min inactivity ke baad)
1. Service URL (jaise `https://whatsapp-bot-xxxx.onrender.com`) browser me kholo
2. 30-60 second wait karo (server jaag raha hoga)
3. Agar QR dikhe to dobara scan karo
4. "Connected" dikhne ke baad GSRM app me jaake button dabao
