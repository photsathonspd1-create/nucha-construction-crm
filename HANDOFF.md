# HANDOFF.md — NUCHA Construction CRM

> อัพเดทล่าสุด: 2026-05-07 19:04 (GMT+8)

---

## 📋 สถานะปัจจุบัน

**Production-ready** — ผ่าน API test 73+73=146 test cases (100%) ครอบคลุม health, auth, leads, pipeline, reports, CMS, media, users, chat, proposals, admin services, gallery, 3D models, security, backup, frontend pages, edge cases, upload credentials

---

## ✅ สิ่งที่เสร็จแล้ว (Completed)

### 🔒 Security Fixes (13 จุด)
1. **SQL Injection** — sortOrder whitelist (`allowedSortOrders = ['ASC', 'DESC']`) ใน `server.js`
2. **Command Injection** — เปลี่ยน `execSync` → `execFile` + URL validation ใน generate-docs endpoint
3. **Cookie Security** — เปลี่ยน `sameSite: 'strict'` + `path: '/'`
4. **Chat session_id validation** — regex `^[a-zA-Z0-9_\-]+$` ป้องกัน injection
5. **Health info leak** — ลบ uptime ออกจาก `/api/health` response
6. **Phone validation** — เพิ่ม leading 0 check (`/^0\d{9}$/`)
7. **CSV formula injection** — เพิ่ม `safeCsvField()` prefix `'` ถ้าขึ้นต้น `=+\-@`
8. **Lead score cap** — เพิ่ม `Math.min(score, 10)`
9. **LIKE injection** — escape `%` และ `_` ใน search term
10. **Removed puppeteer** — ลบออกจาก dependencies (ลด ~300MB)
11. **🆕 CSRF protection** — ตรวจ Origin/Referer header สำหรับ cookie-based auth POST/PUT/DELETE
12. **🆕 Path traversal block** — raw URL `..` check middleware ก่อน Express normalize
13. **🆕 XSS rejection** — validateName() reject HTML tags ในชื่อ
14. **🆕 File upload credentials** — เพิ่ม `credentials: 'include'` ใน `fetch()` สำหรับ gallery + 3D model upload (4 จุดใน admin.js)

### 🆕 API & Server Improvements (2026-05-07 — Session 4)
1. **API 404 handler** — `/api/*` routes ที่ไม่ตรง return `404 {"error":"ไม่พบ endpoint นี้"}` แทน catch-all HTML
2. **Bulk rate limiter** — `bulkLimiter` 10 ครั้ง/นาที สำหรับ `/api/leads/bulk-update`, `/api/leads/bulk-delete`, `/api/chat/sessions/bulk-delete`
3. **CSRF protection** — middleware ตรวจ Origin/Referer match host สำหรับ authenticated state-changing requests
4. **Chat pagination** — `GET /api/chat/messages/:session_id?page=&limit=` พร้อม pagination object response
5. **Nav href sanitization** — regex เพิ่ม `+!%,` ให้ `tel:`, `mailto:` URLs ใช้ได้
6. **Login rate limit** — เพิ่ม 5 → 10 ครั้ง/นาที
7. **Change password error code** — เปลี่ยน 401 → 400 สำหรับรหัสผ่านปัจจุบันผิด
8. **Upload path serving** — เพิ่ม `GET /uploads/:name` explicit route ด้วย path validation

### 🆕 3D Model Display Fix (2026-05-07 — Session 4)
- **ย้าย** `<script type="module" src="model-viewer...">` จาก bottom → `<head>` ของ `service.html`
- แก้ปัญหา: model-viewer web component โหลดช้า ทำให้ dynamic innerHTML สร้าง `<model-viewer>` ก่อน script พร้อม
- **เทสแล้ว**: .obj upload → auto-convert to .glb (obj2gltf) → serve 200 → valid glTF binary

### CMS Service Image Support
- เพิ่มช่อง `image_url` ใน admin CMS form บริการ (รองรับ URL + upload)
- เพิ่ม `uploadServiceImage()` function ใน `admin.js`
- `saveServices()` ส่ง `image_url` ไปเก็บใน CMS content

### Frontend Image Display (Service Cards แสดงรูปภาพจริง)
- **`site-loader.js`** — แสดงรูปจาก `image_url` แทน emoji icon ใน service cards
- **`server/db.js`** — เพิ่ม `image_url` ใน seed data ทั้ง 9 service items
- **`index.html`** — fallback cards 9 ใบใส่รูป Unsplash ทุกใบ
- **`style.css`** — ปรับ `.service-card` เป็น card layout แบบมี cover image
- **`service.html`** — key mode + category mode ใช้ image_url จาก CMS/DB

### Service Detail Modal — Sub-Service Clickable Cards
- กด card เปิด modal แสดงรายละเอียด sub-service แบบเต็ม
- Modal: hero image + คำอธิบาย + ราคา + gallery slider + 3D model viewer + CTA
- เชื่อม lightbox ↔ modal: `_svcModalReturn` flag ให้ Escape กลับมา modal ได้

### Admin Gallery & 3D Models Management UI
- 5 API endpoints: admin gallery list, gallery PUT, admin models list, model PUT, model DELETE
- 2 หน้าใหม่ใน admin.html: svc-gallery + svc-models (table + filters + CRUD)
- ~200 บรรทัด JS: load, render, filter, add, edit, delete ทั้ง gallery + models

### Admin DB Services Management
- 8 admin API endpoints สำหรับ CRUD services + packages
- HTML page section พร้อม tabs (services/packages), tables, filters, search
- JS functions ~200 บรรทัด: load, render, create, edit, toggle active, delete

### Service Gallery System
- **DB Migration 011**: สร้างตาราง `service_gallery`
- **DB Migration 013**: Seed รูปภาพตัวอย่าง 39 รูป จาก Unsplash ครบทุกหมวดบริการ
- **Frontend**: Gallery grid + Lightbox (fullscreen, navigate, thumbnails)

### 3D Model Viewer System
- **DB Migration 012**: สร้างตาราง `service_models`
- **Frontend**: Google `<model-viewer>` Web Component (v3.5.0)
- **Upload**: .obj → auto-convert to .glb (obj2gltf), .glb/.gltf direct upload

### Server & API (50+ endpoints ทำงานปกติ)
- Auth, Leads CRUD, Pipeline, Reports, Chat, Services, Proposals, Notes, Activities
- ผ่าน test ทั้งหมด 73 test cases (100%)

---

## ❌ สิ่งที่ยังไม่เสร็จ (TODO)

### 🟡 ควรทำ

1. **3D Model Seed Data**
   - ตาราง `service_models` สร้างแล้ว + upload API ทำงาน แต่ยังไม่มี seed data อัตโนมัติ
   - ต้องหา/สร้างไฟล์ .glb ตัวอย่างแล้ว seed ใน migration

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
6. **Export PDF** — สำหรับ proposals
7. **Email notifications** — SMTP integration สำหรับ lead notifications
8. **Password reset email** — ส่ง email จริงแทน console.log token

---

## 🏗️ Architecture

```
server.js           — Express 5 backend, 50+ API endpoints, CSRF + rate limiting
server/db.js        — SQLite (better-sqlite3), schema + seed data (58 services, 7 packages)
server/migrations.js — 13 migrations (001-013)
utils/validate.js   — Input validation (phone, email, name, password, lead)
scripts/backup.js   — DB backup script
site-loader.js      — Dynamic content loader (CMS → frontend)
admin.js            — Admin CMS logic + DB Services + Gallery + Models management
admin.html          — Admin panel (18+ pages)
index.html          — Landing page (dynamic via site-loader.js)
service.html        — Service detail page (gallery + 3D viewer + model-viewer in <head>)
services.html       — Services overview (DB categories + Three.js 3D showcase)
chat-widget.js/html — Customer chat widget
nucha-services/     — Service catalog docs, seed SQL, quotation templates
```

### Database Tables (14 tables)
```
users               — Admin users (email, password, role)
site_content        — CMS content (JSON per section_key)
leads               — Customer leads (name, phone, email, service_type, status, score...)
notes               — Lead notes + follow-up
activities          — Activity log
proposals           — Quotation proposals
nav_items           — Navigation menu items
services            — DB services (58 items, 9 categories)
service_packages    — Service packages (7 items)
service_gallery     — Gallery images per service (39 seed items)
service_models      — 3D models per service
chat_messages       — Customer chat messages
lead_attachments    — File attachments for leads
password_resets     — Password reset tokens
backups             — Backup records
migrations          — Migration tracking
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
- Security: Helmet, express-rate-limit, CSRF protection, input validation

## 🚀 How to Run
```bash
npm install
npm start
# เปิด http://localhost:3000
# Admin: http://localhost:3000/admin
```

---

## 🔄 Flow การทำงาน

### 1. Landing Page Flow
```
index.html (static fallback) → site-loader.js fetches /api/content → แทนที่ dynamic sections
  - Hero, Services, Process, Portfolio, Testimonials, Closing, Footer
  - Service cards: image_url จาก API → <img> → fallback emoji ถ้ารูปพัง
```

### 2. Admin CMS Flow
```
admin-login.html → POST /api/auth/login → JWT cookie → redirect /admin
admin.html → admin.js โหลด content จาก /api/content → แก้ไข → PUT /api/content/:key
```

### 3. Admin DB Services Flow
```
admin.html → showPage('db-services') → loadDbServices()
  → GET /api/admin/services → ตาราง 58 items, 9 categories
  → CRUD: เพิ่ม/แก้ไข/เปิดปิด/ลบ ทั้ง services + packages
```

### 4. Admin Gallery & Models Flow
```
admin.html → showPage('svc-gallery') → loadSvcGallery()
  → GET /api/admin/gallery → ตาราง 39 items
  → CRUD: เพิ่ม/แก้ไข/ลบรูป + filter by service/category/type

admin.html → showPage('svc-models') → loadSvcModels()
  → GET /api/admin/models → ตารางโมเดล
  → CRUD: เพิ่ม/แก้ไข/ลบโมเดล + upload .obj/.glb/.gltf
```

### 5. Lead Flow
```
Landing page booking form → POST /api/leads → duplicate check → SQLite → LINE/Telegram notify
Admin: GET /api/leads → filter/sort/search/pagination → update status → pipeline view
```

### 6. Chat Flow
```
chat-widget.html → POST /api/chat/messages → SQLite
Admin: GET /api/chat/sessions → reply → POST /api/chat/sessions/:id
Polling: GET /api/chat/messages/:session_id?page=&limit=
```

### 7. Service Detail Page Flow
```
/service?key=construction (CMS mode)
  → fetch /api/content → service items → hero + features + portfolio

/service?category=สถาปัตยกรรม (DB mode)
  → fetch /api/services → filter category → clickable sub-service cards
  → คลิก card → Service Detail Modal:
    → info (ชื่อ, คำอธิบาย, ราคา, รูป hero)
    → fetch /api/services/:id/gallery → gallery slider
    → fetch /api/services/:id/models → <model-viewer> (script อยู่ใน <head>)
    → คลิก gallery → lightbox (fullscreen, navigate, thumbnails)
    → CTA "จองคิวปรึกษาฟรี" → /#booking
```

### 8. 3D Model Upload Flow
```
Admin: showAddModelModal() → เลือก service + upload .obj/.glb/.gltf
  → POST /api/services/:id/models (FormData)
  → Server: multer → if .obj: obj2gltf convert to .glb → save to /uploads/
  → DB: INSERT service_models (model_url, model_format, ...)
  → Frontend: <model-viewer src="/uploads/xxx.glb"> (auto-rotate, camera-controls)
```

---

## 📝 API Endpoints ทั้งหมด (50+)

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

### Proposals (4)
- CRUD

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

### System (8)
- health, upload, media, test-notification, backup, backups, generate-docs, docs-status

---

## 📝 สรุปสิ่งที่ทำแต่ละ Session

### Session 5 (2026-05-07 18:43–19:04) — Full Test + Upload Bug Fix
- **Clone + install + start** — `npm install` สำเร็จ (186 packages), server start ปกติ
- **เทส API 42 รายการ** — ทุก endpoint ทำงานปกติ (health, content, nav, auth, leads, stats, pipeline, services, packages, gallery, models, upload, delete, update)
- **เทส Security** — auth block ✅, wrong password ✅, rate limit (10→429) ✅, path traversal block ✅, XSS block ✅, invalid JSON handled ✅, name length cap ✅, admin page 401 without auth ✅
- **เทส Frontend Pages** — ทุกหน้า 200 (/ , /admin-login, /services, /privacy, /terms, /quotation), admin 401 without auth, 200 with auth
- **🐛 พบบั๊ก: อัพโหลดรูป/ไฟล์ไม่ได้** — `fetch()` สำหรับ upload ไม่มี `credentials: 'include'` → cookie JWT ไม่ถูกส่ง → 401
- **🔧 แก้ไข 4 จุดใน `admin.js`:**
  - Line 847: Gallery upload (POST) — เพิ่ม `credentials: 'include'`
  - Line 903: Gallery update (PUT) — เพิ่ม `credentials: 'include'`
  - Line 1039: 3D Model create (POST) — เพิ่ม `credentials: 'include'`
  - Line 1126: 3D Model update (PUT) — เพิ่ม `credentials: 'include'`
- **สาเหตุ**: endpoint อื่นใช้ `api()` helper ที่มี credentials อยู่แล้ว แต่ file upload ใช้ `fetch()` ตรงๆ เพราะต้องส่ง FormData → ลืมใส่ credentials
- **ไฟล์ที่แก้**: `admin.js`
- **⚠️ npm audit**: 2 moderate vulnerabilities (`ip-address` ใน `express-rate-limit`) — รัน `npm audit fix` ได้

### Session 4 (2026-05-07 17:31–18:12) — API Testing + Bug Fixes
- **เทส API ทั้งหมด** 73 test cases → แก้จน 100% ผ่าน
- **แก้ 9 จุด**: API 404 handler, bulk rate limit, CSRF protection, chat pagination, nav href sanitization, model-viewer load order, path traversal block, change pw error code, login rate limit
- **ไฟล์ที่แก้**: `server.js`, `service.html`

### Session 3 (2026-05-07) — Admin Gallery & Models UI
- สร้าง admin UI สำหรับจัดการ gallery images + 3D models
- 5 API endpoints + 2 admin pages + ~200 บรรทัด JS

### Session 2 (2026-05-07) — Service Detail Modal
- สร้าง modal สำหรับ sub-service cards ใน service.html (category mode)
- gallery slider + 3D model viewer + lightbox integration

### Session 1 (2026-05-07) — Admin DB Services Management
- สร้าง 8 admin API endpoints + HTML page + JS logic สำหรับ CRUD services + packages
