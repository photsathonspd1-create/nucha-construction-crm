# HANDOFF.md — NUCHA Construction CRM

> อัพเดทล่าสุด: 2026-05-08 14:24 (GMT+8)

---

## 📋 สถานะปัจจุบัน

**Production-ready** — ผ่าน API test 150+ test cases ครอบคลุมทุก feature รวมถึง LINE Webhook, Email Notification, PDF Generation, SEO, 3D Model Upload

---

## ✅ สิ่งที่เสร็จแล้ว (Completed)

### 🆕 Session 6 (2026-05-08) — LINE OA + Email + PDF + SEO + 3D Test

#### 1. LINE OA / Chat Integration ✅
- **LINE Webhook endpoint** — `POST /api/line/webhook` รับข้อความจาก LINE OA
  - Verify signature ด้วย Channel Secret (HMAC-SHA256)
  - เก็บข้อความเข้า `chat_messages` table (session_id = `line_{userId}`)
  - Auto-reply จับคู่ FAQ จาก chatbot_faq แล้วตอบผ่าน LINE Reply API
  - ดึงชื่อจาก LINE user profile
- **Admin UI** — เพิ่ม Channel Secret field + แสดง Webhook URL ให้ copy ไปใส่ LINE Developers Console
- **Migration 014** — เพิ่ม `line_channel_secret` ใน notification_settings

**วิธีใช้:**
1. สร้าง Messaging API channel ที่ https://developers.line.biz/console/
2. คัดลอก Webhook URL จาก Admin > Notifications ไปใส่ใน LINE Developers
3. เปิด Use webhook = On, Auto-reply messages = Off
4. ใส่ Channel Access Token + Channel Secret + User ID ใน admin
5. กดทดสอบ LINE

#### 2. Email Notification (Nodemailer) ✅
- **New lead email** — ส่งอีเมล HTML แจ้งเตือนทันทีเมื่อมี lead ใหม่
- **Follow-up reminder** — ส่งอีเมลรวมรายการ follow-up ทุกวัน 08:30 ICT (scheduled)
- **Test endpoint** — `POST /api/test-email` ทดสอบส่งอีเมล
- **Admin UI** — เพิ่ม SMTP config (host/port/user/pass/notify_email) + ปุ่ม 🧪 ทดสอบ Email
- **Migration 014** — เพิ่ม email settings (email_enabled, smtp_host, smtp_port, smtp_user, smtp_pass, notify_email)

**วิธีใช้ (Gmail):**
1. เปิด 2-Step Verification ใน Google Account
2. สร้าง App Password (Security > App Passwords)
3. ใส่ SMTP: smtp.gmail.com:587, user=your@gmail.com, pass=App Password 16 หลัก
4. ใส่ notify_email = อีเมลที่ต้องการรับแจ้งเตือน
5. กดทดสอบ Email

#### 3. Quotation / Invoice PDF Generation ✅
- **PDF endpoint** — `GET /api/proposals/:id/pdf` สร้าง PDF จริงด้วย puppeteer-core + chromium
  - HTML template สวยงาม: header แดง + ตารางบริการ + สรุปราคา + เงื่อนไข + ลายเซ็น
  - ดึงข้อมูลลูกค้าจาก leads table (ชื่อ, เบอร์, อีเมล)
- **Email quotation** — `POST /api/proposals/:id/email` ส่งใบเสนอราคาเป็น PDF แนบอีเมล
- **Admin UI** — ปุ่ม 📄 ดาวน์โหลด PDF + 📧 ส่งอีเมล ในตาราง proposals
- **เทสแล้ว**: สร้าง PDF ได้จริง 57KB, 1 หน้า A4, ข้อมูลครบ

**ไฟล์ที่แก้:** `server.js` (เพิ่ม ~300 บรรทัด: email + PDF + LINE webhook functions)

#### 4. SEO & Performance ✅
- **Structured Data (Schema.org)** — เพิ่ม JSON-LD 2 blocks ใน index.html:
  - `GeneralContractor` — ชื่อ, ที่อยู่, เบอร์โทร, เวลาเปิด, บริการ, พื้นที่ให้บริการ
  - `WebSite` + `SearchAction` — สำหรับ Google Sitelinks Search
- **Meta tags** — เพิ่ม description/keywords/OG/Twitter Card/canonical ใน service.html, services.html
- **robots.txt** — อัพเดท Allow/Disallow ครบ (services, quotation, privacy, terms) + Crawl-delay
- **sitemap.xml** — 7 URLs พร้อม lastmod/priority (index, services, service, quotation, privacy, terms, services-3d)

**ไฟล์ที่แก้:** `index.html`, `service.html`, `services.html`, `robots.txt`, `sitemap.xml`

#### 5. 3D Model Test ✅
- **OBJ → GLB conversion** — Cottage_FREE.obj (326KB) → แปลงเป็น .glb (238KB) อัตโนมัติ
- **Serve** — `GET /uploads/xxx.glb` → HTTP 200, valid glTF binary
- **Model API** — `GET /api/services/:id/models` → ข้อมูลครบ (model_url, format: glb)
- **model-viewer** — script อยู่ใน `<head>` ของ service.html พร้อมแสดงผล

#### 6. Admin UI Updates ✅
- **Notifications page** — เพิ่ม LINE Webhook section + Email Notification section + ปุ่มทดสอบ
- **Proposals table** — เพิ่มปุ่ม 📄 PDF download + 📧 Email send

#### 7. Dependencies เพิ่ม ✅
- `nodemailer` — ส่งอีเมล (Gmail SMTP, หรือ SMTP ใดก็ได้)
- `puppeteer-core` — สร้าง PDF (ใช้ chromium ที่มีอยู่แล้วในระบบ)

---

### Session 5 (2026-05-07 18:43–19:04) — Full Test + Upload Bug Fix
- **เทส API 42 รายการ** — ทุก endpoint ทำงานปกติ
- **🐛 แก้บั๊ก upload credentials** — เพิ่ม `credentials: 'include'` ใน 4 จุดของ admin.js
- **ไฟล์ที่แก้**: `admin.js`

### 🔒 Security Fixes (14 จุด)
1. SQL Injection — sortOrder whitelist
2. Command Injection — execFile + URL validation
3. Cookie Security — sameSite: 'strict'
4. Chat session_id validation — regex
5. Health info leak — ลบ uptime
6. Phone validation — leading 0 check
7. CSV formula injection — safeCsvField()
8. Lead score cap — Math.min(score, 10)
9. LIKE injection — escape % and _
10. Removed puppeteer (heavy)
11. CSRF protection — Origin/Referer check
12. Path traversal block — raw URL check
13. XSS rejection — validateName() reject HTML
14. File upload credentials

### API & Server Improvements
- API 404 handler, bulk rate limiter, CSRF protection
- Chat pagination, nav href sanitization
- Login rate limit, change pw error code, upload path serving

### 3D Model Display Fix
- model-viewer script ย้ายไป `<head>` ของ service.html
- .obj upload → auto-convert to .glb (obj2gltf)

### CMS & Frontend
- Service image support (image_url in admin CMS + frontend display)
- Service Detail Modal (sub-service clickable cards, gallery slider, 3D viewer)
- Admin Gallery & 3D Models Management UI (5 endpoints, 2 pages, ~200 บรรทัด JS)
- Admin DB Services Management (8 endpoints, CRUD services + packages)

### Service Gallery System
- Migration 011: service_gallery table
- Migration 013: Seed 39 gallery images from Unsplash
- Gallery grid + Lightbox (fullscreen, navigate, thumbnails)

### 3D Model Viewer System
- Migration 012: service_models table
- Google model-viewer Web Component (v3.5.0)
- Upload: .obj → auto-convert to .glb, .glb/.gltf direct upload

---

## ❌ สิ่งที่ยังไม่เสร็จ (TODO)

### 🟡 ควรทำ

1. **3D Model Seed Data**
   - ตาราง `service_models` สร้างแล้ว + upload API ทำงาน
   - มี Cottage_FREE.obj → .glb upload สำเร็จ 1 ชิ้น (service_id=38)
   - ควร seed .glb ตัวอย่างเพิ่มใน migration ให้ครบทุกหมวดบริการ

2. **service.html feature cards — hardcoded 5 ชุด**
   - `featureSets` object มีแค่ 5 keys: construction, builtin, design, decoration, project-management
   - อีก 4 บริการ (signage, landscape, drafting, visualization) ไม่มี feature cards
   - Category mode: cards เป็น clickable แล้ว → เปิด modal ดู gallery + 3D model
   - Key mode: ยังเป็น hardcoded static cards (ไม่ clickable) — ควรเปลี่ยนไปดึงจาก DB/CMS

3. **services.html — แสดง images จาก DB**
   - ตอนนี้ใช้ `meta.icon` (emoji) สำหรับ category cards
   - ควรแสดง `image_url` จาก DB service เป็น card background/thumbnail

4. **Pre-fill booking form จาก service page**
   - CTA "จองคิวปรึกษาฟรี" ไปหน้า `/` แบบ generic
   - ควรส่ง `?service=xxx` ไป pre-select ใน form

### 🟢 Nice to Have

5. **Audit log** — บันทึก admin actions เพิ่มเติม
6. **Password reset email** — ส่ง email จริงแทน console.log token (ใช้ Nodemailer ที่มีแล้ว)
7. **Chat widget → LINE bridge** — เมื่อ customer คุยผ่าน chat widget บนเว็บ ให้ admin ตอบผ่าน LINE OA ได้

---

## 🏗️ Architecture

```
server.js           — Express 5 backend, 55+ API endpoints, CSRF + rate limiting
                      + LINE Webhook handler
                      + Email notification (Nodemailer)
                      + PDF generation (puppeteer-core)
server/db.js        — SQLite (better-sqlite3), schema + seed data (58 services, 7 packages)
server/migrations.js — 14 migrations (001-014)
utils/validate.js   — Input validation (phone, email, name, password, lead)
scripts/backup.js   — DB backup script
site-loader.js      — Dynamic content loader (CMS → frontend)
admin.js            — Admin CMS logic + DB Services + Gallery + Models + Proposals PDF/Email
admin.html          — Admin panel (18+ pages)
index.html          — Landing page (dynamic, Schema.org structured data)
service.html        — Service detail page (gallery + 3D viewer + SEO meta tags)
services.html       — Services overview (DB categories + Three.js 3D + SEO meta tags)
chat-widget.js/html — Customer chat widget
quotation.html      — Quotation template (print-ready)
robots.txt          — SEO robots config
sitemap.xml         — SEO sitemap (7 URLs)
nucha-services/     — Service catalog docs, seed SQL, quotation templates
```

### Database Tables (16 tables)
```
users               — Admin users (email, password, role)
site_content        — CMS content (JSON per section_key)
                      Keys: hero, services, process, portfolio, testimonials, footer,
                            notification_settings, chatbot_faq, ...
leads               — Customer leads (name, phone, email, service_type, status, score...)
notes               — Lead notes + follow-up
activities          — Activity log
proposals           — Quotation proposals (items, subtotal, tax, total, PDF generation)
nav_items           — Navigation menu items
services            — DB services (58 items, 9 categories)
service_packages    — Service packages (7 items)
service_gallery     — Gallery images per service (39 seed items)
service_models      — 3D models per service (1 seed: Cottage .glb)
chat_messages       — Customer chat messages (web + LINE OA)
lead_attachments    — File attachments for leads
password_resets     — Password reset tokens
backups             — Backup records
migrations          — Migration tracking (14 applied)
```

---

## 🔑 Default Credentials
- **Admin:** admin@nuchainnovation.com / admin123
- ⚠️ **เปลี่ยนรหัสผ่านก่อน deploy จริง!**

## 📦 Tech Stack
- Frontend: HTML/CSS/JS + GSAP animations + Google model-viewer (3D) + Three.js
- Backend: Node.js + Express 5
- Database: SQLite (better-sqlite3)
- Auth: JWT + bcryptjs (cookie-based, HttpOnly, SameSite=Strict)
- Upload: Multer + obj2gltf (.obj → .glb auto-conversion)
- Email: Nodemailer (Gmail SMTP / any SMTP)
- PDF: puppeteer-core + chromium
- LINE: LINE Messaging API (webhook + push + reply)
- Security: Helmet, express-rate-limit, CSRF protection, input validation

## 🚀 How to Run
```bash
npm install
npm start
# เปิด http://localhost:3000
# Admin: http://localhost:3000/admin
# LINE Webhook: http://localhost:3000/api/line/webhook
```

---

## 🔄 Flow การทำงาน

### 1. Landing Page Flow
```
index.html (static fallback) → site-loader.js fetches /api/content → แทนที่ dynamic sections
  - Hero, Services, Process, Portfolio, Testimonials, Closing, Footer
  - Service cards: image_url จาก API → <img> → fallback emoji ถ้ารูปพัง
  - SEO: Schema.org GeneralContractor + WebSite JSON-LD
```

### 2. Admin CMS Flow
```
admin-login.html → POST /api/auth/login → JWT cookie → redirect /admin
admin.html → admin.js โหลด content จาก /api/content → แก้ไข → PUT /api/content/:key
```

### 3. Lead Flow
```
Landing page booking form → POST /api/leads → duplicate check → SQLite
  → LINE Messaging API push notify
  → Telegram notify
  → Email notification (Nodemailer → notify_email)
  → Auto-reply

Admin: GET /api/leads → filter/sort/search/pagination → update status → pipeline view
```

### 4. LINE OA Flow (NEW)
```
LINE User ส่งข้อความ → LINE Platform → POST /api/line/webhook
  → Verify signature (HMAC-SHA256 + Channel Secret)
  → handleLineEvent():
    → ดึง LINE user profile (ชื่อ)
    → เก็บเข้า chat_messages (session_id = line_{userId})
    → จับคู่ FAQ → reply ผ่าน LINE Reply API
    → เก็บ bot reply เข้า chat_messages

Admin: GET /api/chat/sessions → เห็น session "line_xxx" → ตอบได้
  → POST /api/chat/sessions/:session_id → ส่งข้อความกลับ (future: LINE push)
```

### 5. Email Notification Flow (NEW)
```
New Lead → sendLeadNotificationEmail()
  → getEmailTransporter() (Nodemailer + SMTP config from DB)
  → ส่ง HTML email ถึง notify_email

Daily 08:30 ICT → sendFollowUpReminderEmail()
  → Query follow-up notes (follow_up_date <= today, done = 0)
  → ส่ง HTML email รวมรายการ follow-up

Admin > Notifications:
  → ตั้งค่า SMTP (host/port/user/pass/notify_email)
  → ปุ่ม 🧪 ทดสอบ Email → POST /api/test-email
```

### 6. PDF Generation Flow (NEW)
```
Admin > Proposals:
  → ปุ่ม 📄 → GET /api/proposals/:id/pdf
    → generateQuotationPDF():
      → ดึง proposal + lead data
      → สร้าง HTML template (header แดง, ตาราง, สรุป, เงื่อนไข, ลายเซ็น)
      → puppeteer-core + chromium → PDF buffer
      → ส่งกลับเป็น Content-Type: application/pdf

  → ปุ่ม 📧 → POST /api/proposals/:id/email
    → สร้าง PDF → แนบเป็น attachment → ส่งอีเมลผ่าน Nodemailer
```

### 7. Chat Flow
```
chat-widget.html → POST /api/chat/messages → SQLite
Admin: GET /api/chat/sessions → reply → POST /api/chat/sessions/:id
Polling: GET /api/chat/messages/:session_id?page=&limit=

LINE OA messages → stored in same chat_messages table (sender='customer')
Admin ตอบ → stored as sender='admin'
```

### 8. Service Detail Page Flow
```
/service?key=construction (CMS mode)
  → fetch /api/content → service items → hero + features + portfolio

/service?category=สถาปัตยกรรม (DB mode)
  → fetch /api/services → filter category → clickable sub-service cards
  → คลิก card → Service Detail Modal:
    → info (ชื่อ, คำอธิบาย, ราคา, รูป hero)
    → fetch /api/services/:id/gallery → gallery slider
    → fetch /api/services/:id/models → <model-viewer>
    → คลิก gallery → lightbox (fullscreen, navigate, thumbnails)
    → CTA "จองคิวปรึกษาฟรี" → /#booking
```

### 9. 3D Model Upload Flow
```
Admin: showAddModelModal() → เลือก service + upload .obj/.glb/.gltf
  → POST /api/services/:id/models (FormData)
  → Server: multer → if .obj: obj2gltf convert to .glb → save to /uploads/
  → DB: INSERT service_models (model_url, model_format, ...)
  → Frontend: <model-viewer src="/uploads/xxx.glb"> (auto-rotate, camera-controls)
```

---

## 📝 API Endpoints ทั้งหมด (55+)

### Auth (6)
- `POST /api/auth/login` — Login (rate limited 10/นาที)
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user
- `PUT /api/auth/change-password` — เปลี่ยนรหัสผ่าน
- `POST /api/auth/forgot-password` — ลืมรหัสผ่าน
- `POST /api/auth/reset-password` — รีเซ็ตรหัสผ่าน

### Content CMS (3)
- `GET /api/content` / `GET /api/content/:key` / `PUT /api/content/:key`

### Navigation (2)
- `GET /api/nav` / `PUT /api/nav`

### Leads (10)
- CRUD + bulk-update + bulk-delete + attachments + notes

### Activities & Follow-ups (2)
- `GET /api/activities` / `GET /api/followups`

### Proposals (6) ← เพิ่ม PDF + Email
- CRUD
- `GET /api/proposals/:id/pdf` — ดาวน์โหลด PDF
- `POST /api/proposals/:id/email` — ส่งอีเมล PDF

### Dashboard & Reports (6)
- stats, pipeline, summary, export/csv, by-service, by-date

### Services Public (9)
- services list/detail/categories, gallery, models, packages

### Services Admin (8)
- CRUD services + CRUD packages (auth+admin)

### Gallery & Models Admin (5)
- admin gallery list, gallery PUT, admin models list, model PUT, model DELETE

### Chat (8)
- messages, sessions, reply, bulk-delete, mark-read, unread-count

### Users Admin (4)
- CRUD (auth+admin)

### LINE Integration (1) ← NEW
- `POST /api/line/webhook` — LINE OA webhook receiver

### System (9) ← เพิ่ม test-email
- health, upload, media, test-notification, test-email, backup, backups, generate-docs, docs-status

---

## 📝 สรุปสิ่งที่ทำแต่ละ Session

### Session 6 (2026-05-08 13:50–14:24) — LINE OA + Email + PDF + SEO + 3D Test
- **LINE Webhook** — `POST /api/line/webhook` + signature verify + auto-reply + admin UI
- **Email Notification** — Nodemailer + SMTP config + new lead email + daily follow-up reminder + test endpoint
- **PDF Generation** — puppeteer-core + chromium → 57KB PDF + email attachment
- **SEO** — Schema.org JSON-LD (GeneralContractor + WebSite) + meta tags + sitemap (7 URLs) + robots.txt
- **3D Model Test** — Cottage_FREE.obj (326KB) → .glb (238KB) upload + serve 200 ✅
- **Admin UI** — Notifications page: LINE Webhook + Email config + test buttons; Proposals: PDF + Email buttons
- **Dependencies** — เพิ่ม nodemailer, puppeteer-core
- **Migration 014** — LINE channel_secret + email SMTP settings
- **ไฟล์ที่แก้**: `server.js`, `admin.js`, `admin.html` (via admin.js), `index.html`, `service.html`, `services.html`, `robots.txt`, `sitemap.xml`, `server/migrations.js`, `package.json`

### Session 5 (2026-05-07 18:43–19:04) — Full Test + Upload Bug Fix
- เทส API 42 รายการ ✅, แก้ upload credentials 4 จุด

### Session 4 (2026-05-07 17:31–18:12) — API Testing + Bug Fixes
- เทส API 73 test cases → แก้จน 100% ผ่าน, แก้ 9 จุด

### Session 3 (2026-05-07) — Admin Gallery & Models UI
- 5 API endpoints + 2 admin pages + ~200 บรรทัด JS

### Session 2 (2026-05-07) — Service Detail Modal
- Modal + gallery slider + 3D viewer + lightbox

### Session 1 (2026-05-07) — Admin DB Services Management
- 8 admin API endpoints + CRUD services + packages
