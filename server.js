const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const obj2gltf = require('obj2gltf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const https = require('https');
const querystring = require('querystring');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-core');

const db = require('./server/db_supabase');
const { runMigrations } = require('./server/migrations');
const { createBackup, listBackups } = require('./scripts/backup');
const { validatePhone, validateEmail, validateName, validateMessage, validatePassword, validateLead } = require('./utils/validate');

// Run migrations
// runMigrations();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const serverStartTime = Date.now();

// ===== ENSURE DIRECTORIES EXIST =====
const uploadsDir = path.join(__dirname, 'uploads');
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(uploadsDir)) try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { console.warn("Mkdir skipped (read-only):", e.message); }
if (!fs.existsSync(backupsDir)) try { fs.mkdirSync(backupsDir, { recursive: true }); } catch (e) { console.warn("Mkdir skipped (read-only):", e.message); }

// ===== MIDDLEWARE =====
app.set('etag', false); // Disable ETag to prevent 304 responses breaking client JSON parsing
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(__dirname));

// CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Request logging with timestamps
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Block path traversal attempts on raw URL (before Express normalizes)
app.use((req, res, next) => {
  if (req.url.includes('..')) {
    return res.status(400).json({ error: 'คำขอไม่ถูกต้อง' });
  }
  next();
});

// Disable ETag and cache for API routes — prevents 304 responses that break client-side JSON parsing
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// ===== IMAGE UPLOAD =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(null, false);
  }
});

// File upload for attachments (allows any file type)
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext;
    cb(null, name);
  }
});
const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// File upload for 3D models (.glb, .gltf, poster images)
const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext;
    cb(null, name);
  }
});
const modelUpload = multer({
  storage: modelStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.glb', '.gltf', '.obj', '.mtl', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('อนุญาตเฉพาะไฟล์ .glb, .gltf, .obj, .jpg, .png, .webp เท่านั้น'));
  }
});

// Convert .obj to .glb using obj2gltf
async function convertObjToGlb(objPath) {
  const glbPath = objPath.replace(/\.obj$/i, '.glb');
  const glb = await obj2gltf(objPath, { binary: true });
  fs.writeFileSync(glbPath, glb);
  // Remove original .obj after conversion
  try { fs.unlinkSync(objPath); } catch {}
  return glbPath;
}

// ===== RATE LIMITERS =====
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'เข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

const leadsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'ส่งข้อมูลบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'อัพโหลดบ่อยเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

const bulkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'ดำเนินการจำนวนมากเกินไป กรุณารอสักครู่' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== AUTH MIDDLEWARE =====
function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
  }
}

// Admin-only middleware
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
  }
  next();
}

// CSRF protection for cookie-based auth
// Checks Origin/Referer header matches the server host
async function csrfProtection(req, res, next) {
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      const reqHost = req.headers.host;
      if (originHost !== reqHost) {
        return res.status(403).json({ error: 'CSRF validation failed' });
      }
    } catch {
      // Invalid origin URL — allow (could be non-browser client)
    }
  }
  // If no origin/referer (e.g., API client, mobile app), allow through
  next();
}

// ===== LEAD SCORING =====
async function calculateScore(lead) {
  let score = 0;
  const MAX_SCORE = 10;
  const budgetScores = {
    'มากกว่า 10,000,000': 5, '5,000,000 - 10,000,000': 4,
    '3,000,000 - 5,000,000': 3, '1,000,000 - 3,000,000': 2,
    '500,000 - 1,000,000': 1, 'ต่ำกว่า 500,000': 0.5
  };
  score += budgetScores[lead.budget_range] || 0;
  if (lead.service_type && lead.service_type !== 'อื่นๆ') score += 2;
  if (lead.message && lead.message.length > 10) score += 1;
  if (lead.appointment_date) score += 2;
  score = Math.min(score, MAX_SCORE);
  return Math.round(score * 10) / 10;
}

// ===== THAI DATE HELPER =====
async function getTodayThai() {
  const now = new Date();
  const thaiOffset = 7 * 60;
  const local = new Date(now.getTime() + (thaiOffset + now.getTimezoneOffset()) * 60000);
  return local.toISOString().split('T')[0];
}

// ===== NOTIFICATION FUNCTIONS =====
async function sendLineNotify(message) {
  try {
    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    if (!row) return;
    const config = JSON.parse(row.content);
    // LINE Messaging API (new)
    if (config.line_messaging_enabled && config.line_channel_access_token && config.line_user_id) {
      return sendLineMessaging(config.line_channel_access_token, config.line_user_id, message);
    }
    // Legacy LINE Notify (fallback)
    if (config.line_notify_enabled && config.line_notify_token) {
      return sendLineNotifyRaw(config.line_notify_token, message);
    }
  } catch (err) {
    console.error('LINE Notify error:', err.message);
  }
}

function sendLineMessaging(accessToken, to, message) {
  const postData = JSON.stringify({
    to: to,
    messages: [{ type: 'text', text: message }]
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.line.me',
      path: '/v2/bot/message/push',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error('LINE Messaging API error: ' + res.statusCode + ' ' + data));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function sendLineNotifyRaw(token, message) {
  const postData = querystring.stringify({ message });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'notify-api.line.me',
      path: '/api/notify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer ' + token,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function sendTelegramNotify(message) {
  try {
    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    if (!row) return;
    const config = JSON.parse(row.content);
    if (!config.telegram_enabled || !config.telegram_bot_token || !config.telegram_chat_id) return;

    const url = `https://api.telegram.org/bot${config.telegram_bot_token}/sendMessage`;
    const postData = JSON.stringify({
      chat_id: config.telegram_chat_id,
      text: message,
      parse_mode: 'HTML'
    });

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const req = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  } catch (err) {
    console.error('Telegram Notify error:', err.message);
  }
}

// ===== EMAIL NOTIFICATION (Nodemailer) =====
async function getEmailTransporter() {
  try {
    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    if (!row) return null;
    const config = JSON.parse(row.content);
    if (!config.email_enabled || !config.smtp_host || !config.smtp_user || !config.smtp_pass) return null;
    return nodemailer.createTransport({
      host: config.smtp_host || 'smtp.gmail.com',
      port: parseInt(config.smtp_port) || 587,
      secure: false,
      auth: { user: config.smtp_user, pass: config.smtp_pass }
    });
  } catch { return null; }
}

async function sendEmailNotification(to, subject, htmlBody) {
  try {
    const transporter = await getEmailTransporter();
    if (!transporter) return;
    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    const config = row ? JSON.parse(row.content) : {};
    const fromEmail = config.smtp_user || 'noreply@nuchainnovation.com';
    transporter.sendMail({
      from: `"NUCHA INNOVATION" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: htmlBody
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('Email notification error:', err.message);
  }
}

async function sendLeadNotificationEmail(lead) {
  try {
    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    if (!row) return;
    const config = JSON.parse(row.content);
    const notifyEmail = config.notify_email || config.smtp_user;
    if (!notifyEmail) return;

    const subject = `🆕 Lead ใหม่: ${lead.name} - ${lead.service_type || 'อื่นๆ'}`;
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#D60000,#B00000);color:white;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:1.4rem;">🏗️ NUCHA CRM — Lead ใหม่!</h1>
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;font-weight:600;color:#666;width:120px;">👤 ชื่อ</td><td style="padding:8px 0;">${lead.name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#666;">📞 โทร</td><td style="padding:8px 0;">${lead.phone}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#666;">📧 อีเมล</td><td style="padding:8px 0;">${lead.email || '-'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#666;">🔧 บริการ</td><td style="padding:8px 0;">${lead.service_type || 'อื่นๆ'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#666;">💰 งบ</td><td style="padding:8px 0;">${lead.budget_range || 'ไม่ระบุ'}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#666;">📝 ข้อความ</td><td style="padding:8px 0;">${lead.message || '-'}</td></tr>
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="http://localhost:3000/admin" style="display:inline-block;background:#D60000;color:white;padding:12px 32px;border-radius:50px;text-decoration:none;font-weight:600;">เปิด CRM ดู Lead</a>
          </div>
        </div>
      </div>`;
    await sendEmailNotification(notifyEmail, subject, html);
  } catch (err) {
    console.error('Lead email notification error:', err.message);
  }
}

async function sendFollowUpReminderEmail() {
  try {
    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    if (!row) return;
    const config = JSON.parse(row.content);
    const notifyEmail = config.notify_email || config.smtp_user;
    if (!notifyEmail) return;

    const today = await getTodayThai();
    const followups = await db.prepare(`
      SELECT n.*, l.name as lead_name, l.phone as lead_phone, l.service_type 
      FROM notes n JOIN leads l ON n.lead_id = l.id 
      WHERE n.follow_up_done = 0 AND n.follow_up_date <= ?
      ORDER BY n.follow_up_date ASC LIMIT 20
    `).all(today);

    if (followups.length === 0) return;

    const rows = followups.map(f => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${f.lead_name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${f.lead_phone}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${f.service_type}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${f.follow_up_date}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${f.note?.substring(0, 50) || '-'}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#D60000,#B00000);color:white;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;">📋 Follow-up Reminder — ${today}</h1>
        </div>
        <div style="background:white;padding:24px;border:1px solid #eee;border-radius:0 0 12px 12px;">
          <p style="color:#666;">มี ${followups.length} รายการที่ต้อง follow-up:</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#f5f5f5;">
              <th style="padding:8px;text-align:left;">ชื่อ</th><th style="padding:8px;text-align:left;">โทร</th>
              <th style="padding:8px;text-align:left;">บริการ</th><th style="padding:8px;text-align:left;">วันที่</th>
              <th style="padding:8px;text-align:left;">บันทึก</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:20px;text-align:center;">
            <a href="http://localhost:3000/admin" style="display:inline-block;background:#D60000;color:white;padding:12px 32px;border-radius:50px;text-decoration:none;font-weight:600;">เปิด CRM</a>
          </div>
        </div>
      </div>`;
    await sendEmailNotification(notifyEmail, `📋 Follow-up Reminder: ${followups.length} รายการ`, html);
  } catch (err) {
    console.error('Follow-up reminder email error:', err.message);
  }
}

// ===== LINE OA WEBHOOK HANDLER =====
// Verify LINE webhook signature
function verifyLineSignature(channelSecret, body, signature) {
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  return hash === signature;
}

// Reply to LINE message
async function replyLineMessage(accessToken, replyToken, messages) {
  const postData = JSON.stringify({ replyToken, messages });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.line.me',
      path: '/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error('LINE Reply API error: ' + res.statusCode));
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Get LINE user profile
async function getLineUserProfile(accessToken, userId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.line.me',
      path: `/v2/bot/profile/${userId}`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Process incoming LINE messages
async function handleLineEvent(accessToken, event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userMsg = event.message.text;
  const replyToken = event.replyToken;

  // Store in chat_messages using LINE userId as session_id
  const sessionId = 'line_' + userId;
  const safeMsg = String(userMsg).replace(/<[^>]*>/g, '').slice(0, 2000);

  // Get user profile for name
  let customerName = 'LINE User';
  try {
    const profile = await getLineUserProfile(accessToken, userId);
    if (profile && profile.displayName) customerName = profile.displayName;
  } catch {}

  await db.prepare('INSERT INTO chat_messages (session_id, sender, message, customer_name) VALUES (?, ?, ?, ?)')
    .run(sessionId, 'customer', safeMsg, customerName);

  // Auto-reply with FAQ matching
  const faqRow = await db.prepare("SELECT content FROM site_content WHERE section_key = 'chatbot_faq'").get();
  let replyText = '';

  if (faqRow) {
    try {
      const faq = JSON.parse(faqRow.content);
      const lower = userMsg.toLowerCase();
      for (const [key, item] of Object.entries(faq)) {
        if (item.k && item.k.some(kw => lower.includes(kw.toLowerCase()))) {
          replyText = item.a;
          break;
        }
      }
    } catch {}
  }

  // Default reply if no FAQ match
  if (!replyText) {
    replyText = `ขอบคุณครับคุณ ${customerName}! 🙏\nข้อความของคุณถูกส่งถึงทีมงานแล้ว\nทีมงานจะติดต่อกลับเร็วๆ นี้ครับ\n\n💡 หรือโทร: 02-123-4567`;
  }

  try {
    await replyLineMessage(accessToken, replyToken, [{ type: 'text', text: replyText }]);
    // Store bot reply
    await db.prepare('INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)')
      .run(sessionId, 'bot', replyText);
  } catch (err) {
    console.error('LINE reply error:', err.message);
  }
}

// LINE Webhook endpoint
app.post('/api/line/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    if (!row) return res.status(200).json({ success: true });
    const config = JSON.parse(row.content);

    if (!config.line_channel_access_token || !config.line_channel_secret) {
      return res.status(200).json({ success: true });
    }

    // Verify signature
    const signature = req.headers['x-line-signature'];
    if (signature && !verifyLineSignature(config.line_channel_secret, req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const body = JSON.parse(req.body.toString());
    if (body.events && body.events.length > 0) {
      for (const event of body.events) {
        await handleLineEvent(config.line_channel_access_token, event).catch(console.error);
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('LINE webhook error:', err);
    res.status(200).json({ success: true }); // Always return 200 to LINE
  }
});

// ===== PDF GENERATION (Quotation / Invoice) =====
async function generateQuotationPDF(proposalData) {
  const items = Array.isArray(proposalData.items) ? proposalData.items : JSON.parse(proposalData.items || '[]');
  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><div class="svc-main">${item.name || ''}</div><div class="svc-detail">${item.detail || ''}</div></td>
      <td class="num">${item.qty || 1}</td>
      <td class="num">฿${Number(item.price || 0).toLocaleString()}</td>
      <td class="num">฿${Number((item.qty || 1) * (item.price || 0)).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Noto Sans Thai',sans-serif;color:#4A4543;background:#fff}
      .header{background:linear-gradient(135deg,#D60000,#B00000);color:#fff;padding:32px 40px;display:flex;justify-content:space-between;align-items:flex-start}
      .header h1{font-size:1.6rem;font-weight:800}
      .header p{font-size:.85rem;opacity:.85;line-height:1.6}
      .badge{background:rgba(255,255,255,.2);padding:10px 20px;border-radius:10px;text-align:right}
      .badge .num{font-size:1.2rem;font-weight:800}
      .badge .date{font-size:.82rem;opacity:.8}
      .body{padding:32px 40px}
      .client{background:#FFF0F0;border-left:4px solid #D60000;border-radius:10px;padding:20px;margin-bottom:28px}
      .client h3{font-size:.8rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#D60000;margin-bottom:10px}
      .client-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.9rem}
      .client-grid .lbl{font-weight:600;color:#9B9593;font-size:.78rem}
      table{width:100%;border-collapse:collapse;font-size:.88rem;margin-bottom:28px}
      thead th{background:#F7F5F4;font-size:.75rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6E6866;padding:12px 14px;text-align:left;border-bottom:2px solid #E4E0DE}
      thead th.num,thead th:nth-child(3),thead th:nth-child(4),thead th:nth-child(5){text-align:right}
      tbody td{padding:12px 14px;border-bottom:1px solid #F0EDEB}
      tbody td.num{text-align:right;font-weight:600}
      .svc-main{font-weight:600}.svc-detail{font-size:.78rem;color:#9B9593}
      .summary{display:flex;justify-content:flex-end;margin-bottom:28px}
      .sum-box{background:#F7F5F4;border-radius:10px;padding:20px 24px;min-width:280px}
      .sum-row{display:flex;justify-content:space-between;padding:6px 0;font-size:.9rem}
      .sum-total{display:flex;justify-content:space-between;padding:14px 0 0;margin-top:8px;border-top:2px solid #D60000}
      .sum-total .lbl{font-weight:700;font-size:1rem}.sum-total .val{font-size:1.4rem;font-weight:800;color:#D60000}
      .terms{background:#F7F5F4;border-radius:10px;padding:20px 24px;margin-bottom:28px}
      .terms h3{font-size:.8rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#D60000;margin-bottom:10px}
      .terms ol{padding-left:18px;font-size:.82rem;color:#6E6866;line-height:1.8}
      .sig{display:grid;grid-template-columns:1fr 1fr;gap:32px;padding-top:16px;border-top:1px solid #E4E0DE}
      .sig-block{text-align:center}
      .sig-block h4{font-size:.8rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9B9593;margin-bottom:12px}
      .sig-line{width:100%;height:1px;background:#C8C2BF;margin-bottom:10px}
      .footer{background:#4A4543;color:#C8C2BF;padding:20px 40px;text-align:center;font-size:.82rem}
      @media print{body{background:#fff}.no-print{display:none}}
    </style></head><body>
    <div class="header">
      <div><h1>Nucha Construction</h1><p>บริการออกแบบ 3D ก่อสร้าง ตกแต่ง ครบวงจร</p></div>
      <div class="badge"><div style="font-size:.72rem;opacity:.8;letter-spacing:2px;text-transform:uppercase">ใบเสนอราคา</div><div class="num">${proposalData.proposal_number || 'QT-0000'}</div><div class="date">วันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
    </div>
    <div class="body">
      ${proposalData.client_name ? `<div class="client"><h3>ข้อมูลลูกค้า</h3><div class="client-grid">
        <div><div class="lbl">ชื่อลูกค้า</div><div>${proposalData.client_name || '-'}</div></div>
        <div><div class="lbl">โทรศัพท์</div><div>${proposalData.client_phone || '-'}</div></div>
        <div><div class="lbl">อีเมล</div><div>${proposalData.client_email || '-'}</div></div>
        <div><div class="lbl">โครงการ</div><div>${proposalData.title || '-'}</div></div>
      </div></div>` : ''}
      <h3 style="font-size:.95rem;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px"><span style="width:4px;height:18px;background:#D60000;border-radius:2px;display:inline-block"></span>รายการบริการ</h3>
      <table><thead><tr><th style="width:36px">#</th><th>รายการ</th><th style="width:70px" class="num">จำนวน</th><th style="width:100px" class="num">ราคา/หน่วย</th><th style="width:100px" class="num">รวม</th></tr></thead>
      <tbody>${itemRows || '<tr><td colspan="5" style="text-align:center;color:#999">ไม่มีรายการ</td></tr>'}</tbody></table>
      <div class="summary"><div class="sum-box">
        <div class="sum-row"><span>ราคารวม</span><span style="font-weight:600">฿${Number(proposalData.subtotal || 0).toLocaleString()}</span></div>
        ${proposalData.tax ? `<div class="sum-row"><span>ภาษี (${proposalData.tax}%)</span><span style="font-weight:600">฿${Number(proposalData.subtotal * proposalData.tax / 100).toLocaleString()}</span></div>` : ''}
        <div class="sum-total"><span class="lbl">ยอดรวมทั้งสิ้น</span><span class="val">฿${Number(proposalData.total || 0).toLocaleString()} <span style="font-size:.8rem;font-weight:600;color:#9B9593">บาท</span></span></div>
      </div></div>
      <div class="terms"><h3>เงื่อนไขและข้อกำหนด</h3><ol>
        <li>ใบเสนอนี้มีอายุ 30 วัน นับจากวันที่ออก</li>
        <li>มัดจำ 50% เมื่อตกลงจ้าง / ชำระส่วนที่เหลือเมื่อส่งมอบงาน</li>
        <li>ระยะเวลาดำเนินงานประมาณ 15-20 วันทำการ หลังได้รับมัดจำ</li>
        <li>แก้ไขได้ไม่เกิน 3 ครั้ง โดยไม่คิดค่าใช้จ่ายเพิ่ม</li>
      </ol></div>
      ${proposalData.notes ? `<div style="background:#FFF0F0;border-radius:10px;padding:16px 20px;margin-bottom:28px;font-size:.88rem;"><strong>หมายเหตุ:</strong> ${proposalData.notes}</div>` : ''}
      <div class="sig"><div class="sig-block"><h4>ผู้เสนอราคา</h4><div class="sig-line"></div><p>Nucha Construction</p></div><div class="sig-block"><h4>ผู้อนุมัติ</h4><div class="sig-line"></div><p>( ลงชื่อ )</p></div></div>
    </div>
    <div class="footer">Nucha Construction — บริการออกแบบ 3D ก่อสร้าง ตกแต่ง ครบวงจร | โทร: 02-123-4567 | LINE: @nucha</div>
  </body></html>`;

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

// PDF Download endpoint
app.get('/api/proposals/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const proposal = await db.prepare(`
      SELECT p.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email
      FROM proposals p LEFT JOIN leads l ON p.lead_id = l.id WHERE p.id = ?
    `).get(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'ไม่พบใบเสนอราคา' });

    const pdf = await generateQuotationPDF({
      ...proposal,
      client_name: proposal.lead_name,
      client_phone: proposal.lead_phone,
      client_email: proposal.lead_email
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proposal.proposal_number || 'quotation'}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'ไม่สามารถสร้าง PDF ได้: ' + err.message });
  }
});

// Email quotation endpoint
app.post('/api/proposals/:id/email', authMiddleware, async (req, res) => {
  try {
    const { to_email } = req.body;
    if (!to_email) return res.status(400).json({ error: 'กรุณากรอกอีเมลผู้รับ' });

    const proposal = await db.prepare(`
      SELECT p.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email
      FROM proposals p LEFT JOIN leads l ON p.lead_id = l.id WHERE p.id = ?
    `).get(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'ไม่พบใบเสนอราคา' });

    const pdf = await generateQuotationPDF({
      ...proposal,
      client_name: proposal.lead_name,
      client_phone: proposal.lead_phone,
      client_email: proposal.lead_email
    });

    const transporter = await getEmailTransporter();
    if (!transporter) return res.status(400).json({ error: 'ยังไม่ได้ตั้งค่า SMTP' });

    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    const config = row ? JSON.parse(row.content) : {};

    transporter.sendMail({
      from: `"NUCHA INNOVATION" <${config.smtp_user}>`,
      to: to_email,
      subject: `ใบเสนอราคา ${proposal.proposal_number} — NUCHA INNOVATION`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#D60000;color:white;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
          <h2>📋 ใบเสนอราคา ${proposal.proposal_number}</h2>
        </div>
        <div style="padding:24px;background:#f9f9f9;border-radius:0 0 12px 12px;">
          <p>เรียน คุณ${proposal.lead_name || 'ลูกค้า'},</p>
          <p>กรุณาดูใบเสนอราคา ${proposal.proposal_number} ที่แนบมากับอีเมลนี้</p>
          <p>ยอดรวม: <strong>฿${Number(proposal.total || 0).toLocaleString()}</strong></p>
          <p style="margin-top:16px;">หากมีข้อสงสัย กรุณาติดต่อเราได้เลยครับ</p>
          <p>📞 02-123-4567 | LINE: @nucha</p>
        </div>
      </div>`,
      attachments: [{
        filename: `${proposal.proposal_number || 'quotation'}.pdf`,
        content: pdf,
        contentType: 'application/pdf'
      }]
    });

    res.json({ success: true, message: 'ส่งอีเมลสำเร็จ' });
  } catch (err) {
    console.error('Email quotation error:', err);
    res.status(500).json({ error: 'ไม่สามารถส่งอีเมลได้: ' + err.message });
  }
});

// Test email endpoint
app.post('/api/test-email', authMiddleware, async (req, res) => {
  try {
    const transporter = await getEmailTransporter();
    if (!transporter) return res.status(400).json({ error: 'ยังไม่ได้ตั้งค่า SMTP (กรุณาตั้งค่าใน Admin > Notifications)' });

    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    const config = row ? JSON.parse(row.content) : {};
    const toEmail = config.notify_email || config.smtp_user;

    transporter.sendMail({
      from: `"NUCHA CRM" <${config.smtp_user}>`,
      to: toEmail,
      subject: '🧪 ทดสอบอีเมลแจ้งเตือน — NUCHA CRM',
      html: `<div style="font-family:sans-serif;text-align:center;padding:40px;">
        <h1 style="color:#D60000;">✅ Email ทำงานปกติ!</h1>
        <p>ระบบแจ้งเตือน NUCHA CRM พร้อมใช้งาน</p>
        <p style="color:#999;font-size:.85rem;">${new Date().toLocaleString('th-TH')}</p>
      </div>`
    });

    res.json({ success: true, message: 'ส่งอีเมลทดสอบสำเร็จ' });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: 'ส่งอีเมลไม่สำเร็จ: ' + err.message });
  }
});

// ===== AUTO-REPLY SYSTEM =====
async function checkAutoReply(leadData) {
  try {
    const row = await db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    if (!row) return;
    const config = JSON.parse(row.content);
    if (!config.auto_reply_enabled) return;

    const templates = config.auto_reply_templates || {};
    // Log auto-reply (in real implementation, would send SMS/LINE/Email)
    if (templates.line) {
      const msg = templates.line.replace('{name}', leadData.name || '');
      console.log(`[AUTO-REPLY LINE] To: ${leadData.phone}, Message: ${msg}`);
      await db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
        .run(leadData.id, 'auto_reply_sent', JSON.stringify({ channel: 'line', message: msg }));
    }
    if (templates.sms) {
      const msg = templates.sms.replace('{name}', leadData.name || '');
      console.log(`[AUTO-REPLY SMS] To: ${leadData.phone}, Message: ${msg}`);
      db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
        .run(leadData.id, 'auto_reply_sent', JSON.stringify({ channel: 'sms', message: msg }));
    }
  } catch (err) {
    console.error('Auto-reply error:', err.message);
  }
}

// ===== LEAD NOTIFICATION ON STATUS CHANGE =====
async function notifyLeadStatusChange(leadId, newStatus, leadName) {
  const message = `📋 อัพเดทสถานะ Lead\n👤 ${leadName}\n📊 สถานะใหม่: ${newStatus}`;
  await sendLineNotify(message).catch(() => {});
  await sendTelegramNotify(message).catch(() => {});
}

// Apply CSRF protection to all state-changing authenticated routes
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    // Only apply CSRF when request has cookies (browser auth)
    if (req.cookies && req.cookies.token) {
      return csrfProtection(req, res, next);
    }
  }
  next();
});

// ===== AUTH ROUTES =====
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'กรอกอีเมลและรหัสผ่าน' });

    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    res.json({ success: true, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
    res.json(user || {});
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Change password
app.put('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
    }

    const pwCheck = validatePassword(new_password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(current_password, user.password)) {
      return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    const hashed = bcrypt.hashSync(new_password, 10);
    await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'กรุณากรอกอีเมล' });

    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่าน' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)')
      .run(user.id, token, expiresAt);

    // In production, send email with reset link
    console.log(`[PASSWORD RESET] Token for ${email}: ${token}`);
    res.json({ success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่าน' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'กรุณากรอก token และรหัสผ่านใหม่' });
    }

    const pwCheck = validatePassword(new_password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });

    const reset = await db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').get(token);
    if (!reset) {
      return res.status(400).json({ error: 'Token ไม่ถูกต้องหรือถูกใช้แล้ว' });
    }

    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token หมดอายุแล้ว' });
    }

    const hashed = bcrypt.hashSync(new_password, 10);
    await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, reset.user_id);
    await db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

    res.json({ success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== IMAGE UPLOAD =====
app.post('/api/upload', authMiddleware, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });
    res.json({ url: '/uploads/' + req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== CONTENT API (Public) =====
app.get('/api/content/:key', async (req, res) => {
  try {
    const row = await db.prepare('SELECT content FROM site_content WHERE section_key = ?').get(req.params.key);
    if (!row) return res.json({});
    try { res.json(JSON.parse(row.content)); } catch { res.json({}); }
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/content', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT section_key, content FROM site_content').all();
    const result = {};
    for (const r of rows) { try { result[r.section_key] = JSON.parse(r.content); } catch {} }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== CONTENT API (Admin) =====
app.put('/api/content/:key', authMiddleware, async (req, res) => {
  try {
    const content = JSON.stringify(req.body);
    await db.prepare('INSERT INTO site_content (section_key, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(section_key) DO UPDATE SET content = ?, updated_at = CURRENT_TIMESTAMP')
      .run(req.params.key, content, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== NOTIFICATION TEST =====
app.post('/api/test-notification', authMiddleware, async (req, res) => {
  try {
    const { channel } = req.body; // 'line', 'telegram', or 'all'
    const results = {};

    if (!channel || channel === 'line' || channel === 'all') {
      try {
        await sendLineNotify('🧪 ทดสอบการแจ้งเตือนจาก NUCHA CRM — ระบบทำงานปกติ ✅');
        results.line = 'success';
      } catch (err) {
        results.line = err.message;
      }
    }

    if (!channel || channel === 'telegram' || channel === 'all') {
      try {
        await sendTelegramNotify('🧪 ทดสอบการแจ้งเตือนจาก NUCHA CRM — ระบบทำงานปกติ ✅');
        results.telegram = 'success';
      } catch (err) {
        results.telegram = err.message;
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== NAV ITEMS =====
app.get('/api/nav', async (req, res) => {
  try {
    const items = await db.prepare('SELECT * FROM nav_items ORDER BY sort_order').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/nav', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
    await db.prepare('DELETE FROM nav_items').run();
    const insert = await db.prepare('INSERT INTO nav_items (label, href, sort_order, is_visible) VALUES (?, ?, ?, ?)');
    let i = 0; for (const item of items) {
      const safeLabel = String(item.label || '').replace(/<[^>]*>/g, '');
      // Allow tel:, mailto:, http(s)://, and relative paths like #section or /page
      const safeHref = String(item.href || '#').replace(/[^a-zA-Z0-9\-_/#.?&=:@+!%,]/g, '');
      await insert.run(safeLabel, safeHref, item.sort_order || i + 1, item.is_visible ?? 1);
     i++;}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== LEADS =====
// Get leads with filtering, sorting, pagination
app.get('/api/leads', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT * FROM leads';
    const conditions = [];
    const params = [];

    // Role-based filtering
    if (req.user.role === 'sales') {
      conditions.push('assigned_to = ?');
      params.push(req.user.id);
    }

    // Date range filter
    if (req.query.date_from) {
      conditions.push('created_at >= ?');
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      conditions.push('created_at <= ?');
      params.push(req.query.date_to + ' 23:59:59');
    }

    // Budget range filter
    if (req.query.budget_range) {
      conditions.push('budget_range = ?');
      params.push(req.query.budget_range);
    }

    // Service type filter
    if (req.query.service_type) {
      conditions.push('service_type = ?');
      params.push(req.query.service_type);
    }

    // Status filter
    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }

    // Search by name, phone, email (escape LIKE wildcards)
    if (req.query.search) {
      conditions.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      const escaped = String(req.query.search).replace(/[%_]/g, '\\$&');
      const searchTerm = `%${escaped}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    const sortField = req.query.sort || 'created_at';
    const allowedSortFields = ['created_at', 'name', 'score', 'updated_at', 'status'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const allowedSortOrders = ['ASC', 'DESC'];
    const sortOrder = allowedSortOrders.includes(String(req.query.order).toUpperCase()) ? String(req.query.order).toUpperCase() : 'DESC';
    query += ` ORDER BY ${safeSortField} ${sortOrder}`;

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = await db.prepare(countQuery).get(...params);
    const total = totalResult ? totalResult.total : 0;

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const leads = await db.prepare(query).all(...params);
    res.json({
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get leads error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Create lead (with duplicate detection)
app.post('/api/leads', leadsLimiter, async (req, res) => {
  try {
    const { name, phone, email, service_type, budget_range, message, appointment_date, appointment_time, meeting_type } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'กรอกชื่อและเบอร์โทร' });

    // Validate input
    const validation = validateLead({ name, phone, email, message });
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const force = req.query.force === 'true';

    // Duplicate detection
    if (!force) {
      const cleanPhone = validation.data.phone;
      const existing = await db.prepare("SELECT * FROM leads WHERE phone = ? OR (email = ? AND email != '')").get(cleanPhone, validation.data.email);
      if (existing) {
        return res.status(409).json({
          error: 'พบ lead ที่มีเบอร์โทรหรืออีเมลซ้ำ',
          duplicate: true,
          existing_lead: {
            id: existing.id,
            name: existing.name,
            phone: existing.phone,
            email: existing.email,
            status: existing.status,
            created_at: existing.created_at
          }
        });
      }
    }

    const score = await calculateScore({ budget_range, service_type, message, appointment_date });
    const result = await db.prepare(
      'INSERT INTO leads (name, phone, email, service_type, budget_range, message, score, appointment_date, appointment_time, meeting_type, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(validation.data.name, validation.data.phone, validation.data.email, service_type || 'อื่นๆ', budget_range || '', validation.data.message, score, appointment_date || null, appointment_time || null, meeting_type || 'onsite', req.body.source || 'website');

    // Log activity
    await db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
      .run(result.lastInsertRowid, 'lead_created', JSON.stringify({ source: req.body.source || 'website' }));

    // Send notifications
    const budgetLabel = budget_range && budget_range !== 'ไม่ระบุ' ? `\n💰 งบ: ${budget_range}` : '';
    const apptLabel = appointment_date ? `\n📅 นัด: ${appointment_date} ${appointment_time || ''}` : '';
    const notifyMsg = `🆕 Lead ใหม่!\n👤 ${validation.data.name}\n📞 ${validation.data.phone}\n🔧 ${service_type || 'อื่นๆ'}${budgetLabel}${apptLabel}\n📝 ${validation.data.message || '-'}`;
    await sendLineNotify(notifyMsg).catch(() => {});
    await sendTelegramNotify(notifyMsg).catch(() => {});

    // Send email notification for new lead
    sendLeadNotificationEmail({
      name: validation.data.name,
      phone: validation.data.phone,
      email: validation.data.email,
      service_type: service_type || 'อื่นๆ',
      budget_range: budget_range || 'ไม่ระบุ',
      message: validation.data.message
    }).catch(err => console.error('Lead email error:', err.message));

    // Auto-reply
    checkAutoReply({ id: result.lastInsertRowid, name: validation.data.name, phone: validation.data.phone });

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Update lead
app.put('/api/leads/:id', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'phone', 'email', 'service_type', 'budget_range', 'message', 'status', 'score', 'assigned_to', 'lost_reason', 'appointment_date', 'appointment_time', 'meeting_type', 'source', 'tags'];
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return res.status(200).json({ error: 'ไม่มีข้อมูลที่อัพเดท' });

    // Get old status for notification
    const oldLead = await db.prepare('SELECT status, name FROM leads WHERE id = ?').get(req.params.id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    await db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // Notify on status change
    if (updates.status && oldLead && updates.status !== oldLead.status) {
      notifyLeadStatusChange(req.params.id, updates.status, oldLead.name);
    }

    // Set first_contact_at when status changes to Contacted
    if (updates.status === 'Contacted' && oldLead && oldLead.status !== 'Contacted') {
      await db.prepare('UPDATE leads SET first_contact_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    }

    // Log activity
    await db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
      .run(req.params.id, 'lead_updated', JSON.stringify(updates));

    res.json({ success: true });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Delete lead
app.delete('/api/leads/:id', authMiddleware, async (req, res) => {
  try {
    await db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Bulk update leads
app.post('/api/leads/bulk-update', authMiddleware, bulkLimiter, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ไม่มี leads ที่เลือก' });
    if (!updates || typeof updates !== 'object') return res.status(400).json({ error: 'ไม่มีข้อมูลที่อัพเดท' });

    const allowedFields = ['status', 'assigned_to', 'service_type', 'budget_range', 'tags'];
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return res.status(200).json({ error: 'ไม่มีข้อมูลที่อัพเดท' });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const placeholders = ids.map(() => '?').join(',');
    await db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id IN (${placeholders})`).run(...values, ...ids);

    // Log activity for each
    for (const id of ids) {
      await db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
        .run(id, 'bulk_update', JSON.stringify(updates));
    }

    res.json({ success: true, updated: ids.length });
  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Bulk delete leads
app.post('/api/leads/bulk-delete', authMiddleware, bulkLimiter, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ไม่มี leads ที่เลือก' });

    const placeholders = ids.map(() => '?').join(',');
    await db.prepare(`DELETE FROM leads WHERE id IN (${placeholders})`).run(...ids);
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== LEAD ATTACHMENTS =====
app.get('/api/leads/:id/attachments', authMiddleware, async (req, res) => {
  try {
    const attachments = await db.prepare('SELECT * FROM lead_attachments WHERE lead_id = ? ORDER BY uploaded_at DESC').all(req.params.id);
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/leads/:id/attachments', authMiddleware, uploadLimiter, attachmentUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });

    const result = await db.prepare('INSERT INTO lead_attachments (lead_id, filename, original_name, url, file_size) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, req.file.filename, req.file.originalname, '/uploads/' + req.file.filename, req.file.size);

    res.json({ success: true, id: result.lastInsertRowid, url: '/uploads/' + req.file.filename });
  } catch (err) {
    console.error('Upload attachment error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/attachments/:id', authMiddleware, async (req, res) => {
  try {
    const attachment = await db.prepare('SELECT * FROM lead_attachments WHERE id = ?').get(req.params.id);
    if (!attachment) return res.status(404).json({ error: 'ไม่พบไฟล์' });

    // Delete file from disk
    const filePath = path.join(uploadsDir, attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.prepare('DELETE FROM lead_attachments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== NOTES =====
app.get('/api/leads/:id/notes', authMiddleware, async (req, res) => {
  try {
    const notes = await db.prepare('SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/leads/:id/notes', authMiddleware, async (req, res) => {
  try {
    const { note, note_type, follow_up_date } = req.body;
    if (!note) return res.status(400).json({ error: 'กรุณากรอกบันทึก' });
    const result = await db.prepare('INSERT INTO notes (lead_id, note, note_type, follow_up_date) VALUES (?, ?, ?, ?)')
      .run(req.params.id, note, note_type || 'general', follow_up_date || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const { follow_up_done } = req.body;
    await db.prepare('UPDATE notes SET follow_up_done = ? WHERE id = ?').run(follow_up_done ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== ACTIVITIES =====
app.get('/api/activities', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = await db.prepare(`
      SELECT a.*, l.name as lead_name 
      FROM activities a 
      LEFT JOIN leads l ON a.lead_id = l.id 
      ORDER BY a.created_at DESC 
      LIMIT ?
    `).all(limit);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== PROPOSALS =====
app.get('/api/proposals', authMiddleware, async (req, res) => {
  try {
    const proposals = await db.prepare(`
      SELECT p.*, l.name as lead_name 
      FROM proposals p 
      LEFT JOIN leads l ON p.lead_id = l.id 
      ORDER BY p.created_at DESC
    `).all();
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/proposals', authMiddleware, async (req, res) => {
  try {
    const { lead_id, title, items, subtotal, tax, total, valid_until, notes } = req.body;
    const maxRow = await db.prepare("SELECT proposal_number FROM proposals ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (maxRow && maxRow.proposal_number) {
      const match = maxRow.proposal_number.match(/NP-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const proposal_number = `NP-${String(nextNum).padStart(4, '0')}`;
    const result = await db.prepare(
      'INSERT INTO proposals (lead_id, proposal_number, title, items, subtotal, tax, total, valid_until, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(lead_id, proposal_number, title, JSON.stringify(items || []), subtotal || 0, tax || 0, total || 0, valid_until || null, notes || '');
    res.json({ success: true, id: result.lastInsertRowid, proposal_number });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/proposals/:id', authMiddleware, async (req, res) => {
  try {
    const { status, title, items, subtotal, tax, total, valid_until, notes } = req.body;
    await db.prepare('UPDATE proposals SET status = COALESCE(?, status), title = COALESCE(?, title), items = COALESCE(?, items), subtotal = COALESCE(?, subtotal), tax = COALESCE(?, tax), total = COALESCE(?, total), valid_until = COALESCE(?, valid_until), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, title, items ? JSON.stringify(items) : null, subtotal, tax, total, valid_until, notes, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/proposals/:id', authMiddleware, async (req, res) => {
  try {
    await db.prepare('DELETE FROM proposals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== FOLLOW-UPS =====
app.get('/api/followups', authMiddleware, async (req, res) => {
  try {
    const today = await getTodayThai();
    const followups = await db.prepare(`
      SELECT n.*, l.name as lead_name, l.phone as lead_phone, l.service_type 
      FROM notes n 
      JOIN leads l ON n.lead_id = l.id 
      WHERE n.follow_up_done = 0 AND n.follow_up_date <= ? 
      ORDER BY n.follow_up_date ASC
    `).all(today);
    res.json(followups);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== STATS =====
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const leads = await db.prepare('SELECT * FROM leads').all();
    const today = await getTodayThai();
    const todayAppts = leads.filter(l => l.appointment_date === today).length;
    res.json({
      totalLeads: leads.length,
      closedDeals: leads.filter(l => l.status === 'Closed Won').length,
      todayAppts,
      newLeads: leads.filter(l => l.status === 'New Lead').length,
      conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'Closed Won').length / leads.length) * 100) : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== PIPELINE =====
app.get('/api/pipeline', authMiddleware, async (req, res) => {
  try {
    const leads = await db.prepare('SELECT * FROM leads').all();
    const stages = ['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
    res.json(stages.map(stage => ({
      stage,
      count: leads.filter(l => l.status === stage).length,
      leads: leads.filter(l => l.status === stage)
    })));
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== REPORTS =====
app.get('/api/reports/summary', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const totalLeads = await db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const monthLeads = await db.prepare('SELECT COUNT(*) as count FROM leads WHERE created_at >= ? AND created_at <= ?').get(monthStart, monthEnd).count;
    const closedWon = await db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'Closed Won'").get().count;
    const monthClosed = await db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'Closed Won' AND updated_at >= ? AND updated_at <= ?").get(monthStart, monthEnd).count;
    const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

    // Revenue estimate from proposals
    const revenueResult = await db.prepare("SELECT SUM(total) as total FROM proposals WHERE status = 'accepted'").get();
    const revenueEstimate = revenueResult ? revenueResult.total : 0;

    // Leads by status
    const byStatus = await db.prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status").all();

    res.json({
      total_leads: totalLeads,
      monthly_leads: monthLeads,
      closed_won: closedWon,
      monthly_closed: monthClosed,
      conversion_rate: conversionRate,
      revenue_estimate: revenueEstimate,
      by_status: byStatus
    });
  } catch (err) {
    console.error('Reports summary error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/reports/export/csv', authMiddleware, async (req, res) => {
  try {
    const leads = await db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    // Sanitize CSV field to prevent formula injection in spreadsheet apps
    async function safeCsvField(val) {
      const str = String(val || '').replace(/"/g, '""');
      // Prefix with single quote if starts with formula-triggering chars
      if (/^[=+\-@\t\r]/.test(str)) return `"'${str}"`;
      return `"${str}"`;
    }

    const headers = ['ID', 'ชื่อ', 'เบอร์โทร', 'อีเมล', 'บริการ', 'งบประมาณ', 'สถานะ', 'คะแนน', 'วันที่สร้าง'];
    const rows = leads.map(l => [
      l.id,
      safeCsvField(l.name),
      safeCsvField(l.phone),
      safeCsvField(l.email),
      safeCsvField(l.service_type),
      safeCsvField(l.budget_range),
      safeCsvField(l.status),
      l.score || 0,
      safeCsvField(l.created_at)
    ]);

    let csv = '\uFEFF'; // BOM for Excel UTF-8
    csv += headers.join(',') + '\n';
    csv += rows.map(r => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=leads-export-${await getTodayThai()}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/reports/by-service', authMiddleware, async (req, res) => {
  try {
    const result = await db.prepare(`
      SELECT service_type, COUNT(*) as count, 
        SUM(CASE WHEN status = 'Closed Won' THEN 1 ELSE 0 END) as closed,
        AVG(score) as avg_score
      FROM leads 
      GROUP BY service_type 
      ORDER BY count DESC
    `).all();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/reports/by-date', authMiddleware, async (req, res) => {
  try {
    const dateFrom = req.query.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = req.query.date_to || await getTodayThai();

    const result = await db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count,
        SUM(CASE WHEN status = 'Closed Won' THEN 1 ELSE 0 END) as closed
      FROM leads 
      WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(dateFrom, dateTo);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== USERS MANAGEMENT =====
app.get('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await db.prepare('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.error });

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });

    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'อีเมลนี้มีอยู่ในระบบแล้ว' });

    const validRoles = ['admin', 'manager', 'sales'];
    const userRole = validRoles.includes(role) ? role : 'sales';

    const hashed = bcrypt.hashSync(password, 10);
    const result = await db.prepare('INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)')
      .run(email, hashed, full_name || '', userRole);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { full_name, role, password } = req.body;
    const fields = [];
    const values = [];

    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
    if (role !== undefined) {
      const validRoles = ['admin', 'manager', 'sales'];
      if (!validRoles.includes(role)) return res.status(400).json({ error: 'บทบาทไม่ถูกต้อง' });
      fields.push('role = ?'); values.push(role);
    }
    if (password) {
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });
      fields.push('password = ?'); values.push(bcrypt.hashSync(password, 10));
    }

    if (fields.length === 0) return res.status(400).json({ error: 'ไม่มีข้อมูลที่อัพเดท' });

    values.push(req.params.id);
    await db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเอง' });
    }
    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== BACKUP MANAGEMENT =====
app.get('/api/admin/backup', authMiddleware, adminOnly, async (req, res) => {
  try {
    const backup = createBackup();
    await db.prepare('INSERT INTO backups (filename, file_size, created_by) VALUES (?, ?, ?)')
      .run(backup.filename, backup.file_size, req.user.id);

    const fileBuffer = fs.readFileSync(backup.path);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ error: 'ไม่สามารถสำรองข้อมูลได้' });
  }
});

app.get('/api/admin/backups', authMiddleware, adminOnly, async (req, res) => {
  try {
    const backups = listBackups();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});


// ===== SITE DOCUMENTATION =====
const { execFile } = require("child_process");

app.post("/api/admin/generate-docs", authMiddleware, adminOnly, async (req, res) => {
  try {
    const baseUrl = req.body.url || `http://localhost:${PORT}`;
    const outputDir = path.join(__dirname, "site-docs");

    // Validate URL to prevent command injection
    let parsedUrl;
    try {
      parsedUrl = new URL(baseUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'URL ต้องเป็น http หรือ https เท่านั้น' });
      }
    } catch {
      return res.status(400).json({ error: 'URL ไม่ถูกต้อง' });
    }

    // Run site-docs script using execFile (no shell injection risk)
    const scriptPath = path.join(__dirname, "scripts", "site-docs.js");
    execFile("node", [scriptPath, "--url", baseUrl, "--output", outputDir], {
      timeout: 300000
    }, (err) => {
      if (err) {
        console.error("Generate docs exec error:", err);
        return res.status(500).json({ error: "ไม่สามารถสร้างรายงานได้: " + err.message });
      }

      try {
        // Read the generated data
        const dataPath = path.join(outputDir, "site-data.json");
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

        res.json({
          success: true,
          message: `สร้างรายงานสำเร็จ ${data.length} หน้า`,
          pages: data.length,
          files: {
            html: "/site-docs/site-report.html",
            md: "/site-docs/site-report.md",
            json: "/site-docs/site-data.json"
          }
        });
      } catch (readErr) {
        console.error("Generate docs read error:", readErr);
        res.status(500).json({ error: "ไม่สามารถอ่านรายงานได้: " + readErr.message });
      }
    });
  } catch (err) {
    console.error("Generate docs error:", err);
    res.status(500).json({ error: "ไม่สามารถสร้างรายงานได้: " + err.message });
  }
});

app.get("/api/admin/docs-status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const dataPath = path.join(__dirname, "site-docs", "site-data.json");
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      const stats = fs.statSync(dataPath);
      res.json({
        exists: true,
        pages: data.length,
        generated_at: stats.mtime.toISOString(),
        files: {
          html: "/site-docs/site-report.html",
          md: "/site-docs/site-report.md",
          json: "/site-docs/site-data.json"
        }
      });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    res.json({ exists: false });
  }
});

// Serve site-docs static files
app.use("/site-docs", authMiddleware, express.static(path.join(__dirname, "site-docs")));
// ===== CUSTOMER CHAT =====
// Customer sends a message (no auth required)
app.post('/api/chat/messages', leadsLimiter, async (req, res) => {
  try {
    const { session_id, message, customer_name, customer_phone, sender } = req.body;
    if (!session_id || !message) return res.status(400).json({ error: 'กรุณากรอกข้อความ' });
    // Validate session_id format (alphanumeric, hyphens, underscores, max 100 chars)
    if (typeof session_id !== 'string' || session_id.length > 100 || !/^[a-zA-Z0-9_\-]+$/.test(session_id)) {
      return res.status(400).json({ error: 'session_id ไม่ถูกต้อง' });
    }
    const safeName = customer_name ? String(customer_name).replace(/<[^>]*>/g, '').slice(0, 100) : null;
    const safePhone = customer_phone ? String(customer_phone).replace(/[^0-9\-+ ]/g, '').slice(0, 20) : null;
    const safeMsg = String(message).replace(/<[^>]*>/g, '').slice(0, 2000);
    const safeSender = (sender === 'bot' || sender === 'admin') ? sender : 'customer';
    db.prepare('INSERT INTO chat_messages (session_id, sender, message, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?)')
      .run(session_id, safeSender, safeMsg, safeName, safePhone);
    res.json({ success: true });
  } catch (err) {
    console.error('Chat message error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Customer polls for admin responses
app.get('/api/chat/messages/:session_id', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    const total = await db.prepare('SELECT COUNT(*) as count FROM chat_messages WHERE session_id = ?').get(req.params.session_id).count;
    const messages = await db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?').all(req.params.session_id, limit, offset);
    // Mark admin messages as read
    await db.prepare("UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender = 'admin' AND is_read = 0").run(req.params.session_id);
    res.json({
      data: messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Admin gets all chat sessions
app.get('/api/chat/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await db.prepare(`
      SELECT session_id, customer_name, customer_phone,
        MAX(created_at) as last_message_at,
        COUNT(*) as message_count,
        SUM(CASE WHEN sender = 'customer' AND is_read = 0 THEN 1 ELSE 0 END) as unread_count,
        (SELECT message FROM chat_messages cm2 WHERE cm2.session_id = chat_messages.session_id ORDER BY cm2.created_at DESC LIMIT 1) as last_message
      FROM chat_messages
      GROUP BY session_id
      ORDER BY last_message_at DESC
    `).all();
    res.json(sessions);
  } catch (err) {
    console.error('Chat sessions error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Admin replies to a session
app.post('/api/chat/sessions/:session_id', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'กรุณากรอกข้อความ' });
    const safeMsg = String(message).replace(/<[^>]*>/g, '').slice(0, 2000);
    // Get admin name from JWT
    const adminUser = await db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
    const adminName = adminUser?.full_name || 'Admin';
    await db.prepare("INSERT INTO chat_messages (session_id, sender, message, admin_name) VALUES (?, 'admin', ?, ?)")
      .run(req.params.session_id, safeMsg, adminName);
    // Mark all customer messages in this session as read
    await db.prepare("UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender = 'customer' AND is_read = 0").run(req.params.session_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Delete a chat session (all messages)
app.delete('/api/chat/sessions/:session_id', authMiddleware, async (req, res) => {
  try {
    const result = await db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(req.params.session_id);
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Delete chat session error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Bulk delete chat sessions
app.post('/api/chat/sessions/bulk-delete', authMiddleware, bulkLimiter, async (req, res) => {
  try {
    const { session_ids } = req.body;
    if (!Array.isArray(session_ids) || session_ids.length === 0) return res.status(400).json({ error: 'ไม่มี session ที่เลือก' });
    const placeholders = session_ids.map(() => '?').join(',');
    const result = await db.prepare(`DELETE FROM chat_messages WHERE session_id IN (${placeholders})`).run(...session_ids);
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Bulk delete chat error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Admin marks session as read
app.put('/api/chat/sessions/:session_id/read', authMiddleware, async (req, res) => {
  try {
    await db.prepare("UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender = 'customer' AND is_read = 0").run(req.params.session_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Get unread chat count (for badge)
app.get('/api/chat/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.prepare("SELECT COUNT(DISTINCT session_id) as count FROM chat_messages WHERE sender = 'customer' AND is_read = 0").get();
    res.json({ count: result ? result.count : 0 });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    // Test DB connection
    await db.prepare('SELECT 1').get();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ===== MEDIA =====
app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { console.warn("Mkdir skipped (read-only):", e.message); }
    const files = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
    res.json(files.map(f => ({ name: f, url: '/uploads/' + f })));
  } catch { res.json([]); }
});

app.delete('/api/media/:name', authMiddleware, async (req, res) => {
  try {
    const safeName = path.basename(req.params.name);
    if (!safeName || safeName.includes('..') || safeName.includes('/') || safeName.includes('\\')) {
      return res.status(400).json({ error: 'ชื่อไฟล์ไม่ถูกต้อง' });
    }
    const filePath = path.join(uploadsDir, safeName);
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'ชื่อไฟล์ไม่ถูกต้อง' });
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'ไม่พบไฟล์' });
    }
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Serve uploaded files — reject path traversal attempts
app.get('/uploads/:name', async (req, res) => {
  const safeName = path.basename(req.params.name);
  if (!safeName || safeName.includes('..')) {
    return res.status(400).json({ error: 'ชื่อไฟล์ไม่ถูกต้อง' });
  }
  const filePath = path.join(uploadsDir, safeName);
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(400).json({ error: 'ชื่อไฟล์ไม่ถูกต้อง' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'ไม่พบไฟล์' });
  }
  res.sendFile(filePath);
});

// ===== ADMIN SERVICES API (CRUD) =====
app.get('/api/admin/services', authMiddleware, adminOnly, async (req, res) => {
  try {
    let query = 'SELECT * FROM services';
    const conditions = [];
    const params = [];

    if (req.query.category) {
      conditions.push('category = ?');
      params.push(req.query.category);
    }
    if (req.query.search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      const escaped = String(req.query.search).replace(/[%_]/g, '\\$&');
      params.push(`%${escaped}%`, `%${escaped}%`);
    }
    if (req.query.is_active !== undefined) {
      conditions.push('is_active = ?');
      params.push(parseInt(req.query.is_active));
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');

    const sortField = ['name', 'category', 'sort_order', 'price_start', 'created_at'].includes(req.query.sort) ? req.query.sort : 'category';
    const sortOrder = String(req.query.order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}, sort_order ASC`;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = await db.prepare(countQuery).get(...params).total;

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const services = await db.prepare(query).all(...params);
    const categories = await db.prepare('SELECT DISTINCT category FROM services ORDER BY category').all().map(r => r.category);

    res.json({ data: services, categories, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Admin get services error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/admin/services', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { category, name, description, price_start, price_unit, icon, image_url, sort_order, is_active } = req.body;
    if (!category || !name) return res.status(400).json({ error: 'กรุณากรอกหมวดหมู่และชื่อบริการ' });

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM services').get().m || 0;
    const result = await db.prepare(
      'INSERT INTO services (category, name, description, price_start, price_unit, icon, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(category, name, description || '', price_start || 0, price_unit || 'รายการ', icon || '', image_url || '', sort_order ?? maxOrder + 1, is_active !== undefined ? is_active : 1);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Create service error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/admin/services/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const allowedFields = ['category', 'name', 'description', 'price_start', 'price_unit', 'icon', 'image_url', 'sort_order', 'is_active'];
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return res.status(200).json({ error: 'ไม่มีข้อมูลที่อัพเดท' });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    const result = await db.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    if (result.changes === 0) return res.status(404).json({ error: 'ไม่พบบริการ' });

    res.json({ success: true });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/admin/services/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'ไม่พบบริการ' });
    // Also delete related gallery and models
    await db.prepare('DELETE FROM service_gallery WHERE service_id = ?').run(req.params.id);
    await db.prepare('DELETE FROM service_models WHERE service_id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== ADMIN SERVICE PACKAGES API (CRUD) =====
app.get('/api/admin/service-packages', authMiddleware, adminOnly, async (req, res) => {
  try {
    const packages = await db.prepare('SELECT * FROM service_packages ORDER BY sort_order').all();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/admin/service-packages', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, price_start, features, is_featured, sort_order, is_active } = req.body;
    if (!name) return res.status(400).json({ error: 'กรุณากรอกชื่อแพ็กเกจ' });

    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM service_packages').get().m || 0;
    const featuresStr = typeof features === 'string' ? features : JSON.stringify(features || []);
    const result = await db.prepare(
      'INSERT INTO service_packages (name, description, price_start, features, is_featured, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, description || '', price_start || 0, featuresStr, is_featured ? 1 : 0, sort_order ?? maxOrder + 1, is_active !== undefined ? is_active : 1);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Create package error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/admin/service-packages/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const allowedFields = ['name', 'description', 'price_start', 'features', 'is_featured', 'sort_order', 'is_active'];
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(key === 'features' ? (typeof val === 'string' ? val : JSON.stringify(val)) : val);
      }
    }
    if (fields.length === 0) return res.status(200).json({ error: 'ไม่มีข้อมูลที่อัพเดท' });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    const result = await db.prepare(`UPDATE service_packages SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    if (result.changes === 0) return res.status(404).json({ error: 'ไม่พบแพ็กเกจ' });

    res.json({ success: true });
  } catch (err) {
    console.error('Update package error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/admin/service-packages/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await db.prepare('DELETE FROM service_packages WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'ไม่พบแพ็กเกจ' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete package error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== SERVICES API (Public) =====
app.get('/api/services/categories', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT DISTINCT category FROM services WHERE is_active = 1 ORDER BY category').all();
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    const services = await db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY category, sort_order').all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'ไม่พบบริการ' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== SERVICE GALLERY API =====
app.get('/api/services/:id/gallery', async (req, res) => {
  try {
    const service = await db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'ไม่พบบริการ' });
    const items = await db.prepare(
      'SELECT * FROM service_gallery WHERE (service_id = ? OR service_category = ?) ORDER BY sort_order, id'
    ).all(req.params.id, service.category);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/gallery/category/:category', async (req, res) => {
  try {
    const items = await db.prepare(
      'SELECT * FROM service_gallery WHERE service_category = ? ORDER BY sort_order, id'
    ).all(req.params.category);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/services/:id/gallery', authMiddleware, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    const service = await db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'ไม่พบบริการ' });
    const { title, description, image_type } = req.body;
    let imageUrl = req.body.image_url;
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;
    if (!imageUrl) return res.status(400).json({ error: 'กรุณาอัพโหลดรูปหรือใส่ URL' });
    const maxOrder = await db.prepare('SELECT MAX(sort_order) as m FROM service_gallery').get().m || 0;
    const result = await db.prepare(
      'INSERT INTO service_gallery (service_id, service_category, title, description, image_url, image_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.params.id, service.category, title || '', description || '', imageUrl, image_type || 'photo', maxOrder + 1);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const item = await db.prepare('SELECT * FROM service_gallery WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'ไม่พบรูป' });
    if (item.image_url && item.image_url.startsWith('/uploads/')) {
      const filepath = path.join(__dirname, item.image_url);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    await db.prepare('DELETE FROM service_gallery WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/gallery/:id', authMiddleware, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    const item = await db.prepare('SELECT * FROM service_gallery WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'ไม่พบรูป' });
    const { title, description, image_type, image_url, sort_order } = req.body;
    let newImageUrl = image_url || item.image_url;
    if (req.file) newImageUrl = `/uploads/${req.file.filename}`;
    await db.prepare(
      'UPDATE service_gallery SET title = ?, description = ?, image_url = ?, image_type = ?, sort_order = ? WHERE id = ?'
    ).run(title ?? item.title, description ?? item.description, newImageUrl, image_type ?? item.image_type, sort_order ?? item.sort_order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Admin: list all gallery items with service info
app.get('/api/admin/gallery', authMiddleware, async (req, res) => {
  try {
    const { service_id, category } = req.query;
    let sql = 'SELECT sg.*, s.name as service_name FROM service_gallery sg LEFT JOIN services s ON sg.service_id = s.id WHERE 1=1';
    const params = [];
    if (service_id) { sql += ' AND sg.service_id = ?'; params.push(service_id); }
    if (category) { sql += ' AND sg.service_category = ?'; params.push(category); }
    sql += ' ORDER BY sg.sort_order, sg.id';
    res.json(await db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== SERVICE 3D MODELS API =====
app.get('/api/services/:id/models', async (req, res) => {
  try {
    const service = await db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'ไม่พบบริการ' });
    const items = await db.prepare(
      'SELECT * FROM service_models WHERE (service_id = ? OR service_category = ?) ORDER BY sort_order, id'
    ).all(req.params.id, service.category);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/models/category/:category', async (req, res) => {
  try {
    const items = await db.prepare(
      'SELECT * FROM service_models WHERE service_category = ? ORDER BY sort_order, id'
    ).all(req.params.category);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/services/:id/models', authMiddleware, modelUpload.fields([
  { name: 'model_file', maxCount: 1 },
  { name: 'poster_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const service = await db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'ไม่พบบริการ' });
    const { title, description, model_url, model_format, poster_url, auto_rotate, camera_orbit } = req.body;
    let finalModelUrl = model_url || '';
    let finalPosterUrl = poster_url || '';
    let fmt = model_format || 'glb';
    if (req.files?.model_file?.[0]) {
      let filePath = path.join(uploadsDir, req.files.model_file[0].filename);
      // Auto-convert .obj to .glb
      if (filePath.toLowerCase().endsWith('.obj')) {
        try {
          filePath = await convertObjToGlb(filePath);
          fmt = 'glb';
        } catch (convErr) {
          console.error('OBJ conversion error:', convErr.message);
          return res.status(400).json({ error: 'ไม่สามารถแปลงไฟล์ .obj ได้: ' + convErr.message });
        }
      }
      finalModelUrl = '/uploads/' + path.basename(filePath);
      if (!fmt || fmt === 'obj') fmt = 'glb';
    }
    if (req.files?.poster_file?.[0]) finalPosterUrl = '/uploads/' + req.files.poster_file[0].filename;
    if (!finalModelUrl) return res.status(400).json({ error: 'กรุณาอัพโหลดไฟล์โมเดลหรือใส่ URL' });
    if (!fmt || fmt === 'obj') fmt = finalModelUrl.endsWith('.gltf') ? 'gltf' : 'glb';
    const result = await db.prepare(
      'INSERT INTO service_models (service_id, service_category, title, description, model_url, model_format, poster_url, auto_rotate, camera_orbit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.params.id, service.category, title || '', description || '', finalModelUrl, fmt, finalPosterUrl, auto_rotate !== undefined ? auto_rotate : 1, camera_orbit || '0deg 75deg 105%');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Model create error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/models/:id', authMiddleware, modelUpload.fields([
  { name: 'model_file', maxCount: 1 },
  { name: 'poster_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const item = await db.prepare('SELECT * FROM service_models WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'ไม่พบโมเดล' });
    const { title, description, model_url, model_format, poster_url, auto_rotate, camera_orbit, sort_order } = req.body;
    let finalModelUrl = model_url ?? item.model_url;
    let finalPosterUrl = poster_url ?? item.poster_url;
    let fmt = model_format ?? item.model_format;
    if (req.files?.model_file?.[0]) {
      let filePath = path.join(uploadsDir, req.files.model_file[0].filename);
      // Auto-convert .obj to .glb
      if (filePath.toLowerCase().endsWith('.obj')) {
        try {
          filePath = await convertObjToGlb(filePath);
          fmt = 'glb';
        } catch (convErr) {
          console.error('OBJ conversion error:', convErr.message);
          return res.status(400).json({ error: 'ไม่สามารถแปลงไฟล์ .obj ได้: ' + convErr.message });
        }
      }
      // Delete old uploaded model file
      if (item.model_url?.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, item.model_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      finalModelUrl = '/uploads/' + path.basename(filePath);
      if (!fmt || fmt === 'obj') fmt = 'glb';
    }
    if (req.files?.poster_file?.[0]) {
      // Delete old uploaded poster
      if (item.poster_url?.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, item.poster_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      finalPosterUrl = '/uploads/' + req.files.poster_file[0].filename;
    }
    await db.prepare(
      'UPDATE service_models SET title = ?, description = ?, model_url = ?, model_format = ?, poster_url = ?, auto_rotate = ?, camera_orbit = ?, sort_order = ? WHERE id = ?'
    ).run(title ?? item.title, description ?? item.description, finalModelUrl, fmt, finalPosterUrl, auto_rotate !== undefined ? auto_rotate : item.auto_rotate, camera_orbit ?? item.camera_orbit, sort_order ?? item.sort_order, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Model update error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/models/:id', authMiddleware, async (req, res) => {
  try {
    const item = await db.prepare('SELECT * FROM service_models WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'ไม่พบโมเดล' });
    // Delete uploaded files
    if (item.model_url?.startsWith('/uploads/')) {
      const fp = path.join(__dirname, item.model_url);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    if (item.poster_url?.startsWith('/uploads/')) {
      const fp = path.join(__dirname, item.poster_url);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await db.prepare('DELETE FROM service_models WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Admin: list all models with service info
app.get('/api/admin/models', authMiddleware, async (req, res) => {
  try {
    const { service_id, category } = req.query;
    let sql = 'SELECT sm.*, s.name as service_name FROM service_models sm LEFT JOIN services s ON sm.service_id = s.id WHERE 1=1';
    const params = [];
    if (service_id) { sql += ' AND sm.service_id = ?'; params.push(service_id); }
    if (category) { sql += ' AND sm.service_category = ?'; params.push(category); }
    sql += ' ORDER BY sm.sort_order, sm.id';
    res.json(await db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/service-packages', async (req, res) => {
  try {
    const packages = await db.prepare('SELECT * FROM service_packages WHERE is_active = 1 ORDER BY sort_order').all();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/service-packages/:id', async (req, res) => {
  try {
    const pkg = await db.prepare('SELECT * FROM service_packages WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'ไม่พบแพ็กเกจ' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== API 404 HANDLER =====
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'ไม่พบ endpoint นี้' });
});

// ===== SERVE STATIC FILES =====

// Service detail page (public)
app.get('/service', async (req, res) => {
  res.sendFile('service.html', { root: __dirname });
});
app.get('/service.html', async (req, res) => {
  res.sendFile('service.html', { root: __dirname });
});

// Services overview page (public)
app.get('/services', async (req, res) => {
  res.sendFile('services.html', { root: __dirname });
});
app.get('/services.html', async (req, res) => {
  res.sendFile('services.html', { root: __dirname });
});

// Nucha-services alternate pages (public)
app.get('/services-3d', async (req, res) => {
  res.sendFile('nucha-services/services-page-3d.html', { root: __dirname });
});
app.get('/services-alt', async (req, res) => {
  res.sendFile('nucha-services/services-page.html', { root: __dirname });
});

// Quotation template (public)
app.get('/quotation', async (req, res) => {
  res.sendFile('quotation.html', { root: __dirname });
});
app.get('/quotation.html', async (req, res) => {
  res.sendFile('quotation.html', { root: __dirname });
});

// Legal pages (public)
app.get('/privacy', async (req, res) => {
  res.sendFile('privacy.html', { root: __dirname });
});
app.get('/terms', async (req, res) => {
  res.sendFile('terms.html', { root: __dirname });
});

// Admin pages (protected)
app.get('/admin', authMiddleware, async (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});
app.get('/admin.html', authMiddleware, async (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});

// Public pages
app.get('/login', async (req, res) => {
  res.sendFile('admin-login.html', { root: __dirname });
});
app.get('/admin-login.html', async (req, res) => {
  res.sendFile('admin-login.html', { root: __dirname });
});

// Catch-all for SPA
app.get('*', async (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Server error:`, err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'ไฟล์ใหญ่เกิน 5MB' });
  }
  if (err.message === 'Only images allowed') {
    return res.status(400).json({ error: 'อนุญาตเฉพาะไฟล์รูปภาพ' });
  }
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

// ===== START SERVER =====
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏗️  NUCHA CRM Server running on http://localhost:${PORT}`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
  console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
  console.log(`📱 LINE Webhook: http://localhost:${PORT}/api/line/webhook`);
  console.log(`⚠️  Default admin: admin@nuchainnovation.com / admin123 — เปลี่ยนรหัสผ่านก่อน deploy จริง!`);

  // Schedule follow-up reminder email (daily at 08:30 Thai time = 01:30 UTC)
  const now = new Date();
  const thaiHour = (now.getUTCHours() + 7) % 24;
  const msUntil830 = ((8 - thaiHour + 24) % 24) * 3600000 + (30 - now.getMinutes()) * 60000 - now.getSeconds() * 1000;
  setTimeout(() => {
    sendFollowUpReminderEmail().catch(console.error);
    setInterval(() => sendFollowUpReminderEmail().catch(console.error), 24 * 60 * 60 * 1000);
  }, Math.max(msUntil830, 60000));
  console.log(`📧 Follow-up reminder scheduled (daily 08:30 ICT)`);
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
