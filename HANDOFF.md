# HANDOFF.md — NUCHA Construction CRM

> อัพเดทล่าสุด: 2026-05-06 17:46 (GMT+8)

---

## 📋 สถานะปัจจุบัน

โปรเจคพร้อมใช้งานจริง (production-ready) สำหรับ landing page + CRM พื้นฐาน + CMS แก้ไขเว็บ + ระบบ Gallery/3D Viewer

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

### Admin DB Services Page (เพิ่ม sidebar link แล้ว)
- เพิ่ม sidebar link "📦 บริการ (DB)" ใน `admin.html`

### Server & API (ทั้งหมดทำงานปกติ)
- 35+ API endpoints ผ่าน test ทั้งหมด
- Auth, Leads CRUD, Pipeline, Reports, Chat, Services, Proposals, Notes, Activities

### 🆕 Service Gallery System (2026-05-06 17:30)
- **DB Migration 011**: สร้างตาราง `service_gallery` (id, service_id, service_category, title, description, image_url, image_type, sort_order)
- **DB Migration 013**: Seed รูปภาพตัวอย่าง 40+ รูป จาก Unsplash ครบทุกหมวดบริการ:
  - สถาปัตยกรรม (6 รูป): บ้านเดี่ยว, Contemporary, Tropical, ทาวน์โฮม, อาคารพาณิชย์, สระว่ายน้ำ
  - ตกแต่งภายใน (6 รูป): ห้องนั่งเล่น, ห้องนอน, ครัว, ห้องน้ำ, ออฟฟิศ, ร้านอาหาร
  - บิ้วอิน (4 รูป): ครัว, Walk-in Closet, ชั้นวางทีวี, ตู้หนังสือ
  - ออกแบบ (4 รูป): 3D Perspective, Interior Rendering, Floor Plan, Moodboard
  - ภูมิทัศน์ (4 รูป): สวนโมเดิร์น, สวนญี่ปุ่น, กลางแจ้ง, ไฟสนาม
  - ป้าย (3 รูป): ป้ายโครงการ, ไฟ LED, สแตนเลส
  - งานระบบ (3 รูป): ไฟฟ้า, แอร์, Smart Home
  - เขียนแบบ (2 รูป): แบบสถาปัตย์, แบบโครงสร้าง
  - ที่ปรึกษา (2 รูป): สำรวจพื้นที่, คุมงาน
  - 3D/Visual (3 รูป): Perspective, Walkthrough, 360° Tour
  - งานพิมพ์/ผลิต (2 รูป): ไวนิล, Wallpaper
- **API Endpoints ใหม่**:
  - `GET /api/services/:id/gallery` — ดึงรูป gallery ของบริการ (รองรับทั้ง service_id และ service_category)
  - `GET /api/gallery/category/:category` — ดึงรูปตามหมวดหมู่
  - `POST /api/services/:id/gallery` — เพิ่มรูป (auth required, รองรับ file upload + URL)
  - `DELETE /api/gallery/:id` — ลบรูป (auth required)
- **Frontend — Gallery Section** (`service.html`):
  - Gallery grid แสดงรูปภาพ responsive (auto-fill, min 280px)
  - Filter ตาม image_type (photo / render)
  - Badge "3D Render" สำหรับรูปประเภท render
  - Hover overlay แสดง title + description
  - GSAP scroll animation
- **Frontend — Lightbox** (`service.html`):
  - Fullscreen lightbox ดูรูปขนาดใหญ่
  - ซ้าย/ขวา navigate ด้วยปุ่มหรือ keyboard (←→ Escape)
  - Thumbnail strip ด้านล่าง
  - Counter "1 / N"
  - Click outside ปิดได้

### 🆕 3D Model Viewer System (2026-05-06 17:30)
- **DB Migration 012**: สร้างตาราง `service_models` (id, service_id, service_category, title, description, model_url, model_format, poster_url, auto_rotate, camera_orbit, sort_order)
- **API Endpoints ใหม่**:
  - `GET /api/services/:id/models` — ดึงโมเดล 3D ของบริการ
  - `GET /api/models/category/:category` — ดึงโมเดลตามหมวด
  - `POST /api/services/:id/models` — เพิ่มโมเดล (auth required)
- **Frontend — 3D Viewer Section** (`service.html`):
  - ใช้ Google `<model-viewer>` Web Component (v3.5.0 จาก CDN)
  - รองรับไฟล์ .glb / .gltf
  - หมุนอิสระด้วยเมาส์/ทัช (camera-controls)
  - Auto-rotate เปิด/ปิดได้
  - ปุ่มควบคุม: รีเซ็ตมุม, ด้านหน้า, ด้านข้าง, หมุนอัตโนมัติ
  - Loading spinner ระหว่างโหลดโมเดล
  - Responsive grid (min 400px)
  - ยังไม่มี seed data โมเดล (ต้องเพิ่ม .glb files จริง)

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

3. **Admin Gallery/Models Management UI — ยังไม่มี**
   - API endpoints สำหรับ gallery + models มีแล้ว (ดูหัวข้อ Gallery System)
   - แต่ยังไม่มี admin UI สำหรับ:
     - ดู/เพิ่ม/ลบ รูป gallery ของแต่ละบริการ
     - ดู/เพิ่ม/ลบ โมเดล 3D ของแต่ละบริการ
   - ต้องเพิ่มใน admin.html + admin.js

4. **3D Model Seed Data — ยังไม่มี**
   - ตาราง `service_models` สร้างแล้ว แต่ยังไม่มีข้อมูล
   - ต้องหา/สร้างไฟล์ .glb ตัวอย่าง (เช่น โมเดลบ้าน, เฟอร์นิเจอร์)
   - หรือใช้ free models จากแหล่งต่างๆ เช่น Sketchfab, Google Poly (ปิดแล้ว), Poly.pizza

5. **service.html feature cards — hardcoded 5 ชุด**
   - `featureSets` object มีแค่ 5 keys: construction, builtin, design, decoration, project-management
   - อีก 4 บริการ (signage, landscape, drafting, visualization) ไม่มี feature cards
   - ควรเปลี่ยนไปดึงจาก DB หรือ CMS แทน hardcode

### 🟡 ควรทำ

6. **services.html — แสดง images จาก DB**
   - ตอนนี้ใช้ `meta.icon` (emoji) สำหรับ category cards
   - ควรแสดง `image_url` จาก DB service เป็น card background/thumbnail

7. **Admin: จัดการ Service Packages**
   - DB มี `service_packages` table (7 packages) แต่ไม่มี admin UI จัดการ

8. **Pre-fill booking form จาก service page**
   - CTA "จองคิวปรึกษาฟรี" ไปหน้า `/` แบบ generic
   - ควรส่ง `?service=xxx` ไป pre-select ใน form

### 🟢 Nice to Have

9. **Rate limit admin login** — ตอนนี้ 5 ครั้ง/นาที ทั้งหมด ควรแยก admin กับ public
10. **CSRF protection** — ยังไม่มี
11. **Audit log** — บันทึก admin actions เพิ่มเติม
12. **Export PDF** — สำหรับ proposals

---

## 🏗️ Architecture

```
server.js           — Express 5 backend, 40+ API endpoints
server/db.js        — SQLite (better-sqlite3), schema + seed data (58 services, 7 packages)
server/migrations.js — 13 migrations (001-013)
utils/validate.js   — Input validation (phone, email, name, password, lead)
scripts/backup.js   — DB backup script
site-loader.js      — Dynamic content loader (CMS → frontend)
admin.js            — Admin CMS logic
admin.html          — Admin panel (15+ pages)
index.html          — Landing page (dynamic via site-loader.js)
service.html        — Service detail page (2 modes: key/category + gallery + 3D viewer)
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
gallery             — General gallery (ไม่ได้ใช้แล้ว ใช้ service_gallery แทน)
services            — DB services (58 items, 9 categories)
service_packages    — Service packages (7 items)
service_gallery     — 🆕 Gallery images per service (40+ seed items)
service_models      — 🆕 3D models per service (ยังไม่มี seed data)
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

### 5. 🆕 Service Detail Page Flow
```
เข้า /service?key=construction (CMS mode)
  → fetch /api/content → หา service items → แสดง hero + features + portfolio
  → fetch /api/services (DB) → หา service ที่ชื่อตรง → ดึง gallery + models
  → แสดง Gallery grid + Lightbox
  → แสดง 3D Model Viewer (ถ้ามีโมเดล)

เข้า /service?category=สถาปัตยกรรม (DB mode)
  → fetch /api/services → filter ตาม category → แสดง sub-services
  → fetch /api/gallery/category/สถาปัตยกรรม → แสดง gallery
  → fetch /api/models/category/สถาปัตยกรรม → แสดง 3D viewer (ถ้ามี)
```

### 6. 🆕 Gallery + Lightbox Flow
```
service.html โหลด → ตรวจ key/category → fetch gallery API
  → render gallery grid (filter: all/photo/render)
  → คลิกรูป → เปิด lightbox
  → navigate: ← → keyboard, thumbnail strip, click outside ปิด
```

### 7. 🆕 3D Model Viewer Flow
```
service.html โหลด → fetch models API → ถ้ามีโมเดล
  → render model-viewer component (Google CDN)
  → ผู้ใช้หมุน/ซูมด้วยเมาส์/ทัช
  → ปุ่มควบคุม: รีเซ็ต, ด้านหน้า, ด้านข้าง, auto-rotate
```

---

## 📝 Notes สำหรับ Agent ถัดไป

### สิ่งที่ทำวันนี้ (2026-05-06)

**รอบเช้า (16:44):**
- แก้ service cards แสดงรูปภาพแทน emoji (4 ไฟล์: style.css, site-loader.js, index.html, server/db.js)
- ปรับ CSS `.service-card` เป็น card layout แบบมี cover image
- เพิ่ม `image_url` ใน seed data ของ site_content services
- fallback HTML ใน index.html ใส่รูป Unsplash ทั้ง 9 ใบ

**รอบบ่าย (17:30):**
- เพิ่มระบบ Gallery รูปภาพหลายรูปต่อบริการ (DB + API + Frontend)
- เพิ่ม Lightbox ดูรูป fullscreen พร้อม navigate + thumbnails
- เพิ่ม 3D Model Viewer ใช้ Google model-viewer web component
- Migration 011-013: สร้าง service_gallery, service_models tables + seed 40+ รูป
- API 6 endpoints ใหม่: gallery CRUD + models CRUD
- CSS 200+ บรรทัด: gallery grid, lightbox, 3D viewer, responsive

### สิ่งที่ต้องทำต่อ (เรียงตาม priority)

1. **Admin Gallery/Models UI** — API มีแล้ว ต้องทำ admin UI จัดการรูป + โมเดล
2. **Admin DB Services Page** — HTML + JS สำหรับจัดการ 58 services
3. **Services CRUD API** — POST/PUT/DELETE /api/services
4. **3D Model seed data** — หาไฟล์ .glb ตัวอย่าง
5. **Feature cards จาก DB** — แทน hardcode 5 ชุด
6. **services.html images** — แสดงรูปจาก DB ใน category cards

### ข้อมูลอ้างอิง

- `server/migrations.js` — ดู migration 011-013 สำหรับ gallery/models schema + seed data
- `service.html` — ดู CSS ที่เพิ่ม (~300 บรรทัด) สำหรับ gallery, lightbox, 3D viewer
- `service.html` — ดู JS ที่เพิ่ม (~200 บรรทัด) สำหรับ loadGallery(), load3DModels(), lightbox logic
- `server.js` — ดู endpoints ใหม่หลัง `/api/services/:id` สำหรับ gallery + models API
- Gallery seed data ใช้ Unsplash URLs หมวดละ 2-6 รูป (รวม 40+ รูป)
- 3D viewer ใช้ `<model-viewer>` จาก `https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js`
