# 🔄 HANDOFF — NUCHA INNOVATION Construction CRM

> อัปเดต: 2026-04-29 02:10 GMT+8
> Agent: Main session (webchat)
> Repo: https://github.com/dmz2001TH/nucha-construction-crm

---

## 📌 สถานะปัจจุบัน: Supabase Backend + Auth + Full CRM เสร็จ

---

## 🏗️ สิ่งที่เสร็จแล้ว (DONE)

### 1. Supabase Database (`supabase/schema.sql`)
- [x] **leads** table — name, phone, email, service_type, budget_range, status, score
- [x] **appointments** table — date, time, meeting_type, linked to lead
- [x] **proposals** table — items (JSONB), total, status, valid_until
- [x] **notes** table — note_type, follow_up_date, follow_up_done
- [x] **activities** table — auto-logged on status change (DB trigger)
- [x] **profiles** table — auto-created on signup
- [x] **RLS policies** — authenticated for admin, public insert for website form
- [x] **Lead scoring function** — budget + service + engagement + appointment
- [x] **Demo data** — 6 seed leads
- [x] **Indexes** — status, created_at, score, date, follow_up

### 2. Supabase Client (`supabase/crm.js`)
- [x] Full async CRM module replacing localStorage
- [x] getLeads, saveLead, updateLead, deleteLead, searchLeads
- [x] getAppointments, saveAppointment, updateAppointment
- [x] getNotes, addNote, getPendingFollowUps, markFollowUpDone
- [x] getProposals, saveProposal, updateProposal
- [x] getActivities, logActivity
- [x] getStats, getPipelineStats
- [x] calculateScore, formatDate, getMeetingLabel
- [x] notifyNewLead (calls Edge Function)

### 3. Authentication (`supabase/auth.js` + `admin-login.html`)
- [x] Supabase Auth (email + password)
- [x] Login page with error handling
- [x] Auto-redirect to admin if already logged in
- [x] Profile loading (name, role)
- [x] Sign out

### 4. Admin Dashboard (`admin.html` + `admin.js` + `admin.css`)
- [x] Auth-gated (redirects to login if not authenticated)
- [x] **Dashboard** — stats cards + recent leads
- [x] **Leads** — table with search, filter, status change, edit, delete
- [x] **Pipeline** — 6-column kanban (New Lead → Closed Won/Lost)
- [x] **Appointments** — grid view
- [x] **Proposals** — create, edit status, item-based quotation
- [x] **Follow-ups** — pending follow-ups with mark-done
- [x] **Activities** — auto-logged status changes
- [x] **Export CSV** — download leads data
- [x] **Notes modal** — per-lead notes with follow-up dates
- [x] Loading overlay
- [x] User profile in sidebar

### 5. Website Form (`script.js` + `index.html`)
- [x] Supabase SDK loaded
- [x] Form submission → CRM.saveLead() → Supabase
- [x] Appointment creation → CRM.saveAppointment() → Supabase
- [x] All GSAP animations preserved
- [x] All existing UI unchanged

### 6. Edge Functions (`supabase/functions/`)
- [x] **notify** — LINE Notify + Email on new lead
- [x] **followup-reminder** — daily check for overdue follow-ups
- [x] **daily-summary** — evening CRM summary

### 7. Styling
- [x] Admin CSS extracted to `admin.css`
- [x] All original styles preserved
- [x] New styles for proposals, follow-ups, activities

---

## ⚙️ Architecture

```
[Website Visitor]
    ↓ fills form
[index.html + script.js]
    ↓ CRM.saveLead() / CRM.saveAppointment()
[Supabase JS Client]
    ↓ REST API
[Supabase PostgreSQL]
    ├── leads table (with RLS)
    ├── appointments table
    ├── proposals table
    ├── notes table
    └── activities table (auto-trigger)
         ↓
[Edge Functions] → LINE Notify / Email

[Admin]
    ↓ login
[admin-login.html] → Supabase Auth
    ↓ session
[admin.html + admin.js]
    ↓ reads/writes
[Supabase PostgreSQL]
```

---

## 📋 ตั้งค่า Supabase (ขั้นตอน)

1. สร้าง project ที่ supabase.com
2. รัน `supabase/schema.sql` ใน SQL Editor
3. แก้ `supabase/config.js` — ใส่ URL + Anon Key
4. สร้าง admin user ใน Authentication
5. Deploy Edge Functions (ถ้าต้องการ notifications)
6. Upload ไฟล์ไป Hostinger

---

## 📋 สิ่งที่ต้องทำต่อ (TODO)

### Priority 1: ตั้งค่า Production
- [ ] สร้าง Supabase project จริง
- [ ] ใส่ credentials ใน config.js
- [ ] สร้าง admin user
- [ ] Deploy บน Hostinger
- [ ] ทดสอบ form submission → admin dashboard

### Priority 2: Notifications
- [ ] สร้าง LINE Notify token
- [ ] Deploy notify Edge Function
- [ ] ตั้งค่า SMTP สำหรับ email
- [ ] Deploy followup-reminder (cron)
- [ ] Deploy daily-summary (cron)

### Priority 3: Enhancements
- [ ] Drag & drop ใน pipeline view
- [ ] Calendar view สำหรับ appointments
- [ ] Dark mode สำหรับ admin
- [ ] Google Maps ใน booking form
- [ ] PDF export สำหรับ proposals

---

## 🗂️ โครงสร้างไฟล์

```
nucha-crm/
├── index.html              ← Landing page
├── style.css               ← Landing page styles
├── script.js               ← Landing page JS (Supabase form)
├── admin.html              ← Admin dashboard
├── admin.css               ← Admin styles
├── admin.js                ← Admin logic (async)
├── admin-login.html        ← Login page
├── supabase/
│   ├── config.js           ← Supabase credentials
│   ├── crm.js              ← CRM module (all DB ops)
│   ├── auth.js             ← Auth module
│   ├── schema.sql          ← DB schema + seed
│   └── functions/
│       ├── notify/index.ts
│       ├── followup-reminder/index.ts
│       └── daily-summary/index.ts
├── .env.example
├── .gitignore
├── README.md
└── HANDOFF.md              ← ไฟล์นี้
```

---

## 🔑 ข้อมูลสำคัญ

- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Hosting**: Hostinger (static HTML/JS/CSS)
- **Auth**: Supabase Auth (email/password)
- **Data**: All in Supabase — no localStorage
- **Notifications**: LINE Notify + Email via Edge Functions
- **No build step**: เปิด HTML ตรง ๆ ได้เลย (Supabase JS จาก CDN)

---

## 📝 Notes

1. **อย่าเปลี่ยน design system** — สีแดง (#D60000), font Inter + Noto Sans Thai
2. **อย่าลบ GSAP animations** — ทำงานได้ดีแล้ว
3. **Supabase JS จาก CDN** — ไม่ต้อง npm install
4. **admin.html ต้อง login** — ใช้ Supabase Auth
5. **Website form insert ได้** — public insert policy (RLS)
6. **Service-based เท่านั้น** — ไม่ใช่ขายบ้าน
