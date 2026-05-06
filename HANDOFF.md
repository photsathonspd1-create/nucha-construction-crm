# HANDOFF.md — NUCHA Construction CRM

> อัพเดทล่าสุด: 2026-05-06 16:44 (GMT+8)

---

## 📋 สถานะปัจจุบัน

โปรเจคพร้อมใช้งานจริง (production-ready) สำหรับ landing page + CRM พื้นฐาน + CMS แก้ไขเว็บ

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
  - `<img>` พร้อม `onload` → เพิ่ม class `loaded` → ซ่อน emoji fallback
  - `onerror` → ซ่อนรูป แสดง emoji fallback แทน
- **`server/db.js`** — เพิ่ม `image_url` ใน seed data ทั้ง 9 service items (site_content)
- **`index.html`** — fallback cards 9 ใบใส่รูป Unsplash ทุกใบ (ไม่ใช่ emoji ล้วน)
- **`style.css`** — ปรับ `.service-card` เป็น flex column:
  - `.service-icon` → 200px สูง, cover image, zoom on hover
  - `.service-card-body` → padding, flex-grow
  - `.emoji-fallback` → แสดงเมื่อรูปโหลดไม่ได้
- **`service.html`** — key mode: ใช้ `image_url` เป็น hero icon + hero image
- **`service.html`** — category mode: แสดงรูปจาก DB services ใน hero + feature cards

### Admin DB Services Page (เพิ่ม sidebar link แล้ว)
- เพิ่ม sidebar link "📦 บริการ (DB)" ใน `admin.html`

### Server & API (ทั้งหมดทำงานปกติ)
- 35 API endpoints ผ่าน test ทั้งหมด
- Auth, Leads CRUD, Pipeline, Reports, Chat, Services, Proposals, Notes, Activities

---

## ❌ สิ่งที่ยังไม่เสร็จ (TODO)

### 🔴 สำคัญ — ต้องทำต่อ

1. **Admin DB Services Page — ยังไม่มี page section + JS logic**
   - เพิ่ม sidebar link แล้ว แต่ยังไม่มี `<div id="page-db-services">` ใน `admin.html`
   - ต้องเพิ่ม HTML page section สำหรับจัดการ 58 DB services
   - ต้องเพิ่ม JS functions: `renderDbServices()`, `editDbService()`, `saveDbService()`, `deleteDbService()`
   - ต้องมี: list view, add/edit form (name, category, description, price_start, price_unit, icon, image_url, sort_order, is_active), delete, filter by category
   - API endpoints ที่มีแล้ว: `GET /api/services` + `GET /api/services/:id` (แต่ยังไม่มี POST/PUT/DELETE — ต้องเพิ่มใน server.js)

2. **API สำหรับ DB Services CRUD — ยังไม่ครบ**
   - `GET /api/services` ✅ (มีแล้ว)
   - `GET /api/services/:id` ✅ (มีแล้ว)
   - `POST /api/services` ❌ (ยังไม่มี — ต้องเพิ่ม)
   - `PUT /api/services/:id` ❌ (ยังไม่มี — ต้องเพิ่ม)
   - `DELETE /api/services/:id` ❌ (ยังไม่มี — ต้องเพิ่ม)

3. **service.html feature cards — hardcoded 5 ชุด**
   - `featureSets` object มีแค่ 5 keys: construction, builtin, design, decoration, project-management
   - อีก 4 บริการ (signage, landscape, drafting, visualization) ไม่มี feature cards
   - ควรเปลี่ยนไปดึงจาก DB หรือ CMS แทน hardcode

### 🟡 ควรทำ

4. **services.html — แสดง images จาก DB**
   - ตอนนี้ใช้ `meta.icon` (emoji) สำหรับ category cards
   - ควรแสดง `image_url` จาก DB service เป็น card background/thumbnail

5. **Admin: จัดการ Service Packages**
   - DB มี `service_packages` table (7 packages) แต่ไม่มี admin UI จัดการ

### 🟢 Nice to Have

6. **Rate limit admin login** — ตอนนี้ 5 ครั้ง/นาที ทั้งหมด ควรแยก admin กับ public
7. **CSRF protection** — ยังไม่มี
8. **Audit log** — บันทึก admin actions เพิ่มเติม
9. **Export PDF** — สำหรับ proposals

---

## 🏗️ Architecture

```
server.js           — Express 5 backend, 35+ API endpoints
server/db.js        — SQLite (better-sqlite3), schema + seed data (58 services, 7 packages)
server/migrations.js — 10 migrations
utils/validate.js   — Input validation (phone, email, name, password, lead)
scripts/backup.js   — DB backup script
site-loader.js      — Dynamic content loader (CMS → frontend)
admin.js            — Admin CMS logic
admin.html          — Admin panel (15+ pages)
index.html          — Landing page (dynamic via site-loader.js)
service.html        — Service detail page (2 modes: key/category)
services.html       — Services overview (DB categories)
chat-widget.js/html — Customer chat widget
nucha-services/     — Service catalog docs, seed SQL, quotation templates
```

## 🔑 Default Credentials
- **Admin:** admin@nuchainnovation.com / admin123
- ⚠️ **เปลี่ยนรหัสผ่านก่อน deploy จริง!**

## 📦 Tech Stack
- Frontend: HTML/CSS/JS + GSAP animations
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

### 3. Lead Flow
```
Landing page booking form → POST /api/leads → SQLite
Admin: GET /api/leads → list/filter/search → update status → pipeline view
```

### 4. Chat Flow
```
chat-widget.html → customer ส่งข้อความ → POST /api/chat
Admin: GET /api/chat → reply → real-time polling
```

---

## 📝 Notes สำหรับ Agent ถัดไป

- **สิ่งที่ทำวันนี้ (2026-05-06):**
  - แก้ service cards แสดงรูปภาพแทน emoji (4 ไฟล์: style.css, site-loader.js, index.html, server/db.js)
  - ปรับ CSS `.service-card` เป็น card layout แบบมี cover image
  - เพิ่ม `image_url` ใน seed data ของ site_content services
  - fallback HTML ใน index.html ใส่รูป Unsplash ทั้ง 9 ใบ

- **สิ่งที่ยังค้าง (TODO ข้อ 1-3 สำคัญสุด):**
  1. Admin DB Services Page — ต้องทำ HTML + JS สำหรับจัดการ 58 services
  2. API CRUD สำหรับ services — เพิ่ม POST/PUT/DELETE ใน server.js
  3. service.html feature cards — hardcoded 5 ชุด ต้องเพิ่มอีก 4 หรือดึงจาก DB

- **ข้อมูลอ้างอิง:**
  - ดู `server/db.js` บรรทัด ~185 สำหรับ seed data services (มี image_url แล้ว)
  - ดู `site-loader.js` บรรทัด ~183 สำหรับ service card image rendering
  - ดู `style.css` บรรทัด ~262 สำหรับ `.service-card` layout ใหม่
  - ดู `admin.js` บรรทัด ~280 สำหรับ renderServicesForm ที่เพิ่ม image_url
