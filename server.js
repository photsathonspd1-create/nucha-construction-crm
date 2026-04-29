const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const db = require('./server/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// ===== ENSURE DIRECTORIES EXIST =====
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) require('fs').mkdirSync(uploadsDir, { recursive: true });

// ===== MIDDLEWARE =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

// ===== IMAGE UPLOAD =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
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

// ===== RATE LIMITER (simple in-memory) =====
const rateLimitMap = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }
    record.count++;
    rateLimitMap.set(ip, record);
    if (record.count > max) return res.status(429).json({ error: 'ลองใหม่ภายหลัง' });
    next();
  };
}

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

// ===== AUTH ROUTES =====
app.post('/api/auth/login', (req, res) => {
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
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ success: true, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user || {});
});

// ===== IMAGE UPLOAD =====
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });
  res.json({ url: '/uploads/' + req.file.filename });
});

// ===== CONTENT API (Public) =====
app.get('/api/content/:key', (req, res) => {
  const row = db.prepare('SELECT content FROM site_content WHERE section_key = ?').get(req.params.key);
  if (!row) return res.json({});
  try { res.json(JSON.parse(row.content)); } catch { res.json({}); }
});

app.get('/api/content', (req, res) => {
  const rows = db.prepare('SELECT section_key, content FROM site_content').all();
  const result = {};
  rows.forEach(r => { try { result[r.section_key] = JSON.parse(r.content); } catch {} });
  res.json(result);
});

// ===== CONTENT API (Admin) =====
app.put('/api/content/:key', authMiddleware, (req, res) => {
  const content = JSON.stringify(req.body);
  db.prepare('INSERT INTO site_content (section_key, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(section_key) DO UPDATE SET content = ?, updated_at = CURRENT_TIMESTAMP')
    .run(req.params.key, content, content);
  res.json({ success: true });
});

// Test LINE Notify
app.post('/api/test-notification', authMiddleware, async (req, res) => {
  try {
    await sendLineNotify('🧪 ทดสอบการแจ้งเตือนจาก NUCHA CRM — ระบบทำงานปกติ ✅');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== NAV ITEMS =====
app.get('/api/nav', (req, res) => {
  const items = db.prepare('SELECT * FROM nav_items ORDER BY sort_order').all();
  res.json(items);
});

app.put('/api/nav', authMiddleware, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
  db.prepare('DELETE FROM nav_items').run();
  const insert = db.prepare('INSERT INTO nav_items (label, href, sort_order, is_visible) VALUES (?, ?, ?, ?)');
  items.forEach((item, i) => {
    // Sanitize: strip HTML tags from label
    const safeLabel = String(item.label || '').replace(/<[^>]*>/g, '');
    const safeHref = String(item.href || '#').replace(/[^a-zA-Z0-9\-_/#.?&=:@]/g, '');
    insert.run(safeLabel, safeHref, item.sort_order || i + 1, item.is_visible ?? 1);
  });
  res.json({ success: true });
});

// ===== LEADS =====
app.get('/api/leads', authMiddleware, (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(leads);
});

app.post('/api/leads', rateLimit(60 * 1000, 10), (req, res) => {
  const { name, phone, email, service_type, budget_range, message, appointment_date, appointment_time, meeting_type } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'กรอกชื่อและเบอร์โทร' });

  const score = calculateScore({ budget_range, service_type, message, appointment_date });
  const result = db.prepare(
    'INSERT INTO leads (name, phone, email, service_type, budget_range, message, score, appointment_date, appointment_time, meeting_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, phone, email || '', service_type || 'อื่นๆ', budget_range || '', message || '', score, appointment_date || null, appointment_time || null, meeting_type || 'onsite');

  // Log activity
  db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
    .run(result.lastInsertRowid, 'lead_created', JSON.stringify({ source: 'website' }));

  // Send LINE Notify (async, don't block response)
  const budgetLabel = budget_range && budget_range !== 'ไม่ระบุ' ? `\n💰 งบ: ${budget_range}` : '';
  const apptLabel = appointment_date ? `\n📅 นัด: ${appointment_date} ${appointment_time || ''}` : '';
  sendLineNotify(
    `🆕 Lead ใหม่!\n👤 ${name}\n📞 ${phone}\n🔧 ${service_type || 'อื่นๆ'}${budgetLabel}${apptLabel}\n📝 ${message || '-'}`
  ).catch(() => {});

  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/leads/:id', authMiddleware, (req, res) => {
  const updates = req.body;
  const allowedFields = ['name', 'phone', 'email', 'service_type', 'budget_range', 'message', 'status', 'score', 'assigned_to', 'lost_reason', 'appointment_date', 'appointment_time', 'meeting_type'];
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
  values.push(req.params.id);
  db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  // Log activity
  db.prepare('INSERT INTO activities (lead_id, action, details) VALUES (?, ?, ?)')
    .run(req.params.id, 'lead_updated', JSON.stringify(updates));

  res.json({ success: true });
});

app.delete('/api/leads/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ===== NOTES =====
app.get('/api/leads/:id/notes', authMiddleware, (req, res) => {
  const notes = db.prepare('SELECT * FROM notes WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(notes);
});

app.post('/api/leads/:id/notes', authMiddleware, (req, res) => {
  const { note, note_type, follow_up_date } = req.body;
  if (!note) return res.status(400).json({ error: 'กรุณากรอกบันทึก' });
  const result = db.prepare('INSERT INTO notes (lead_id, note, note_type, follow_up_date) VALUES (?, ?, ?, ?)')
    .run(req.params.id, note, note_type || 'general', follow_up_date || null);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.put('/api/notes/:id', authMiddleware, (req, res) => {
  const { follow_up_done } = req.body;
  db.prepare('UPDATE notes SET follow_up_done = ? WHERE id = ?').run(follow_up_done ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// ===== ACTIVITIES =====
app.get('/api/activities', authMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const activities = db.prepare(`
    SELECT a.*, l.name as lead_name 
    FROM activities a 
    LEFT JOIN leads l ON a.lead_id = l.id 
    ORDER BY a.created_at DESC 
    LIMIT ?
  `).all(limit);
  res.json(activities);
});

// ===== PROPOSALS =====
app.get('/api/proposals', authMiddleware, (req, res) => {
  const proposals = db.prepare(`
    SELECT p.*, l.name as lead_name 
    FROM proposals p 
    LEFT JOIN leads l ON p.lead_id = l.id 
    ORDER BY p.created_at DESC
  `).all();
  res.json(proposals);
});

app.post('/api/proposals', authMiddleware, (req, res) => {
  const { lead_id, title, items, subtotal, tax, total, valid_until, notes } = req.body;
  // Use MAX to avoid race condition
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
});

app.put('/api/proposals/:id', authMiddleware, (req, res) => {
  const { status, title, items, subtotal, tax, total, valid_until, notes } = req.body;
  db.prepare('UPDATE proposals SET status = COALESCE(?, status), title = COALESCE(?, title), items = COALESCE(?, items), subtotal = COALESCE(?, subtotal), tax = COALESCE(?, tax), total = COALESCE(?, total), valid_until = COALESCE(?, valid_until), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, title, items ? JSON.stringify(items) : null, subtotal, tax, total, valid_until, notes, req.params.id);
  res.json({ success: true });
});

// ===== FOLLOW-UPS =====
app.get('/api/followups', authMiddleware, (req, res) => {
  const today = getTodayThai();
  const followups = db.prepare(`
    SELECT n.*, l.name as lead_name, l.phone as lead_phone, l.service_type 
    FROM notes n 
    JOIN leads l ON n.lead_id = l.id 
    WHERE n.follow_up_done = 0 AND n.follow_up_date <= ? 
    ORDER BY n.follow_up_date ASC
  `).all(today);
  res.json(followups);
});

// ===== STATS =====
app.get('/api/stats', authMiddleware, (req, res) => {
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
});

// ===== PIPELINE =====
app.get('/api/pipeline', authMiddleware, (req, res) => {
  const leads = db.prepare('SELECT * FROM leads').all();
  const stages = ['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
  res.json(stages.map(stage => ({
    stage,
    count: leads.filter(l => l.status === stage).length,
    leads: leads.filter(l => l.status === stage)
  })));
});

// ===== LEAD SCORING =====
function calculateScore(lead) {
  let score = 0;
  const budgetScores = {
    'มากกว่า 10,000,000': 5, '5,000,000 - 10,000,000': 4,
    '3,000,000 - 5,000,000': 3, '1,000,000 - 3,000,000': 2,
    '500,000 - 1,000,000': 1, 'ต่ำกว่า 500,000': 0.5
  };
  score += budgetScores[lead.budget_range] || 0;
  if (lead.service_type && lead.service_type !== 'อื่นๆ') score += 2;
  if (lead.message && lead.message.length > 10) score += 1;
  if (lead.appointment_date) score += 2;
  return Math.round(score * 10) / 10;
}

// ===== THAI DATE HELPER =====
function getTodayThai() {
  const now = new Date();
  const thaiOffset = 7 * 60; // UTC+7 in minutes
  const local = new Date(now.getTime() + (thaiOffset + now.getTimezoneOffset()) * 60000);
  return local.toISOString().split('T')[0];
}

// ===== MEDIA =====
const fs = require('fs');
app.get('/api/media', authMiddleware, (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const files = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
    res.json(files.map(f => ({ name: f, url: '/uploads/' + f })));
  } catch { res.json([]); }
});

app.delete('/api/media/:name', authMiddleware, (req, res) => {
  // Path traversal protection: only allow flat filenames
  const safeName = path.basename(req.params.name);
  if (!safeName || safeName.includes('..') || safeName.includes('/') || safeName.includes('\\')) {
    return res.status(400).json({ error: 'ชื่อไฟล์ไม่ถูกต้อง' });
  }
  const filePath = path.join(__dirname, 'uploads', safeName);
  // Double check: resolved path must be inside uploadsDir
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(400).json({ error: 'ชื่อไฟล์ไม่ถูกต้อง' });
  }
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'ไม่พบไฟล์' });
  }
});

// ===== LINE NOTIFY =====
async function sendLineNotify(message) {
  try {
    const row = db.prepare("SELECT content FROM site_content WHERE section_key = 'notifications'").get();
    if (!row) return;
    const config = JSON.parse(row.content);
    if (!config.line_notify_token) return;

    const https = require('https');
    const querystring = require('querystring');
    const postData = querystring.stringify({ message });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'notify-api.line.me',
        path: '/api/notify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Bearer ' + config.line_notify_token,
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
    console.error('LINE Notify error:', err.message);
  }
}

// ===== SERVE STATIC FILES =====
// Static files (CSS, JS, images) — BEFORE explicit routes
app.use(express.static(__dirname));

// Service detail page (public)
app.get('/service', (req, res) => {
  res.sendFile('service.html', { root: __dirname });
});
app.get('/service.html', (req, res) => {
  res.sendFile('service.html', { root: __dirname });
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

// Catch-all for SPA (Express 5 syntax)
app.get('/{*splat}', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'ไฟล์ใหญ่เกิน 5MB' });
  }
  if (err.message === 'Only images allowed') {
    return res.status(400).json({ error: 'อนุญาตเฉพาะไฟล์รูปภาพ' });
  }
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏗️  NUCHA CRM Server running on http://localhost:${PORT}`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
  console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
});
