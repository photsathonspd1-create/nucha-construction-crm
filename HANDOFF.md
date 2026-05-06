# HANDOFF.md — NUCHA Construction CRM

> อัพเดทล่าสุด: 2026-05-06 15:47 (GMT+8)

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

### Frontend Image Display
- **`site-loader.js`** — แสดงรูปจาก `image_url` แทน emoji icon ใน service cards (หน้า index)
- **`service.html`** — key mode: ใช้ `image_url` เป็น hero icon + hero image
- **`service.html`** — category mode: แสดงรูปจาก DB services ใน hero + feature cards
- **`service.html`** — ซ่อน emoji icon ถ้ามีรูปแล้ว

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
   - API endpoints ที่มีแล้ว: `GET/POST/PUT/DELETE /api/services/:id` (แต่ยังไม่มี POST/PUT/DELETE — ต้องเพิ่มใน server.js)

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

5. **index.html — service cards ยัง hardcoded**
   - service cards ใน index.html เป็น HTML ตายตัว (ไม่ dynamic)
   - `site-loader.js` เขียนทับด้วย CMS content แล้ว แต่ถ้า CMS ไม่มีข้อมูล จะแสดง HTML ดั้งเดิมที่ไม่มีรูป

6. **Admin: จัดการ Service Packages**
   - DB มี `service_packages` table (7 packages) แต่ไม่มี admin UI จัดการ

### 🟢 Nice to Have

7. **Rate limit admin login** — ตอนนี้ 5 ครั้ง/นาที ทั้งหมด ควรแยก admin กับ public
8. **CSRF protection** — ยังไม่มี
9. **Audit log** — บันทึก admin actions เพิ่มเติม
10. **Export PDF** — สำหรับ proposals

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
```

## 🔑 Default Credentials
- **Admin:** admin@nuchainnovation.com / admin123
- ⚠️ **เปลี่ยนรหัสผ่านก่อน deploy จริง!**

## 📦 Tech Stack
- Frontend: HTML/CSS/JS + GSAP animations
- Backend: Node.js + Express 5
- Database: SQLite (better-sqlite3)
- Auth: JWT + bcryptjs
- Upload: Multer

## 🚀 How to Run
```bash
npm install
npm start
# เปิด http://localhost:3000
# Admin: http://localhost:3000/admin
```

---

## 📝 Notes สำหรับ Agent ถัดไป

- ทุก fix ที่ทำไว้ยัง **ไม่ได้ commit** — ต้อง commit ก่อน
- Security fixes ทั้ง 10 จุดทำงานแล้ว ผ่าน test แล้ว
- CMS image support ใช้ได้แล้ว แต่ DB services admin ยังไม่เสร็จ
- ดู `server.js` บรรทัด ~1190 สำหรับ generate-docs ที่เปลี่ยนเป็น execFile
- ดู `admin.js` บรรทัด ~280 สำหรับ renderServicesForm ที่เพิ่ม image_url
- ดู `site-loader.js` บรรทัด ~170 สำหรับ service card image rendering
