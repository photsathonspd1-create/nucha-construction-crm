# 🔄 HANDOFF — NUCHA INNOVATION Construction CRM

> อัปเดต: 2026-04-29 02:30 GMT+8
> Agent: Main session (webchat)
> Repo: https://github.com/dmz2001TH/nucha-construction-crm

---

## 📌 สถานะ: Production CRM with Notifications + Team + Auto Follow-up

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
- [x] Lead CRUD
- [x] Search + filter (name, phone, status, service)
- [x] Pipeline 6 stages
- [x] Appointments
- [x] Notes per lead (with follow-up dates)
- [x] Follow-up system (pending + mark done + call button)
- [x] Activity log
- [x] Export CSV

### Lead Priority System
- [x] Visual priority (🔴 ≥5 / 🟡 ≥3 / 🟢 <3)
- [x] Priority dots in table, cards, follow-ups
- [x] Sort by priority

### Kanban Drag & Drop
- [x] Native HTML5 drag & drop
- [x] Auto-update status on drop
- [x] Toast notification on change

### Proposal System
- [x] Create with items (JSONB)
- [x] Status flow: draft → sent → accepted/rejected
- [x] Accept → auto Closed Won
- [x] Reject → mark rejected
- [x] 🔔 Notification on new proposal

### Dashboard Analytics
- [x] Conversion rate, leads/day, avg close time, pipeline value
- [x] Bar chart, conversion funnel, service popularity
- [x] Budget distribution, lead sources

### 🔔 Notifications (3 Edge Functions)
- [x] **notify** — LINE + Telegram on new lead / follow-up / proposal
- [x] **followup-reminder** — daily cron (9 AM) → overdue follow-ups
- [x] **daily-summary** — daily cron (6 PM) → pipeline + stats summary
- [x] Priority-sorted notifications (🔴 high score first)
- [x] All 3 functions support both LINE + Telegram

### 👥 Team System
- [x] profiles table (auto-created on signup)
- [x] assigned_to field in leads
- [x] Team assignment dropdown in lead modal
- [x] Team page — performance per member
- [x] Stats: total leads, closed deals, conversion rate per person
- [x] Pipeline breakdown per team member
- [x] getTeamPerformance() in CRM module

### Toast Notifications
- [x] Success/error/info toasts
- [x] Auto-dismiss 3.5s

### Frontend
- [x] Website form → Supabase
- [x] All GSAP animations preserved

---

## ⚙️ Flow การทำงาน

```
[Website Visitor]
    ↓ กรอก form
[index.html + script.js]
    ↓ CRM.saveLead() → Supabase
    ├── leads table (auto score)
    ├── activities table (auto log)
    └── notify Edge Function
         → LINE Notify 🔔
         → Telegram 🔔
         → "🔴 ด่วน! Lead ใหม่: ..."

[Admin]
    ↓ login
[admin.html]
    ├── Dashboard (stats + priority leads + funnel)
    ├── Leads (table + search + filter + assign team)
    ├── Pipeline (Kanban drag & drop)
    ├── Appointments
    ├── Proposals (create + accept/reject + notify)
    ├── Follow-ups (priority sorted + call button)
    ├── Activities
    ├── Analytics (charts + funnel + revenue)
    └── Team (performance per member)

[Cron Jobs]
    ├── 9:00 AM → followup-reminder → LINE/Telegram
    └── 6:00 PM → daily-summary → LINE/Telegram
```

---

## 📋 ตั้งค่า Supabase

1. สร้าง project → supabase.com
2. รัน `supabase/schema.sql` ใน SQL Editor
3. แก้ `supabase/config.js` → ใส่ URL + Anon Key
4. สร้าง admin user → Authentication > Invite
5. Upload ไป Hostinger

### ตั้งค่า Notifications
```bash
# Deploy Edge Functions
supabase functions deploy notify
supabase functions deploy followup-reminder
supabase functions deploy daily-summary

# Set secrets
supabase secrets set LINE_NOTIFY_TOKEN=your_token
supabase secrets set TELEGRAM_BOT_TOKEN=your_token
supabase secrets set TELEGRAM_CHAT_ID=your_chat_id
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key

# Set up cron (via Supabase Dashboard > Edge Functions > Schedules)
# followup-reminder: 0 9 * * * (daily 9 AM)
# daily-summary: 0 18 * * * (daily 6 PM)
```

---

## 📋 สิ่งที่ต้องทำต่อ (TODO)

### Priority 1: Production Setup
- [ ] สร้าง Supabase project จริง
- [ ] ใส่ credentials
- [ ] สร้าง admin user
- [ ] Deploy บน Hostinger
- [ ] ทดสอบ form → admin → notification flow

### Priority 2: Notifications
- [ ] สร้าง LINE Notify token
- [ ] สร้าง Telegram Bot (optional)
- [ ] Deploy Edge Functions
- [ ] ตั้ง cron schedules

### Priority 3: Future Enhancements
- [ ] Calendar view (full calendar)
- [ ] Dark mode (admin)
- [ ] PDF export (proposals)
- [ ] Email templates (proposal send)
- [ ] KPI targets per team member
- [ ] Lead source tracking (UTM)
- [ ] Multi-language (EN/TH)

---

## 🗂️ โครงสร้างไฟล์

```
nucha-crm/
├── index.html              ← Landing page
├── style.css               ← Landing styles
├── script.js               ← Form → Supabase
├── admin.html              ← Admin dashboard
├── admin.css               ← Admin styles (kanban, analytics, priority, team)
├── admin.js                ← Admin logic (DnD, charts, team, toast)
├── admin-login.html        ← Login page
├── supabase/
│   ├── config.js           ← Supabase credentials (PLACEHOLDER)
│   ├── crm.js              ← CRM module (leads, appts, proposals, team, notify)
│   ├── auth.js             ← Auth module
│   ├── schema.sql          ← DB schema + seed
│   └── functions/
│       ├── notify/index.ts           ← LINE + Telegram (new lead/follow-up/proposal)
│       ├── followup-reminder/index.ts ← Daily overdue check
│       └── daily-summary/index.ts    ← Evening summary
├── .env.example
├── README.md
└── HANDOFF.md              ← ไฟล์นี้
```

---

## 🔑 ข้อมูลสำคัญ

- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Hosting**: Hostinger (static)
- **Auth**: Supabase Auth
- **Data**: All in Supabase — no localStorage
- **Notifications**: LINE Notify + Telegram (Edge Functions)
- **Cron**: Supabase scheduled functions
- **No build step**: HTML/JS ตรง ๆ

---

## 📝 Notes สำหรับ Agent ถัดไป

1. **อย่าเปลี่ยน design system** — สีแดง (#D60000), font Inter + Noto Sans Thai
2. **อย่าลบ GSAP animations**
3. **supabase/config.js เป็น placeholder** — ต้องใส่ credentials จริง
4. **admin.html ต้อง login** — Supabase Auth
5. **Website form insert ได้** — public insert policy
6. **Kanban DnD** — native HTML5 drag API
7. **Team assignment** — assigned_to field + profiles table
8. **Notifications** — LINE + Telegram, รองรับ 3 ประเภท: new_lead, followup_reminder, new_proposal
9. **Cron jobs** — ตั้งผ่าน Supabase Dashboard
10. **Proposal accept** → auto Closed Won + notify
