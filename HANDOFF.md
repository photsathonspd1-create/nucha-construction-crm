# HANDOFF.md — NUCHA INNOVATION CRM

> Last updated: 2026-04-29 by AI Agent  
> Repo: https://github.com/dmz2001TH/nucha-construction-crm

---

## 📋 ภาพรวมโปรเจกต์

ระบบ CRM สำหรับบริษัทรับเหมาก่อสร้าง **NUCHA INNOVATION** ประกอบด้วย:
- **หน้าเว็บสาธารณะ** (Landing Page) — แสดงบริการ, ผลงาน, แบบฟอร์มจองคิว
- **ระบบ CMS หลังบ้าน** — แก้ไขเนื้อหาเว็บได้ทุกส่วนผ่าน UI
- **ระบบ CRM** — จัดการ Leads, Pipeline, นัดหมาย, ใบเสนอราคา

---

## 🏗️ Stack เทคโนโลยี

| Layer | Technology |
|-------|-----------|
| Frontend | HTML/CSS/JS + GSAP 3.12.5 |
| Backend | **Node.js + Express 5** |
| Database | **SQLite (better-sqlite3)** — ไม่ต้องสมัครภายนอก |
| Auth | **JWT + bcryptjs** — cookie-based sessions |
| File Upload | **Multer** — เก็บใน `/uploads/` |
| Hosting | Static + Node.js server |

---

## 🔑 ข้อมูลเข้าสู่ระบบ

| รายการ | ค่า |
|--------|-----|
| Login URL | `/login` หรือ `/admin-login.html` |
| Email | `admin@nuchainnovation.com` |
| Password | `admin123` |
| JWT Secret | `nucha-secret-key-change-in-production` (เปลี่ยนใน production) |

---

## 📁 โครงสร้างไฟล์

```
nucha-construction-crm/
├── server.js              ← ✅ Backend server (Express + SQLite + JWT + API)
├── server/
│   └── db.js              ← ✅ Database schema, seed data, default content
├── data/
│   └── nucha.db           ← ✅ SQLite database (auto-created on first run)
├── uploads/               ← ✅ Image uploads storage
├── index.html             ← ✅ หน้าเว็บหลัก (dynamic, โหลดจาก API)
├── site-loader.js         ← ✅ โหลดเนื้อหาจาก API → แสดงบนหน้าเว็บ
├── admin.html             ← ✅ CMS หลังบ้าน (Full content editor)
├── admin.css              ← ✅ CMS styles
├── admin.js               ← ✅ CMS logic (edit all sections, manage leads)
├── admin-login.html       ← ✅ หน้า Login
├── script.js              ← ✅ Frontend JS (animations, form submit → API)
├── style.css              ← ✅ Frontend styles (เดิม)
├── package.json           ← ✅ Dependencies + start script
├── supabase/              ← ⚠️ LEGACY — ไม่ใช้แล้ว (เก็บไว้อ้างอิง)
│   ├── config.js
│   ├── crm.js
│   ├── auth.js
│   ├── schema.sql
│   └── functions/         ← Edge Functions (ไม่ใช้แล้ว)
├── .env.example
├── README.md
├── HANDOFF.md             ← 📄 ไฟล์นี้
└── SALES-SCRIPT.md
```

---

## ✅ สิ่งที่เสร็จแล้ว

### Backend (server.js + server/db.js)
- [x] Express 5 server พร้อม middleware (JSON, CORS, cookie-parser)
- [x] SQLite database พร้อม schema ครบ (leads, notes, activities, proposals, users, site_content, nav_items, gallery)
- [x] JWT authentication (login/logout/me)
- [x] Auth middleware ป้องกัน admin routes
- [x] Image upload API (`POST /api/upload`) — Multer, 5MB limit, image only
- [x] Media library API (`GET /api/media`, `DELETE /api/media/:name`)
- [x] Content API — GET/PUT ทุก section (`/api/content/:key`)
- [x] Nav items API — GET/PUT (`/api/nav`)
- [x] Leads CRUD API — GET/POST/PUT/DELETE (`/api/leads`)
- [x] Notes API — GET/POST (`/api/leads/:id/notes`)
- [x] Activities API — GET (`/api/activities`)
- [x] Proposals API — GET/POST/PUT (`/api/proposals`)
- [x] Follow-ups API — GET (`/api/followups`)
- [x] Stats API — GET (`/api/stats`)
- [x] Pipeline API — GET (`/api/pipeline`)
- [x] Lead scoring function (budget + service + engagement)
- [x] Demo seed data (3 leads, 6 nav items, 11 content sections)
- [x] Default admin user seed

### Frontend — หน้าเว็บ (index.html + site-loader.js + script.js)
- [x] Dynamic content loading จาก API (ไม่ hardcode)
- [x] site-loader.js — โหลดทุก section จาก API → render HTML
- [x] ทุก section เป็น dynamic: Hero, Services, Process, Portfolio, Testimonials, Closing, Footer, Trust Badges, Stats, Booking
- [x] Multi-step booking form → POST /api/leads (ไม่ใช้ Supabase)
- [x] Navbar โหลดจาก API
- [x] GSAP animations (เดิม)
- [x] Custom cursor, magnetic buttons, scroll effects (เดิม)
- [x] Mobile responsive (เดิม)
- [x] Floating CTA (LINE + Phone)

### CMS หลังบ้าน (admin.html + admin.js + admin.css)
- [x] Sidebar navigation ครบ 12+ pages
- [x] **Dashboard** — Stats cards, Pipeline view, Recent bookings
- [x] **⚙️ ตั้งค่าเว็บ** — แก้ ชื่อเว็บ, โลโก้, เบอร์โทร, email, LINE ID, social, copyright
- [x] **🏠 Hero** — แก้ badge, title, subtitle, description, CTA, สถิติ, รูป, float card
- [x] **🔧 บริการ** — เพิ่ม/ลบ/แก้ไข รายการบริการ (icon, name, desc, budget, key)
- [x] **📋 กระบวนการ** — เพิ่ม/ลบ/แก้ไข ขั้นตอน + อัพโหลดรูป
- [x] **🖼️ ผลงาน** — เพิ่ม/ลบ/แก้ไข ผลงาน + อัพโหลดรูป + size (large/normal)
- [x] **⭐ รีวิว** — เพิ่ม/ลบ/แก้ไข รีวิว (name, avatar, role, quote, stars)
- [x] **🔚 ปิดท้าย** — แก้ CTA, title, description, ข้อรับประกัน
- [x] **📎 Footer** — แก้ description, เมนูลัด, ลิงก์บริการ
- [x] **📑 เมนูนำทาง** — เพิ่ม/ลบ/ซ่อน/แสดง เมนู Navbar
- [x] **👥 Leads** — ตาราง leads, ค้นหา, filter สถานะ, ดู/แก้/ลบ lead, เพิ่มบันทึก, follow-up
- [x] **📅 จองคิว** — ดูนัดหมายทั้งหมด
- [x] **📁 คลังรูป** — อัพโหลดรูป (drag & drop), copy URL, ลบรูป
- [x] Image upload field — ทุก section ที่มีรูป (upload file หรือใส่ URL)
- [x] Repeatable items — เพิ่ม/ลบ รายการซ้ำ (services, process, portfolio, testimonials, guarantees, links)
- [x] Toast notifications
- [x] Mobile responsive sidebar
- [x] Lead detail modal — แก้ข้อมูล, เปลี่ยนสถานะ, ดู/เพิ่มบันทึก

### Auth
- [x] Login page (`/login`) — ใช้ API ไม่ใช้ Supabase
- [x] Cookie-based JWT sessions (7 วัน)
- [x] Auth check ก่อนเข้า admin
- [x] Logout → clear cookie → redirect to login
- [x] "กลับหน้าเว็บหลัก" link ใน login page

---

## ⚠️ สิ่งที่ยังไม่เสร็จ / ควรทำต่อ

### Priority 1 — สำคัญ
- [ ] **เปลี่ยน JWT_SECRET** ใน production (ปัจจุบันใช้ default)
- [ ] **เปลี่ยนรหัสผ่าน admin** (ปัจจุบันเป็น `admin123`)
- [ ] **Rate limiting** — ป้องกัน spam บน booking form (public endpoint)
- [ ] **CSRF protection** — เพิ่ม csrf token สำหรับ form submissions
- [ ] **Input validation/sanitization** — เพิ่ม server-side validation ที่เข้มงวดขึ้น

### Priority 2 — ควรทำ
- [ ] **เปลี่ยน Unsplash images เป็นรูปจริง** — ปัจจุบันใช้ Unsplash URLs
- [ ] **Favicon** — เพิ่ม favicon จริง
- [ ] **Meta tags / SEO** — เพิ่ม meta description, OG tags
- [ ] **เปลี่ยน phone/email/address** เป็นข้อมูลจริงของบริษัท
- [ ] **Proposal system** — สร้าง/edit/preview ใบเสนอราคา (API พร้อมแล้ว, UI ยังไม่มี)
- [ ] **Team management** — เพิ่ม/แก้ไข สมาชิกทีม (API พร้อมแล้ว, UI ยังไม่มี)
- [ ] **Analytics page** — charts/graphs สำหรับ CRM data
- [ ] **Export CSV** — ส่งออก leads เป็น CSV
- [ ] **Bulk actions** — เลือกหลาย leads พร้อมกัน

### Priority 3 — ถ้ามีเวลา
- [ ] **LINE Notify integration** — ส่งแจ้งเตือนเมื่อมี lead ใหม่
- [ ] **Email notifications** — ส่ง email เมื่อมี booking
- [ ] **Password reset** — ลืมรหัสผ่าน
- [ ] **Multi-user roles** — admin, manager, staff (DB schema รองรับแล้ว)
- [ ] **Activity log UI** — หน้าแสดงกิจกรรมทั้งหมด
- [ ] **Lead import/export** — นำเข้า/ส่งออก leads จาก CSV
- [ ] **Image optimization** — บีบอัดรูปอัตโนมัติ
- [ ] **Backup system** — สำรอง database อัตโนมัติ
- [ ] **HTTPS/SSL** — ตั้งค่า SSL certificate
- [ ] **Docker** — สร้าง Dockerfile สำหรับ deploy

---

## 🔄 Flow การทำงาน

### ผู้ใช้ทั่วไป (Public)
```
เข้าเว็บ → ดูบริการ → กด "จองคิวปรึกษาฟรี"
→ เลือกบริการ (Step 1)
→ กรอกชื่อ/โทร/งบ (Step 2)  
→ นัดวัน/เวลา (Step 3)
→ ส่งฟอร์ม → POST /api/leads → บันทึกลง SQLite
→ แสดง "จองคิวสำเร็จ!"
```

### แอดมิน (Admin)
```
เข้า /login → กรอก email/password
→ POST /api/auth/login → ได้ JWT cookie
→ Redirect ไป /admin (CMS)

แก้ไขเนื้อหา:
→ เลือก section (Hero, Services, etc.)
→ แก้ไขข้อมูลในฟอร์ม
→ อัพโหลดรูป (file หรือ URL)
→ กด "บันทึก" → PUT /api/content/:key → บันทึกลง SQLite
→ หน้าเว็บอัพเดททันที (โหลดจาก API)

จัดการ Leads:
→ ไปหน้า "Leads"
→ ค้นหา/กรอง ตามสถานะ
→ คลิก lead → เปิด modal
→ แก้ไขข้อมูล/เปลี่ยนสถานะ/เพิ่มบันทึก
→ บันทึก → PUT /api/leads/:id
```

---

## 📊 Database Schema

### Tables
| Table | Description |
|-------|------------|
| `users` | ผู้ใช้ระบบ (admin, manager, staff) |
| `site_content` | เนื้อหาเว็บ (key-value JSON) |
| `nav_items` | เมนูนำทาง |
| `leads` | ลูกค้าเป้าหมาย |
| `notes` | บันทึก/หมายเหตุ ต่อ lead |
| `activities` | บันทึกกิจกรรม |
| `proposals` | ใบเสนอราคา |
| `gallery` | คลังรูปภาพ |
| `footer_links` | ลิงก์ footer |

### Content Sections (site_content)
| Key | Description |
|-----|------------|
| `site_config` | ชื่อเว็บ, โลโก้, เบอร์โทร, email, LINE, social |
| `hero` | Hero section ทั้งหมด |
| `services` | รายการบริการ |
| `process` | ขั้นตอนการทำงาน |
| `portfolio` | ผลงาน |
| `testimonials` | รีวิวลูกค้า |
| `closing` | CTA ปิดท้าย + ข้อรับประกัน |
| `footer` | Footer links + description |
| `trust_badges` | แบรนด์พันธมิตร |
| `stats` | สถิติ (ตัวเลข) |
| `booking` | หัวข้อแบบฟอร์มจองคิว |

---

## 🚀 วิธีรัน

```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start

# 3. เปิด browser
# เว็บ: http://localhost:3000
# Login: http://localhost:3000/login
# Admin: http://localhost:3000/admin
```

---

## ⚡ Commands

| Command | Description |
|---------|------------|
| `npm start` | เริ่ม server (port 3000) |
| `npm run dev` | เริ่ม server (เหมือน start) |
| `rm data/nucha.db` | ลบ database → สร้างใหม่ (reset ทุกอย่าง) |

---

## 📝 Notes สำหรับ Agent ถัดไป

1. **อย่าใช้ Supabase แล้ว** — โปรเจกต์เปลี่ยนมาใช้ SQLite + Express ทั้งหมด ไฟล์ใน `supabase/` เป็น legacy เก็บไว้อ้างอิงเท่านั้น
2. **Frontend เป็น dynamic** — เนื้อหาทุกส่วนโหลดจาก API ไม่ใช่ hardcoded
3. **CMS อยู่ที่ `/admin`** — ต้อง login ก่อน (auth middleware)
4. **Public form ไม่ต้อง login** — `/api/leads` POST เปิด public สำหรับ booking form
5. **รูปอัพโหลดเก็บใน `/uploads/`** — ใช้ Multer, served เป็น static files
6. **Express 5** — ใช้ syntax ใหม่ เช่น `'/{*splat}'` แทน `'*'` สำหรับ catch-all
7. **`server/db.js`** — มี default content ทั้งหมด ถ้าอยาก reset ให้ลบ `data/nucha.db` แล้วรันใหม่
