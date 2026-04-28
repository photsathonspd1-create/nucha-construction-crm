# 🔄 HANDOFF — NUCHA INNOVATION Construction CRM

> อัปเดต: 2026-04-29 02:40 GMT+8
> Agent: Main session (webchat)
> Repo: https://github.com/dmz2001TH/nucha-construction-crm

---

## 📌 สถานะ: Full Sales Operating System with SLA + Team + Automation

---

## ✅ สิ่งที่เสร็จแล้ว (DONE)

### Database (Supabase)
- [x] 6 tables: leads, appointments, proposals, notes, activities, profiles
- [x] RLS policies (public insert + authenticated)
- [x] Auto activity logging (DB trigger)
- [x] Auto profile creation on signup
- [x] Lead scoring function
- [x] first_contact_at field + auto-set trigger
- [x] lost_reason field with CHECK constraint
- [x] get_sla_breaches() DB function
- [x] Indexes ทุก column ที่ query บ่อย

### Auth
- [x] Supabase Auth (email/password)
- [x] Login page + session protection
- [x] Profile display in sidebar

### CRM Core
- [x] Lead CRUD + search + filter
- [x] Pipeline 6 stages
- [x] Appointments
- [x] Notes per lead (with follow-up dates)
- [x] Follow-up system (priority sorted + call button)
- [x] Activity log
- [x] Export CSV

### Lead Priority System
- [x] Visual priority (🔴 ≥5 / 🟡 ≥3 / 🟢 <3)
- [x] Priority in table, pipeline, follow-ups, SLA alerts

### Kanban Drag & Drop
- [x] Native HTML5 drag & drop
- [x] Auto-update status on drop

### Proposal System
- [x] Create with items + auto number
- [x] Status flow: draft → sent → accepted/rejected
- [x] Accept → auto Closed Won
- [x] Notification on new proposal

### 🔴 SLA Enforcement (NEW)
- [x] first_contact_at — auto-set when status changes from "New Lead"
- [x] SLA breach detection — 3 tiers:
  - 🔴 Score ≥5 → 5 นาที
  - 🟡 Score 3-4.9 → 2 ชั่วโมง
  - 🟢 Score <3 → 24 ชั่วโมง
- [x] SLA alerts card on dashboard (breached leads with call button)
- [x] SLA badge on dashboard header
- [x] SLA check Edge Function (runs every 5 minutes)
- [x] LINE/Telegram alert when SLA breached

### 🏆 Leaderboard (NEW)
- [x] Team page with leaderboard (🥇🥈🥉)
- [x] Period selector (week/month/year)
- [x] Metrics per person:
  - Deals closed
  - Conversion rate
  - Avg response time (minutes)
  - Avg close time (days)
- [x] Visual bar chart per person
- [x] Performance ranking table

### ❌ Lost Reason Tracking (NEW)
- [x] Dropdown when marking lead as "Closed Lost":
  - ราคาแพง, คู่แข่งเร็วกว่า, ลูกค้ายังไม่พร้อม
  - งบประมาณไม่พอ, ไม่ตอบกลับ, โครงการเลื่อน, อื่นๆ
- [x] Stored in leads.lost_reason
- [x] Analytics chart: lost reasons breakdown
- [x] Team page shows lost reason stats

### 🔔 Notifications (4 Edge Functions)
- [x] **notify** — LINE + Telegram (new_lead, followup_reminder, new_proposal)
- [x] **sla-check** — every 5 min → SLA breach alerts
- [x] **followup-reminder** — daily 9 AM → overdue follow-ups
- [x] **daily-summary** — daily 6 PM → pipeline + stats

### 👥 Team System
- [x] profiles table
- [x] assigned_to field in leads
- [x] Team assignment dropdown
- [x] Leaderboard + performance metrics
- [x] Team stats cards + table

### Dashboard Analytics
- [x] Conversion rate, leads/day, avg close time, pipeline value
- [x] Bar chart, funnel, service popularity, budget distribution
- [x] Lead sources

### Frontend
- [x] Website form → Supabase
- [x] All GSAP animations preserved

---

## ⚙️ Flow การทำงาน

```
[Website Visitor]
    ↓
[index.html] → CRM.saveLead() → Supabase
    ├── notify Edge Function → LINE/Telegram 🔔
    └── SLA clock starts ticking ⏰

[Admin Login]
    ↓
[admin.html]
    ├── Dashboard
    │   ├── Stats (leads, closed, appts, new)
    │   ├── Recent leads (priority sorted)
    │   └── 🚨 SLA Alerts (breached leads + call button)
    ├── Leads (table + search + filter + assign + lost reason)
    ├── Pipeline (Kanban drag & drop)
    ├── Appointments
    ├── Proposals (create + accept/reject)
    ├── Follow-ups (priority sorted + call)
    ├── Activities
    ├── Analytics (charts + funnel + revenue)
    └── Team
        ├── 🏆 Leaderboard (period selector)
        ├── Stats per person
        ├── ❌ Lost reasons chart
        └── Performance table

[Cron Jobs]
    ├── */5 * * * → sla-check → LINE/Telegram 🚨
    ├── 0 9 * * * → followup-reminder → LINE/Telegram
    └── 0 18 * * → daily-summary → LINE/Telegram
```

---

## 📋 ตั้งค่า Supabase

1. สร้าง project → supabase.com
2. รัน `supabase/schema.sql` ใน SQL Editor
3. แก้ `supabase/config.js` → ใส่ URL + Anon Key
4. สร้าง admin user → Authentication > Invite
5. Upload ไป Hostinger

### Notifications + SLA
```bash
supabase functions deploy notify
supabase functions deploy sla-check
supabase functions deploy followup-reminder
supabase functions deploy daily-summary

supabase secrets set LINE_NOTIFY_TOKEN=xxx
supabase secrets set TELEGRAM_BOT_TOKEN=xxx
supabase secrets set TELEGRAM_CHAT_ID=xxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx

# Cron schedules (Supabase Dashboard > Edge Functions > Schedules)
# sla-check: */5 * * * * (every 5 min)
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
- [ ] Deploy Edge Functions
- [ ] ตั้ง cron schedules
- [ ] ทดสอบ flow ทั้งหมด

### Priority 2: Future Enhancements
- [ ] Calendar view
- [ ] Dark mode
- [ ] PDF export (proposals)
- [ ] Email templates
- [ ] Lead source tracking (UTM)
- [ ] KPI targets per team member

---

## 🗂️ โครงสร้างไฟล์

```
nucha-crm/
├── index.html + style.css + script.js    ← Landing page
├── admin.html + admin.css + admin.js     ← Admin dashboard
├── admin-login.html                      ← Login
├── supabase/
│   ├── config.js           ← Credentials (PLACEHOLDER)
│   ├── crm.js              ← CRM module (leads, team, SLA, leaderboard, lost reasons)
│   ├── auth.js             ← Auth module
│   ├── schema.sql          ← DB schema (6 tables + SLA functions + triggers)
│   └── functions/
│       ├── notify/index.ts           ← LINE + Telegram (3 types)
│       ├── sla-check/index.ts        ← SLA breach alerts (*/5 min)
│       ├── followup-reminder/index.ts ← Daily follow-up check
│       └── daily-summary/index.ts    ← Evening summary
├── .env.example
├── README.md
└── HANDOFF.md
```

---

## 📝 Notes สำหรับ Agent ถัดไป

1. **อย่าเปลี่ยน design system** — สีแดง (#D60000), font Inter + Noto Sans Thai
2. **supabase/config.js เป็น placeholder** — ต้องใส่ credentials จริง
3. **SLA check** — ทำงานผ่าน get_sla_breaches() DB function + Edge Function
4. **first_contact_at** — auto-set โดย DB trigger เมื่อ status เปลี่ยนจาก "New Lead"
5. **lost_reason** — CHECK constraint, ต้องเลือกจากตัวเลือกที่กำหนด
6. **Leaderboard** — ใช้ getLeaderboard() ใน crm.js, รองรับ week/month/year
7. **Notifications** — LINE + Telegram, 4 types: new_lead, followup_reminder, new_proposal, sla_breach
8. **Cron** — ตั้งผ่าน Supabase Dashboard, sla-check ทุก 5 นาที
