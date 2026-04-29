# HANDOFF.md — NUCHA Construction CRM

> เอกสารสำหรับ Agent ถัดไป: อ่านไฟล์นี้ก่อนเริ่มทำงาน

---

## 📋 สรุปโปรเจค

ระบบ CRM สำหรับบริษัทรับเหมาก่อสร้าง (NUCHA INNOVATION) พร้อม CMS แก้ไขเว็บได้ทุกส่วน

**Tech Stack:**
- Frontend: HTML/CSS/JS + GSAP (vanilla, no framework)
- Backend: Node.js + Express 5
- Database: SQLite (better-sqlite3)
- Auth: JWT + bcryptjs
- Upload: Multer

---

## 🏗️ โครงสร้างไฟล์

```
├── server.js              ← Backend (Express + SQLite + API) [แก้ไขแล้ว]
├── server/db.js           ← Database schema + seed data
├── data/nucha.db          ← SQLite database (auto-created)
├── uploads/               ← Image uploads
├── index.html             ← Landing page (มี fallback content แล้ว) [แก้ไขแล้ว]
├── site-loader.js         ← Load content from API (มี esc() ป้องกัน XSS แล้ว) [แก้ไขแล้ว]
├── script.js              ← Frontend JS + GSAP animations (แก้ re-init bug) [แก้ไขแล้ว]
├── admin.html             ← CMS admin panel
├── admin.js               ← CMS logic (แก้ esc + media XSS) [แก้ไขแล้ว]
├── admin.css              ← CMS styles
├── admin-login.html       ← Login page (ซ่อน default password ใน production) [แก้ไขแล้ว]
├── style.css              ← Frontend styles
├── package.json           ← Dependencies
└── HANDOFF.md             ← เอกสารนี้
```

---

## ✅ สิ่งที่แก้ไขแล้ว (3 commits)

### Commit 1: Security + Bug Fixes (`c2526c1`)

| แก้ไข | ไฟล์ | รายละเอียด |
|---|---|---|
| Path Traversal | `server.js` | `path.basename()` + double-check resolved path อยู่ใน uploads |
| XSS prevention | `site-loader.js` | เพิ่ม `esc()` ทุกจุดที่ใช้ innerHTML (nav, services, process, portfolio, booking, stats, badges) |
| XSS closingNote | `site-loader.js` | เปลี่ยนจาก innerHTML → DOM API (createElement + textContent) |
| JWT Secret | `server.js` | `crypto.randomBytes(32)` ถ้าไม่ตั้ง env var |
| Cookie secure | `server.js` | เพิ่ม `secure: process.env.NODE_ENV === 'production'` |
| Rate limit | `server.js` | In-memory rate limiter 10 req/min สำหรับ POST /api/leads |
| Error handler | `server.js` | Global Express error handler (จับ multer error) |
| Proposal race condition | `server.js` | เปลี่ยนจาก COUNT → MAX(proposal_number) + parse |
| Date timezone | `server.js` + `script.js` | `getTodayThai()` helper ใช้ UTC+7 |
| GSAP re-init | `script.js` | `ScrollTrigger.getAll().forEach(t => t.kill())` ก่อน re-init |
| Default password | `admin-login.html` | แสดงเฉพาะ localhost |
| multer fileFilter | `server.js` | `cb(null, false)` แทน `cb(new Error)` |
| Nav validation | `server.js` | `Array.isArray(items)` check |
| Filename random | `server.js` | `crypto.randomBytes(4)` แทน `Math.random` |
| Media delete URL | `admin.js` | `encodeURIComponent(name)` |

### Commit 2: Fallback Content (`2955fdc`)

- เพิ่ม fallback HTML content ใน `index.html` ทุก section:
  - Services (5 cards), Process (4 steps), Portfolio (4 items)
  - Stats (4 items), Testimonials (3 cards), Booking form (service options)
  - Guarantees (3 items), Footer links, Trust badges (6 brands)
- หน้าเว็บแสดงผลได้ทันทีแม้ API ยังไม่ตอบ
- เพิ่ม `onerror` handler ทุก `<img>` tag (hero, portfolio, process)
- Service card link events กลับมาทำงานหลัง API reload

### Commit 3: Nav Input Sanitize (`8c18f1b`)

- `PUT /api/nav` sanitize label (strip HTML tags) + href (allowlist chars)
- ป้องกัน stored XSS ผ่าน CMS

---

## 🗄️ Database Schema

**Tables:** `users`, `site_content`, `leads`, `notes`, `activities`, `proposals`, `nav_items`, `footer_links`, `gallery`

**Default admin:** `admin@nuchainnovation.com` / `admin123`

**Content sections (site_content):**
`site_config`, `hero`, `services`, `process`, `portfolio`, `testimonials`, `closing`, `footer`, `trust_badges`, `stats`, `booking`

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/content | No | Get all content |
| GET | /api/content/:key | No | Get section content |
| PUT | /api/content/:key | Yes | Update section |
| GET | /api/nav | No | Get nav items |
| PUT | /api/nav | Yes | Update nav items |
| POST | /api/leads | No* | Create lead (*rate limited) |
| GET | /api/leads | Yes | List leads |
| PUT | /api/leads/:id | Yes | Update lead |
| DELETE | /api/leads/:id | Yes | Delete lead |
| POST | /api/auth/login | No | Login |
| POST | /api/auth/logout | Yes | Logout |
| GET | /api/auth/me | Yes | Current user |
| POST | /api/upload | Yes | Upload image |
| GET | /api/media | Yes | List images |
| DELETE | /api/media/:name | Yes | Delete image |
| GET | /api/stats | Yes | Dashboard stats |
| GET | /api/pipeline | Yes | Pipeline view |
| GET | /api/leads/:id/notes | Yes | Lead notes |
| POST | /api/leads/:id/notes | Yes | Add note |
| GET | /api/activities | Yes | Activity log |
| GET | /api/proposals | Yes | List proposals |
| POST | /api/proposals | Yes | Create proposal |
| GET | /api/followups | Yes | Due follow-ups |

---

## 🔒 Security Measures ที่มีอยู่

1. JWT auth (httpOnly cookie + Bearer token)
2. bcryptjs password hashing
3. Rate limit on lead creation (10/min per IP)
4. Path traversal protection on media delete
5. XSS prevention via `esc()` on all innerHTML
6. Nav input sanitization (strip HTML tags)
7. Cookie secure flag in production
8. JWT secret auto-generated if not set
9. Global error handler (no stack trace leak)
10. File upload: image-only filter + 5MB limit

---

## 📌 สิ่งที่ยังไม่ได้ทำ (Optional / Nice-to-have)

### Priority: Medium
- [ ] **CORS configuration** — ถ้ามี frontend domain อื่นเรียก API
- [ ] **Input validation middleware** — validate ข้อมูล leads/proposals ให้ละเอียดกว่านี้
- [ ] **Admin user management** — CRUD users จาก admin panel (ตอนนี้มีแค่ seed user เดียว)
- [ ] **Proposal UI** — API proposals มีแล้วแต่ยังไม่มี UI ใน admin panel

### Priority: Low
- [ ] **Session invalidation** — เมื่อ logout แล้ว token ยังใช้ได้จนกว่าจะหมดอายุ
- [ ] **Upload file type validation** — ตรวจ magic bytes แทน mimetype (ป้องกัน spoof)
- [ ] **Database backup** — อัตโนมัติ
- [ ] **Production deployment** — PM2, nginx reverse proxy, SSL
- [ ] **.env.example** — เพิ่ม JWT_SECRET, PORT, NODE_ENV
- [ ] **Tests** — ไม่มี unit/integration tests เลย

### Priority: Low (Frontend)
- [ ] **Service card emoji fallback** — ถ้า browser แสดง emoji ไม่ได้ ให้ใช้ SVG icon แทน
- [ ] **Image lazy loading** — รูป portfolio/process ควร lazy load
- [ ] **Accessibility** — ARIA labels, keyboard navigation
- [ ] **Performance** — Critical CSS, defer JS

---

## 🚀 วิธีรัน

```bash
npm install
npm start
# เปิด http://localhost:3000
# Admin: http://localhost:3000/admin
# Login: admin@nuchainnovation.com / admin123
```

---

## ⚠️ ข้อควรระวัง

1. **อย่าใช้ default password ใน production** — เปลี่ยน admin password ทันที
2. **ตั้ง JWT_SECRET env var** — ถ้าไม่ตั้งจะ generate ใหม่ทุกครั้งที่ restart (token เก่าจะใช้ไม่ได้)
3. **SQLite** — เหมาะกับ usage ต่ำ ถ้า concurrent users เยอะควรเปลี่ยนเป็น PostgreSQL
4. **Rate limiter** — ใช้ in-memory (หายเมื่อ restart) ถ้าต้องการ persistent ใช้ Redis
5. **uploads/ folder** — ไม่ได้ gitignore (ควรเพิ่ม)

---

*Last updated: 2026-04-29 by Agent*
