# HANDOFF.md — NUCHA Construction CRM

> อัพเดทล่าสุด: 2026-05-07 11:19 (GMT+8)

---

## 📋 สถานะปัจจุบัน

โปรเจคพร้อมใช้งานจริง (production-ready) สำหรับ landing page + CRM + CMS + Gallery + 3D Viewer + **Admin DB Services Management (เสร็จแล้ว)**

---

## ✅ สิ่งที่เสร็จแล้ว (Completed)

### Security Fixes (10 จุด)
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

### CMS Service Image Support
- เพิ่มช่อง `image_url` ใน admin CMS form บริการ (รองรับ URL + upload)
- เพิ่ม `uploadServiceImage()` function ใน `admin.js`
- เพิ่ม CSS `.image-upload-row` + `.image-preview` ใน `admin.css`
- `saveServices()` ส่ง `image_url` ไปเก็บใน CMS content

### Frontend Image Display (Service Cards แสดงรูปภาพจริง)
- **`site-loader.js`** — แสดงรูปจาก `image_url` แทน emoji icon ใน service cards
- **`server/db.js`** — เพิ่ม `image_url` ใน seed data ทั้ง 9 service items (site_content)
- **`index.html`** — fallback cards 9 ใบใส่รูป Unsplash ทุกใบ
- **`style.css`** — ปรับ `.service-card` เป็น card layout แบบมี cover image
- **`service.html`** — key mode + category mode ใช้ image_url จาก CMS/DB

### Server & API (40+ endpoints ทำงานปกติ)
- Auth, Leads CRUD, Pipeline, Reports, Chat, Services, Proposals, Notes, Activities
- ผ่าน test ทั้งหมด 48+ test cases

### Service Gallery System
- **DB Migration 011**: สร้างตาราง `service_gallery`
- **DB Migration 013**: Seed รูปภาพตัวอย่าง 39 รูป จาก Unsplash ครบทุกหมวดบริการ
- **API Endpoints**:
  - `GET /api/services/:id/gallery` — ดึงรูป gallery ของบริการ
  - `GET /api/gallery/category/:category` — ดึงรูปตามหมวดหมู่
  - `POST /api/services/:id/gallery` — เพิ่มรูป (auth required)
  - `DELETE /api/gallery/:id` — ลบรูป (auth required)
- **Frontend**: Gallery grid + Lightbox (fullscreen, navigate, thumbnails)

### 3D Model Viewer System
- **DB Migration 012**: สร้างตาราง `service_models`
- **API Endpoints**:
  - `GET /api/services/:id/models` — ดึงโมเดล 3D
  - `GET /api/models/category/:category` — ดึงโมเดลตามหมวด
  - `POST /api/services/:id/models` — เพิ่มโมเดล (auth required)
- **Frontend**: Google `<model-viewer>` Web Component (v3.5.0)

### 🆕 Admin DB Services Management (2026-05-07) — เสร็จสมบูรณ์
สิ่งที่ก่อนหน้ามีแค่ sidebar link ไม่มีหน้าจริง → ตอนนี้สร้างครบทั้ง 3 ส่วน:

#### 1. Server API (`server.js`) — 8 endpoints ใหม่
| Method | Endpoint | ฟังก์ชัน |
|--------|----------|----------|
| GET | `/api/admin/services` | รายการ services (filter by category/search/active, pagination) |
| POST | `/api/admin/services` | สร้าง service ใหม่ |
| PUT | `/api/admin/services/:id` | แก้ไข service (ทุก field) |
| DELETE | `/api/admin/services/:id` | ลบ service (+ cascade ลบ gallery + models) |
| GET | `/api/admin/service-packages` | รายการแพ็กเกจทั้งหมด |
| POST | `/api/admin/service-packages` | สร้างแพ็กเกจใหม่ |
| PUT | `/api/admin/service-packages/:id` | แก้ไขแพ็กเกจ |
| DELETE | `/api/admin/service-packages/:id` | ลบแพ็กเกจ |

- ทุก endpoint ใช้ `authMiddleware` + `adminOnly` (ต้อง login เป็น admin)
- Services: รองรับ filter ตาม category, search ชื่อ/รายละเอียด, filter is_active
- Packages: features เก็บเป็น JSON array, รองรับ is_featured flag

#### 2. Admin HTML (`admin.html`) — หน้า `page-db-services`
- **Tabs**: สลับระหว่าง "บริการ" กับ "แพ็กเกจ"
- **Services tab**: ตาราง + search + category filter + active filter + ปุ่มเพิ่ม
- **Packages tab**: ตาราง + ปุ่มเพิ่ม
- **Action buttons**: แก้ไข, เปิด/ปิดใช้, ลบ
- **Badge counts**: แสดงจำนวน services + packages ใน sidebar

#### 3. Admin JS (`admin.js`) — ~200 บรรทัด
- `loadDbServices()` — โหลดข้อมูลจาก API พร้อม categories
- `renderDbServices()` — render ตาราง services (filter + search)
- `renderDbPackages()` — render ตาราง packages
- `showAddServiceModal()` — modal สร้าง service ใหม่ (category dropdown + new category input)
- `editDbService()` / `saveDbService()` — แก้ไข service
- `toggleServiceActive()` — เปิด/ปิดใช้ service
- `deleteDbService()` — ลบ service (confirm dialog)
- `showAddPackageModal()` / `editDbPackage()` / `saveDbPackage()` / `deleteDbPackage()` — CRUD packages
- `switchDbTab()` — สลับ tabs
- Hook เข้า `showPage()` — โหลดข้อมูลอัตโนมัติเมื่อเข้าหน้า
- Pre-load ใน `loadAll()` — badge counts แสดงตั้งแต่เปิด admin

---

## ❌ สิ่งที่ยังไม่เสร็จ (TODO)

### 🟡 ควรทำ

1. **Admin Gallery/Models Management UI**
   - API endpoints สำหรับ gallery + models มีแล้ว
   - แต่ยังไม่มี admin UI สำหรับจัดการรูป gallery + โมเดล 3D ของแต่ละบริการ
   - ต้องเพิ่มใน admin.html + admin.js (คล้าย pattern ของ DB Services page)

2. **3D Model Seed Data**
   - ตาราง `service_models` สร้างแล้ว แต่ยังไม่มีข้อมูล
   - ต้องหา/สร้างไฟล์ .glb ตัวอย่าง

3. **service.html feature cards — hardcoded 5 ชุด**
   - `featureSets` object มีแค่ 5 keys: construction, builtin, design, decoration, project-management
   - อีก 4 บริการ (signage, landscape, drafting, visualization) ไม่มี feature cards
   - ควรเปลี่ยนไปดึงจาก DB หรือ CMS แทน hardcode

4. **services.html — แสดง images จาก DB**
   - ตอนนี้ใช้ `meta.icon` (emoji) สำหรับ category cards
   - ควรแสดง `image_url` จาก DB service เป็น card background/thumbnail

5. **Pre-fill booking form จาก service page**
   - CTA "จองคิวปรึกษาฟรี" ไปหน้า `/` แบบ generic
   - ควรส่ง `?service=xxx` ไป pre-select ใน form

### 🟢 Nice to Have

6. **Rate limit admin login** — แยก admin กับ public
7. **CSRF protection** — ยังไม่มี
8. **Audit log** — บันทึก admin actions เพิ่มเติม
9. **Export PDF** — สำหรับ proposals

---

## 🏗️ Architecture

```
server.js           — Express 5 backend, 45+ API endpoints
server/db.js        — SQLite (better-sqlite3), schema + seed data (58 services, 7 packages)
server/migrations.js — 13 migrations (001-013)
utils/validate.js   — Input validation (phone, email, name, password, lead)
scripts/backup.js   — DB backup script
site-loader.js      — Dynamic content loader (CMS → frontend)
admin.js            — Admin CMS logic + DB Services management
admin.html          — Admin panel (16+ pages including db-services)
index.html          — Landing page (dynamic via site-loader.js)
service.html        — Service detail page (gallery + 3D viewer)
services.html       — Services overview (DB categories)
chat-widget.js/html — Customer chat widget
nucha-services/     — Service catalog docs, seed SQL, quotation templates
```

### Database Tables
```
users               — Admin users (email, password, role)
site_content        — CMS content (JSON per section_key)
leads               — Customer leads (name, phone, email, service_type, status, score...)
notes               — Lead notes + follow-up
activities          — Activity log
proposals           — Quotation proposals
nav_items           — Navigation menu items
footer_links        — Footer links
gallery             — General gallery (legacy, ใช้ service_gallery แทน)
services            — DB services (58 items, 9 categories) ← 🆕 admin CRUD ครบแล้ว
service_packages    — Service packages (7 items) ← 🆕 admin CRUD ครบแล้ว
service_gallery     — Gallery images per service (39 seed items)
service_models      — 3D models per service (ยังไม่มี seed data)
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
- Frontend: HTML/CSS/JS + GSAP animations + Google model-viewer (3D)
- Backend: Node.js + Express 5
- Database: SQLite (better-sqlite3)
- Auth: JWT + bcryptjs (cookie-based, HttpOnly, SameSite=Strict)
- Upload: Multer

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
  - แก้ได้: Hero, Services, Portfolio, Footer, Navbar, ฯลฯ
  - อัปโหลดรูป: POST /api/upload → ได้ URL → ใส่ใน content
```

### 3. 🆕 Admin DB Services Flow
```
admin.html → showPage('db-services') → loadDbServices()
  → GET /api/admin/services → แสดงตาราง (58 items, 9 categories)
  → GET /api/admin/service-packages → แสดงตาราง (7 items)

เพิ่มบริการ: showAddServiceModal() → POST /api/admin/services → reload
แก้ไข: editDbService(id) → form modal → PUT /api/admin/services/:id → reload
เปิด/ปิด: toggleServiceActive(id, 0|1) → PUT /api/admin/services/:id → reload
ลบ: deleteDbService(id) → confirm → DELETE /api/admin/services/:id → reload

แพ็กเกจ: เหมือนกัน ใช้ /api/admin/service-packages endpoints
```

### 4. Lead Flow
```
Landing page booking form → POST /api/leads → SQLite
Admin: GET /api/leads → list/filter/search → update status → pipeline view
```

### 5. Chat Flow
```
chat-widget.html → customer ส่งข้อความ → POST /api/chat
Admin: GET /api/chat → reply → real-time polling
```

### 6. Service Detail Page Flow
```
เข้า /service?key=construction (CMS mode)
  → fetch /api/content → หา service items → แสดง hero + features + portfolio
  → fetch /api/services (DB) → หา service ที่ชื่อตรง → ดึง gallery + models

เข้า /service?category=สถาปัตยกรรม (DB mode)
  → fetch /api/services → filter ตาม category → แสดง sub-services
  → fetch /api/gallery/category/สถาปัตยกรรม → แสดง gallery
```

---

## 📝 API Endpoints ทั้งหมด (45+)

### Auth
- `POST /api/auth/login` — Login (rate limited 5/นาที)
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user
- `PUT /api/auth/change-password` — เปลี่ยนรหัสผ่าน
- `POST /api/auth/forgot-password` — ลืมรหัสผ่าน
- `POST /api/auth/reset-password` — รีเซ็ตรหัสผ่าน

### Content (CMS)
- `GET /api/content` — All content
- `GET /api/content/:key` — Section content
- `PUT /api/content/:key` — Update section (auth)

### Navigation
- `GET /api/nav` — Nav items
- `PUT /api/nav` — Update nav (auth)

### Leads
- `GET /api/leads` — List leads (auth, filter/sort/pagination)
- `POST /api/leads` — Create lead (rate limited, duplicate detection)
- `PUT /api/leads/:id` — Update lead (auth)
- `DELETE /api/leads/:id` — Delete lead (auth)
- `POST /api/leads/bulk-update` — Bulk update (auth)
- `POST /api/leads/bulk-delete` — Bulk delete (auth)
- `GET /api/leads/:id/attachments` — Lead attachments (auth)
- `POST /api/leads/:id/attachments` — Upload attachment (auth)
- `DELETE /api/attachments/:id` — Delete attachment (auth)
- `GET /api/leads/:id/notes` — Lead notes (auth)
- `POST /api/leads/:id/notes` — Add note (auth)
- `PUT /api/notes/:id` — Update note (auth)

### Activities & Follow-ups
- `GET /api/activities` — Activity log (auth)
- `GET /api/followups` — Pending follow-ups (auth)

### Proposals
- `GET /api/proposals` — List proposals (auth)
- `POST /api/proposals` — Create proposal (auth)
- `PUT /api/proposals/:id` — Update proposal (auth)
- `DELETE /api/proposals/:id` — Delete proposal (auth)

### Dashboard & Reports
- `GET /api/stats` — Dashboard stats (auth)
- `GET /api/pipeline` — Pipeline view (auth)
- `GET /api/reports/summary` — Report summary (auth)
- `GET /api/reports/export/csv` — CSV export (auth)
- `GET /api/reports/by-service` — Report by service (auth)
- `GET /api/reports/by-date` — Report by date (auth)

### Services (Public)
- `GET /api/services` — All active services
- `GET /api/services/:id` — Service detail
- `GET /api/services/categories` — Service categories
- `GET /api/services/:id/gallery` — Service gallery
- `GET /api/gallery/category/:category` — Gallery by category
- `GET /api/services/:id/models` — Service 3D models
- `GET /api/models/category/:category` — Models by category
- `GET /api/service-packages` — All packages
- `GET /api/service-packages/:id` — Package detail

### 🆕 Services Admin (CRUD)
- `GET /api/admin/services` — List services (auth+admin, filter/search/pagination)
- `POST /api/admin/services` — Create service (auth+admin)
- `PUT /api/admin/services/:id` — Update service (auth+admin)
- `DELETE /api/admin/services/:id` — Delete service (auth+admin, cascade gallery+models)
- `GET /api/admin/service-packages` — List packages (auth+admin)
- `POST /api/admin/service-packages` — Create package (auth+admin)
- `PUT /api/admin/service-packages/:id` — Update package (auth+admin)
- `DELETE /api/admin/service-packages/:id` — Delete package (auth+admin)

### Gallery & Models (Admin)
- `POST /api/services/:id/gallery` — Add gallery image (auth)
- `DELETE /api/gallery/:id` — Delete gallery image (auth)
- `POST /api/services/:id/models` — Add 3D model (auth)

### Chat
- `POST /api/chat/messages` — Customer message (rate limited)
- `GET /api/chat/messages/:session_id` — Get messages
- `GET /api/chat/sessions` — Admin: all sessions (auth)
- `POST /api/chat/sessions/:session_id` — Admin: reply (auth)
- `DELETE /api/chat/sessions/:session_id` — Admin: delete session (auth)
- `POST /api/chat/sessions/bulk-delete` — Admin: bulk delete (auth)
- `PUT /api/chat/sessions/:session_id/read` — Admin: mark read (auth)
- `GET /api/chat/unread-count` — Admin: unread count (auth)

### Users (Admin)
- `GET /api/users` — List users (auth+admin)
- `POST /api/users` — Create user (auth+admin)
- `PUT /api/users/:id` — Update user (auth+admin)
- `DELETE /api/users/:id` — Delete user (auth+admin)

### System
- `GET /api/health` — Health check
- `POST /api/upload` — Image upload (auth)
- `GET /api/media` — Media library (auth)
- `DELETE /api/media/:name` — Delete media (auth)
- `POST /api/test-notification` — Test notification (auth)
- `GET /api/admin/backup` — Download backup (auth+admin)
- `GET /api/admin/backups` — List backups (auth+admin)
- `POST /api/admin/generate-docs` — Generate site docs (auth+admin)
- `GET /api/admin/docs-status` — Docs status (auth+admin)

---

## 📝 Notes สำหรับ Agent ถัดไป

### สิ่งที่ทำวันนี้ (2026-05-07)

**Admin DB Services Management — สร้างเสร็จสมบูรณ์:**
- แก้ปัญหา: sidebar link "📦 บริการ (DB)" มีแต่ไม่มีหน้าจริง (ไม่มี HTML section, ไม่มี JS logic, ไม่มี admin API)
- สร้าง 8 admin API endpoints สำหรับ CRUD services + packages
- สร้าง HTML page section พร้อม tabs (services/packages), tables, filters, search
- สร้าง JS functions ~200 บรรทัด: load, render, create, edit, toggle active, delete
- ผ่าน test 18 cases ทั้งหมด

**ปัญหาที่พบและแก้แล้ว:**
- SQLite DB corruption (SQLITE_IOERR_SHORT_READ) — เกิดจาก `rm data/nucha.db` ตอน DB ยังเปิดอยู่ → แก้โดย kill server ก่อนลบ
- Cookie expiration — ระหว่างทดสอบ server restart ทำให้ cookie หมดอายุ → ต้อง re-login ทุกครั้งหลัง restart

### สิ่งที่ต้องทำต่อ (เรียงตาม priority)

1. **Admin Gallery/Models UI** — API มีแล้ว ต้องทำ admin UI จัดการรูป + โมเดล (ใช้ pattern เดียวกับ DB Services page)
2. **3D Model seed data** — หาไฟล์ .glb ตัวอย่าง
3. **Feature cards จาก DB** — แทน hardcode 5 ชุดใน service.html
4. **services.html images** — แสดงรูปจาก DB ใน category cards
5. **Pre-fill booking form** — ส่ง ?service=xxx จาก service page
