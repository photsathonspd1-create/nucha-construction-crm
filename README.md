# NUCHA INNOVATION — Construction CRM

ระบบ CRM สำหรับบริษัทรับเหมาก่อสร้าง พร้อม CMS แก้ไขเว็บได้ทุกส่วน

## 🚀 Quick Start

```bash
npm install
npm start
```

เปิด:
- 🌐 **เว็บ:** http://localhost:3000
- 🔐 **Login:** http://localhost:3000/login
- 🔧 **Admin CMS:** http://localhost:3000/admin

**Login:** `admin@nuchainnovation.com` / `admin123`

## ✨ Features

### หน้าเว็บ (Public)
- Landing page ครบวงจร (Hero, Services, Process, Portfolio, Testimonials)
- Multi-step booking form
- Dynamic content (โหลดจาก API)
- GSAP animations + Custom cursor
- Responsive ทุกอุปกรณ์

### ระบบ CMS (Admin)
- แก้ไขเนื้อหาเว็บได้ทุกส่วน (Hero, Services, Portfolio, Footer, Navbar...)
- อัพโหลดรูป (file upload หรือ URL)
- จัดการ Leads (CRUD, ค้นหา, filter, เปลี่ยนสถานะ)
- ดูนัดหมาย / จองคิว
- คลังรูปภาพ

### ระบบ CRM
- Lead management พร้อม scoring
- Pipeline view (6 stages)
- Notes + Follow-up system
- Activity log
- Proposals (API พร้อม)

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML/CSS/JS + GSAP |
| Backend | Node.js + Express 5 |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + bcryptjs |
| Upload | Multer |

## 📁 Structure

```
├── server.js          ← Backend (Express + SQLite + API)
├── server/db.js       ← Database schema + seed data
├── data/nucha.db      ← SQLite database (auto-created)
├── uploads/           ← Image uploads
├── index.html         ← Landing page (dynamic)
├── site-loader.js     ← Load content from API
├── admin.html         ← CMS admin panel
├── admin.js           ← CMS logic
├── admin.css          ← CMS styles
├── admin-login.html   ← Login page
├── script.js          ← Frontend JS
└── style.css          ← Frontend styles
```

## 📝 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/content` | No | Get all content |
| GET | `/api/content/:key` | No | Get section content |
| PUT | `/api/content/:key` | Yes | Update section |
| GET | `/api/nav` | No | Get nav items |
| PUT | `/api/nav` | Yes | Update nav items |
| POST | `/api/leads` | No | Create lead (booking form) |
| GET | `/api/leads` | Yes | List leads |
| PUT | `/api/leads/:id` | Yes | Update lead |
| DELETE | `/api/leads/:id` | Yes | Delete lead |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/upload` | Yes | Upload image |
| GET | `/api/media` | Yes | List images |
| GET | `/api/stats` | Yes | Dashboard stats |
| GET | `/api/pipeline` | Yes | Pipeline view |

## License

Private — NUCHA INNOVATION Co., Ltd.
