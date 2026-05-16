# HANDOFF.md — NUCHA Construction CRM

> Last updated: 2026-05-16T18:47+08:00

---

## ✅ สิ่งที่เสร็จแล้วทั้งหมด

### 1. `server/db.js` — Supabase Proxy (Async)
- `all()`, `get()`, `run()` เป็น async ทั้งหมด
- รองรับทุก table: migrations, site_content, services, leads, users, nav_items, footer_links, service_gallery, chat_messages, password_resets, backups, service_models

### 2. `server/migrations.js` — Async Migrations
- `async function runMigrations()` + `await` ทุกจุด
- แยก DDL (ต้องรันใน Supabase SQL Editor) vs Data (รันผ่าน proxy)
- ลบ PRAGMA (SQLite-specific)

### 3. `server/upload.js` — Supabase Storage Helper
- `uploadToStorage(file, folder)` — อัพโหลด buffer ขึ้น Supabase Storage
- `deleteFromStorage(path)` — ลบไฟล์
- `listStorageFiles(folder)` — list ไฟล์
- `extractStoragePath(url)` — ดึง path จาก URL

### 4. `server.js` — Entry Point
- `await runMigrations()` ก่อน start server

### 5. `api/index.js` — แก้ไข Upload ทั้งหมด (12 จุด)
- ✅ เพิ่ม `require('./server/upload')`
- ✅ เปลี่ยน `multer.diskStorage` 3 blocks → `multer.memoryStorage()`
- ✅ `/api/upload` → `uploadToStorage(req.file, 'images')`
- ✅ Lead attachments POST → `uploadToStorage()`
- ✅ Lead attachments DELETE → `deleteFromStorage()`
- ✅ `/api/media` GET → `listStorageFiles('images')`
- ✅ `/api/media/:name` DELETE → `deleteFromStorage()`
- ✅ `/uploads/:name` route → legacy redirect (410)
- ✅ Gallery POST/PUT/DELETE → Supabase Storage
- ✅ Model POST/PUT/DELETE → Supabase Storage
- ✅ ลบ `uploadsDir`, `fs.mkdirSync(uploadsDir)` 
- ✅ ลบ `convertObjToGlb` (ไม่ต้องเขียนไฟล์ลง disk แล้ว)

### 6. SQL Scripts
- `supabase-setup.sql` — สร้างทุก table
- `supabase-storage-setup.sql` — Storage bucket + RLS

### 7. ลบไฟล์ซ้ำ
- ✅ `server/db_bridge.js`
- ✅ `server/db_supabase.js`
- ✅ `fix_*.js`, `repair_*.js`, `refactor_*.js`, `rebuild_*.js` (~25 ไฟล์)

---

## ⏳ สิ่งที่ต้องทำต่อ (Manual Steps)

### 1. Supabase Storage Bucket
- ไป **Supabase Dashboard → Storage → New Bucket**
  - Name: `uploads`
  - Public: ✅
- รัน `supabase-storage-setup.sql` ใน SQL Editor

### 2. Supabase Tables (ถ้ายังไม่ได้รัน)
- รัน `supabase-setup.sql` ใน SQL Editor

### 3. Vercel Environment Variables
- `SUPABASE_URL` = `https://kwhlpiyhtmywtcmgdqnj.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (service_role secret)
- `JWT_SECRET` = (random string)

### 4. Deploy
```bash
git push origin main
```

### 5. Test
- Login → Admin → Upload logo → ต้องได้ full Supabase URL
- Gallery → Upload รูป → ต้องแสดงได้
- Lead attachments → Upload → ต้องดาวน์โหลดได้

---

## 🏗️ Architecture

```
User → admin.js → POST /api/upload (FormData)
  → multer.memoryStorage() → file.buffer
  → uploadToStorage(file, 'images')
  → Supabase Storage (public CDN URL)
  → DB: save URL
  → <img src="https://xxx.supabase.co/storage/v1/object/public/uploads/images/xxx.jpg">
```

## 🔐 Supabase
- Project: `https://kwhlpiyhtmywtcmgdqnj.supabase.co`
