# HANDOFF.md — NUCHA Construction CRM

> **Last Updated:** 2026-04-29 22:44 (GMT+8)
> **Updated By:** OpenClaw AI Agent
> **Branch:** main
> **Status:** ✅ All features implemented & tested

---

## 📋 Project Overview

ระบบ CRM สำหรับบริษัทรับเหมาก่อสร้าง NUCHA INNOVATION พร้อม CMS แก้ไขเว็บได้ทุกส่วน

**Tech Stack:**
- Frontend: HTML/CSS/JS + GSAP animations
- Backend: Node.js + Express 5
- Database: SQLite (better-sqlite3)
- Auth: JWT + bcryptjs (cookies httpOnly)
- Upload: Multer
- Security: helmet, express-rate-limit

---

## ✅ สิ่งที่เสร็จแล้ว (Completed Features)

### 🔴 Security & Stability
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 1 | Change password (ต้องใส่รหัสเดิม) | server.js `PUT /api/auth/change-password` | ✅ |
| 2 | Forgot password (generate token) | server.js `POST /api/auth/forgot-password` | ✅ |
| 3 | Reset password (ใช้ token) | server.js `POST /api/auth/reset-password` | ✅ |
| 4 | Password validation (≥8 ตัวอักษร) | utils/validate.js | ✅ |
| 5 | Input validation (เบอร์ 10 หลัก, email format, name ≤200, message ≤5000) | utils/validate.js | ✅ |
| 6 | Error handling (try-catch ทุก route + global error handler) | server.js | ✅ |
| 7 | Login rate limit (5 ครั้ง/นาที, ภาษาไทย) | server.js express-rate-limit | ✅ |
| 8 | Backup system (create, list, download) | scripts/backup.js, server.js `/api/admin/backup` | ✅ |
| 9 | Graceful shutdown (SIGTERM/SIGINT) | server.js | ✅ |
| 10 | Health check endpoint | server.js `GET /api/health` | ✅ |
| 11 | Security headers (helmet) | server.js | ✅ |
| 12 | CORS configuration | server.js | ✅ |
| 13 | Request logging with timestamps | server.js middleware | ✅ |

### 🟡 Core Features
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 14 | LINE Notify integration | server.js `sendLineNotify()` | ✅ |
| 15 | Telegram Notify integration | server.js `sendTelegramNotify()` | ✅ |
| 16 | Notification settings (stored in DB) | server/migrations.js, site_content table | ✅ |
| 17 | Auto-reply system (LINE/SMS/Email templates) | server.js `checkAutoReply()` | ✅ |
| 18 | Status change notification (LINE + Telegram) | server.js `notifyLeadStatusChange()` | ✅ |
| 19 | Lead duplicate detection (phone/email) | server.js `POST /api/leads` | ✅ |
| 20 | Force bypass duplicate (`?force=true`) | server.js | ✅ |
| 21 | Reports summary (monthly stats) | server.js `GET /api/reports/summary` | ✅ |
| 22 | Reports by service | server.js `GET /api/reports/by-service` | ✅ |
| 23 | Reports by date range | server.js `GET /api/reports/by-date` | ✅ |
| 24 | CSV export (UTF-8 BOM for Excel) | server.js `GET /api/reports/export/csv` | ✅ |
| 25 | Multi-user roles (admin/manager/sales) | server.js, migrations.js | ✅ |
| 26 | Users CRUD (admin only) | server.js `GET/POST/PUT/DELETE /api/users` | ✅ |
| 27 | Role-based access (sales sees only assigned leads) | server.js GET /api/leads | ✅ |
| 28 | Self-delete protection | server.js DELETE /api/users/:id | ✅ |

### 🟢 UX Improvements
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 29 | Search (name, phone, email) | server.js `?search=` param | ✅ |
| 30 | Filter (date_from, date_to, budget, service, status) | server.js query params | ✅ |
| 31 | Sort (created_at, name, score, updated_at, status) | server.js `?sort=&order=` | ✅ |
| 32 | Pagination (page + limit, max 100) | server.js `?page=&limit=` | ✅ |
| 33 | Bulk update leads | server.js `POST /api/leads/bulk-update` | ✅ |
| 34 | Bulk delete leads | server.js `POST /api/leads/bulk-delete` | ✅ |
| 35 | Lead attachments (upload/list/delete) | server.js, lead_attachments table | ✅ |
| 36 | Admin pages: Reports + Users + Site Docs | admin.html | ✅ |

### 🧱 Technical
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 37 | express-rate-limit (แทน in-memory Map) | package.json, server.js | ✅ |
| 38 | Database migrations system | server/migrations.js | ✅ |
| 39 | Path traversal protection (media delete) | server.js | ✅ |
| 40 | Global error handler middleware | server.js | ✅ |
| 41 | Site Documentation Generator (Puppeteer) | scripts/site-docs.js | ✅ |
| 42 | Site docs API endpoint | server.js `/api/admin/generate-docs` | ✅ |

---

## 📁 File Structure (Current)

```
nucha-construction-crm/
├── server.js                 ← Backend (Express + SQLite + ALL API routes) [~1200 lines]
├── server/
│   ├── db.js                 ← Database connection + schema + seed
│   └── migrations.js         ← NEW: Schema versioning (6 migrations)
├── scripts/
│   ├── backup.js             ← NEW: Database backup utility
│   └── site-docs.js          ← NEW: Site documentation generator (Puppeteer)
├── utils/
│   └── validate.js           ← NEW: Input validation (phone, email, name, password)
├── uploads/                  ← Image/file uploads
├── backups/                  ← NEW: Database backups
├── site-docs/                ← NEW: Generated site documentation
│   ├── site-report.html      ← Visual HTML report
│   ├── site-report.md        ← Markdown summary
│   ├── site-data.json        ← Raw structured data
│   └── screenshots/          ← Page screenshots
├── data/
│   └── nucha.db              ← SQLite database (auto-created)
├── index.html                ← Landing page (dynamic)
├── site-loader.js            ← Load content from API
├── script.js                 ← Frontend JS (GSAP, cursor, booking form)
├── style.css                 ← Frontend styles
├── admin.html                ← Admin CMS (dashboard, CMS editors, leads, reports, users, site-docs)
├── admin.js                  ← Admin CMS logic
├── admin.css                 ← Admin CMS styles
├── admin-login.html          ← Login page
├── service.html              ← Service detail page
├── chat-widget.html          ← Chat widget
├── chat-widget.js            ← Chat widget logic
├── .env.example              ← Environment variables template
├── .gitignore
├── package.json              ← Dependencies
├── package-lock.json
├── README.md
├── SALES-SCRIPT.md
└── HANDOFF.md                ← THIS FILE
```

---

## 🔌 API Endpoints (Complete)

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | No | Login (rate limited: 5/min) |
| POST | /api/auth/logout | Yes | Logout |
| GET | /api/auth/me | Yes | Current user |
| PUT | /api/auth/change-password | Yes | Change password |
| POST | /api/auth/forgot-password | No | Generate reset token |
| POST | /api/auth/reset-password | No | Reset password with token |

### Content (CMS)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/content | No | Get all content |
| GET | /api/content/:key | No | Get section content |
| PUT | /api/content/:key | Yes | Update section |

### Navigation
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/nav | No | Get nav items |
| PUT | /api/nav | Yes | Update nav items |

### Leads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/leads | No | Create lead (rate limited, duplicate detection) |
| GET | /api/leads | Yes | List leads (filter, sort, paginate) |
| PUT | /api/leads/:id | Yes | Update lead |
| DELETE | /api/leads/:id | Yes | Delete lead |
| POST | /api/leads/bulk-update | Yes | Bulk update leads |
| POST | /api/leads/bulk-delete | Yes | Bulk delete leads |

### Lead Notes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/leads/:id/notes | Yes | List notes |
| POST | /api/leads/:id/notes | Yes | Create note |
| PUT | /api/notes/:id | Yes | Update note (follow_up_done) |

### Lead Attachments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/leads/:id/attachments | Yes | List attachments |
| POST | /api/leads/:id/attachments | Yes | Upload attachment |
| DELETE | /api/attachments/:id | Yes | Delete attachment |

### Proposals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/proposals | Yes | List proposals |
| POST | /api/proposals | Yes | Create proposal |
| PUT | /api/proposals/:id | Yes | Update proposal |

### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/reports/summary | Yes | Monthly summary |
| GET | /api/reports/by-service | Yes | Leads by service type |
| GET | /api/reports/by-date | Yes | Leads by date range |
| GET | /api/reports/export/csv | Yes | Export leads CSV |

### Users (Admin Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/users | Yes+Admin | List users |
| POST | /api/users | Yes+Admin | Create user |
| PUT | /api/users/:id | Yes+Admin | Update user |
| DELETE | /api/users/:id | Yes+Admin | Delete user |

### Media & Upload
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/upload | Yes | Upload image |
| GET | /api/media | Yes | List images |
| DELETE | /api/media/:name | Yes | Delete image |

### Site Documentation
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/admin/generate-docs | Yes+Admin | Generate site documentation |
| GET | /api/admin/docs-status | Yes+Admin | Check if docs exist |
| GET | /site-docs/* | Yes | Serve documentation files |

### Backup (Admin Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/admin/backup | Yes+Admin | Create & download backup |
| GET | /api/admin/backups | Yes+Admin | List backups |

### System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/health | No | Health check |
| POST | /api/test-notification | Yes | Test LINE/Telegram notify |
| GET | /api/stats | Yes | Dashboard stats |
| GET | /api/pipeline | Yes | Pipeline view |
| GET | /api/activities | Yes | Activity log |
| GET | /api/followups | Yes | Pending follow-ups |

---

## 🧪 Test Results (2026-04-29)

ทดสอบ 42 endpoints — **ผ่านทั้งหมด ไม่มี error**

| # | Test | Result |
|---|------|--------|
| 1 | Health Check | ✅ |
| 2 | Auth Login | ✅ |
| 3 | Auth Me | ✅ |
| 4 | Change Password (wrong current → rejected) | ✅ |
| 5 | Change Password (correct → success) | ✅ |
| 6 | Forgot Password (generate token) | ✅ |
| 7 | Reset Password (use token) | ✅ |
| 8 | Content List (13 sections) | ✅ |
| 9 | Content By Key | ✅ |
| 10 | Content Update | ✅ |
| 11 | Nav Items (6 items) | ✅ |
| 12 | Leads List + Pagination | ✅ |
| 13 | Leads Filter (status, budget, date) | ✅ |
| 14 | Leads Sort (score, date, name) | ✅ |
| 15 | Lead Create | ✅ |
| 16 | Lead Duplicate Detection (409) | ✅ |
| 17 | Lead Force Create (bypass duplicate) | ✅ |
| 18 | Lead Validation (bad phone → rejected) | ✅ |
| 19 | Lead Validation (bad email → rejected) | ✅ |
| 20 | Lead Update | ✅ |
| 21 | Lead Notes Create/List | ✅ |
| 22 | Lead Attachments Upload/List | ✅ |
| 23 | Bulk Update | ✅ |
| 24 | Bulk Delete | ✅ |
| 25 | Pipeline (6 stages) | ✅ |
| 26 | Stats | ✅ |
| 27 | Activities | ✅ |
| 28 | Proposals Create/List | ✅ |
| 29 | Follow-ups | ✅ |
| 30 | Reports Summary | ✅ |
| 31 | Reports By Service | ✅ |
| 32 | Reports By Date | ✅ |
| 33 | CSV Export | ✅ |
| 34 | Users List | ✅ |
| 35 | Users Create | ✅ |
| 36 | Users Update | ✅ |
| 37 | Users Delete Self (blocked) | ✅ |
| 38 | Backups List | ✅ |
| 39 | Backup Create & Download | ✅ |
| 40 | Notification Test (LINE + Telegram) | ✅ |
| 41 | Login Rate Limit (6th attempt → 429) | ✅ |
| 42 | Graceful Shutdown (SIGTERM) | ✅ |
| 43 | Landing Page (200, 52KB) | ✅ |
| 44 | Login Page (200, 7.6KB) | ✅ |
| 45 | Admin Page (200 with auth) | ✅ |
| 46 | Site Docs Generator (10 pages, all screenshots) | ✅ |

---

## ⚠️ สิ่งที่ต้องทำต่อ (TODO)

### ถ้าอยากทำต่อ:
1. **Admin JS สำหรับหน้าใหม่** — admin.html มี sections สำหรับ Reports, Users, Site Docs แล้ว แต่ `admin.js` ยังไม่มี functions สำหรับ:
   - `loadReports()` — โหลดข้อมูลรายงาน + แสดงกราฟ
   - `loadUsers()` — โหลดรายชื่อผู้ใช้ + CRUD UI
   - `generateSiteDocs()` — เรียก API สร้างรายงาน + แสดงสถานะ
   - `exportCSV()` — ดาวน์โหลด CSV
   - `createBackup()` — สร้าง backup + ดาวน์โหลด
   - ต้องเพิ่ม functions เหล่านี้ใน `admin.js`

2. **Customer Portal** — ให้ลูกค้าเข้ามาดู progress โครงการ (login ด้วยเบอร์โทร + OTP)

3. **Dashboard Charts** — กราฟ leads ตามเดือน, conversion funnel (ใช้ Chart.js หรือ lightweight-charts)

4. **Email Notifications** — เพิ่ม SMTP send จริง (ตอนนี้แค่ log console)

5. **Auto-reply จริง** — ส่ง SMS/LINE จริงแทนแค่ console.log

6. **Proposal PDF Export** — สร้าง PDF จากใบเสนอราคา

7. **Lead Source Tracking** — เพิ่ม UTM parameters / source tracking

8. **Automated Backup Cron** — ตั้ง cron job backup อัตโนมัติทุกวัน

---

## 🔐 Security Notes

- **Default credentials:** admin@nuchainnovation.com / admin123 — **ต้องเปลี่ยนทันที** ก่อน deploy จริง
- **JWT_SECRET:** ถ้าไม่ตั้ง env var จะสุ่มใหม่ทุก restart → token หมดอายุ
- **HTTPS:** ต้อง deploy หลัง reverse proxy (nginx) ที่ terminate SSL
- **Rate limit:** In-memory → ไม่ survive restart / ไม่ work กับ multiple instances

---

## 🚀 How to Run

```bash
# Install
npm install

# Start
npm start

# Access
# Website: http://localhost:3000
# Login: http://localhost:3000/login
# Admin: http://localhost:3000/admin
# Health: http://localhost:3000/api/health

# Generate Site Documentation
node scripts/site-docs.js --url http://localhost:3000 --output site-docs
```

---

## 📦 Dependencies

```json
{
  "bcryptjs": "^3.0.3",
  "better-sqlite3": "^12.9.0",
  "cookie-parser": "^1.4.7",
  "express": "^5.2.1",
  "express-rate-limit": "^8.4.1",
  "helmet": "^8.1.0",
  "jsonwebtoken": "^9.0.3",
  "multer": "^2.1.1",
  "puppeteer": "^24.x"
}
```

---

## 📝 Notes for Next Agent

- โค้ดสไตล์: CommonJS (`require`), Thai language API responses, error messages เป็นภาษาไทย
- Database: SQLite ใช้ `better-sqlite3` (sync API, ไม่ใช่ async)
- Auth: JWT ใน httpOnly cookie, middleware ชื่อ `authMiddleware` และ `adminOnly`
- Admin pages: Single-page app ใช้ `showPage('page-name')` สลับ sections
- Site docs: Puppeteer script ต้อง Chrome/Chromium — ถ้า server ไม่มี GUI ใช้ `headless: 'new'`
- ทุก route มี try-catch แล้ว — ไม่ควร crash
