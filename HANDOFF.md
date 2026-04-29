# HANDOFF.md — NUCHA INNOVATION CRM

> สถานะ: **Production-ready** | อัพเดทล่าสุด: 2026-04-29

---

## สรุปโปรเจค

ระบบ CRM สำหรับบริษัทรับเหมาก่อสร้าง พร้อม CMS แก้ไขเว็บได้ทุกส่วน

- **Stack**: HTML/CSS/JS + GSAP (Frontend) | Node.js + Express 5 + SQLite (Backend)
- **Auth**: JWT + bcryptjs | **Upload**: Multer
- **เว็บ**: Landing page dynamic โหลด content จาก API
- **Admin CMS**: แก้ไขเนื้อหาเว็บได้ทุกส่วน

---

## Flow การทำงาน (Architecture)

```
index.html (Landing Page)
  ├── style.css (Styling)
  ├── script.js (Animations + UI Logic)
  │     ├── รอ site-loader.js โหลด API content ก่อน (__siteContentLoaded promise)
  │     ├── initAnimations() — GSAP ScrollTrigger ทุก section (เรียกครั้งเดียวหลัง content พร้อม)
  │     ├── setupEventDelegation() — event listeners สำหรับ dynamic content
  │     └── rebindEventListeners() — re-bind หลัง DOM replacement (cursor, magnetic, ripple)
  └── site-loader.js (Dynamic Content Loader)
        ├── GET /api/content → โหลด hero, services, process, portfolio, booking, stats, testimonials, closing, footer, trust_badges, site_config
        ├── GET /api/nav → โหลด nav items (deduplicate by href)
        ├── Replace DOM innerHTML ทุก section ด้วย API data
        ├── Validate image URLs ก่อน set src (ป้องกันรูปหาย)
        ├── Preserve nav login link สำหรับ mobile
        ├── Re-bind event listeners (cursor, magnetic, ripple) หลัง DOM replacement
        └── Resolve __siteContentLoaded → script.js ถึงจะ init animations

server.js (Backend API)
  ├── Auth: POST /api/auth/login, /logout, /me
  ├── Content: GET/PUT /api/content/:key (CMS)
  ├── Nav: GET/PUT /api/nav
  ├── Leads: POST /api/leads (public, triggers LINE Notify), GET/PUT/DELETE (auth)
  ├── Upload: POST /api/upload (auth)
  ├── Media: GET/DELETE /api/media (auth)
  ├── Stats: GET /api/stats (auth)
  ├── Pipeline: GET /api/pipeline (auth)
  ├── Notes: GET/POST /api/leads/:id/notes (auth)
  ├── Proposals: GET/POST/PUT /api/proposals (auth)
  ├── Follow-ups: GET /api/followups (auth)
  ├── Notifications: POST /api/test-notification (auth)
  └── LINE Notify: sendLineNotify() — triggered on lead creation

server/db.js (Database Schema + Seed)
  ├── Tables: users, site_content, leads, notes, activities, proposals, nav_items, footer_links, gallery
  └── Seed: default content, nav items (check count before insert), admin user, demo leads

admin.html + admin.js + admin.css (CMS Admin Panel)
  ├── Login → JWT auth
  ├── แก้ไขเนื้อหาเว็บทุก section (Hero, Services, Portfolio, Footer, Navbar...)
  ├── อัพโหลดรูป (file upload หรือ URL)
  ├── จัดการ Leads (CRUD, ค้นหา, filter, เปลี่ยนสถานะ)
  ├── ดูนัดหมาย / จองคิว
  ├── คลังรูปภาพ
  └── Pipeline view (6 stages)
```

---

## ไฟล์ทั้งหมด

```
├── index.html           ← Landing page (dynamic, โหลดจาก API)
├── style.css            ← Frontend styles
├── script.js            ← Frontend JS (animations, form, events)
├── site-loader.js       ← Load content from API + replace DOM
├── service.html         ← Service detail page (per-service portfolio + features)
├── admin.html           ← CMS admin panel
├── admin.js             ← CMS logic
├── admin.css            ← CMS styles
├── admin-login.html     ← Login page
├── server.js            ← Backend (Express + SQLite + API + LINE Notify)
├── server/db.js         ← Database schema + seed data
├── package.json         ← Dependencies
├── .env.example         ← Environment config template
├── data/nucha.db        ← SQLite database (auto-created)
├── uploads/             ← Image uploads
├── HANDOFF.md           ← This file
├── README.md            ← Project overview
└── SALES-SCRIPT.md      ← Sales call script
```

---

## สิ่งที่เสร็จแล้ว ✅

### Bug Fixes (2026-04-29 — Round 1)

| บัค | สาเหตุ | วิธีแก้ | ไฟล์ |
|-----|--------|---------|------|
| เนื้อหาแสดงแล้วหาย (Flash of Content) | Race condition — `initAnimations()` ทำงานก่อน API content โหลด | เปลี่ยน `load` handler เป็น `async` + `await __siteContentLoaded` ก่อน init | script.js |
| `gsap.killTweensOf('*')` ไม่ทำงาน | GSAP ไม่รองรับ wildcard | เปลี่ยนเป็น explicit selector list ทุก animated element | script.js |
| Event listeners หายหลัง DOM replacement | `innerHTML` ทำลาย element + attached listeners | เพิ่ม `rebindEventListeners()` + `setupEventDelegation()` (cursor, magnetic btn, ripple, booking links, radio selections) | script.js |
| แถบ/sections จาง (opacity ค้าง) | ScrollTrigger ไม่ re-init ถูกต้องหลัง DOM replace | kill ScrollTriggers เก่า → re-init ใหม่หลัง content พร้อม | script.js + site-loader.js |
| รูปหายจาก API URL ว่าง | ไม่ validate URL ก่อน set `src` | เพิ่ม `url && url.trim()` check + conditional `<img>` render | site-loader.js |
| Nav login link หายบน mobile | site-loader เปลี่ยน navMenu innerHTML ทั้งหมด | เพิ่ม login link กลับหลัง API nav items | site-loader.js |
| GSAP โหลดซ้ำ 2 ครั้ง | script tags ใน `<head>` + ก่อน `</body>` | เอา `<head>` ออก เหลือแค่ก่อน `</body>` | index.html |

### Bug Fixes (2026-04-29 — Round 2)

| บัค | สาเหตุ | วิธีแก้ | ไฟล์ |
|-----|--------|---------|------|
| **Navbar ซ้ำกัน** | site-loader ไม่ deduplicate nav items จาก API — ถ้า API ส่ง href ซ้ำก็แสดงซ้ำ | เพิ่ม deduplication ด้วย `Set()` กรองซ้ำจาก `href` ก่อน render | site-loader.js |
| **เนื้อหาแว๊บ (Flash)** | `initAnimations()` ถูกเรียก 2 ครั้ง: จาก site-loader.js แล้วจาก script.js — ครั้งที่ 2 kill ScrollTriggers แล้ว re-init ทำให้ elements ที่แสดงอยู่ถูก reset เป็น opacity:0 แล้ว animate ใหม่ | เอา `initAnimations()` ออกจาก site-loader.js ให้ script.js เป็นตัวเดียวที่ init | site-loader.js |
| **Hamburger menu ไม่ปิดบนมือถือ** | Event delegation ไม่เช็ค active state + query selectors ซ้ำซ้อน | ปรับ logic เช็ค `navMenu.classList.contains('active')` ก่อนปิด | script.js |
| **ข้อความสำเร็จหายไปเร็ว** | Form success auto-reset หลัง 8 วินาที — ผู้ใช้อ่านไม่ทัน | เพิ่ม timeout เป็น 15 วินาที + ล้าง visual states (radio selections) ตอน reset | script.js |

### Features (2026-04-29)

| ฟีเจอร์ | รายละเอียด | ไฟล์ |
|---------|-----------|------|
| **Logo Image Support** | รองรับรูป logo (upload/URL) — แสดงใน Navbar, Loader, Footer; fallback เป็น text | site-loader.js, admin.js, server/db.js |
| **Service Detail Pages** | แต่ละบริการมีหน้า `/service.html?key=xxx` — features, portfolio เฉพาะบริการ, process, CTA | service.html, site-loader.js |
| **LINE Notify** | แจ้งเตือนทันทีเมื่อมี lead ใหม่ผ่าน LINE — admin ตั้งค่า token + เปิด/ปิด + ทดสอบ | server.js, admin.js, admin.html |

### ฟีเจอร์ที่ทำงานครบ ✅

- [x] Landing page ครบวงจร (Hero, Services, Process, Portfolio, Testimonials, Closing)
- [x] Dynamic content โหลดจาก API (ไม่มี double init)
- [x] GSAP animations + ScrollTrigger ทุก section
- [x] Custom cursor (desktop)
- [x] Magnetic buttons
- [x] Multi-step booking form (3 steps + success state 15s)
- [x] Counter animation (stats)
- [x] Sticky story/process section
- [x] Portfolio grid with hover overlay
- [x] Responsive ทุกอุปกรณ์
- [x] Floating CTA (LINE + phone)
- [x] Trust badges (brands)
- [x] Admin CMS (login, edit content, manage leads)
- [x] Image upload
- [x] Lead CRUD + scoring
- [x] Pipeline view
- [x] API endpoints ครบ
- [x] Navbar ไม่ซ้ำ (deduplicate)
- [x] Mobile hamburger menu ทำงานถูกต้อง
- [x] Logo image support (upload/URL, fallback text)
- [x] Service detail pages (/service.html?key=xxx)
- [x] LINE Notify (แจ้งเตือน lead ใหม่)
- [x] Notification config page ใน Admin CMS

---

## สิ่งที่ควรทำต่อ (Optional Improvements)

### Priority: Medium

1. **Admin Panel — ปรับปรุง UX**
   - Preview ก่อน publish content
   - Undo/Redo สำหรับ content editing
   - Bulk actions สำหรับ leads

2. **Lead Scoring — ปรับปรุง algorithm**
   - เพิ่ม factors: page views, time on site, referral source
   - Auto-assign sales rep ตาม score threshold

3. **Proposals — เปิดใช้งาน UI**
   - API พร้อมแล้ว (POST/PUT /api/proposals)
   - ต้องสร้าง UI ใน admin panel สำหรับสร้าง/แก้ไข proposal
   - Generate PDF จาก proposal

4. **Email Notifications**
   - ส่ง email เมื่อมี lead ใหม่
   - Follow-up reminders

5. **Analytics Dashboard**
   - Lead conversion funnel
   - Revenue tracking
   - Monthly/weekly reports

### Priority: Low

6. **SEO Optimization**
   - Meta tags dynamic จาก site_config
   - Open Graph tags
   - Sitemap generation

7. **Performance**
   - Image lazy loading
   - Service worker for offline
   - CDN สำหรับ static assets

8. **Security Hardening**
   - Rate limiting ปรับปรุง (ใช้ Redis แทน in-memory)
   - CSRF protection
   - Input sanitization เพิ่มเติม

9. **Testing**
   - Unit tests สำหรับ API endpoints
   - E2E tests สำหรับ booking flow
   - Visual regression tests

---

## วิธีรัน

```bash
npm install
npm start
```

เปิด:
- 🌐 เว็บ: http://localhost:3000
- 🔐 Login: http://localhost:3000/login (admin@nuchainnovation.com / admin123)
- 🔧 Admin CMS: http://localhost:3000/admin

---

## Notes สำหรับ Agent ถัดไป

- **อย่าแก้ script.js/site-loader.js โดยไม่เข้าใจ flow**: `site-loader.js` ต้อง resolve `__siteContentLoaded` promise ก่อน → `script.js` ถึงจะ init animations (เรียก `initAnimations()` จาก script.js เท่านั้น ห้ามเรียกจาก site-loader.js)
- **Event delegation อยู่ใน `setupEventDelegation()`**: ใช้ `document.addEventListener` ครอบ — ไม่ต้อง re-bind ทุกครั้ง
- **`rebindEventListeners()`** ใช้สำหรับ cursor/magnetic/ripple effects ที่ต้อง bind กับ element ตรงๆ — เรียกจาก site-loader.js หลัง DOM replacement
- **Image validation**: ทุกรูปจาก API ต้องผ่าน `esc()` + check ว่า URL ไม่ว่างก่อน render `<img>`
- **GSAP ไม่รองรับ `killTweensOf('*')`**: ใช้ explicit selector list เท่านั้น
- **Nav deduplication**: site-loader.js กรอง nav items ซ้ำจาก href ด้วย `Set()` ก่อน render
- **Database**: ใช้ better-sqlite3 (sync) — seed data ใน `server/db.js` เช็ค `navCount === 0` ก่อน insert ป้องกันซ้ำตอน restart
