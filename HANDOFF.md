# HANDOFF.md — NUCHA Construction CRM

> **Last Updated:** 2026-04-30 00:25 (GMT+8)
> **Updated By:** OpenClaw AI Agent (timeout fix + report redesign)
> **Branch:** main
> **Latest Commit:** `40cb5d1` — fix: Puppeteer timeout 60s, redesign report for non-technical audience
> **Status:** ✅ All features implemented, report redesigned for boss-friendly viewing

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

## 🔄 Working Flow (สำหรับ Agent ถัดไป)

### ลำดับการทำงานเมื่อรับช่วงต่อ:
1. **อ่าน HANDOFF.md (ไฟล์นี้)** เพื่อเข้าใจสถานะปัจจุบัน
2. **อ่าน SOUL.md + AGENTS.md** ใน workspace หลัก เพื่อเข้าใจ behavior rules
3. **Clone/pull repo** → `npm install` → `npm start` เพื่อรัน server
4. **ตรวจสอบ API** ผ่าน `/api/health` ก่อน
5. **ทำตาม TODO** ด้านล่าง หรือรับ brief จาก user

### สิ่งที่ต้องรู้ก่อนทำงาน:
- โค้ดสไตล์: CommonJS (`require`), Thai language API responses
- Database: SQLite sync API (`better-sqlite3`)
- Auth: JWT ใน httpOnly cookie, middleware: `authMiddleware` + `adminOnly`
- Admin: Single-page app ใช้ `showPage('page-name')` สลับ sections
- Site docs: Puppeteer ต้อง Chromium — ใช้ `headless: 'new'`
- ทุก route มี try-catch แล้ว — ไม่ควร crash

---

## 🐛 Bug Fix Log (2026-04-29 23:08)

### สิ่งที่แก้ไขแล้ว — ทั้งหมด 9 จุด

| # | Severity | Bug | Fix | File |
|---|----------|-----|-----|------|
| 1 | 🔴 Critical | Admin Leads API response format mismatch — `allLeads` เป็น object ไม่ใช่ array → crash ทั้ง dashboard | แก้ `loadAll()` ให้ดึง `.data` จาก paginated response | admin.js |
| 2 | 🔴 Critical | ไม่มีฟังก์ชัน renderReports, renderUsers, showAddUserModal, exportCSV, createBackup, generateSiteDocs, checkSiteDocs | เพิ่มฟังก์ชันครบ 11 ฟังก์ชัน + อัปเดต `showPage()` | admin.js |
| 3 | 🔴 Critical | Notifications form อ่าน/เขียนผิด key (`notifications` แทน `notification_settings`) | เปลี่ยน key + เพิ่ม Telegram/Auto-reply fields เต็มรูปแบบ | admin.js |
| 4 | 🟡 Medium | Forgot password คืน `reset_token` ใน response → ใครก็รีเซ็ตได้แค่รู้ email | ลบ token ออกจาก response | server.js |
| 5 | 🟡 Medium | CSV export — fields ไม่ escape → CSV injection risk | wrap ทุก field ด้วย `"` + escape `"` ภายใน | server.js |
| 6 | 🟡 Medium | `.gitignore` ไม่ครบ — `*.db-shm`, `*.db-wal`, `backups/` ถูก commit | เพิ่ม entries ครบ | .gitignore |
| 7 | 🟡 Medium | `supabase/config.js` มี hardcoded placeholder credentials | แทนด้วย legacy notice | supabase/config.js |
| 8 | 🟢 Minor | `first_contact_at` column ไม่ถูกตั้งค่าเลย | เพิ่ม logic ตั้งค่าเมื่อ status → "Contacted" | server.js |
| 9 | 🟢 Minor | Site Docs ไม่มี sidebar link ใน admin | เพิ่ม sidebar section | admin.html |

---

## ✅ สิ่งที่เสร็จแล้ว (Completed Features)

### 🔴 Security & Stability
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 1 | Change password (ต้องใส่รหัสเดิม) | server.js `PUT /api/auth/change-password` | ✅ |
| 2 | Forgot password (generate token, ไม่คืน token ให้ client) | server.js `POST /api/auth/forgot-password` | ✅ |
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
| 14 | Path traversal protection (media delete) | server.js `path.basename()` + `startsWith()` | ✅ |

### 🟡 Core Features
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 15 | LINE Notify integration | server.js `sendLineNotify()` | ✅ |
| 16 | Telegram Notify integration | server.js `sendTelegramNotify()` | ✅ |
| 17 | Notification settings (stored in DB, key: `notification_settings`) | server/migrations.js, admin.js | ✅ |
| 18 | Auto-reply system (LINE/SMS/Email templates) | server.js `checkAutoReply()` | ✅ |
| 19 | Status change notification (LINE + Telegram) | server.js `notifyLeadStatusChange()` | ✅ |
| 20 | first_contact_at auto-set on "Contacted" status | server.js `PUT /api/leads/:id` | ✅ |
| 21 | Lead duplicate detection (phone/email) | server.js `POST /api/leads` | ✅ |
| 22 | Force bypass duplicate (`?force=true`) | server.js | ✅ |
| 23 | Reports summary (monthly stats) | server.js `GET /api/reports/summary` | ✅ |
| 24 | Reports by service | server.js `GET /api/reports/by-service` | ✅ |
| 25 | Reports by date range | server.js `GET /api/reports/by-date` | ✅ |
| 26 | CSV export (UTF-8 BOM, all fields escaped) | server.js `GET /api/reports/export/csv` | ✅ |
| 27 | Multi-user roles (admin/manager/sales) | server.js, migrations.js | ✅ |
| 28 | Users CRUD (admin only) | server.js `GET/POST/PUT/DELETE /api/users` | ✅ |
| 29 | Role-based access (sales sees only assigned leads) | server.js GET /api/leads | ✅ |
| 30 | Self-delete protection | server.js DELETE /api/users/:id | ✅ |

### 🟢 Admin CMS (Frontend)
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 31 | Dashboard (stats, pipeline, recent bookings) | admin.js `renderDashboard()` | ✅ |
| 32 | CMS: Site Config (logo, contact, social) | admin.js `renderSiteConfigForm()` | ✅ |
| 33 | CMS: Hero Section | admin.js `renderHeroForm()` | ✅ |
| 34 | CMS: Services (repeatable items) | admin.js `renderServicesForm()` | ✅ |
| 35 | CMS: Process Steps | admin.js `renderProcessForm()` | ✅ |
| 36 | CMS: Portfolio | admin.js `renderPortfolioForm()` | ✅ |
| 37 | CMS: Testimonials | admin.js `renderTestimonialsForm()` | ✅ |
| 38 | CMS: Closing CTA | admin.js `renderClosingForm()` | ✅ |
| 39 | CMS: Footer | admin.js `renderFooterForm()` | ✅ |
| 40 | CMS: Navigation | admin.js `renderNavForm()` | ✅ |
| 41 | CMS: Notifications (LINE + Telegram + Auto-reply) | admin.js `renderNotificationsForm()` | ✅ |
| 42 | Leads Management (search, filter, modal edit, notes) | admin.js `renderLeads()` | ✅ |
| 43 | Bookings View | admin.js `renderBookings()` | ✅ |
| 44 | Media Library (upload, drag-drop, copy URL, delete) | admin.js `renderMedia()` | ✅ |
| 45 | Reports Page (summary, by-service, by-date) | admin.js `renderReports()` | ✅ |
| 46 | Users Page (list, add, edit, delete) | admin.js `renderUsers()` | ✅ |
| 47 | Site Docs Page (generate, status, view links) | admin.js `generateSiteDocs()` | ✅ |
| 48 | CSV Export button | admin.js `exportCSV()` | ✅ |
| 49 | Backup download button | admin.js `createBackup()` | ✅ |

### 🧱 Technical
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 50 | express-rate-limit (แทน in-memory Map) | package.json, server.js | ✅ |
| 51 | Database migrations system (6 migrations) | server/migrations.js | ✅ |
| 52 | Global error handler middleware | server.js | ✅ |
| 53 | Site Documentation Generator (Puppeteer) | scripts/site-docs.js | ✅ |
| 54 | Site docs API endpoint | server.js `/api/admin/generate-docs` | ✅ |
| 55 | Supabase legacy files marked | supabase/config.js | ✅ |

### 📄 Site Documentation Report (2026-04-30 Rewrite)
| # | Feature | Files | Status |
|---|---------|-------|--------|
| 56 | Site report rewrite — Thai font fix (Noto Sans Thai + Inter via Google Fonts) | site-docs/site-report.html | ✅ |
| 57 | Admin page deduplication (10 pages → only show active section, not all 16) | site-docs/site-report.html | ✅ |
| 58 | Hidden elements filter (visible: false excluded from display) | site-docs/site-report.html | ✅ |
| 59 | PDF export button + @media print CSS | site-docs/site-report.html | ✅ |
| 60 | Professional card-based layout (dark header, red accent, white cards) | site-docs/site-report.html | ✅ |
| 61 | Stats cards (pages, buttons, links, forms, errors) | site-docs/site-report.html | ✅ |
| 62 | Table of contents with clickable anchor links | site-docs/site-report.html | ✅ |
| 63 | Screenshot lightbox (click to zoom) | site-docs/site-report.html | ✅ |
| 64 | Form fields grouped by prefix, unnamed fields filtered | site-docs/site-report.html | ✅ |
| 65 | Admin summary cards with nav tab visualization | site-docs/site-report.html | ✅ |

---

## 📁 File Structure (Current)

```
nucha-construction-crm/
├── server.js                 ← Backend (Express + SQLite + ALL API routes) [~1200 lines]
├── server/
│   ├── db.js                 ← Database connection + schema + seed data
│   └── migrations.js         ← Schema versioning (6 migrations)
├── scripts/
│   ├── backup.js             ← Database backup utility
│   └── site-docs.js          ← Site documentation generator (Puppeteer)
├── utils/
│   └── validate.js           ← Input validation (phone, email, name, password, lead)
├── uploads/                  ← Image/file uploads
├── backups/                  ← Database backups (gitignored)
├── site-docs/                ← Generated site documentation
│   ├── site-report.html      ← Visual HTML report
│   ├── site-report.md        ← Markdown summary
│   ├── site-data.json        ← Raw structured data
│   └── screenshots/          ← Page screenshots
├── data/
│   └── nucha.db              ← SQLite database (auto-created, gitignored)
├── index.html                ← Landing page (dynamic, loaded via site-loader.js)
├── site-loader.js            ← Load content from API into index.html
├── script.js                 ← Frontend JS (GSAP animations, cursor, booking form)
├── style.css                 ← Frontend styles
├── admin.html                ← Admin CMS (dashboard, CMS editors, leads, reports, users, site-docs)
├── admin.js                  ← Admin CMS logic [~1200 lines, all functions complete]
├── admin.css                 ← Admin CMS styles
├── admin-login.html          ← Login page
├── service.html              ← Service detail page (public)
├── chat-widget.html          ← Chat widget (standalone)
├── chat-widget.js            ← Chat widget logic
├── supabase/                 ← LEGACY — not used (project uses SQLite)
│   ├── config.js             ← Marked as legacy
│   ├── auth.js               ← Supabase auth module (unused)
│   ├── crm.js                ← Supabase CRM module (unused)
│   └── functions/            ← Supabase edge functions (unused)
├── .env.example              ← Environment variables template
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── SALES-SCRIPT.md
└── HANDOFF.md                ← THIS FILE
```

---

## 🔌 API Endpoints (Complete — 40+ endpoints)

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | No | Login (rate limited: 5/min) |
| POST | /api/auth/logout | Yes | Logout |
| GET | /api/auth/me | Yes | Current user info |
| PUT | /api/auth/change-password | Yes | Change password (requires current) |
| POST | /api/auth/forgot-password | No | Generate reset token (console log only) |
| POST | /api/auth/reset-password | No | Reset password with token |

### Content (CMS)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/content | No | Get all content sections |
| GET | /api/content/:key | No | Get single section |
| PUT | /api/content/:key | Yes | Update section (admin) |

### Navigation
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/nav | No | Get nav items |
| PUT | /api/nav | Yes | Update nav items |

### Leads
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/leads | No | Create lead (rate limited, duplicate detection) |
| GET | /api/leads | Yes | List leads (filter, sort, paginate) — returns `{data, pagination}` |
| PUT | /api/leads/:id | Yes | Update lead (auto-sets first_contact_at) |
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
| POST | /api/leads/:id/attachments | Yes | Upload attachment (10MB limit) |
| DELETE | /api/attachments/:id | Yes | Delete attachment + file |

### Proposals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/proposals | Yes | List proposals with lead names |
| POST | /api/proposals | Yes | Create proposal (auto NP-XXXX number) |
| PUT | /api/proposals/:id | Yes | Update proposal |

### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/reports/summary | Yes | Monthly summary stats |
| GET | /api/reports/by-service | Yes | Leads grouped by service type |
| GET | /api/reports/by-date | Yes | Leads by date range |
| GET | /api/reports/export/csv | Yes | Export leads CSV (UTF-8 BOM, escaped) |

### Users (Admin Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/users | Yes+Admin | List users |
| POST | /api/users | Yes+Admin | Create user |
| PUT | /api/users/:id | Yes+Admin | Update user |
| DELETE | /api/users/:id | Yes+Admin | Delete user (self-delete blocked) |

### Media & Upload
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/upload | Yes | Upload image (5MB limit, images only) |
| GET | /api/media | Yes | List uploaded images |
| DELETE | /api/media/:name | Yes | Delete image (path traversal protected) |

### Site Documentation
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/admin/generate-docs | Yes+Admin | Generate site documentation (Puppeteer) |
| GET | /api/admin/docs-status | Yes+Admin | Check if docs exist |
| GET | /site-docs/* | Yes | Serve documentation files |

### Backup (Admin Only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/admin/backup | Yes+Admin | Create & download backup |
| GET | /api/admin/backups | Yes+Admin | List all backups |

### System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/health | No | Health check (uptime, db status) |
| POST | /api/test-notification | Yes | Test LINE/Telegram notification |
| GET | /api/stats | Yes | Dashboard statistics |
| GET | /api/pipeline | Yes | Pipeline view (6 stages) |
| GET | /api/activities | Yes | Activity log |
| GET | /api/followups | Yes | Pending follow-ups |

---

## ⚠️ สิ่งที่ต้องทำต่อ (TODO — เรียงตามลำดับความสำคัญ)

### 🔥 Priority 1 — ควรทำก่อน deploy
1. **เปลี่ยนรหัสผ่าน default** — `admin@nuchainnovation.com / admin123` ต้องเปลี่ยนทันที
2. **ตั้ง JWT_SECRET** ใน `.env` — ถ้าไม่ตั้งจะสุ่มใหม่ทุก restart → token หมดอายุ
3. **Deploy หลัง HTTPS** — ใช้ nginx reverse proxy + SSL (Let's Encrypt)
4. **LINE Notify Token** — ใส่ token จริงในหน้า Notifications settings

### 🟡 Priority 2 — เพิ่มประสิทธิภาพ
5. **Email Notifications** — เพิ่ม SMTP send จริง (ตอนนี้แค่ log console)
6. **Auto-reply จริง** — ส่ง SMS/LINE จริงแทนแค่ console.log
7. **Automated Backup Cron** — ตั้ง cron job backup อัตโนมัติทุกวัน
8. **Dashboard Charts** — กราฟ leads ตามเดือน, conversion funnel (ใช้ Chart.js)

### 🟢 Priority 3 — Features ใหม่
9. **Customer Portal** — ให้ลูกค้าเข้ามาดู progress โครงการ (login ด้วยเบอร์โทร + OTP)
10. **Proposal PDF Export** — สร้าง PDF จากใบเสนอราคา
11. **Lead Source Tracking** — เพิ่ม UTM parameters / source tracking
12. **Chat Widget AI Integration** — เชื่อม chat widget กับ AI API (PromptDee)

---

## 🔐 Security Notes

- **Default credentials:** admin@nuchainnovation.com / admin123 — **ต้องเปลี่ยนทันที** ก่อน deploy จริง
- **JWT_SECRET:** ถ้าไม่ตั้ง env var จะสุ่มใหม่ทุก restart → token หมดอายุ
- **HTTPS:** ต้อง deploy หลัง reverse proxy (nginx) ที่ terminate SSL
- **Rate limit:** In-memory → ไม่ survive restart / ไม่ work กับ multiple instances
- **Supabase files:** ใน `supabase/` เป็น legacy code ไม่ได้ใช้งาน — ระบบใช้ SQLite + Express

---

## 🚀 How to Run

```bash
# Install
npm install

# Start
npm start

# Access
# Website:  http://localhost:3000
# Login:    http://localhost:3000/login
# Admin:    http://localhost:3000/admin
# Health:   http://localhost:3000/api/health

# Generate Site Documentation (ต้อง Chromium)
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
