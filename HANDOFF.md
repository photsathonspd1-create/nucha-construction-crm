# HANDOFF.md — NUCHA Construction CRM

> เอกสารสำหรับ agent ตัวถัดไปที่จะทำงานต่อ
> Last updated: 2026-05-16T18:43+08:00

---

## 📋 สถานะปัจจุบัน

### ✅ สิ่งที่เสร็จแล้ว

1. **แก้ไข `server/db.js`** — Supabase proxy รวมทุก table patterns
   - `all()`, `get()`, `run()` เป็น async ทั้งหมด
   - รองรับ: migrations, site_content, services, leads, users, nav_items, footer_links, service_gallery, chat_messages, password_resets, backups, service_models

2. **แก้ไข `server/migrations.js`** — async migrations
   - เปลี่ยนเป็น `async function runMigrations()`
   - เพิ่ม `await` ทุกจุด
   - แยก DDL vs Data migrations
   - ลบ PRAGMA (SQLite-specific)

3. **สร้าง `server/upload.js`** — Supabase Storage helper
   - `uploadToStorage(file, folder)` — อัพโหลดขึ้น Supabase Storage
   - `deleteFromStorage(path)` — ลบไฟล์
   - `listStorageFiles(folder)` — list ไฟล์
   - `extractStoragePath(url)` — ดึง path จาก URL

4. **สร้าง `server.js`** — Entry point (await runMigrations)

5. **SQL scripts**: `supabase-setup.sql`, `supabase-storage-setup.sql`

6. **`CHANGES.md`** — คำอธิบาย 12 จุดที่ต้องแก้ใน `api/index.js`

### ⏳ สิ่งที่ต้องทำต่อ

#### ลำดับ 1: แก้ไข `api/index.js` (ยังไม่ได้แก้!)
ไฟล์ 2506 บรรทัด — ต้องแก้ 12 จุดตาม `CHANGES.md`:
- [ ] เพิ่ม `require('./server/upload')`
- [ ] เปลี่ยน `multer.diskStorage` 3 blocks → `multer.memoryStorage()`
- [ ] แก้ `/api/upload` → ใช้ `uploadToStorage()`
- [ ] แก้ lead attachments POST/DELETE
- [ ] แก้ `/api/media` GET/DELETE
- [ ] แก้ gallery POST/PUT/DELETE
- [ ] แก้ model uploads
- [ ] ลบ `/uploads/:name` route (เปลี่ยนเป็น redirect/error)

#### ลำดับ 2: ลบไฟล์ซ้ำ
- [ ] `server/db_bridge.js`, `server/db_supabase.js`
- [ ] ไฟล์ fix_*.js, repair_*.js, refactor_*.js ใน root (~25 ไฟล์)

#### ลำดับ 3: Supabase Storage Bucket
- [ ] Dashboard → Storage → New Bucket: `uploads` (Public: ✅)
- [ ] รัน `supabase-storage-setup.sql`

#### ลำดับ 4: Vercel Environment Variables
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `JWT_SECRET`

#### ลำดับ 5: Deploy & Test
- [ ] `git push` → Vercel auto-deploy
- [ ] ทดสอบ upload รูป, logo, gallery, attachments

---

## 🏗️ Architecture

```
nucha-construction-crm/
├── api/index.js          ← Express app (ยังไม่แก้ upload)
├── server/
│   ├── db.js             ← ✅ Supabase proxy (แก้แล้ว)
│   ├── migrations.js     ← ✅ Async migrations (แก้แล้ว)
│   ├── upload.js         ← ✅ Supabase Storage helper (ใหม่)
│   └── supabase_client.js
├── public/
│   ├── script.js         ← Frontend (URL-based images)
│   ├── admin.js          ← Admin panel (imageField → /api/upload)
│   └── chat-widget.js
├── server.js             ← ✅ Entry point (ใหม่)
├── supabase-setup.sql    ← ✅ Schema SQL
├── supabase-storage-setup.sql ← ✅ Storage SQL
├── CHANGES.md            ← ✅ Instructions
└── HANDOFF.md            ← ✅ ไฟล์นี้
```

### Data Flow (Upload)
```
User → admin.js → POST /api/upload (FormData)
  → multer.memoryStorage() → file.buffer
  → uploadToStorage(file, 'images')
  → Supabase Storage (public URL)
  → DB: save URL
  → Frontend: <img src="https://xxx.supabase.co/storage/v1/object/public/uploads/...">
```

### Database
- Supabase (PostgreSQL) ผ่าน REST API
- Proxy: `db.prepare(sql).all/get/run()` → Supabase `.from().select/insert/update`
- Tables: users, leads, services, service_gallery, service_models, site_content, nav_items, footer_links, chat_messages, password_resets, backups, migrations

---

## ⚠️ Known Issues
1. `api/index.js` ยังไม่แก้ upload → ยังใช้ local disk
2. Duplicated db files ยังอยู่
3. Fix scripts ใน root ~25 ไฟล์ ควรลบ

## 💡 Tips
- `api/index.js` ใหญ่มาก — ใช้ `edit` แบบ surgical
- Frontend ใช้ URL-based images อยู่แล้ว — เปลี่ยนแค่ backend
- `CHANGES.md` มี before/after code ทุกจุด
