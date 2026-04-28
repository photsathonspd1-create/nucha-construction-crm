# 🏗️ NUCHA INNOVATION — Construction CRM

> ระบบ CRM สำหรับบริษัทรับเหมาก่อสร้าง พร้อม Supabase backend

## ⚡ Quick Start

### 1. สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) → สร้าง project ใหม่
2. คัดลอก **Project URL** และ **Anon Key**

### 2. รัน Database Schema

1. เปิด Supabase Dashboard → **SQL Editor**
2. เปิดไฟล์ `supabase/schema.sql` → copy ทั้งหมด → paste → Run

### 3. ตั้งค่า Environment

1. เปิด `supabase/config.js`
2. แทนที่ `YOUR_PROJECT` และ `YOUR_ANON_KEY`:

```js
const SUPABASE_URL = 'https://abcdefghij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

### 4. สร้าง Admin User

ใน Supabase Dashboard → **Authentication** → **Users** → **Invite user**

หรือใช้ SQL:
```sql
-- ใน SQL Editor
SELECT auth.create_user('admin@nuchainnovation.com', 'your_password', '{"full_name": "Admin"}');
```

### 5. Deploy บน Hostinger

1. Upload ไฟล์ทั้งหมดไปยัง Hostinger (File Manager หรือ FTP)
2. **อย่า upload** โฟลเดอร์ `.git/` และ `supabase/functions/`
3. เปิดเว็บ → ทดสอบ form → ทดสอบ admin

### 6. ตั้งค่า Notifications (Optional)

#### LINE Notify
1. ไปที่ [notify-bot.line.me](https://notify-bot.line.me/my/)
2. สร้าง token ใหม่
3. Deploy Edge Function:
```bash
supabase functions deploy notify
supabase secrets set LINE_NOTIFY_TOKEN=your_token
```

#### Scheduled Functions
```bash
# Follow-up reminders (daily at 9 AM)
supabase functions deploy followup-reminder
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Daily summary (daily at 6 PM)  
supabase functions deploy daily-summary
```

---

## 📁 โครงสร้างไฟล์

```
nucha-crm/
├── index.html              ← หน้าเว็บหลัก (Landing page)
├── style.css               ← สไตล์หน้าเว็บ
├── script.js               ← JS หน้าเว็บ (form submission → Supabase)
├── admin.html              ← Admin Dashboard (protected)
├── admin.css               ← สไตล์ Admin
├── admin.js                ← Admin logic (async Supabase)
├── admin-login.html        ← หน้า Login
├── supabase/
│   ├── config.js           ← Supabase URL + Key
│   ├── crm.js              ← CRM module (all DB operations)
│   ├── auth.js             ← Authentication module
│   ├── schema.sql          ← Database schema + seed data
│   └── functions/
│       ├── notify/         ← Edge Function: LINE + Email notification
│       ├── followup-reminder/  ← Scheduled: daily follow-up check
│       └── daily-summary/      ← Scheduled: daily CRM summary
├── .env.example            ← Environment variables template
├── HANDOFF.md              ← Development handoff document
└── README.md               ← ไฟล์นี้
```

---

## 🔐 Security

- **Row Level Security (RLS)** เปิดใช้งานทุก table
- **Admin dashboard** ต้อง login ก่อนเข้า
- **Website form** สามารถ insert leads ได้โดยไม่ต้อง login (public insert policy)
- **Admin operations** ต้อง authenticated เท่านั้น

---

## 📊 Features

### Website (index.html)
- ✅ Multi-step booking form → Supabase
- ✅ Service selection + budget + appointment
- ✅ Auto notification เมื่อมี lead ใหม่

### Admin Dashboard (admin.html)
- ✅ Auth-gated login
- ✅ Dashboard stats (leads, closed, appointments, new)
- ✅ Leads management (CRUD, search, filter, status change)
- ✅ Pipeline view (6 stages kanban)
- ✅ Appointments view
- ✅ **ใบเสนอราคา (Proposals)** — สร้าง/แก้ไข/เปลี่ยนสถานะ
- ✅ **Follow-up system** — ดู overdue + mark done
- ✅ **Activity log** — บันทึกการเปลี่ยนแปลงทั้งหมด
- ✅ **Export CSV** — ส่งออกข้อมูล leads
- ✅ Notes per lead (with follow-up dates)

### Backend (Supabase)
- ✅ PostgreSQL database with RLS
- ✅ Auto lead scoring (DB function)
- ✅ Auto activity logging (DB trigger)
- ✅ Auto profile creation on signup
- ✅ Edge Functions for notifications

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML/CSS/JS + GSAP |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Hosting | Hostinger (static) |
| Notifications | LINE Notify + Email |
| Animations | GSAP 3.12.5 |

---

## 📝 License

Private — NUCHA INNOVATION Co., Ltd.
