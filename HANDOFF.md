# 🔄 HANDOFF — NUCHA INNOVATION Construction CRM

> อัปเดต: 2026-04-29 02:25 GMT+8
> Agent: Main session (webchat)
> Repo: https://github.com/dmz2001TH/nucha-construction-crm

---

## 📌 สถานะ: Production-Grade CRM with Full Sales Pipeline

---

## ✅ สิ่งที่เสร็จแล้ว (DONE)

### Database (Supabase)
- [x] 6 tables: leads, appointments, proposals, notes, activities, profiles
- [x] RLS policies (public insert + authenticated)
- [x] Auto activity logging (DB trigger)
- [x] Auto profile creation on signup
- [x] Lead scoring function
- [x] Indexes ทุก column ที่ query บ่อย
- [x] Demo data (6 leads)

### Auth
- [x] Supabase Auth (email/password)
- [x] Login page (admin-login.html)
- [x] Session protection (redirect if not logged in)
- [x] Profile display in sidebar

### CRM Core
- [x] Lead CRUD (create, read, update, delete)
- [x] Search + filter (name, phone, status, service)
- [x] Pipeline 6 stages (New Lead → Closed Won/Lost)
- [x] Appointments (create, view, meeting types)
- [x] Notes per lead (with follow-up dates)
- [x] Follow-up system (pending + mark done)
- [x] Activity log (auto status change tracking)
- [x] Export CSV

### 🆕 Lead Priority System
- [x] Visual priority indicators (🔴 High / 🟡 Medium / 🟢 Low)
- [x] Based on lead score (≥5 = high, ≥3 = mid, <3 = low)
- [x] Priority dots in leads table
- [x] Priority borders in pipeline cards
- [x] Priority in recent leads dashboard

### 🆕 Kanban Drag & Drop Pipeline
- [x] Drag pipeline cards between columns
- [x] Auto-update status on drop
- [x] Visual feedback (drag-over highlight)
- [x] Toast notification on status change

### 🆕 Proposal System (Enhanced)
- [x] Create proposals with item-based quotations
- [x] Generate proposal number (NP-0001, NP-0002...)
- [x] Status flow: draft → sent → accepted/rejected
- [x] Accept button → auto-update lead to "Closed Won"
- [x] Reject button → mark as rejected
- [x] Status labels in Thai

### 🆕 Dashboard Analytics
- [x] Conversion rate (Closed Won / Total)
- [x] Leads per day (7-day average)
- [x] Average close time (days)
- [x] Pipeline value estimate (budget-based)
- [x] Mini conversion funnel (visual bar)
- [x] Leads by day bar chart (7 days)
- [x] Conversion funnel (full)
- [x] Service popularity ranking
- [x] Budget distribution breakdown
- [x] Lead source breakdown

### 🆕 Toast Notifications
- [x] Success/error/info toasts
- [x] Auto-dismiss after 3.5s
- [x] Visual feedback for all actions

### Notifications (Edge Functions)
- [x] notify — LINE + Email on new lead
- [x] followup-reminder — daily overdue check
- [x] daily-summary — evening CRM summary

### Frontend
- [x] Website form → Supabase
- [x] All GSAP animations preserved
- [x] All existing UI unchanged

---

## ⚙️ Flow การทำงาน

```
[Website Visitor]
    ↓ กรอก form
[index.html + script.js]
    ↓ CRM.saveLead() → insert into Supabase
[Supabase]
    ├── leads table (auto score)
    ├── activities table (auto log)
    └── trigger notify Edge Function
         → LINE Notify + Email
         → "ทีมงานจะติดต่อกลับภายใน 24 ชม."

[Admin Login]
    ↓ email/password
[admin.html]
    ├── Dashboard (stats + recent leads + mini funnel)
    ├── Leads (table + search + filter + priority)
    ├── Pipeline (Kanban drag & drop)
    ├── Appointments (grid view)
    ├── Proposals (create + accept/reject)
    ├── Follow-ups (pending + mark done)
    ├── Activities (auto log)
    └── Analytics (charts + funnel + revenue)
```

---

## 📋 ตั้งค่า Supabase

1. สร้าง project → supabase.com
2. รัน `supabase/schema.sql` ใน SQL Editor
3. แก้ `supabase/config.js` → ใส่ URL + Anon Key
4. สร้าง admin user → Authentication > Invite
5. Upload ไฟล์ไป Hostinger

---

## 📋 สิ่งที่ต้องทำต่อ (TODO)

### Priority 1: Production Setup
- [ ] สร้าง Supabase project จริง
- [ ] ใส่ credentials ใน config.js
- [ ] สร้าง admin user
- [ ] Deploy บน Hostinger
- [ ] ทดสอบ form → admin flow ทั้งหมด

### Priority 2: Notifications
- [ ] สร้าง LINE Notify token
- [ ] Deploy notify Edge Function
- [ ] ตั้งค่า SMTP (email)
- [ ] Deploy followup-reminder (cron: 9 AM)
- [ ] Deploy daily-summary (cron: 6 PM)

### Priority 3: Future Enhancements
- [ ] Calendar view (full calendar grid)
- [ ] Dark mode (admin)
- [ ] Google Maps (booking form)
- [ ] PDF export (proposals)
- [ ] Mobile responsive sidebar toggle
- [ ] Multi-user roles (admin/manager/staff)
- [ ] Lead assignment to team members
- [ ] Email templates (proposal send)

---

## 🗂️ โครงสร้างไฟล์

```
nucha-crm/
├── index.html              ← Landing page
├── style.css               ← Landing page styles
├── script.js               ← Form submission → Supabase
├── admin.html              ← Admin dashboard
├── admin.css               ← Admin styles (kanban, analytics, priority)
├── admin.js                ← Admin logic (async, DnD, charts)
├── admin-login.html        ← Login page
├── supabase/
│   ├── config.js           ← Supabase credentials (PLACEHOLDER)
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
- **Hosting**: Hostinger (static)
- **Auth**: Supabase Auth (email/password)
- **Data**: All in Supabase — no localStorage
- **Notifications**: LINE Notify + Email (Edge Functions)
- **No build step**: เปิด HTML ตรง ๆ ได้เลย

---

## 📝 Notes สำหรับ Agent ถัดไป

1. **อย่าเปลี่ยน design system** — สีแดง (#D60000), font Inter + Noto Sans Thai
2. **อย่าลบ GSAP animations** — ทำงานได้ดีแล้ว
3. **supabase/config.js เป็น placeholder** — ต้องใส่ credentials จริง
4. **admin.html ต้อง login** — ใช้ Supabase Auth
5. **Website form insert ได้** — public insert policy (RLS)
6. **Service-based เท่านั้น** — ไม่ใช่ขายบ้าน
7. **Kanban DnD** ใช้ native HTML5 drag API — ไม่ต้อง library เพิ่ม
8. **Analytics** render ทุกครั้งที่ refreshData() — cached leads
9. **Toast notifications** — เรียก showToast(message, type)
10. **Proposal accept** → auto-update lead status เป็น Closed Won
