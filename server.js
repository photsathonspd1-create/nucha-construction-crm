const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const https = require('https');
const querystring = require('querystring');

const db = require('./server/db');
const { runMigrations } = require('./server/migrations');
const { createBackup, listBackups } = require('./scripts/backup');
const { validatePhone, validateEmail, validateName, validateMessage, validatePassword, validateLead } = require('./utils/validate');

// Run migrations
runMigrations();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const serverStartTime = Date.now();

// ===== ENSURE DIRECTORIES EXIST =====
const uploadsDir = path.join(__dirname, 'uploads');
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

// ===== MIDDLEWARE =====
app.set('etag', false); // Disable ETag to prevent 304 responses breaking client JSON parsing
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

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

// ===== RATE LIMITERS =====
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
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

// ===== LEAD SCORING =====
function calculateScore(lead) {
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
function getTodayThai() {
  const now = new Date();
  const thaiOffset = 7 * 60;
  const local = new Date(now.getTime() + (thaiOffset + now.getTimezoneOffset()) * 60000);
  return local.toISOString().split('T')[0];
}

// ===== NOTIFICATION FUNCTIONS =====
async function sendLineNotify(message) {
  try {
    const row = db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
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

function sendLineNotifyRaw(token, message) {
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
    const row = db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
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

// ===== AUTO-REPLY SYSTEM =====
function checkAutoReply(leadData) {
  try {
    const row = db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
    if (!row) return;
    const config = JSON.parse(row.content);
    if (!config.auto_reply_enabled) return;

    const templates = config.auto_reply_templates || {};
    // Log auto-reply (in real implementation, would send SMS/LINE/Email)
    if (templates.line) {
      const msg = templates.line.replace('{name}', leadData.name || '');
      console.log(`[AUTO-REPLY LINE] To: ${leadData.phone}, Message: ${msg}`);
      db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
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
function notifyLeadStatusChange(leadId, newStatus, leadName) {
  const message = `📋 อัพเดทสถานะ Lead\n👤 ${leadName}\n📊 สถานะใหม่: ${newStatus}`;
  sendLineNotify(message).catch(() => {});
  sendTelegramNotify(message).catch(() => {});
}

// ===== AUTH ROUTES =====
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'กรอกอีเมลและรหัสผ่าน' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
    res.json(user || {});
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Change password
app.put('/api/auth/change-password', authMiddleware, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
    }

    const pwCheck = validatePassword(new_password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(current_password, user.password)) {
      return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    const hashed = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'กรุณากรอกอีเมล' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่าน' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)')
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
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'กรุณากรอก token และรหัสผ่านใหม่' });
    }

    const pwCheck = validatePassword(new_password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });

    const reset = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').get(token);
    if (!reset) {
      return res.status(400).json({ error: 'Token ไม่ถูกต้องหรือถูกใช้แล้ว' });
    }

    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token หมดอายุแล้ว' });
    }

    const hashed = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, reset.user_id);
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

    res.json({ success: true, message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== IMAGE UPLOAD =====
app.post('/api/upload', authMiddleware, uploadLimiter, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });
    res.json({ url: '/uploads/' + req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== CONTENT API (Public) =====
app.get('/api/content/:key', (req, res) => {
  try {
    const row = db.prepare('SELECT content FROM site_content WHERE section_key = ?').get(req.params.key);
    if (!row) return res.json({});
    try { res.json(JSON.parse(row.content)); } catch { res.json({}); }
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/content', (req, res) => {
  try {
    const rows = db.prepare('SELECT section_key, content FROM site_content').all();
    const result = {};
    rows.forEach(r => { try { result[r.section_key] = JSON.parse(r.content); } catch {} });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== CONTENT API (Admin) =====
app.put('/api/content/:key', authMiddleware, (req, res) => {
  try {
    const content = JSON.stringify(req.body);
    db.prepare('INSERT INTO site_content (section_key, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(section_key) DO UPDATE SET content = ?, updated_at = CURRENT_TIMESTAMP')
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
app.get('/api/nav', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM nav_items ORDER BY sort_order').all();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/nav', authMiddleware, (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
    db.prepare('DELETE FROM nav_items').run();
    const insert = db.prepare('INSERT INTO nav_items (label, href, sort_order, is_visible) VALUES (?, ?, ?, ?)');
    items.forEach((item, i) => {
      const safeLabel = String(item.label || '').replace(/<[^>]*>/g, '');
      const safeHref = String(item.href || '#').replace(/[^a-zA-Z0-9\-_/#.?&=:@]/g, '');
      insert.run(safeLabel, safeHref, item.sort_order || i + 1, item.is_visible ?? 1);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== LEADS =====
// Get leads with filtering, sorting, pagination
app.get('/api/leads', authMiddleware, (req, res) => {
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
    const totalResult = db.prepare(countQuery).get(...params);
    const total = totalResult ? totalResult.total : 0;

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const leads = db.prepare(query).all(...params);
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
app.post('/api/leads', leadsLimiter, (req, res) => {
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
      const existing = db.prepare("SELECT * FROM leads WHERE phone = ? OR (email = ? AND email != '')").get(cleanPhone, validation.data.email);
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

    const score = calculateScore({ budget_range, service_type, message, appointment_date });
    const result = db.prepare(
      'INSERT INTO leads (name, phone, email, service_type, budget_range, message, score, appointment_date, appointment_time, meeting_type, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(validation.data.name, validation.data.phone, validation.data.email, service_type || 'อื่นๆ', budget_range || '', validation.data.message, score, appointment_date || null, appointment_time || null, meeting_type || 'onsite', req.body.source || 'website');

    // Log activity
    db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
      .run(result.lastInsertRowid, 'lead_created', JSON.stringify({ source: req.body.source || 'website' }));

    // Send notifications
    const budgetLabel = budget_range && budget_range !== 'ไม่ระบุ' ? `\n💰 งบ: ${budget_range}` : '';
    const apptLabel = appointment_date ? `\n📅 นัด: ${appointment_date} ${appointment_time || ''}` : '';
    const notifyMsg = `🆕 Lead ใหม่!\n👤 ${validation.data.name}\n📞 ${validation.data.phone}\n🔧 ${service_type || 'อื่นๆ'}${budgetLabel}${apptLabel}\n📝 ${validation.data.message || '-'}`;
    sendLineNotify(notifyMsg).catch(() => {});
    sendTelegramNotify(notifyMsg).catch(() => {});

    // Auto-reply
    checkAutoReply({ id: result.lastInsertRowid, name: validation.data.name, phone: validation.data.phone });

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Update lead
app.put('/api/leads/:id', authMiddleware, (req, res) => {
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
    if (fields.length === 0) return res.status(400).json({ error: 'ไม่มีข้อมูลที่อัพเดท' });

    // Get old status for notification
    const oldLead = db.prepare('SELECT status, name FROM leads WHERE id = ?').get(req.params.id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    // Notify on status change
    if (updates.status && oldLead && updates.status !== oldLead.status) {
      notifyLeadStatusChange(req.params.id, updates.status, oldLead.name);
    }

    // Set first_contact_at when status changes to Contacted
    if (updates.status === 'Contacted' && oldLead && oldLead.status !== 'Contacted') {
      db.prepare('UPDATE leads SET first_contact_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    }

    // Log activity
    db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
      .run(req.params.id, 'lead_updated', JSON.stringify(updates));

    res.json({ success: true });
  } catch (err) {
    console.error('Update lead error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Delete lead
app.delete('/api/leads/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Bulk update leads
app.post('/api/leads/bulk-update', authMiddleware, (req, res) => {
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
    if (fields.length === 0) return res.status(400).json({ error: 'ไม่มีข้อมูลที่อัพเดท' });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id IN (${placeholders})`).run(...values, ...ids);

    // Log activity for each
    ids.forEach(id => {
      db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
        .run(id, 'bulk_update', JSON.stringify(updates));
    });

    res.json({ success: true, updated: ids.length });
  } catch (err) {
    console.error('Bulk update error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Bulk delete leads
app.post('/api/leads/bulk-delete', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ไม่มี leads ที่เลือก' });

    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM leads WHERE id IN (${placeholders})`).run(...ids);
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== LEAD ATTACHMENTS =====
app.get('/api/leads/:id/attachments', authMiddleware, (req, res) => {
  try {
    const attachments = db.prepare('SELECT * FROM lead_attachments WHERE lead_id = ? ORDER BY uploaded_at DESC').all(req.params.id);
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/leads/:id/attachments', authMiddleware, uploadLimiter, attachmentUpload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });

    const result = db.prepare('INSERT INTO lead_attachments (lead_id, filename, original_name, url, file_size) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, req.file.filename, req.file.originalname, '/uploads/' + req.file.filename, req.file.size);

    res.json({ success: true, id: result.lastInsertRowid, url: '/uploads/' + req.file.filename });
  } catch (err) {
    console.error('Upload attachment error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/attachments/:id', authMiddleware, (req, res) => {
  try {
    const attachment = db.prepare('SELECT * FROM lead_attachments WHERE id = ?').get(req.params.id);
    if (!attachment) return res.status(404).json({ error: 'ไม่พบไฟล์' });

    // Delete file from disk
    const filePath = path.join(uploadsDir, attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM lead_attachments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== NOTES =====
app.get('/api/leads/:id/notes', authMiddleware, (req, res) => {
  try {
    const notes = db.prepare('SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/leads/:id/notes', authMiddleware, (req, res) => {
  try {
    const { note, note_type, follow_up_date } = req.body;
    if (!note) return res.status(400).json({ error: 'กรุณากรอกบันทึก' });
    const result = db.prepare('INSERT INTO notes (lead_id, note, note_type, follow_up_date) VALUES (?, ?, ?, ?)')
      .run(req.params.id, note, note_type || 'general', follow_up_date || null);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/notes/:id', authMiddleware, (req, res) => {
  try {
    const { follow_up_done } = req.body;
    db.prepare('UPDATE notes SET follow_up_done = ? WHERE id = ?').run(follow_up_done ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== ACTIVITIES =====
app.get('/api/activities', authMiddleware, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = db.prepare(`
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
app.get('/api/proposals', authMiddleware, (req, res) => {
  try {
    const proposals = db.prepare(`
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

app.post('/api/proposals', authMiddleware, (req, res) => {
  try {
    const { lead_id, title, items, subtotal, tax, total, valid_until, notes } = req.body;
    const maxRow = db.prepare("SELECT proposal_number FROM proposals ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (maxRow && maxRow.proposal_number) {
      const match = maxRow.proposal_number.match(/NP-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const proposal_number = `NP-${String(nextNum).padStart(4, '0')}`;
    const result = db.prepare(
      'INSERT INTO proposals (lead_id, proposal_number, title, items, subtotal, tax, total, valid_until, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(lead_id, proposal_number, title, JSON.stringify(items || []), subtotal || 0, tax || 0, total || 0, valid_until || null, notes || '');
    res.json({ success: true, id: result.lastInsertRowid, proposal_number });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/proposals/:id', authMiddleware, (req, res) => {
  try {
    const { status, title, items, subtotal, tax, total, valid_until, notes } = req.body;
    db.prepare('UPDATE proposals SET status = COALESCE(?, status), title = COALESCE(?, title), items = COALESCE(?, items), subtotal = COALESCE(?, subtotal), tax = COALESCE(?, tax), total = COALESCE(?, total), valid_until = COALESCE(?, valid_until), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, title, items ? JSON.stringify(items) : null, subtotal, tax, total, valid_until, notes, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/proposals/:id', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM proposals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== FOLLOW-UPS =====
app.get('/api/followups', authMiddleware, (req, res) => {
  try {
    const today = getTodayThai();
    const followups = db.prepare(`
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
app.get('/api/stats', authMiddleware, (req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM leads').all();
    const today = getTodayThai();
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
app.get('/api/pipeline', authMiddleware, (req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM leads').all();
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
app.get('/api/reports/summary', authMiddleware, (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const monthLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE created_at >= ? AND created_at <= ?').get(monthStart, monthEnd).count;
    const closedWon = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'Closed Won'").get().count;
    const monthClosed = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'Closed Won' AND updated_at >= ? AND updated_at <= ?").get(monthStart, monthEnd).count;
    const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

    // Revenue estimate from proposals
    const revenueResult = db.prepare("SELECT SUM(total) as total FROM proposals WHERE status = 'accepted'").get();
    const revenueEstimate = revenueResult ? revenueResult.total : 0;

    // Leads by status
    const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM leads GROUP BY status").all();

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

app.get('/api/reports/export/csv', authMiddleware, (req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    // Sanitize CSV field to prevent formula injection in spreadsheet apps
    function safeCsvField(val) {
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
    res.setHeader('Content-Disposition', `attachment; filename=leads-export-${getTodayThai()}.csv`);
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/reports/by-service', authMiddleware, (req, res) => {
  try {
    const result = db.prepare(`
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

app.get('/api/reports/by-date', authMiddleware, (req, res) => {
  try {
    const dateFrom = req.query.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = req.query.date_to || getTodayThai();

    const result = db.prepare(`
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
app.get('/api/users', authMiddleware, adminOnly, (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.post('/api/users', authMiddleware, adminOnly, (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return res.status(400).json({ error: emailCheck.error });

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.error });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'อีเมลนี้มีอยู่ในระบบแล้ว' });

    const validRoles = ['admin', 'manager', 'sales'];
    const userRole = validRoles.includes(role) ? role : 'sales';

    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)')
      .run(email, hashed, full_name || '', userRole);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.put('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
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
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'ไม่สามารถลบบัญชีตัวเอง' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== BACKUP MANAGEMENT =====
app.get('/api/admin/backup', authMiddleware, adminOnly, (req, res) => {
  try {
    const backup = createBackup();
    db.prepare('INSERT INTO backups (filename, file_size, created_by) VALUES (?, ?, ?)')
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

app.get('/api/admin/backups', authMiddleware, adminOnly, (req, res) => {
  try {
    const backups = listBackups();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});


// ===== SITE DOCUMENTATION =====
const { execFile } = require("child_process");

app.post("/api/admin/generate-docs", authMiddleware, adminOnly, (req, res) => {
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

app.get("/api/admin/docs-status", authMiddleware, adminOnly, (req, res) => {
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
app.post('/api/chat/messages', leadsLimiter, (req, res) => {
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
app.get('/api/chat/messages/:session_id', (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(req.params.session_id);
    // Mark admin messages as read
    db.prepare("UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender = 'admin' AND is_read = 0").run(req.params.session_id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Admin gets all chat sessions
app.get('/api/chat/sessions', authMiddleware, (req, res) => {
  try {
    const sessions = db.prepare(`
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
app.post('/api/chat/sessions/:session_id', authMiddleware, (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'กรุณากรอกข้อความ' });
    const safeMsg = String(message).replace(/<[^>]*>/g, '').slice(0, 2000);
    // Get admin name from JWT
    const adminUser = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
    const adminName = adminUser?.full_name || 'Admin';
    db.prepare("INSERT INTO chat_messages (session_id, sender, message, admin_name) VALUES (?, 'admin', ?, ?)")
      .run(req.params.session_id, safeMsg, adminName);
    // Mark all customer messages in this session as read
    db.prepare("UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender = 'customer' AND is_read = 0").run(req.params.session_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Delete a chat session (all messages)
app.delete('/api/chat/sessions/:session_id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(req.params.session_id);
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Delete chat session error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Bulk delete chat sessions
app.post('/api/chat/sessions/bulk-delete', authMiddleware, (req, res) => {
  try {
    const { session_ids } = req.body;
    if (!Array.isArray(session_ids) || session_ids.length === 0) return res.status(400).json({ error: 'ไม่มี session ที่เลือก' });
    const placeholders = session_ids.map(() => '?').join(',');
    const result = db.prepare(`DELETE FROM chat_messages WHERE session_id IN (${placeholders})`).run(...session_ids);
    res.json({ success: true, deleted: result.changes });
  } catch (err) {
    console.error('Bulk delete chat error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Admin marks session as read
app.put('/api/chat/sessions/:session_id/read', authMiddleware, (req, res) => {
  try {
    db.prepare("UPDATE chat_messages SET is_read = 1 WHERE session_id = ? AND sender = 'customer' AND is_read = 0").run(req.params.session_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// Get unread chat count (for badge)
app.get('/api/chat/unread-count', authMiddleware, (req, res) => {
  try {
    const result = db.prepare("SELECT COUNT(DISTINCT session_id) as count FROM chat_messages WHERE sender = 'customer' AND is_read = 0").get();
    res.json({ count: result ? result.count : 0 });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  try {
    // Test DB connection
    db.prepare('SELECT 1').get();
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
app.get('/api/media', authMiddleware, (req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const files = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
    res.json(files.map(f => ({ name: f, url: '/uploads/' + f })));
  } catch { res.json([]); }
});

app.delete('/api/media/:name', authMiddleware, (req, res) => {
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

// ===== SERVICES API (Public) =====
app.get('/api/services/categories', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT category FROM services WHERE is_active = 1 ORDER BY category').all();
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY category, sort_order').all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/services/:id', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!service) return res.status(404).json({ error: 'ไม่พบบริการ' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/service-packages', (req, res) => {
  try {
    const packages = db.prepare('SELECT * FROM service_packages WHERE is_active = 1 ORDER BY sort_order').all();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

app.get('/api/service-packages/:id', (req, res) => {
  try {
    const pkg = db.prepare('SELECT * FROM service_packages WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'ไม่พบแพ็กเกจ' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// ===== SERVE STATIC FILES =====
app.use(express.static(__dirname));

// Service detail page (public)
app.get('/service', (req, res) => {
  res.sendFile('service.html', { root: __dirname });
});
app.get('/service.html', (req, res) => {
  res.sendFile('service.html', { root: __dirname });
});

// Services overview page (public)
app.get('/services', (req, res) => {
  res.sendFile('services.html', { root: __dirname });
});
app.get('/services.html', (req, res) => {
  res.sendFile('services.html', { root: __dirname });
});

// Nucha-services alternate pages (public)
app.get('/services-3d', (req, res) => {
  res.sendFile('nucha-services/services-page-3d.html', { root: __dirname });
});
app.get('/services-alt', (req, res) => {
  res.sendFile('nucha-services/services-page.html', { root: __dirname });
});

// Quotation template (public)
app.get('/quotation', (req, res) => {
  res.sendFile('quotation.html', { root: __dirname });
});
app.get('/quotation.html', (req, res) => {
  res.sendFile('quotation.html', { root: __dirname });
});

// Legal pages (public)
app.get('/privacy', (req, res) => {
  res.sendFile('privacy.html', { root: __dirname });
});
app.get('/terms', (req, res) => {
  res.sendFile('terms.html', { root: __dirname });
});

// Admin pages (protected)
app.get('/admin', authMiddleware, (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});
app.get('/admin.html', authMiddleware, (req, res) => {
  res.sendFile('admin.html', { root: __dirname });
});

// Public pages
app.get('/login', (req, res) => {
  res.sendFile('admin-login.html', { root: __dirname });
});
app.get('/admin-login.html', (req, res) => {
  res.sendFile('admin-login.html', { root: __dirname });
});

// Catch-all for SPA
app.get('/{*splat}', (req, res) => {
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
  console.log(`⚠️  Default admin: admin@nuchainnovation.com / admin123 — เปลี่ยนรหัสผ่านก่อน deploy จริง!`);
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
