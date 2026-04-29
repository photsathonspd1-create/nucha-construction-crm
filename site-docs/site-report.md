# 🏗️ NUCHA INNOVATION — Site Documentation

**Generated:** 29/4/2569 22:38:49
**URL:** http://localhost:3000
**Pages:** 10

---

## 📑 Table of Contents

1. [Landing Page](#landing-page) — /
2. [Login Page](#login-page) — /login
3. [Admin Dashboard](#admin-dashboard) — /admin
4. [Admin - Hero Editor](#admin-hero-editor) — /admin#edit-hero
5. [Admin - Services Editor](#admin-services-editor) — /admin#edit-services
6. [Admin - Leads Management](#admin-leads-management) — /admin#leads
7. [Admin - Reports](#admin-reports) — /admin#reports
8. [Admin - Users](#admin-users) — /admin#users
9. [Admin - Media Library](#admin-media-library) — /admin#media
10. [Service Detail Page](#service-detail-page) — /service.html

---

## 1. Landing Page

**Path:** `/`
**Description:** หน้าแรกเว็บไซต์ — Hero, Services, Portfolio, Testimonials

![Landing Page](screenshots/landing-page.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 11,302px |
| Images | 9 |
| Sections | 10 |
| Custom Cursor | ✅ |
| Scroll Progress | ✅ |

### 📦 Sections (10)

- `<section>` **สร้าง
                    
                    
                        ทุกความฝัน** (#home)
- `<section>` **เราไม่ได้สร้าง
                แค่อาคาร** (#break-scene)
- `<section>` **บริการของเรา** (#services)
- `<section>` **ขั้นตอนการทำงานที่คุณวางใจได้** (#story)
- `<section>` **ผลงานของเรา** (#portfolio)
- `<section>` **จองคิวปรึกษาฟรีไม่มีค่าใช้จ่าย** (#booking)
- `<section>` **stats** (#stats)
- `<section>` **เสียงจากลูกค้าจริง** (#trust)
- `<section>` **เริ่มต้นโครงการของคุณวันนี้** (#closing)
- `<section>` **trust-badges** (#trust-badges)

### 🧭 Navigation (10)

- **N
                NUCHAINNOVATION** → `#`
- **หน้าหลัก** → `#home` *(active)*
- **บริการ** → `#services`
- **กระบวนการ** → `#story`
- **ผลงาน** → `#portfolio`
- **จองคิว** → `#booking`
- **ติดต่อเรา** → `#contact`
- **🔑 เข้าสู่ระบบ** → `/login`
- **จองคิวปรึกษาฟรี** → `#booking`
- **** → `/login`

### 🔘 Buttons (11)

- **Menu** *(hidden)*
- **จองคิวปรึกษาฟรี** → `http://localhost:3000/#booking`
- **ดูบริการทั้งหมด** → `http://localhost:3000/#services`
- **ถัดไป**
- **ย้อนกลับ** *(hidden)*
- **ถัดไป** *(hidden)*
- **ย้อนกลับ** *(hidden)*
- **ส่งข้อมูลและจองคิว** *(hidden)*
- **จองคิวปรึกษาฟรี — ภายใน 24 ชม.** → `http://localhost:3000/#booking`
- **ส่งข้อมูล** *(hidden)*
- **1**

### 🔗 Links (30)

- **หน้าหลัก** → `#home`
- **บริการ** → `#services`
- **กระบวนการ** → `#story`
- **ผลงาน** → `#portfolio`
- **จองคิว** → `#booking`
- **ติดต่อเรา** → `#contact`
- **🔑 เข้าสู่ระบบ** → `/login`
- **จองคิวปรึกษาฟรี** → `#booking`
- **จองคิวปรึกษาฟรี** → `#booking`
- **ดูบริการทั้งหมด** → `#services`
- **เลื่อนลง** → `#break-scene`
- **ดูรายละเอียด** → `/service.html?key=construction`
- **จองคิว** → `#booking`
- **ดูรายละเอียด** → `/service.html?key=builtin`
- **จองคิว** → `#booking`
- **ดูรายละเอียด** → `/service.html?key=design`
- **จองคิว** → `#booking`
- **ดูรายละเอียด** → `/service.html?key=decoration`
- **จองคิว** → `#booking`
- **ดูรายละเอียด** → `/service.html?key=project-management`
- **จองคิว** → `#booking`
- **จองคิวปรึกษาฟรี — ภายใน 24 ชม.** → `#booking`
- **02-123-4567** → `tel:02-123-4567`
- **Line** → `https://line.me/ti/p/~nuchainnovation` *(external)*
- **หน้าหลัก** → `#home`
- **บริการ** → `#services`
- **ผลงาน** → `#portfolio`
- **จองคิว** → `#booking`
- **LINE** → `https://line.me/ti/p/~nuchainnovation` *(external)*
- **โทร** → `tel:02-123-4567`

### 📝 Forms (1)

**Form #bookingForm** (get http://localhost:3000/)

- `radio` **🏗️
                รับเหมาก่อสร้าง
                งบประมาณเริ่มต้น 500,000 บาท** *(required)*
- `radio` **🪑
                บิ้วอิน
                งบประมาณเริ่มต้น 200,000 บาท** *(required)*
- `radio` **✏️
                ออกแบบ
                งบประมาณเริ่มต้น 100,000 บาท** *(required)*
- `radio` **🎨
                ตกแต่ง
                งบประมาณเริ่มต้น 150,000 บาท** *(required)*
- `radio` **📋
                บริหารงานขายโครงการ
                งบประมาณตามขนาดโครงการ** *(required)*
- `radio` **💬
                อื่นๆ
                ปรึกษาเรื่องอื่น**
- `text` **ชื่อ-นามสกุล *** *(required)*
- `tel` **เบอร์โทรศัพท์ *** *(required)*
- `radio` **ต่ำกว่า 500K**
- `radio` **500K – 1M**
- `radio` **1M – 3M**
- `radio` **3M – 5M**
- `radio` **5M – 10M**
- `radio` **10M+**
- `textarea` **รายละเอียดเพิ่มเติม**
- `date` **วันที่สะดวก *** *(required)*
- `select-one` **เวลา *** *(required)*
- `radio` **เข้าดูหน้างาน**
- `radio` **วิดีโอคอล**
- `radio` **โทรศัพท์**

### ⚡ Interactive Elements (1)

- `toggle` **Menu**

---

## 2. Login Page

**Path:** `/login`
**Description:** หน้าเข้าสู่ระบบ Admin

![Login Page](screenshots/login-page.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 900px |
| Images | 8 |
| Sections | 0 |
| Custom Cursor | ❌ |
| Scroll Progress | ❌ |

### 📦 Sections (16)

- `<div>` **Dashboard** (#page-dashboard)
- `<div>` **⚙️ ตั้งค่าเว็บไซต์** (#page-edit-site) *(hidden)*
- `<div>` **🏠 Hero Section** (#page-edit-hero) *(hidden)*
- `<div>` **🔧 บริการ** (#page-edit-services) *(hidden)*
- `<div>` **📋 กระบวนการ** (#page-edit-process) *(hidden)*
- `<div>` **🖼️ ผลงาน** (#page-edit-portfolio) *(hidden)*
- `<div>` **⭐ รีวิวลูกค้า** (#page-edit-testimonials) *(hidden)*
- `<div>` **🔚 ปิดท้าย** (#page-edit-closing) *(hidden)*
- `<div>` **📎 Footer** (#page-edit-footer) *(hidden)*
- `<div>` **📑 เมนูนำทาง** (#page-edit-nav) *(hidden)*
- `<div>` **🔔 แจ้งเตือน** (#page-edit-notifications) *(hidden)*
- `<div>` **👥 Leads** (#page-leads) *(hidden)*
- `<div>` **📅 จองคิว** (#page-bookings) *(hidden)*
- `<div>` **📁 คลังรูปภาพ** (#page-media) *(hidden)*
- `<div>` **📈 รายงาน** (#page-reports) *(hidden)*
- `<div>` **👥 จัดการผู้ใช้** (#page-users) *(hidden)*

### 🧭 Navigation (16)

- **Dashboard** → `dashboard` *(active)*
- **⚙️ ตั้งค่าเว็บ** → `edit-site`
- **🏠 Hero** → `edit-hero`
- **🔧 บริการ** → `edit-services`
- **📋 กระบวนการ** → `edit-process`
- **🖼️ ผลงาน** → `edit-portfolio`
- **⭐ รีวิว** → `edit-testimonials`
- **🔚 ปิดท้าย** → `edit-closing`
- **📎 Footer** → `edit-footer`
- **📑 เมนูนำทาง** → `edit-nav`
- **🔔 แจ้งเตือน** → `edit-notifications`
- **👥 Leads0** → `leads`
- **📅 จองคิว0** → `bookings`
- **📈 รายงาน** → `reports`
- **👥 จัดการผู้ใช้** → `users`
- **📁 คลังรูปภาพ** → `media`

### 🔘 Buttons (58)

- **✕** *(hidden)*
- **🚪** onclick: `logout()`
- **☰** *(hidden)*
- **💾 บันทึก** *(hidden)* onclick: `saveSiteConfig()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('h_image')`
- **💾 บันทึก** *(hidden)* onclick: `saveHero()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มบริการ** *(hidden)* onclick: `addServiceItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveServices()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มขั้นตอน** *(hidden)* onclick: `addProcessStep()`
- **💾 บันทึก** *(hidden)* onclick: `saveProcess()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-3')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มผลงาน** *(hidden)* onclick: `addPortfolioItem()`
- **💾 บันทึก** *(hidden)* onclick: `savePortfolio()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มรีวิว** *(hidden)* onclick: `addTestimonial()`
- **💾 บันทึก** *(hidden)* onclick: `saveTestimonials()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มข้อรับประกัน** *(hidden)* onclick: `addGuarantee()`
- **💾 บันทึก** *(hidden)* onclick: `saveClosing()`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftQuickLinks', 'ft-ql')`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftServiceLinks', 'ft-sl')`
- **💾 บันทึก** *(hidden)* onclick: `saveFooter()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **+ เพิ่มเมนู** *(hidden)* onclick: `addNavItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveNav()`
- **💾 บันทึก** *(hidden)* onclick: `saveNotifications()`
- **🧪 ทดสอบส่ง** *(hidden)* onclick: `testNotification()`
- **📥 ส่งออก CSV** *(hidden)* onclick: `exportCSV()`
- **💾 สำรองข้อมูล** *(hidden)* onclick: `createBackup()`
- **➕ เพิ่มผู้ใช้** *(hidden)* onclick: `showAddUserModal()`
- **✕** *(hidden)* onclick: `closeModal()`

### 🔗 Links (2)

- **🌐** → `/`
- **notify-bot.line.me** → `https://notify-bot.line.me/my/` *(external)* *(new tab)*

### 📝 Forms (10)

**Form #siteConfigForm** (get http://localhost:3000/admin)

- `text` **sc_site_name**
- `text` **sc_site_tagline**
- `text` **sc_logo_text**
- `text` **sc_logo_full**
- `file` **file-sc_logo_url**
- `text` **url-sc_logo_url**
- `file` **file-sc_favicon**
- `text` **url-sc_favicon**
- `text` **sc_phone**
- `text` **sc_email**
- `text` **sc_address**
- `text` **sc_line_id**
- `text` **sc_facebook**
- `text` **sc_instagram**
- `text` **sc_copyright**

**Form #heroForm** (get http://localhost:3000/admin)

- `text` **h_badge**
- `text` **h_title1**
- `text` **h_title2**
- `text` **h_subtitle**
- `textarea` **h_desc**
- `text` **h_cta1**
- `text` **h_cta2**
- `file` **file-h_image**
- `text` **url-h_image**
- `text` **h_s1n**
- `text` **h_s1l**
- `text` **h_s2n**
- `text` **h_s2l**
- `text` **h_s3n**
- `text` **h_s3l**
- `text` **h_ft**
- `text` **h_fd**

**Form #servicesForm** (get http://localhost:3000/admin)

- `text` **sv_tag**
- `text` **sv_title**
- `textarea` **sv_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #processForm** (get http://localhost:3000/admin)

- `text` **pr_title**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-0**
- `text` **url-pr-step-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-1**
- `text` **url-pr-step-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-2**
- `text` **url-pr-step-img-2**

**Form #portfolioForm** (get http://localhost:3000/admin)

- `text` **pf_tag**
- `text` **pf_title**
- `textarea` **pf_desc**
- `file` **file-pf-item-img-0**
- `text` **url-pf-item-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-1**
- `text` **url-pf-item-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-2**
- `text` **url-pf-item-img-2**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-3**
- `text` **url-pf-item-img-3**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #testimonialsForm** (get http://localhost:3000/admin)

- `text` **tm_tag**
- `text` **tm_title**
- `textarea` **tm_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**

**Form #closingForm** (get http://localhost:3000/admin)

- `text` **cl_tag**
- `text` **cl_cta**
- `text` **cl_t1**
- `text` **cl_t2**
- `textarea` **cl_desc**
- `text` **cl_proof**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #footerForm** (get http://localhost:3000/admin)

- `textarea` **ft_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #navForm** (get http://localhost:3000/admin)

- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #notificationsForm** (get http://localhost:3000/admin)

- `text` **nt_line_token**
- `checkbox` **เปิดใช้การแจ้งเตือน**

### ⚡ Interactive Elements (17)

- `tab` **Dashboard** → `dashboard`
- `tab` **⚙️ ตั้งค่าเว็บ** → `edit-site`
- `tab` **🏠 Hero** → `edit-hero`
- `tab` **🔧 บริการ** → `edit-services`
- `tab` **📋 กระบวนการ** → `edit-process`
- `tab` **🖼️ ผลงาน** → `edit-portfolio`
- `tab` **⭐ รีวิว** → `edit-testimonials`
- `tab` **🔚 ปิดท้าย** → `edit-closing`
- `tab` **📎 Footer** → `edit-footer`
- `tab` **📑 เมนูนำทาง** → `edit-nav`
- `tab` **🔔 แจ้งเตือน** → `edit-notifications`
- `tab` **👥 Leads0** → `leads`
- `tab` **📅 จองคิว0** → `bookings`
- `tab` **📈 รายงาน** → `reports`
- `tab` **👥 จัดการผู้ใช้** → `users`
- `tab` **📁 คลังรูปภาพ** → `media`
- `modal` **(unnamed)**

---

## 3. Admin Dashboard

**Path:** `/admin`
**Description:** แผงควบคุม CMS — Dashboard, Leads, Pipeline

![Admin Dashboard](screenshots/admin-dashboard.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 900px |
| Images | 8 |
| Sections | 0 |
| Custom Cursor | ❌ |
| Scroll Progress | ❌ |

### 📦 Sections (16)

- `<div>` **Dashboard** (#page-dashboard)
- `<div>` **⚙️ ตั้งค่าเว็บไซต์** (#page-edit-site) *(hidden)*
- `<div>` **🏠 Hero Section** (#page-edit-hero) *(hidden)*
- `<div>` **🔧 บริการ** (#page-edit-services) *(hidden)*
- `<div>` **📋 กระบวนการ** (#page-edit-process) *(hidden)*
- `<div>` **🖼️ ผลงาน** (#page-edit-portfolio) *(hidden)*
- `<div>` **⭐ รีวิวลูกค้า** (#page-edit-testimonials) *(hidden)*
- `<div>` **🔚 ปิดท้าย** (#page-edit-closing) *(hidden)*
- `<div>` **📎 Footer** (#page-edit-footer) *(hidden)*
- `<div>` **📑 เมนูนำทาง** (#page-edit-nav) *(hidden)*
- `<div>` **🔔 แจ้งเตือน** (#page-edit-notifications) *(hidden)*
- `<div>` **👥 Leads** (#page-leads) *(hidden)*
- `<div>` **📅 จองคิว** (#page-bookings) *(hidden)*
- `<div>` **📁 คลังรูปภาพ** (#page-media) *(hidden)*
- `<div>` **📈 รายงาน** (#page-reports) *(hidden)*
- `<div>` **👥 จัดการผู้ใช้** (#page-users) *(hidden)*

### 🧭 Navigation (16)

- **Dashboard** → `dashboard` *(active)*
- **⚙️ ตั้งค่าเว็บ** → `edit-site`
- **🏠 Hero** → `edit-hero`
- **🔧 บริการ** → `edit-services`
- **📋 กระบวนการ** → `edit-process`
- **🖼️ ผลงาน** → `edit-portfolio`
- **⭐ รีวิว** → `edit-testimonials`
- **🔚 ปิดท้าย** → `edit-closing`
- **📎 Footer** → `edit-footer`
- **📑 เมนูนำทาง** → `edit-nav`
- **🔔 แจ้งเตือน** → `edit-notifications`
- **👥 Leads0** → `leads`
- **📅 จองคิว0** → `bookings`
- **📈 รายงาน** → `reports`
- **👥 จัดการผู้ใช้** → `users`
- **📁 คลังรูปภาพ** → `media`

### 🔘 Buttons (58)

- **✕** *(hidden)*
- **🚪** onclick: `logout()`
- **☰** *(hidden)*
- **💾 บันทึก** *(hidden)* onclick: `saveSiteConfig()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('h_image')`
- **💾 บันทึก** *(hidden)* onclick: `saveHero()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มบริการ** *(hidden)* onclick: `addServiceItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveServices()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มขั้นตอน** *(hidden)* onclick: `addProcessStep()`
- **💾 บันทึก** *(hidden)* onclick: `saveProcess()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-3')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มผลงาน** *(hidden)* onclick: `addPortfolioItem()`
- **💾 บันทึก** *(hidden)* onclick: `savePortfolio()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มรีวิว** *(hidden)* onclick: `addTestimonial()`
- **💾 บันทึก** *(hidden)* onclick: `saveTestimonials()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มข้อรับประกัน** *(hidden)* onclick: `addGuarantee()`
- **💾 บันทึก** *(hidden)* onclick: `saveClosing()`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftQuickLinks', 'ft-ql')`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftServiceLinks', 'ft-sl')`
- **💾 บันทึก** *(hidden)* onclick: `saveFooter()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **+ เพิ่มเมนู** *(hidden)* onclick: `addNavItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveNav()`
- **💾 บันทึก** *(hidden)* onclick: `saveNotifications()`
- **🧪 ทดสอบส่ง** *(hidden)* onclick: `testNotification()`
- **📥 ส่งออก CSV** *(hidden)* onclick: `exportCSV()`
- **💾 สำรองข้อมูล** *(hidden)* onclick: `createBackup()`
- **➕ เพิ่มผู้ใช้** *(hidden)* onclick: `showAddUserModal()`
- **✕** *(hidden)* onclick: `closeModal()`

### 🔗 Links (2)

- **🌐** → `/`
- **notify-bot.line.me** → `https://notify-bot.line.me/my/` *(external)* *(new tab)*

### 📝 Forms (10)

**Form #siteConfigForm** (get http://localhost:3000/admin)

- `text` **sc_site_name**
- `text` **sc_site_tagline**
- `text` **sc_logo_text**
- `text` **sc_logo_full**
- `file` **file-sc_logo_url**
- `text` **url-sc_logo_url**
- `file` **file-sc_favicon**
- `text` **url-sc_favicon**
- `text` **sc_phone**
- `text` **sc_email**
- `text` **sc_address**
- `text` **sc_line_id**
- `text` **sc_facebook**
- `text` **sc_instagram**
- `text` **sc_copyright**

**Form #heroForm** (get http://localhost:3000/admin)

- `text` **h_badge**
- `text` **h_title1**
- `text` **h_title2**
- `text` **h_subtitle**
- `textarea` **h_desc**
- `text` **h_cta1**
- `text` **h_cta2**
- `file` **file-h_image**
- `text` **url-h_image**
- `text` **h_s1n**
- `text` **h_s1l**
- `text` **h_s2n**
- `text` **h_s2l**
- `text` **h_s3n**
- `text` **h_s3l**
- `text` **h_ft**
- `text` **h_fd**

**Form #servicesForm** (get http://localhost:3000/admin)

- `text` **sv_tag**
- `text` **sv_title**
- `textarea` **sv_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #processForm** (get http://localhost:3000/admin)

- `text` **pr_title**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-0**
- `text` **url-pr-step-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-1**
- `text` **url-pr-step-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-2**
- `text` **url-pr-step-img-2**

**Form #portfolioForm** (get http://localhost:3000/admin)

- `text` **pf_tag**
- `text` **pf_title**
- `textarea` **pf_desc**
- `file` **file-pf-item-img-0**
- `text` **url-pf-item-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-1**
- `text` **url-pf-item-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-2**
- `text` **url-pf-item-img-2**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-3**
- `text` **url-pf-item-img-3**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #testimonialsForm** (get http://localhost:3000/admin)

- `text` **tm_tag**
- `text` **tm_title**
- `textarea` **tm_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**

**Form #closingForm** (get http://localhost:3000/admin)

- `text` **cl_tag**
- `text` **cl_cta**
- `text` **cl_t1**
- `text` **cl_t2**
- `textarea` **cl_desc**
- `text` **cl_proof**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #footerForm** (get http://localhost:3000/admin)

- `textarea` **ft_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #navForm** (get http://localhost:3000/admin)

- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #notificationsForm** (get http://localhost:3000/admin)

- `text` **nt_line_token**
- `checkbox` **เปิดใช้การแจ้งเตือน**

### ⚡ Interactive Elements (17)

- `tab` **Dashboard** → `dashboard`
- `tab` **⚙️ ตั้งค่าเว็บ** → `edit-site`
- `tab` **🏠 Hero** → `edit-hero`
- `tab` **🔧 บริการ** → `edit-services`
- `tab` **📋 กระบวนการ** → `edit-process`
- `tab` **🖼️ ผลงาน** → `edit-portfolio`
- `tab` **⭐ รีวิว** → `edit-testimonials`
- `tab` **🔚 ปิดท้าย** → `edit-closing`
- `tab` **📎 Footer** → `edit-footer`
- `tab` **📑 เมนูนำทาง** → `edit-nav`
- `tab` **🔔 แจ้งเตือน** → `edit-notifications`
- `tab` **👥 Leads0** → `leads`
- `tab` **📅 จองคิว0** → `bookings`
- `tab` **📈 รายงาน** → `reports`
- `tab` **👥 จัดการผู้ใช้** → `users`
- `tab` **📁 คลังรูปภาพ** → `media`
- `modal` **(unnamed)**

---

## 4. Admin - Hero Editor

**Path:** `/admin#edit-hero`
**Description:** แก้ไขส่วน Hero

![Admin - Hero Editor](screenshots/admin-hero-editor.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 1,676px |
| Images | 8 |
| Sections | 0 |
| Custom Cursor | ❌ |
| Scroll Progress | ❌ |

### 📦 Sections (16)

- `<div>` **Dashboard** (#page-dashboard) *(hidden)*
- `<div>` **⚙️ ตั้งค่าเว็บไซต์** (#page-edit-site) *(hidden)*
- `<div>` **🏠 Hero Section** (#page-edit-hero)
- `<div>` **🔧 บริการ** (#page-edit-services) *(hidden)*
- `<div>` **📋 กระบวนการ** (#page-edit-process) *(hidden)*
- `<div>` **🖼️ ผลงาน** (#page-edit-portfolio) *(hidden)*
- `<div>` **⭐ รีวิวลูกค้า** (#page-edit-testimonials) *(hidden)*
- `<div>` **🔚 ปิดท้าย** (#page-edit-closing) *(hidden)*
- `<div>` **📎 Footer** (#page-edit-footer) *(hidden)*
- `<div>` **📑 เมนูนำทาง** (#page-edit-nav) *(hidden)*
- `<div>` **🔔 แจ้งเตือน** (#page-edit-notifications) *(hidden)*
- `<div>` **👥 Leads** (#page-leads) *(hidden)*
- `<div>` **📅 จองคิว** (#page-bookings) *(hidden)*
- `<div>` **📁 คลังรูปภาพ** (#page-media) *(hidden)*
- `<div>` **📈 รายงาน** (#page-reports) *(hidden)*
- `<div>` **👥 จัดการผู้ใช้** (#page-users) *(hidden)*

### 🧭 Navigation (16)

- **Dashboard** → `dashboard`
- **⚙️ ตั้งค่าเว็บ** → `edit-site`
- **🏠 Hero** → `edit-hero` *(active)*
- **🔧 บริการ** → `edit-services`
- **📋 กระบวนการ** → `edit-process`
- **🖼️ ผลงาน** → `edit-portfolio`
- **⭐ รีวิว** → `edit-testimonials`
- **🔚 ปิดท้าย** → `edit-closing`
- **📎 Footer** → `edit-footer`
- **📑 เมนูนำทาง** → `edit-nav`
- **🔔 แจ้งเตือน** → `edit-notifications`
- **👥 Leads0** → `leads`
- **📅 จองคิว0** → `bookings`
- **📈 รายงาน** → `reports`
- **👥 จัดการผู้ใช้** → `users`
- **📁 คลังรูปภาพ** → `media`

### 🔘 Buttons (58)

- **✕** *(hidden)*
- **🚪** onclick: `logout()`
- **☰** *(hidden)*
- **💾 บันทึก** *(hidden)* onclick: `saveSiteConfig()`
- **✕** onclick: `event.stopPropagation();clearImage('h_image')`
- **💾 บันทึก** onclick: `saveHero()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มบริการ** *(hidden)* onclick: `addServiceItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveServices()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มขั้นตอน** *(hidden)* onclick: `addProcessStep()`
- **💾 บันทึก** *(hidden)* onclick: `saveProcess()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-3')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มผลงาน** *(hidden)* onclick: `addPortfolioItem()`
- **💾 บันทึก** *(hidden)* onclick: `savePortfolio()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มรีวิว** *(hidden)* onclick: `addTestimonial()`
- **💾 บันทึก** *(hidden)* onclick: `saveTestimonials()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มข้อรับประกัน** *(hidden)* onclick: `addGuarantee()`
- **💾 บันทึก** *(hidden)* onclick: `saveClosing()`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftQuickLinks', 'ft-ql')`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftServiceLinks', 'ft-sl')`
- **💾 บันทึก** *(hidden)* onclick: `saveFooter()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **+ เพิ่มเมนู** *(hidden)* onclick: `addNavItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveNav()`
- **💾 บันทึก** *(hidden)* onclick: `saveNotifications()`
- **🧪 ทดสอบส่ง** *(hidden)* onclick: `testNotification()`
- **📥 ส่งออก CSV** *(hidden)* onclick: `exportCSV()`
- **💾 สำรองข้อมูล** *(hidden)* onclick: `createBackup()`
- **➕ เพิ่มผู้ใช้** *(hidden)* onclick: `showAddUserModal()`
- **✕** *(hidden)* onclick: `closeModal()`

### 🔗 Links (2)

- **🌐** → `/`
- **notify-bot.line.me** → `https://notify-bot.line.me/my/` *(external)* *(new tab)*

### 📝 Forms (10)

**Form #siteConfigForm** (get http://localhost:3000/admin#edit-hero)

- `text` **sc_site_name**
- `text` **sc_site_tagline**
- `text` **sc_logo_text**
- `text` **sc_logo_full**
- `file` **file-sc_logo_url**
- `text` **url-sc_logo_url**
- `file` **file-sc_favicon**
- `text` **url-sc_favicon**
- `text` **sc_phone**
- `text` **sc_email**
- `text` **sc_address**
- `text` **sc_line_id**
- `text` **sc_facebook**
- `text` **sc_instagram**
- `text` **sc_copyright**

**Form #heroForm** (get http://localhost:3000/admin#edit-hero)

- `text` **h_badge**
- `text` **h_title1**
- `text` **h_title2**
- `text` **h_subtitle**
- `textarea` **h_desc**
- `text` **h_cta1**
- `text` **h_cta2**
- `file` **file-h_image**
- `text` **url-h_image**
- `text` **h_s1n**
- `text` **h_s1l**
- `text` **h_s2n**
- `text` **h_s2l**
- `text` **h_s3n**
- `text` **h_s3l**
- `text` **h_ft**
- `text` **h_fd**

**Form #servicesForm** (get http://localhost:3000/admin#edit-hero)

- `text` **sv_tag**
- `text` **sv_title**
- `textarea` **sv_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #processForm** (get http://localhost:3000/admin#edit-hero)

- `text` **pr_title**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-0**
- `text` **url-pr-step-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-1**
- `text` **url-pr-step-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-2**
- `text` **url-pr-step-img-2**

**Form #portfolioForm** (get http://localhost:3000/admin#edit-hero)

- `text` **pf_tag**
- `text` **pf_title**
- `textarea` **pf_desc**
- `file` **file-pf-item-img-0**
- `text` **url-pf-item-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-1**
- `text` **url-pf-item-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-2**
- `text` **url-pf-item-img-2**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-3**
- `text` **url-pf-item-img-3**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #testimonialsForm** (get http://localhost:3000/admin#edit-hero)

- `text` **tm_tag**
- `text` **tm_title**
- `textarea` **tm_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**

**Form #closingForm** (get http://localhost:3000/admin#edit-hero)

- `text` **cl_tag**
- `text` **cl_cta**
- `text` **cl_t1**
- `text` **cl_t2**
- `textarea` **cl_desc**
- `text` **cl_proof**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #footerForm** (get http://localhost:3000/admin#edit-hero)

- `textarea` **ft_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #navForm** (get http://localhost:3000/admin#edit-hero)

- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #notificationsForm** (get http://localhost:3000/admin#edit-hero)

- `text` **nt_line_token**
- `checkbox` **เปิดใช้การแจ้งเตือน**

### ⚡ Interactive Elements (17)

- `tab` **Dashboard** → `dashboard`
- `tab` **⚙️ ตั้งค่าเว็บ** → `edit-site`
- `tab` **🏠 Hero** → `edit-hero`
- `tab` **🔧 บริการ** → `edit-services`
- `tab` **📋 กระบวนการ** → `edit-process`
- `tab` **🖼️ ผลงาน** → `edit-portfolio`
- `tab` **⭐ รีวิว** → `edit-testimonials`
- `tab` **🔚 ปิดท้าย** → `edit-closing`
- `tab` **📎 Footer** → `edit-footer`
- `tab` **📑 เมนูนำทาง** → `edit-nav`
- `tab` **🔔 แจ้งเตือน** → `edit-notifications`
- `tab` **👥 Leads0** → `leads`
- `tab` **📅 จองคิว0** → `bookings`
- `tab` **📈 รายงาน** → `reports`
- `tab` **👥 จัดการผู้ใช้** → `users`
- `tab` **📁 คลังรูปภาพ** → `media`
- `modal` **(unnamed)**

---

## 5. Admin - Services Editor

**Path:** `/admin#edit-services`
**Description:** แก้ไขบริการ

![Admin - Services Editor](screenshots/admin-services-editor.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 1,090px |
| Images | 8 |
| Sections | 0 |
| Custom Cursor | ❌ |
| Scroll Progress | ❌ |

### 📦 Sections (16)

- `<div>` **Dashboard** (#page-dashboard) *(hidden)*
- `<div>` **⚙️ ตั้งค่าเว็บไซต์** (#page-edit-site) *(hidden)*
- `<div>` **🏠 Hero Section** (#page-edit-hero) *(hidden)*
- `<div>` **🔧 บริการ** (#page-edit-services)
- `<div>` **📋 กระบวนการ** (#page-edit-process) *(hidden)*
- `<div>` **🖼️ ผลงาน** (#page-edit-portfolio) *(hidden)*
- `<div>` **⭐ รีวิวลูกค้า** (#page-edit-testimonials) *(hidden)*
- `<div>` **🔚 ปิดท้าย** (#page-edit-closing) *(hidden)*
- `<div>` **📎 Footer** (#page-edit-footer) *(hidden)*
- `<div>` **📑 เมนูนำทาง** (#page-edit-nav) *(hidden)*
- `<div>` **🔔 แจ้งเตือน** (#page-edit-notifications) *(hidden)*
- `<div>` **👥 Leads** (#page-leads) *(hidden)*
- `<div>` **📅 จองคิว** (#page-bookings) *(hidden)*
- `<div>` **📁 คลังรูปภาพ** (#page-media) *(hidden)*
- `<div>` **📈 รายงาน** (#page-reports) *(hidden)*
- `<div>` **👥 จัดการผู้ใช้** (#page-users) *(hidden)*

### 🧭 Navigation (16)

- **Dashboard** → `dashboard`
- **⚙️ ตั้งค่าเว็บ** → `edit-site`
- **🏠 Hero** → `edit-hero`
- **🔧 บริการ** → `edit-services` *(active)*
- **📋 กระบวนการ** → `edit-process`
- **🖼️ ผลงาน** → `edit-portfolio`
- **⭐ รีวิว** → `edit-testimonials`
- **🔚 ปิดท้าย** → `edit-closing`
- **📎 Footer** → `edit-footer`
- **📑 เมนูนำทาง** → `edit-nav`
- **🔔 แจ้งเตือน** → `edit-notifications`
- **👥 Leads0** → `leads`
- **📅 จองคิว0** → `bookings`
- **📈 รายงาน** → `reports`
- **👥 จัดการผู้ใช้** → `users`
- **📁 คลังรูปภาพ** → `media`

### 🔘 Buttons (58)

- **✕** *(hidden)*
- **🚪** onclick: `logout()`
- **☰** *(hidden)*
- **💾 บันทึก** *(hidden)* onclick: `saveSiteConfig()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('h_image')`
- **💾 บันทึก** *(hidden)* onclick: `saveHero()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มบริการ** onclick: `addServiceItem()`
- **💾 บันทึก** onclick: `saveServices()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มขั้นตอน** *(hidden)* onclick: `addProcessStep()`
- **💾 บันทึก** *(hidden)* onclick: `saveProcess()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-3')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มผลงาน** *(hidden)* onclick: `addPortfolioItem()`
- **💾 บันทึก** *(hidden)* onclick: `savePortfolio()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มรีวิว** *(hidden)* onclick: `addTestimonial()`
- **💾 บันทึก** *(hidden)* onclick: `saveTestimonials()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มข้อรับประกัน** *(hidden)* onclick: `addGuarantee()`
- **💾 บันทึก** *(hidden)* onclick: `saveClosing()`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftQuickLinks', 'ft-ql')`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftServiceLinks', 'ft-sl')`
- **💾 บันทึก** *(hidden)* onclick: `saveFooter()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **+ เพิ่มเมนู** *(hidden)* onclick: `addNavItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveNav()`
- **💾 บันทึก** *(hidden)* onclick: `saveNotifications()`
- **🧪 ทดสอบส่ง** *(hidden)* onclick: `testNotification()`
- **📥 ส่งออก CSV** *(hidden)* onclick: `exportCSV()`
- **💾 สำรองข้อมูล** *(hidden)* onclick: `createBackup()`
- **➕ เพิ่มผู้ใช้** *(hidden)* onclick: `showAddUserModal()`
- **✕** *(hidden)* onclick: `closeModal()`

### 🔗 Links (2)

- **🌐** → `/`
- **notify-bot.line.me** → `https://notify-bot.line.me/my/` *(external)* *(new tab)*

### 📝 Forms (10)

**Form #siteConfigForm** (get http://localhost:3000/admin#edit-services)

- `text` **sc_site_name**
- `text` **sc_site_tagline**
- `text` **sc_logo_text**
- `text` **sc_logo_full**
- `file` **file-sc_logo_url**
- `text` **url-sc_logo_url**
- `file` **file-sc_favicon**
- `text` **url-sc_favicon**
- `text` **sc_phone**
- `text` **sc_email**
- `text` **sc_address**
- `text` **sc_line_id**
- `text` **sc_facebook**
- `text` **sc_instagram**
- `text` **sc_copyright**

**Form #heroForm** (get http://localhost:3000/admin#edit-services)

- `text` **h_badge**
- `text` **h_title1**
- `text` **h_title2**
- `text` **h_subtitle**
- `textarea` **h_desc**
- `text` **h_cta1**
- `text` **h_cta2**
- `file` **file-h_image**
- `text` **url-h_image**
- `text` **h_s1n**
- `text` **h_s1l**
- `text` **h_s2n**
- `text` **h_s2l**
- `text` **h_s3n**
- `text` **h_s3l**
- `text` **h_ft**
- `text` **h_fd**

**Form #servicesForm** (get http://localhost:3000/admin#edit-services)

- `text` **sv_tag**
- `text` **sv_title**
- `textarea` **sv_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #processForm** (get http://localhost:3000/admin#edit-services)

- `text` **pr_title**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-0**
- `text` **url-pr-step-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-1**
- `text` **url-pr-step-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-2**
- `text` **url-pr-step-img-2**

**Form #portfolioForm** (get http://localhost:3000/admin#edit-services)

- `text` **pf_tag**
- `text` **pf_title**
- `textarea` **pf_desc**
- `file` **file-pf-item-img-0**
- `text` **url-pf-item-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-1**
- `text` **url-pf-item-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-2**
- `text` **url-pf-item-img-2**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-3**
- `text` **url-pf-item-img-3**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #testimonialsForm** (get http://localhost:3000/admin#edit-services)

- `text` **tm_tag**
- `text` **tm_title**
- `textarea` **tm_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**

**Form #closingForm** (get http://localhost:3000/admin#edit-services)

- `text` **cl_tag**
- `text` **cl_cta**
- `text` **cl_t1**
- `text` **cl_t2**
- `textarea` **cl_desc**
- `text` **cl_proof**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #footerForm** (get http://localhost:3000/admin#edit-services)

- `textarea` **ft_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #navForm** (get http://localhost:3000/admin#edit-services)

- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #notificationsForm** (get http://localhost:3000/admin#edit-services)

- `text` **nt_line_token**
- `checkbox` **เปิดใช้การแจ้งเตือน**

### ⚡ Interactive Elements (17)

- `tab` **Dashboard** → `dashboard`
- `tab` **⚙️ ตั้งค่าเว็บ** → `edit-site`
- `tab` **🏠 Hero** → `edit-hero`
- `tab` **🔧 บริการ** → `edit-services`
- `tab` **📋 กระบวนการ** → `edit-process`
- `tab` **🖼️ ผลงาน** → `edit-portfolio`
- `tab` **⭐ รีวิว** → `edit-testimonials`
- `tab` **🔚 ปิดท้าย** → `edit-closing`
- `tab` **📎 Footer** → `edit-footer`
- `tab` **📑 เมนูนำทาง** → `edit-nav`
- `tab` **🔔 แจ้งเตือน** → `edit-notifications`
- `tab` **👥 Leads0** → `leads`
- `tab` **📅 จองคิว0** → `bookings`
- `tab` **📈 รายงาน** → `reports`
- `tab` **👥 จัดการผู้ใช้** → `users`
- `tab` **📁 คลังรูปภาพ** → `media`
- `modal` **(unnamed)**

---

## 6. Admin - Leads Management

**Path:** `/admin#leads`
**Description:** จัดการลูกค้าเป้าหมาย

![Admin - Leads Management](screenshots/admin-leads-management.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 900px |
| Images | 8 |
| Sections | 0 |
| Custom Cursor | ❌ |
| Scroll Progress | ❌ |

### 📦 Sections (16)

- `<div>` **Dashboard** (#page-dashboard) *(hidden)*
- `<div>` **⚙️ ตั้งค่าเว็บไซต์** (#page-edit-site) *(hidden)*
- `<div>` **🏠 Hero Section** (#page-edit-hero) *(hidden)*
- `<div>` **🔧 บริการ** (#page-edit-services) *(hidden)*
- `<div>` **📋 กระบวนการ** (#page-edit-process) *(hidden)*
- `<div>` **🖼️ ผลงาน** (#page-edit-portfolio) *(hidden)*
- `<div>` **⭐ รีวิวลูกค้า** (#page-edit-testimonials) *(hidden)*
- `<div>` **🔚 ปิดท้าย** (#page-edit-closing) *(hidden)*
- `<div>` **📎 Footer** (#page-edit-footer) *(hidden)*
- `<div>` **📑 เมนูนำทาง** (#page-edit-nav) *(hidden)*
- `<div>` **🔔 แจ้งเตือน** (#page-edit-notifications) *(hidden)*
- `<div>` **👥 Leads** (#page-leads)
- `<div>` **📅 จองคิว** (#page-bookings) *(hidden)*
- `<div>` **📁 คลังรูปภาพ** (#page-media) *(hidden)*
- `<div>` **📈 รายงาน** (#page-reports) *(hidden)*
- `<div>` **👥 จัดการผู้ใช้** (#page-users) *(hidden)*

### 🧭 Navigation (16)

- **Dashboard** → `dashboard`
- **⚙️ ตั้งค่าเว็บ** → `edit-site`
- **🏠 Hero** → `edit-hero`
- **🔧 บริการ** → `edit-services`
- **📋 กระบวนการ** → `edit-process`
- **🖼️ ผลงาน** → `edit-portfolio`
- **⭐ รีวิว** → `edit-testimonials`
- **🔚 ปิดท้าย** → `edit-closing`
- **📎 Footer** → `edit-footer`
- **📑 เมนูนำทาง** → `edit-nav`
- **🔔 แจ้งเตือน** → `edit-notifications`
- **👥 Leads0** → `leads` *(active)*
- **📅 จองคิว0** → `bookings`
- **📈 รายงาน** → `reports`
- **👥 จัดการผู้ใช้** → `users`
- **📁 คลังรูปภาพ** → `media`

### 🔘 Buttons (58)

- **✕** *(hidden)*
- **🚪** onclick: `logout()`
- **☰** *(hidden)*
- **💾 บันทึก** *(hidden)* onclick: `saveSiteConfig()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('h_image')`
- **💾 บันทึก** *(hidden)* onclick: `saveHero()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มบริการ** *(hidden)* onclick: `addServiceItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveServices()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มขั้นตอน** *(hidden)* onclick: `addProcessStep()`
- **💾 บันทึก** *(hidden)* onclick: `saveProcess()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-3')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มผลงาน** *(hidden)* onclick: `addPortfolioItem()`
- **💾 บันทึก** *(hidden)* onclick: `savePortfolio()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มรีวิว** *(hidden)* onclick: `addTestimonial()`
- **💾 บันทึก** *(hidden)* onclick: `saveTestimonials()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มข้อรับประกัน** *(hidden)* onclick: `addGuarantee()`
- **💾 บันทึก** *(hidden)* onclick: `saveClosing()`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftQuickLinks', 'ft-ql')`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftServiceLinks', 'ft-sl')`
- **💾 บันทึก** *(hidden)* onclick: `saveFooter()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **+ เพิ่มเมนู** *(hidden)* onclick: `addNavItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveNav()`
- **💾 บันทึก** *(hidden)* onclick: `saveNotifications()`
- **🧪 ทดสอบส่ง** *(hidden)* onclick: `testNotification()`
- **📥 ส่งออก CSV** *(hidden)* onclick: `exportCSV()`
- **💾 สำรองข้อมูล** *(hidden)* onclick: `createBackup()`
- **➕ เพิ่มผู้ใช้** *(hidden)* onclick: `showAddUserModal()`
- **✕** *(hidden)* onclick: `closeModal()`

### 🔗 Links (2)

- **🌐** → `/`
- **notify-bot.line.me** → `https://notify-bot.line.me/my/` *(external)* *(new tab)*

### 📝 Forms (10)

**Form #siteConfigForm** (get http://localhost:3000/admin#leads)

- `text` **sc_site_name**
- `text` **sc_site_tagline**
- `text` **sc_logo_text**
- `text` **sc_logo_full**
- `file` **file-sc_logo_url**
- `text` **url-sc_logo_url**
- `file` **file-sc_favicon**
- `text` **url-sc_favicon**
- `text` **sc_phone**
- `text` **sc_email**
- `text` **sc_address**
- `text` **sc_line_id**
- `text` **sc_facebook**
- `text` **sc_instagram**
- `text` **sc_copyright**

**Form #heroForm** (get http://localhost:3000/admin#leads)

- `text` **h_badge**
- `text` **h_title1**
- `text` **h_title2**
- `text` **h_subtitle**
- `textarea` **h_desc**
- `text` **h_cta1**
- `text` **h_cta2**
- `file` **file-h_image**
- `text` **url-h_image**
- `text` **h_s1n**
- `text` **h_s1l**
- `text` **h_s2n**
- `text` **h_s2l**
- `text` **h_s3n**
- `text` **h_s3l**
- `text` **h_ft**
- `text` **h_fd**

**Form #servicesForm** (get http://localhost:3000/admin#leads)

- `text` **sv_tag**
- `text` **sv_title**
- `textarea` **sv_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #processForm** (get http://localhost:3000/admin#leads)

- `text` **pr_title**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-0**
- `text` **url-pr-step-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-1**
- `text` **url-pr-step-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-2**
- `text` **url-pr-step-img-2**

**Form #portfolioForm** (get http://localhost:3000/admin#leads)

- `text` **pf_tag**
- `text` **pf_title**
- `textarea` **pf_desc**
- `file` **file-pf-item-img-0**
- `text` **url-pf-item-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-1**
- `text` **url-pf-item-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-2**
- `text` **url-pf-item-img-2**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-3**
- `text` **url-pf-item-img-3**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #testimonialsForm** (get http://localhost:3000/admin#leads)

- `text` **tm_tag**
- `text` **tm_title**
- `textarea` **tm_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**

**Form #closingForm** (get http://localhost:3000/admin#leads)

- `text` **cl_tag**
- `text` **cl_cta**
- `text` **cl_t1**
- `text` **cl_t2**
- `textarea` **cl_desc**
- `text` **cl_proof**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #footerForm** (get http://localhost:3000/admin#leads)

- `textarea` **ft_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #navForm** (get http://localhost:3000/admin#leads)

- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #notificationsForm** (get http://localhost:3000/admin#leads)

- `text` **nt_line_token**
- `checkbox` **เปิดใช้การแจ้งเตือน**

### ⚡ Interactive Elements (17)

- `tab` **Dashboard** → `dashboard`
- `tab` **⚙️ ตั้งค่าเว็บ** → `edit-site`
- `tab` **🏠 Hero** → `edit-hero`
- `tab` **🔧 บริการ** → `edit-services`
- `tab` **📋 กระบวนการ** → `edit-process`
- `tab` **🖼️ ผลงาน** → `edit-portfolio`
- `tab` **⭐ รีวิว** → `edit-testimonials`
- `tab` **🔚 ปิดท้าย** → `edit-closing`
- `tab` **📎 Footer** → `edit-footer`
- `tab` **📑 เมนูนำทาง** → `edit-nav`
- `tab` **🔔 แจ้งเตือน** → `edit-notifications`
- `tab` **👥 Leads0** → `leads`
- `tab` **📅 จองคิว0** → `bookings`
- `tab` **📈 รายงาน** → `reports`
- `tab` **👥 จัดการผู้ใช้** → `users`
- `tab` **📁 คลังรูปภาพ** → `media`
- `modal` **(unnamed)**

---

## 7. Admin - Reports

**Path:** `/admin#reports`
**Description:** รายงานสรุป

![Admin - Reports](screenshots/admin-reports.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 900px |
| Images | 8 |
| Sections | 0 |
| Custom Cursor | ❌ |
| Scroll Progress | ❌ |

### 📦 Sections (16)

- `<div>` **Dashboard** (#page-dashboard) *(hidden)*
- `<div>` **⚙️ ตั้งค่าเว็บไซต์** (#page-edit-site) *(hidden)*
- `<div>` **🏠 Hero Section** (#page-edit-hero) *(hidden)*
- `<div>` **🔧 บริการ** (#page-edit-services) *(hidden)*
- `<div>` **📋 กระบวนการ** (#page-edit-process) *(hidden)*
- `<div>` **🖼️ ผลงาน** (#page-edit-portfolio) *(hidden)*
- `<div>` **⭐ รีวิวลูกค้า** (#page-edit-testimonials) *(hidden)*
- `<div>` **🔚 ปิดท้าย** (#page-edit-closing) *(hidden)*
- `<div>` **📎 Footer** (#page-edit-footer) *(hidden)*
- `<div>` **📑 เมนูนำทาง** (#page-edit-nav) *(hidden)*
- `<div>` **🔔 แจ้งเตือน** (#page-edit-notifications) *(hidden)*
- `<div>` **👥 Leads** (#page-leads) *(hidden)*
- `<div>` **📅 จองคิว** (#page-bookings) *(hidden)*
- `<div>` **📁 คลังรูปภาพ** (#page-media) *(hidden)*
- `<div>` **📈 รายงาน** (#page-reports)
- `<div>` **👥 จัดการผู้ใช้** (#page-users) *(hidden)*

### 🧭 Navigation (16)

- **Dashboard** → `dashboard`
- **⚙️ ตั้งค่าเว็บ** → `edit-site`
- **🏠 Hero** → `edit-hero`
- **🔧 บริการ** → `edit-services`
- **📋 กระบวนการ** → `edit-process`
- **🖼️ ผลงาน** → `edit-portfolio`
- **⭐ รีวิว** → `edit-testimonials`
- **🔚 ปิดท้าย** → `edit-closing`
- **📎 Footer** → `edit-footer`
- **📑 เมนูนำทาง** → `edit-nav`
- **🔔 แจ้งเตือน** → `edit-notifications`
- **👥 Leads0** → `leads`
- **📅 จองคิว0** → `bookings`
- **📈 รายงาน** → `reports` *(active)*
- **👥 จัดการผู้ใช้** → `users`
- **📁 คลังรูปภาพ** → `media`

### 🔘 Buttons (58)

- **✕** *(hidden)*
- **🚪** onclick: `logout()`
- **☰** *(hidden)*
- **💾 บันทึก** *(hidden)* onclick: `saveSiteConfig()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('h_image')`
- **💾 บันทึก** *(hidden)* onclick: `saveHero()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มบริการ** *(hidden)* onclick: `addServiceItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveServices()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มขั้นตอน** *(hidden)* onclick: `addProcessStep()`
- **💾 บันทึก** *(hidden)* onclick: `saveProcess()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-3')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มผลงาน** *(hidden)* onclick: `addPortfolioItem()`
- **💾 บันทึก** *(hidden)* onclick: `savePortfolio()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มรีวิว** *(hidden)* onclick: `addTestimonial()`
- **💾 บันทึก** *(hidden)* onclick: `saveTestimonials()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มข้อรับประกัน** *(hidden)* onclick: `addGuarantee()`
- **💾 บันทึก** *(hidden)* onclick: `saveClosing()`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftQuickLinks', 'ft-ql')`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftServiceLinks', 'ft-sl')`
- **💾 บันทึก** *(hidden)* onclick: `saveFooter()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **+ เพิ่มเมนู** *(hidden)* onclick: `addNavItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveNav()`
- **💾 บันทึก** *(hidden)* onclick: `saveNotifications()`
- **🧪 ทดสอบส่ง** *(hidden)* onclick: `testNotification()`
- **📥 ส่งออก CSV** onclick: `exportCSV()`
- **💾 สำรองข้อมูล** onclick: `createBackup()`
- **➕ เพิ่มผู้ใช้** *(hidden)* onclick: `showAddUserModal()`
- **✕** *(hidden)* onclick: `closeModal()`

### 🔗 Links (2)

- **🌐** → `/`
- **notify-bot.line.me** → `https://notify-bot.line.me/my/` *(external)* *(new tab)*

### 📝 Forms (10)

**Form #siteConfigForm** (get http://localhost:3000/admin#reports)

- `text` **sc_site_name**
- `text` **sc_site_tagline**
- `text` **sc_logo_text**
- `text` **sc_logo_full**
- `file` **file-sc_logo_url**
- `text` **url-sc_logo_url**
- `file` **file-sc_favicon**
- `text` **url-sc_favicon**
- `text` **sc_phone**
- `text` **sc_email**
- `text` **sc_address**
- `text` **sc_line_id**
- `text` **sc_facebook**
- `text` **sc_instagram**
- `text` **sc_copyright**

**Form #heroForm** (get http://localhost:3000/admin#reports)

- `text` **h_badge**
- `text` **h_title1**
- `text` **h_title2**
- `text` **h_subtitle**
- `textarea` **h_desc**
- `text` **h_cta1**
- `text` **h_cta2**
- `file` **file-h_image**
- `text` **url-h_image**
- `text` **h_s1n**
- `text` **h_s1l**
- `text` **h_s2n**
- `text` **h_s2l**
- `text` **h_s3n**
- `text` **h_s3l**
- `text` **h_ft**
- `text` **h_fd**

**Form #servicesForm** (get http://localhost:3000/admin#reports)

- `text` **sv_tag**
- `text` **sv_title**
- `textarea` **sv_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #processForm** (get http://localhost:3000/admin#reports)

- `text` **pr_title**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-0**
- `text` **url-pr-step-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-1**
- `text` **url-pr-step-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-2**
- `text` **url-pr-step-img-2**

**Form #portfolioForm** (get http://localhost:3000/admin#reports)

- `text` **pf_tag**
- `text` **pf_title**
- `textarea` **pf_desc**
- `file` **file-pf-item-img-0**
- `text` **url-pf-item-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-1**
- `text` **url-pf-item-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-2**
- `text` **url-pf-item-img-2**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-3**
- `text` **url-pf-item-img-3**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #testimonialsForm** (get http://localhost:3000/admin#reports)

- `text` **tm_tag**
- `text` **tm_title**
- `textarea` **tm_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**

**Form #closingForm** (get http://localhost:3000/admin#reports)

- `text` **cl_tag**
- `text` **cl_cta**
- `text` **cl_t1**
- `text` **cl_t2**
- `textarea` **cl_desc**
- `text` **cl_proof**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #footerForm** (get http://localhost:3000/admin#reports)

- `textarea` **ft_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #navForm** (get http://localhost:3000/admin#reports)

- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #notificationsForm** (get http://localhost:3000/admin#reports)

- `text` **nt_line_token**
- `checkbox` **เปิดใช้การแจ้งเตือน**

### ⚡ Interactive Elements (17)

- `tab` **Dashboard** → `dashboard`
- `tab` **⚙️ ตั้งค่าเว็บ** → `edit-site`
- `tab` **🏠 Hero** → `edit-hero`
- `tab` **🔧 บริการ** → `edit-services`
- `tab` **📋 กระบวนการ** → `edit-process`
- `tab` **🖼️ ผลงาน** → `edit-portfolio`
- `tab` **⭐ รีวิว** → `edit-testimonials`
- `tab` **🔚 ปิดท้าย** → `edit-closing`
- `tab` **📎 Footer** → `edit-footer`
- `tab` **📑 เมนูนำทาง** → `edit-nav`
- `tab` **🔔 แจ้งเตือน** → `edit-notifications`
- `tab` **👥 Leads0** → `leads`
- `tab` **📅 จองคิว0** → `bookings`
- `tab` **📈 รายงาน** → `reports`
- `tab` **👥 จัดการผู้ใช้** → `users`
- `tab` **📁 คลังรูปภาพ** → `media`
- `modal` **(unnamed)**

---

## 8. Admin - Users

**Path:** `/admin#users`
**Description:** จัดการผู้ใช้

![Admin - Users](screenshots/admin-users.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 900px |
| Images | 8 |
| Sections | 0 |
| Custom Cursor | ❌ |
| Scroll Progress | ❌ |

### 📦 Sections (16)

- `<div>` **Dashboard** (#page-dashboard) *(hidden)*
- `<div>` **⚙️ ตั้งค่าเว็บไซต์** (#page-edit-site) *(hidden)*
- `<div>` **🏠 Hero Section** (#page-edit-hero) *(hidden)*
- `<div>` **🔧 บริการ** (#page-edit-services) *(hidden)*
- `<div>` **📋 กระบวนการ** (#page-edit-process) *(hidden)*
- `<div>` **🖼️ ผลงาน** (#page-edit-portfolio) *(hidden)*
- `<div>` **⭐ รีวิวลูกค้า** (#page-edit-testimonials) *(hidden)*
- `<div>` **🔚 ปิดท้าย** (#page-edit-closing) *(hidden)*
- `<div>` **📎 Footer** (#page-edit-footer) *(hidden)*
- `<div>` **📑 เมนูนำทาง** (#page-edit-nav) *(hidden)*
- `<div>` **🔔 แจ้งเตือน** (#page-edit-notifications) *(hidden)*
- `<div>` **👥 Leads** (#page-leads) *(hidden)*
- `<div>` **📅 จองคิว** (#page-bookings) *(hidden)*
- `<div>` **📁 คลังรูปภาพ** (#page-media) *(hidden)*
- `<div>` **📈 รายงาน** (#page-reports) *(hidden)*
- `<div>` **👥 จัดการผู้ใช้** (#page-users)

### 🧭 Navigation (16)

- **Dashboard** → `dashboard`
- **⚙️ ตั้งค่าเว็บ** → `edit-site`
- **🏠 Hero** → `edit-hero`
- **🔧 บริการ** → `edit-services`
- **📋 กระบวนการ** → `edit-process`
- **🖼️ ผลงาน** → `edit-portfolio`
- **⭐ รีวิว** → `edit-testimonials`
- **🔚 ปิดท้าย** → `edit-closing`
- **📎 Footer** → `edit-footer`
- **📑 เมนูนำทาง** → `edit-nav`
- **🔔 แจ้งเตือน** → `edit-notifications`
- **👥 Leads0** → `leads`
- **📅 จองคิว0** → `bookings`
- **📈 รายงาน** → `reports`
- **👥 จัดการผู้ใช้** → `users` *(active)*
- **📁 คลังรูปภาพ** → `media`

### 🔘 Buttons (58)

- **✕** *(hidden)*
- **🚪** onclick: `logout()`
- **☰** *(hidden)*
- **💾 บันทึก** *(hidden)* onclick: `saveSiteConfig()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('h_image')`
- **💾 บันทึก** *(hidden)* onclick: `saveHero()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มบริการ** *(hidden)* onclick: `addServiceItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveServices()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มขั้นตอน** *(hidden)* onclick: `addProcessStep()`
- **💾 บันทึก** *(hidden)* onclick: `saveProcess()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-3')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มผลงาน** *(hidden)* onclick: `addPortfolioItem()`
- **💾 บันทึก** *(hidden)* onclick: `savePortfolio()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มรีวิว** *(hidden)* onclick: `addTestimonial()`
- **💾 บันทึก** *(hidden)* onclick: `saveTestimonials()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มข้อรับประกัน** *(hidden)* onclick: `addGuarantee()`
- **💾 บันทึก** *(hidden)* onclick: `saveClosing()`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftQuickLinks', 'ft-ql')`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftServiceLinks', 'ft-sl')`
- **💾 บันทึก** *(hidden)* onclick: `saveFooter()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **+ เพิ่มเมนู** *(hidden)* onclick: `addNavItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveNav()`
- **💾 บันทึก** *(hidden)* onclick: `saveNotifications()`
- **🧪 ทดสอบส่ง** *(hidden)* onclick: `testNotification()`
- **📥 ส่งออก CSV** *(hidden)* onclick: `exportCSV()`
- **💾 สำรองข้อมูล** *(hidden)* onclick: `createBackup()`
- **➕ เพิ่มผู้ใช้** onclick: `showAddUserModal()`
- **✕** *(hidden)* onclick: `closeModal()`

### 🔗 Links (2)

- **🌐** → `/`
- **notify-bot.line.me** → `https://notify-bot.line.me/my/` *(external)* *(new tab)*

### 📝 Forms (10)

**Form #siteConfigForm** (get http://localhost:3000/admin#users)

- `text` **sc_site_name**
- `text` **sc_site_tagline**
- `text` **sc_logo_text**
- `text` **sc_logo_full**
- `file` **file-sc_logo_url**
- `text` **url-sc_logo_url**
- `file` **file-sc_favicon**
- `text` **url-sc_favicon**
- `text` **sc_phone**
- `text` **sc_email**
- `text` **sc_address**
- `text` **sc_line_id**
- `text` **sc_facebook**
- `text` **sc_instagram**
- `text` **sc_copyright**

**Form #heroForm** (get http://localhost:3000/admin#users)

- `text` **h_badge**
- `text` **h_title1**
- `text` **h_title2**
- `text` **h_subtitle**
- `textarea` **h_desc**
- `text` **h_cta1**
- `text` **h_cta2**
- `file` **file-h_image**
- `text` **url-h_image**
- `text` **h_s1n**
- `text` **h_s1l**
- `text` **h_s2n**
- `text` **h_s2l**
- `text` **h_s3n**
- `text` **h_s3l**
- `text` **h_ft**
- `text` **h_fd**

**Form #servicesForm** (get http://localhost:3000/admin#users)

- `text` **sv_tag**
- `text` **sv_title**
- `textarea` **sv_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #processForm** (get http://localhost:3000/admin#users)

- `text` **pr_title**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-0**
- `text` **url-pr-step-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-1**
- `text` **url-pr-step-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-2**
- `text` **url-pr-step-img-2**

**Form #portfolioForm** (get http://localhost:3000/admin#users)

- `text` **pf_tag**
- `text` **pf_title**
- `textarea` **pf_desc**
- `file` **file-pf-item-img-0**
- `text` **url-pf-item-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-1**
- `text` **url-pf-item-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-2**
- `text` **url-pf-item-img-2**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-3**
- `text` **url-pf-item-img-3**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #testimonialsForm** (get http://localhost:3000/admin#users)

- `text` **tm_tag**
- `text` **tm_title**
- `textarea` **tm_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**

**Form #closingForm** (get http://localhost:3000/admin#users)

- `text` **cl_tag**
- `text` **cl_cta**
- `text` **cl_t1**
- `text` **cl_t2**
- `textarea` **cl_desc**
- `text` **cl_proof**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #footerForm** (get http://localhost:3000/admin#users)

- `textarea` **ft_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #navForm** (get http://localhost:3000/admin#users)

- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #notificationsForm** (get http://localhost:3000/admin#users)

- `text` **nt_line_token**
- `checkbox` **เปิดใช้การแจ้งเตือน**

### ⚡ Interactive Elements (17)

- `tab` **Dashboard** → `dashboard`
- `tab` **⚙️ ตั้งค่าเว็บ** → `edit-site`
- `tab` **🏠 Hero** → `edit-hero`
- `tab` **🔧 บริการ** → `edit-services`
- `tab` **📋 กระบวนการ** → `edit-process`
- `tab` **🖼️ ผลงาน** → `edit-portfolio`
- `tab` **⭐ รีวิว** → `edit-testimonials`
- `tab` **🔚 ปิดท้าย** → `edit-closing`
- `tab` **📎 Footer** → `edit-footer`
- `tab` **📑 เมนูนำทาง** → `edit-nav`
- `tab` **🔔 แจ้งเตือน** → `edit-notifications`
- `tab` **👥 Leads0** → `leads`
- `tab` **📅 จองคิว0** → `bookings`
- `tab` **📈 รายงาน** → `reports`
- `tab` **👥 จัดการผู้ใช้** → `users`
- `tab` **📁 คลังรูปภาพ** → `media`
- `modal` **(unnamed)**

---

## 9. Admin - Media Library

**Path:** `/admin#media`
**Description:** คลังรูปภาพ

![Admin - Media Library](screenshots/admin-media-library.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 900px |
| Images | 8 |
| Sections | 0 |
| Custom Cursor | ❌ |
| Scroll Progress | ❌ |

### 📦 Sections (16)

- `<div>` **Dashboard** (#page-dashboard) *(hidden)*
- `<div>` **⚙️ ตั้งค่าเว็บไซต์** (#page-edit-site) *(hidden)*
- `<div>` **🏠 Hero Section** (#page-edit-hero) *(hidden)*
- `<div>` **🔧 บริการ** (#page-edit-services) *(hidden)*
- `<div>` **📋 กระบวนการ** (#page-edit-process) *(hidden)*
- `<div>` **🖼️ ผลงาน** (#page-edit-portfolio) *(hidden)*
- `<div>` **⭐ รีวิวลูกค้า** (#page-edit-testimonials) *(hidden)*
- `<div>` **🔚 ปิดท้าย** (#page-edit-closing) *(hidden)*
- `<div>` **📎 Footer** (#page-edit-footer) *(hidden)*
- `<div>` **📑 เมนูนำทาง** (#page-edit-nav) *(hidden)*
- `<div>` **🔔 แจ้งเตือน** (#page-edit-notifications) *(hidden)*
- `<div>` **👥 Leads** (#page-leads) *(hidden)*
- `<div>` **📅 จองคิว** (#page-bookings) *(hidden)*
- `<div>` **📁 คลังรูปภาพ** (#page-media)
- `<div>` **📈 รายงาน** (#page-reports) *(hidden)*
- `<div>` **👥 จัดการผู้ใช้** (#page-users) *(hidden)*

### 🧭 Navigation (16)

- **Dashboard** → `dashboard`
- **⚙️ ตั้งค่าเว็บ** → `edit-site`
- **🏠 Hero** → `edit-hero`
- **🔧 บริการ** → `edit-services`
- **📋 กระบวนการ** → `edit-process`
- **🖼️ ผลงาน** → `edit-portfolio`
- **⭐ รีวิว** → `edit-testimonials`
- **🔚 ปิดท้าย** → `edit-closing`
- **📎 Footer** → `edit-footer`
- **📑 เมนูนำทาง** → `edit-nav`
- **🔔 แจ้งเตือน** → `edit-notifications`
- **👥 Leads0** → `leads`
- **📅 จองคิว0** → `bookings`
- **📈 รายงาน** → `reports`
- **👥 จัดการผู้ใช้** → `users`
- **📁 คลังรูปภาพ** → `media` *(active)*

### 🔘 Buttons (58)

- **✕** *(hidden)*
- **🚪** onclick: `logout()`
- **☰** *(hidden)*
- **💾 บันทึก** *(hidden)* onclick: `saveSiteConfig()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('h_image')`
- **💾 บันทึก** *(hidden)* onclick: `saveHero()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มบริการ** *(hidden)* onclick: `addServiceItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveServices()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pr-step-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มขั้นตอน** *(hidden)* onclick: `addProcessStep()`
- **💾 บันทึก** *(hidden)* onclick: `saveProcess()`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-0')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-1')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-2')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **✕** *(hidden)* onclick: `event.stopPropagation();clearImage('pf-item-img-3')`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มผลงาน** *(hidden)* onclick: `addPortfolioItem()`
- **💾 บันทึก** *(hidden)* onclick: `savePortfolio()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มรีวิว** *(hidden)* onclick: `addTestimonial()`
- **💾 บันทึก** *(hidden)* onclick: `saveTestimonials()`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **🗑️ ลบ** *(hidden)* onclick: `removeRepeatable(this)`
- **+ เพิ่มข้อรับประกัน** *(hidden)* onclick: `addGuarantee()`
- **💾 บันทึก** *(hidden)* onclick: `saveClosing()`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftQuickLinks', 'ft-ql')`
- **+ เพิ่มลิงก์** *(hidden)* onclick: `addFooterLink('ftServiceLinks', 'ft-sl')`
- **💾 บันทึก** *(hidden)* onclick: `saveFooter()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **🗑️** *(hidden)* onclick: `this.closest('.form-row').remove()`
- **+ เพิ่มเมนู** *(hidden)* onclick: `addNavItem()`
- **💾 บันทึก** *(hidden)* onclick: `saveNav()`
- **💾 บันทึก** *(hidden)* onclick: `saveNotifications()`
- **🧪 ทดสอบส่ง** *(hidden)* onclick: `testNotification()`
- **📥 ส่งออก CSV** *(hidden)* onclick: `exportCSV()`
- **💾 สำรองข้อมูล** *(hidden)* onclick: `createBackup()`
- **➕ เพิ่มผู้ใช้** *(hidden)* onclick: `showAddUserModal()`
- **✕** *(hidden)* onclick: `closeModal()`

### 🔗 Links (2)

- **🌐** → `/`
- **notify-bot.line.me** → `https://notify-bot.line.me/my/` *(external)* *(new tab)*

### 📝 Forms (10)

**Form #siteConfigForm** (get http://localhost:3000/admin#media)

- `text` **sc_site_name**
- `text` **sc_site_tagline**
- `text` **sc_logo_text**
- `text` **sc_logo_full**
- `file` **file-sc_logo_url**
- `text` **url-sc_logo_url**
- `file` **file-sc_favicon**
- `text` **url-sc_favicon**
- `text` **sc_phone**
- `text` **sc_email**
- `text` **sc_address**
- `text` **sc_line_id**
- `text` **sc_facebook**
- `text` **sc_instagram**
- `text` **sc_copyright**

**Form #heroForm** (get http://localhost:3000/admin#media)

- `text` **h_badge**
- `text` **h_title1**
- `text` **h_title2**
- `text` **h_subtitle**
- `textarea` **h_desc**
- `text` **h_cta1**
- `text` **h_cta2**
- `file` **file-h_image**
- `text` **url-h_image**
- `text` **h_s1n**
- `text` **h_s1l**
- `text` **h_s2n**
- `text` **h_s2l**
- `text` **h_s3n**
- `text` **h_s3l**
- `text` **h_ft**
- `text` **h_fd**

**Form #servicesForm** (get http://localhost:3000/admin#media)

- `text` **sv_tag**
- `text` **sv_title**
- `textarea` **sv_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #processForm** (get http://localhost:3000/admin#media)

- `text` **pr_title**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-0**
- `text` **url-pr-step-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-1**
- `text` **url-pr-step-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `file` **file-pr-step-img-2**
- `text` **url-pr-step-img-2**

**Form #portfolioForm** (get http://localhost:3000/admin#media)

- `text` **pf_tag**
- `text` **pf_title**
- `textarea` **pf_desc**
- `file` **file-pf-item-img-0**
- `text` **url-pf-item-img-0**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-1**
- `text` **url-pf-item-img-1**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-2**
- `text` **url-pf-item-img-2**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `file` **file-pf-item-img-3**
- `text` **url-pf-item-img-3**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #testimonialsForm** (get http://localhost:3000/admin#media)

- `text` **tm_tag**
- `text` **tm_title**
- `textarea` **tm_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `textarea` **(unnamed)**
- `number` **(unnamed)**

**Form #closingForm** (get http://localhost:3000/admin#media)

- `text` **cl_tag**
- `text` **cl_cta**
- `text` **cl_t1**
- `text` **cl_t2**
- `textarea` **cl_desc**
- `text` **cl_proof**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #footerForm** (get http://localhost:3000/admin#media)

- `textarea` **ft_desc**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**

**Form #navForm** (get http://localhost:3000/admin#media)

- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**
- `text` **(unnamed)**
- `text` **(unnamed)**
- `select-one` **(unnamed)**

**Form #notificationsForm** (get http://localhost:3000/admin#media)

- `text` **nt_line_token**
- `checkbox` **เปิดใช้การแจ้งเตือน**

### ⚡ Interactive Elements (17)

- `tab` **Dashboard** → `dashboard`
- `tab` **⚙️ ตั้งค่าเว็บ** → `edit-site`
- `tab` **🏠 Hero** → `edit-hero`
- `tab` **🔧 บริการ** → `edit-services`
- `tab` **📋 กระบวนการ** → `edit-process`
- `tab` **🖼️ ผลงาน** → `edit-portfolio`
- `tab` **⭐ รีวิว** → `edit-testimonials`
- `tab` **🔚 ปิดท้าย** → `edit-closing`
- `tab` **📎 Footer** → `edit-footer`
- `tab` **📑 เมนูนำทาง** → `edit-nav`
- `tab` **🔔 แจ้งเตือน** → `edit-notifications`
- `tab` **👥 Leads0** → `leads`
- `tab` **📅 จองคิว0** → `bookings`
- `tab` **📈 รายงาน** → `reports`
- `tab` **👥 จัดการผู้ใช้** → `users`
- `tab` **📁 คลังรูปภาพ** → `media`
- `modal` **(unnamed)**

---

## 10. Service Detail Page

**Path:** `/service.html`
**Description:** หน้ารายละเอียดบริการ

![Service Detail Page](screenshots/service-detail-page.png)

### 📊 Page Stats

| Metric | Value |
|--------|-------|
| Height | 11,302px |
| Images | 9 |
| Sections | 10 |
| Custom Cursor | ✅ |
| Scroll Progress | ✅ |

### 📦 Sections (10)

- `<section>` **สร้าง
                    
                    
                        ทุกความฝัน** (#home)
- `<section>` **เราไม่ได้สร้าง
                แค่อาคาร** (#break-scene)
- `<section>` **บริการของเรา** (#services)
- `<section>` **ขั้นตอนการทำงานที่คุณวางใจได้** (#story)
- `<section>` **ผลงานของเรา** (#portfolio)
- `<section>` **จองคิวปรึกษาฟรีไม่มีค่าใช้จ่าย** (#booking)
- `<section>` **stats** (#stats)
- `<section>` **เสียงจากลูกค้าจริง** (#trust)
- `<section>` **เริ่มต้นโครงการของคุณวันนี้** (#closing)
- `<section>` **trust-badges** (#trust-badges)

### 🧭 Navigation (10)

- **N
                NUCHAINNOVATION** → `#`
- **หน้าหลัก** → `#home`
- **บริการ** → `#services` *(active)*
- **กระบวนการ** → `#story`
- **ผลงาน** → `#portfolio`
- **จองคิว** → `#booking`
- **ติดต่อเรา** → `#contact`
- **🔑 เข้าสู่ระบบ** → `/login`
- **จองคิวปรึกษาฟรี** → `#booking`
- **** → `/login`

### 🔘 Buttons (11)

- **Menu** *(hidden)*
- **จองคิวปรึกษาฟรี** → `http://localhost:3000/#booking`
- **ดูบริการทั้งหมด** → `http://localhost:3000/#services`
- **ถัดไป**
- **ย้อนกลับ** *(hidden)*
- **ถัดไป** *(hidden)*
- **ย้อนกลับ** *(hidden)*
- **ส่งข้อมูลและจองคิว** *(hidden)*
- **จองคิวปรึกษาฟรี — ภายใน 24 ชม.** → `http://localhost:3000/#booking`
- **ส่งข้อมูล** *(hidden)*
- **1**

### 🔗 Links (30)

- **หน้าหลัก** → `#home`
- **บริการ** → `#services`
- **กระบวนการ** → `#story`
- **ผลงาน** → `#portfolio`
- **จองคิว** → `#booking`
- **ติดต่อเรา** → `#contact`
- **🔑 เข้าสู่ระบบ** → `/login`
- **จองคิวปรึกษาฟรี** → `#booking`
- **จองคิวปรึกษาฟรี** → `#booking`
- **ดูบริการทั้งหมด** → `#services`
- **เลื่อนลง** → `#break-scene`
- **ดูรายละเอียด** → `/service.html?key=construction`
- **จองคิว** → `#booking`
- **ดูรายละเอียด** → `/service.html?key=builtin`
- **จองคิว** → `#booking`
- **ดูรายละเอียด** → `/service.html?key=design`
- **จองคิว** → `#booking`
- **ดูรายละเอียด** → `/service.html?key=decoration`
- **จองคิว** → `#booking`
- **ดูรายละเอียด** → `/service.html?key=project-management`
- **จองคิว** → `#booking`
- **จองคิวปรึกษาฟรี — ภายใน 24 ชม.** → `#booking`
- **02-123-4567** → `tel:02-123-4567`
- **Line** → `https://line.me/ti/p/~nuchainnovation` *(external)*
- **หน้าหลัก** → `#home`
- **บริการ** → `#services`
- **ผลงาน** → `#portfolio`
- **จองคิว** → `#booking`
- **LINE** → `https://line.me/ti/p/~nuchainnovation` *(external)*
- **โทร** → `tel:02-123-4567`

### 📝 Forms (1)

**Form #bookingForm** (get http://localhost:3000/#services)

- `radio` **🏗️
                รับเหมาก่อสร้าง
                งบประมาณเริ่มต้น 500,000 บาท** *(required)*
- `radio` **🪑
                บิ้วอิน
                งบประมาณเริ่มต้น 200,000 บาท** *(required)*
- `radio` **✏️
                ออกแบบ
                งบประมาณเริ่มต้น 100,000 บาท** *(required)*
- `radio` **🎨
                ตกแต่ง
                งบประมาณเริ่มต้น 150,000 บาท** *(required)*
- `radio` **📋
                บริหารงานขายโครงการ
                งบประมาณตามขนาดโครงการ** *(required)*
- `radio` **💬
                อื่นๆ
                ปรึกษาเรื่องอื่น**
- `text` **ชื่อ-นามสกุล *** *(required)*
- `tel` **เบอร์โทรศัพท์ *** *(required)*
- `radio` **ต่ำกว่า 500K**
- `radio` **500K – 1M**
- `radio` **1M – 3M**
- `radio` **3M – 5M**
- `radio` **5M – 10M**
- `radio` **10M+**
- `textarea` **รายละเอียดเพิ่มเติม**
- `date` **วันที่สะดวก *** *(required)*
- `select-one` **เวลา *** *(required)*
- `radio` **เข้าดูหน้างาน**
- `radio` **วิดีโอคอล**
- `radio` **โทรศัพท์**

### ⚡ Interactive Elements (1)

- `toggle` **Menu**

---

