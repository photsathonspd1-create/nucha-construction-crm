const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'nucha.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===== CREATE TABLES =====

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT DEFAULT 'Admin',
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_key TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    service_type TEXT NOT NULL DEFAULT 'อื่นๆ',
    budget_range TEXT DEFAULT 'ไม่ระบุ',
    message TEXT,
    status TEXT NOT NULL DEFAULT 'New Lead',
    score REAL DEFAULT 0,
    source TEXT DEFAULT 'website',
    assigned_to INTEGER,
    first_contact_at DATETIME,
    lost_reason TEXT,
    appointment_date TEXT,
    appointment_time TEXT,
    meeting_type TEXT DEFAULT 'onsite',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    note_type TEXT DEFAULT 'general',
    follow_up_date TEXT,
    follow_up_done INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    action TEXT NOT NULL,
    details TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    proposal_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    items TEXT DEFAULT '[]',
    subtotal REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL DEFAULT 0,
    valid_until TEXT,
    notes TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS nav_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS footer_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name TEXT NOT NULL,
    label TEXT NOT NULL,
    href TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_start INTEGER DEFAULT 0,
    price_unit TEXT DEFAULT 'รายการ',
    icon TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_start INTEGER DEFAULT 0,
    features TEXT,
    is_featured INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ===== SEED DEFAULT CONTENT =====

const defaultContent = {
  site_config: {
    site_name: 'NUCHA INNOVATION',
    site_tagline: 'บริการออกแบบ ก่อสร้าง ตกแต่งครบวงจร',
    logo_text: 'N',
    logo_full: 'NUCHA\nINNOVATION',
    logo_url: '',
    phone: '02-123-4567',
    email: 'info@nuchainnovation.com',
    address: '123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110',
    line_id: '@nuchainnovation',
    facebook_url: '#',
    instagram_url: '#',
    copyright: '© 2024 Nucha Innovation Co., Ltd. All Rights Reserved.',
    favicon: ''
  },
  hero: {
    badge: 'บริษัทชั้นนำด้านการออกแบบและก่อสร้าง',
    title_line1: 'สร้าง',
    title_line2: 'ทุกความฝัน',
    subtitle: 'รับเหมาก่อสร้าง · บิ้วอิน · ออกแบบ · ตกแต่ง · บริหารโครงการ',
    description: 'ทีมสถาปนิกและวิศวกรมืออาชีพ ดูแลครบทุกขั้นตอน ตั้งแต่ออกแบบจนส่งมอบ พร้อมรับประกันคุณภาพ',
    cta_primary: 'จองคิวปรึกษาฟรี',
    cta_secondary: 'ดูบริการทั้งหมด',
    stat1_number: '120+',
    stat1_label: 'โครงการสำเร็จ',
    stat2_number: '10+',
    stat2_label: 'ปีประสบการณ์',
    stat3_number: '500+',
    stat3_label: 'ลูกค้าไว้วางใจ',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85',
    float_title: 'ครบวงจร',
    float_desc: 'ออกแบบ → ก่อสร้าง → ส่งมอบ'
  },
  services: {
    section_tag: 'OUR SERVICES',
    section_title: 'บริการของเรา',
    section_desc: 'เลือกบริการที่ตรงกับความต้องการของคุณ — ปรึกษาฟรี ไม่มีค่าใช้จ่าย',
    items: [
      { icon: '🏗️', name: 'รับเหมาก่อสร้าง', desc: 'รับเหมาก่อสร้างครบวงจร บ้าน อาคาร สำนักงาน โรงงาน ด้วยทีมวิศวกรมืออาชีพ', budget: 'งบประมาณเริ่มต้น 500,000 บาท', key: 'construction', image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80' },
      { icon: '🪑', name: 'บิ้วอิน', desc: 'ออกแบบและติดตั้งเฟอร์นิเจอร์บิ้วอิน ครัว ตู้เสื้อผ้า ชั้นวาง วัสดุคุณภาพสูง', budget: 'งบประมาณเริ่มต้น 200,000 บาท', key: 'builtin', image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80' },
      { icon: '✏️', name: 'ออกแบบ', desc: 'ออกแบบสถาปัตยกรรม ตกแต่งภายใน 3D Rendering ครบวงจร โดยทีมดีไซเนอร์มืออาชีพ', budget: 'งบประมาณเริ่มต้น 100,000 บาท', key: 'design', image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80' },
      { icon: '🎨', name: 'ตกแต่ง', desc: 'ตกแต่งภายในและภายนอก ปรับปรุง รีโนเวท เปลี่ยนพื้นที่เดิมให้สวยงามทันสมัย', budget: 'งบประมาณเริ่มต้น 150,000 บาท', key: 'decoration', image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80' },
      { icon: '📋', name: 'บริหารงานขายโครงการ', desc: 'บริหารจัดการโครงการก่อสร้างครบวงจร วางแผน ควบคุมงาน ตรวจสอบคุณภาพ ดูแลงบประมาณ', budget: 'งบประมาณตามขนาดโครงการ', key: 'project-management', image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80' },
      { icon: '🪧', name: 'ออกแบบป้าย', desc: 'ออกแบบและผลิตป้ายทุกประเภท ป้ายโครงการ ป้ายบริษัท ป้ายโฆษณา ป้ายไฟ LED', budget: 'งบประมาณเริ่มต้น 2,000 บาท', key: 'signage', image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80' },
      { icon: '🌳', name: 'ออกแบบภูมิทัศน์', desc: 'ออกแบบสวนและพื้นที่กลางแจ้ง สวนโมเดิร์น ญี่ปุ่น Tropical ระบบไฟสนาม', budget: 'งบประมาณเริ่มต้น 5,000 บาท', key: 'landscape', image_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80' },
      { icon: '📐', name: 'เขียนแบบและเอกสาร', desc: 'เขียนแบบก่อสร้าง แบบขออนุญาต BOQ ประมาณราคา TOR ครบถ้วน', budget: 'งบประมาณเริ่มต้น 3,000 บาท', key: 'drafting', image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80' },
      { icon: '🖼️', name: 'งาน Visual / 3D', desc: '3D Perspective Walkthrough Virtual Tour 360° Floor Plan Moodboard', budget: 'งบประมาณเริ่มต้น 2,000 บาท', key: 'visualization', image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80' }
    ]
  },
  process: {
    section_tag: 'OUR PROCESS',
    section_title: 'ขั้นตอนการทำงาน\nที่คุณวางใจได้',
    steps: [
      { tag: 'STEP 01', title: 'รับฟัง\nและวางแผน', desc: 'พูดคุยความต้องการ สำรวจหน้างาน ประเมินงบประมาณ วางแผนงานอย่างละเอียด', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&q=85' },
      { tag: 'STEP 02', title: 'ออกแบบ\nและเสนอราคา', desc: 'ออกแบบตามความต้องการ นำเสนอแบบ 3D พร้อมใบเสนอราคาที่โปร่งใส ไม่มีบวกราคา', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=700&q=85' },
      { tag: 'STEP 03', title: 'ก่อสร้าง\nและส่งมอบ', desc: 'ก่อสร้างตามมาตรฐาน ตรวจสอบทุกขั้นตอน ส่งมอบงานคุณภาพ พร้อมรับประกัน', image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=700&q=85' }
    ]
  },
  portfolio: {
    section_tag: 'OUR WORKS',
    section_title: 'ผลงานของเรา',
    section_desc: 'รวมโครงการที่เราภูมิใจ — ทุกชิ้นงานคือมาตรฐานของเรา',
    items: [
      { image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=85', tag: 'รับเหมาก่อสร้าง', title: 'บ้านโมเดิร์น วิลล่า', desc: 'สุขุมวิท 50 · งบ 8.5 ล้านบาท', size: 'large' },
      { image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&q=85', tag: 'บิ้วอิน + ตกแต่ง', title: 'คอนโด ลักชัวรี่', desc: '', size: 'normal' },
      { image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500&q=85', tag: 'รีโนเวท', title: 'บ้านเก่า → ใหม่', desc: '', size: 'normal' },
      { image: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=500&q=85', tag: 'ออกแบบ + บริหาร', title: 'ออฟฟิศ ดีไซน์', desc: '', size: 'normal' }
    ]
  },
  testimonials: {
    section_tag: 'TRUSTED BY 500+ CLIENTS',
    section_title: 'เสียงจากลูกค้าจริง',
    section_desc: 'ลูกค้ากว่า 500+ ครอบครัวไว้วางใจให้เราดูแล',
    items: [
      { stars: 5, quote: 'สร้างบ้านกับ Nucha ประทับใจมาก ทีมงานมืออาชีพ ไม่บวกราคา ส่งมอบตรงเวลา แนะนำเลยครับ', name: 'สมชาย วงศ์สุข', role: 'รับเหมาก่อสร้าง · สุขุมวิท 50', avatar: 'สม' },
      { stars: 5, quote: 'บิ้วอินครัวสวยมาก วัสดุดี ทีมช่างทำงานเรียบร้อย ราคาสมเหตุสมผล คุ้มค่าจริงๆ ค่ะ', name: 'ประภา ศรีสุวรรณ', role: 'บิ้วอิน · พระราม 9', avatar: 'ปร' },
      { stars: 5, quote: 'ออกแบบได้ตรงใจมาก ฟังทุกความต้องการ ดีไซเนอร์เข้าใจ lifestyle เราจริงๆ ประทับใจครับ', name: 'วิชัย พัฒนาทรัพย์', role: 'ออกแบบ + ตกแต่ง · ลาดพร้าว 71', avatar: 'วิ' }
    ]
  },
  closing: {
    tag: 'START YOUR PROJECT',
    title_line1: 'เริ่มต้นโครงการ',
    title_line2: 'ของคุณวันนี้',
    description: 'ทีมงานพร้อมดูแลคุณตั้งแต่วันแรก — ปรึกษาฟรี ไม่มีค่าใช้จ่าย ไม่มีข้อผูกมัด',
    cta_text: 'จองคิวปรึกษาฟรี — ภายใน 24 ชม.',
    proof_text: '✓ ลูกค้ากว่า 500+ ครอบครัวไว้วางใจเรา · ✓ ไม่มีค่าใช้จ่าย ไม่มีข้อผูกมัด',
    guarantees: [
      { icon: 'shield', title: 'รับประกันคุณภาพ', desc: 'โครงสร้างทั้งโครงการ' },
      { icon: 'check', title: 'ส่งมอบตรงเวลา', desc: 'ไม่เลื่อน ไม่บวกราคา' },
      { icon: 'heart', title: 'ดูแลหลังส่งมอบ', desc: 'ทีม Service ตลอดอายุใช้งาน' }
    ]
  },
  footer: {
    description: 'บริการออกแบบ สถาปัตยกรรม วิศวกรรม และสร้างบ้านครบวงจร โดยมืออาชีพ',
    quick_links: [
      { label: 'หน้าหลัก', href: '#home' },
      { label: 'บริการ', href: '#services' },
      { label: 'ผลงาน', href: '#portfolio' },
      { label: 'จองคิว', href: '#booking' }
    ],
    service_links: [
      { label: 'รับเหมาก่อสร้าง', href: '#' },
      { label: 'บิ้วอิน', href: '#' },
      { label: 'ออกแบบ', href: '#' },
      { label: 'ตกแต่ง', href: '#' },
      { label: 'บริหารโครงการ', href: '#' },
      { label: 'ออกแบบป้าย', href: '/services' },
      { label: 'ภูมิทัศน์', href: '/services' },
      { label: 'เขียนแบบ', href: '/services' },
      { label: '3D / Visual', href: '/services' }
    ],
    legal_links: [
      { label: 'นโยบายความเป็นส่วนตัว', href: '/privacy' },
      { label: 'ข้อตกลงการใช้บริการ', href: '/terms' }
    ]
  },
  trust_badges: {
    label: 'วัสดุคุณภาพจากแบรนด์ชั้นนำ',
    brands: ['SCG', 'TOA', 'COTTO', 'STIEBEL', 'DAIKIN', 'KARAT']
  },
  stats: {
    items: [
      { number: 120, suffix: '+', label: 'โครงการสำเร็จ' },
      { number: 10, suffix: '+', label: 'ปีเปิดทำงาน' },
      { number: 500, suffix: '+', label: 'ลูกค้าที่ไว้วางใจ' },
      { number: 50, suffix: '+', label: 'ทีมมืออาชีพ' }
    ]
  },
  booking: {
    section_tag: 'FREE CONSULTATION',
    title: 'จองคิวปรึกษาฟรี\nไม่มีค่าใช้จ่าย',
    description: 'เลือกบริการ ระบุงบประมาณ นัดวันสะดวก — ทีมผู้เชี่ยวชาญจะติดต่อกลับภายใน 24 ชั่วโมง',
    benefits: ['ปรึกษาฟรี ไม่มีค่าใช้จ่าย', 'ประเมินราคาเบื้องต้นทันที', 'นัดเข้าดูหน้างานได้ทันที']
  },
  chatbot_faq: {
    services: { q: 'มีบริการอะไรบ้าง?', a: 'เรามีบริการ 5 อย่าง:\n\n🏗️ รับเหมาก่อสร้าง\n🪑 บิ้วอิน\n✏️ ออกแบบ\n🎨 ตกแต่ง\n📋 บริหารโครงการ\n\nสนใจบริการไหนครับ?', f: ['ดูรายละเอียดแต่ละบริการ', 'ขอใบเสนอราคา'], k: ['บริการ', 'service', 'ทำอะไร', 'มีอะไร', 'รับทำ', 'รับอะไร'] },
    price: { q: 'ราคาเท่าไหร่?', a: 'ราคาขึ้นอยู่กับขนาดและประเภทโครงการ:\n\n🏠 บ้าน: เริ่มต้น 500,000 บ.\n🪑 บิ้วอิน: เริ่มต้น 200,000 บ.\n✏️ ออกแบบ: เริ่มต้น 100,000 บ.\n🎨 ตกแต่ง: เริ่มต้น 150,000 บ.\n\n💡 ปรึกษาฟรี ไม่มีค่าใช้จ่าย!', f: ['จองคิวปรึกษาฟรี', 'ดูผลงาน'], k: ['ราคา', 'price', 'เท่าไหร่', 'cost', 'ค่าใช้จ่าย', 'budget', 'งบ', 'กี่บาท'] },
    booking: { q: 'จองคิวอย่างไร?', a: 'จองคิวง่ายๆ 3 ขั้นตอน:\n\n1️⃣ เลือกบริการที่สนใจ\n2️⃣ กรอกชื่อ-เบอร์โทร\n3️⃣ เลือกวัน-เวลาสะดวก\n\nทีมงานจะติดต่อกลับภายใน 24 ชม. ครับ', f: ['จองคิวเลย', 'ดูบริการ'], k: ['จอง', 'นัด', 'book', 'ปรึกษา', 'คิว', 'นัดหมาย', 'consult'] },
    works: { q: 'ดูผลงาน', a: 'ดูผลงานของเราได้ที่หน้าเว็บเลยครับ มีทั้งบ้านโมเดิร์น คอนโด ลักชัวรี่ และโครงการรีโนเวท\n\n🌐 ดูผลงานทั้งหมด', f: ['ขอใบเสนอราคา', 'จองคิวปรึกษาฟรี'], k: ['ผลงาน', 'portfolio', 'งาน', 'project', 'gallery', 'รูป', 'ตัวอย่าง'] },
    warranty: { q: 'รับประกันอย่างไร?', a: 'เรารับประกัน:\n\n🛡️ โครงสร้าง — ทั้งโครงการ\n✅ ส่งมอบตรงเวลา — ไม่เลื่อน ไม่บวกราคา\n❤️ ดูแลหลังส่งมอบ — ทีม Service ตลอดอายุใช้งาน', f: ['จองคิวปรึกษาฟรี', 'มีบริการอะไรบ้าง?'], k: ['รับประกัน', 'warranty', 'การันตี', 'ประกัน', 'รับผิดชอบ'] },
    contact: { q: 'ติดต่ออย่างไร?', a: '📞 โทร: 02-123-4567\n📱 LINE: @nuchainnovation\n📧 Email: info@nuchainnovation.com\n\n⏰ เปิดทำการ: จันทร์-เสาร์ 09:00-18:00', f: ['จองคิวปรึกษาฟรี', 'ดูบริการ'], k: ['ติดต่อ', 'contact', 'โทร', 'line', 'เบอร์', 'phone', 'email', 'ที่อยู่', 'address'] },
    duration: { q: 'ใช้เวลานานแค่ไหน?', a: 'ระยะเวลาขึ้นอยู่กับขนาดโครงการ:\n\n🏠 บ้าน 2 ชั้น: 6-10 เดือน\n🪑 บิ้วอิน: 2-4 สัปดาห์\n✏️ ออกแบบ: 2-4 สัปดาห์\n🎨 ตกแต่ง: 1-3 เดือน\n\nจะแจ้งไทม์ไลน์ที่ชัดเจนหลังสำรวจหน้างานครับ', f: ['จองคิวปรึกษาฟรี', 'ราคาเท่าไหร่?'], k: ['นาน', 'เวลา', 'duration', 'กี่วัน', 'กี่เดือน', 'เสร็จ', 'timeline'] },
    area: { q: 'รับงานพื้นที่ไหน?', a: 'เรารับงานทั่วกรุงเทพฯ และปริมณฑล:\n\n📍 กรุงเทพฯ ทุกเขต\n📍 นนทบุรี ปทุมธานี สมุทรปราการ\n📍 นครปฐม สมุทรสาคร\n\nพื้นที่อื่นๆ สอบถามได้ครับ', f: ['จองคิวปรึกษาฟรี', 'ดูบริการ'], k: ['พื้นที่', 'area', 'zone', 'เขต', 'จังหวัด', 'ที่ไหน', 'กรุงเทพ', 'กทม'] },
    process: { q: 'ขั้นตอนการทำงาน?', a: 'ขั้นตอนการทำงานของเรา:\n\n📋 STEP 01: รับฟังและวางแผน\n📐 STEP 02: ออกแบบและเสนอราคา\n🏗️ STEP 03: ก่อสร้างและส่งมอบ\n\nทุกขั้นตอนมี QC ตรวจสอบคุณภาพครับ', f: ['จองคิวปรึกษาฟรี', 'ดูผลงาน'], k: ['ขั้นตอน', 'step', 'process', 'ทำงาน', 'ขั้น', 'ลำดับ', 'procedure'] },
    team: { q: 'ทีมงานเป็นอย่างไร?', a: 'ทีมงานของเรา:\n\n👷 วิศวกรประจำโครงการ\n🎨 สถาปนิกและดีไซเนอร์\n🔨 ทีมช่างมืออาชีพ\n📋 ผู้จัดการโครงการดูแลใกล้ชิด\n\nประสบการณ์ 10+ ปี ครับ', f: ['ดูผลงาน', 'จองคิวปรึกษาฟรี'], k: ['ทีม', 'team', 'ช่าง', 'วิศวกร', 'สถาปนิก', 'ประสบการณ์', 'experience'] },
    material: { q: 'ใช้วัสดุอะไร?', a: 'เราใช้วัสดุคุณภาพจากแบรนด์ชั้นนำ:\n\n🏗️ SCG — ปูน หลังคา\n🎨 TOA — สี\n🚿 COTTO — สุขภัณฑ์\n❄️ DAIKIN — แอร์\n🔥 STIEBEL — เครื่องทำน้ำอุ่น\n\nลูกค้าเลือกแบรนด์เองได้ครับ', f: ['ราคาเท่าไหร่?', 'จองคิวปรึกษาฟรี'], k: ['วัสดุ', 'material', 'brand', 'แบรนด์', 'scg', 'toa', 'cotto', 'คุณภาพ'] },
    renovation: { q: 'รับรีโนเวทไหม?', a: 'รับครับ! บริการรีโนเวทของเรา:\n\n🏠 บ้านเก่า → ใหม่\n🏢 สำนักงาน\n🍳 ห้องครัว\n🛁 ห้องน้ำ\n\nสำรวจหน้างานฟรี ไม่มีค่าใช้จ่าย', f: ['จองคิวปรึกษาฟรี', 'ดูผลงาน'], k: ['รีโนเวท', 'renovate', 'ต่อเติม', 'ซ่อม', 'ปรับปรุง', 'remodel'] },
    quote: { q: 'ขอใบเสนอราคา', a: 'ขอใบเสนอราคาได้ง่ายๆ ครับ:\n\n📞 โทร: 02-123-4567\n📱 LINE: @nuchainnovation\n📝 หรือกรอกฟอร์มด้านล่าง\n\nประเมินราคาเบื้องต้นฟรี!', f: ['จองคิวเลย'], k: ['ใบเสนอราคา', 'quote', 'เสนอราคา', 'estimate', 'ประเมิน', 'quotation'] },
    promotion: { q: 'มีโปรโมชั่นไหม?', a: 'โปรโมชั่นตอนนี้:\n\n🎉 ปรึกษาฟรี ไม่มีค่าใช้จ่าย\n💰 ส่วนลดพิเศษสำหรับโครงการใหญ่\n🎁 ฟรี! ออกแบบ 3D เมื่อเซ็นสัญญา\n\nติดต่อสอบถามรายละเอียดได้เลยครับ', f: ['จองคิวปรึกษาฟรี', 'ดูบริการ'], k: ['โปรโมชั่น', 'promotion', 'ส่วนลด', 'discount', 'ลด', 'ของแถม', 'ฟรี'] },
    payment: { q: 'ชำระเงินอย่างไร?', a: 'วิธีชำระเงิน:\n\n💳 โอนเงินธนาคาร\n💰 เงินสด\n📄 เช็ค\n\nชำระเป็นงวดตามความคืบหน้างาน ไม่ต้องจ่ายทั้งก้อนครับ', f: ['จองคิวปรึกษาฟรี', 'ราคาเท่าไหร่?'], k: ['ชำระ', 'pay', 'payment', 'เงิน', 'โอน', 'จ่าย', 'ผ่อน', 'installment', 'งวด'] },
    location: { q: 'สำนักงานอยู่ที่ไหน?', a: '📍 สำนักงาน NUCHA INNOVATION\n\n123 ถนนสุขุมวิท แขวงคลองเตย\nเขตคลองเตย กรุงเทพฯ 10110\n\n🚇 ใกล้ BTS อโศก / MRT สุขุมวิท\n⏰ จันทร์-เสาร์ 09:00-18:00', f: ['ติดต่ออย่างไร?', 'จองคิวปรึกษาฟรี'], k: ['สำนักงาน', 'office', 'map', 'แผนที่', 'bts', 'mrt', 'ทางมา'] },
    greeting: { q: 'สวัสดี', a: 'สวัสดีครับ! 👋 ยินดีต้อนรับสู่ NUCHA INNOVATION\n\nผมเป็นผู้ช่วยอัจฉริยะ ช่วยเรื่องไหนได้บ้างครับ?', f: ['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย'], k: ['สวัสดี', 'hello', 'hi', 'hey', 'ดีจ้า', 'หวัดดี'] },
    thanks: { q: 'ขอบคุณ', a: 'ยินดีครับ! 🙏 มีอะไรให้ช่วยเพิ่มเติมถามได้เลยนะครับ', f: ['มีบริการอะไรบ้าง?', 'จองคิวเลย'], k: ['ขอบคุณ', 'thank', 'thanks', 'thx'] }
  }
};

// Seed default content
// Delete services/footer content so updated categories are always applied on restart
db.prepare("DELETE FROM site_content WHERE section_key IN ('services', 'footer')").run();
const insertContent = db.prepare('INSERT OR IGNORE INTO site_content (section_key, content) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultContent)) {
  insertContent.run(key, JSON.stringify(value));
}

// Seed default nav items (only if table is empty to prevent duplicates on restart)
const navCount = db.prepare('SELECT COUNT(*) as cnt FROM nav_items').get().cnt;
if (navCount === 0) {
  const navItems = [
    { label: 'หน้าหลัก', href: '#home', sort_order: 1 },
    { label: 'บริการ', href: '#services', sort_order: 2 },
    { label: 'กระบวนการ', href: '#story', sort_order: 3 },
    { label: 'ผลงาน', href: '#portfolio', sort_order: 4 },
    { label: 'จองคิว', href: '#booking', sort_order: 5 },
    { label: 'ติดต่อเรา', href: '#contact', sort_order: 6 }
  ];
  const insertNav = db.prepare('INSERT INTO nav_items (label, href, sort_order) VALUES (?, ?, ?)');
  navItems.forEach(n => insertNav.run(n.label, n.href, n.sort_order));
}

// Seed default admin user
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT OR IGNORE INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)')
  .run('admin@nuchainnovation.com', hashedPassword, 'Admin', 'admin');

// Seed demo leads
const demoLeads = [
  { name: 'สมชาย วงศ์สุข', phone: '081-234-5678', service_type: 'รับเหมาก่อสร้าง', budget_range: '3,000,000 - 5,000,000', message: 'ต้องการสร้างบ้าน 2 ชั้น ซอยสุขุมวิท 50', status: 'New Lead', score: 5 },
  { name: 'ประภา ศรีสุวรรณ', phone: '089-876-5432', service_type: 'บิ้วอิน', budget_range: '500,000 - 1,000,000', message: 'บิ้วอินครัวและตู้เสื้อผ้า', status: 'Contacted', score: 3 },
  { name: 'วิชัย พัฒนาทรัพย์', phone: '092-345-6789', service_type: 'ออกแบบ', budget_range: '1,000,000 - 3,000,000', message: 'ออกแบบบ้านโมเดิร์น', status: 'Appointment Set', score: 5 },
];
const insertLead = db.prepare('INSERT OR IGNORE INTO leads (name, phone, service_type, budget_range, message, status, score) VALUES (?, ?, ?, ?, ?, ?, ?)');
demoLeads.forEach(l => insertLead.run(l.name, l.phone, l.service_type, l.budget_range, l.message, l.status, l.score));

// ===== SEED SERVICES =====
const serviceCount = db.prepare('SELECT COUNT(*) as cnt FROM services').get().cnt;
if (serviceCount === 0) {
  const insertService = db.prepare(`INSERT INTO services (category, name, description, price_start, price_unit, icon, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const IMG = 'https://images.unsplash.com';
  const allServices = [
  // ป้าย (Signage)
  ['ป้าย', 'ป้ายโครงการ', 'ป้ายหน้าหมู่บ้าน, ป้ายซอย, ป้ายบ้านเลขที่', 3000, 'แบบ', '🪧', `${IMG}/photo-1580587771525-78b9dba3b914?w=600&q=80`, 1],
  ['ป้าย', 'ป้ายบริษัท', 'ป้ายชื่อบริษัท, ป้ายสำนักงาน, ป้าย Reception', 5000, 'แบบ', '🪧', `${IMG}/photo-1497366216548-37526070297c?w=600&q=80`, 2],
  ['ป้าย', 'ป้ายโฆษณา', 'Billboard, Banner, Roll-up, X-stand, Standee', 8000, 'แบบ', '🪧', `${IMG}/photo-1504384308090-c894fdcc538d?w=600&q=80`, 3],
  ['ป้าย', 'ป้ายร้านค้า', 'ป้ายหน้าร้าน, ป้ายเมนู, ป้าย LED, ป้ายกล่องไฟ', 3000, 'แบบ', '🪧', `${IMG}/photo-1556742049-0cfed4f6a45d?w=600&q=80`, 4],
  ['ป้าย', 'ป้ายอสังหา', 'ป้ายขาย/เช่า, ป้ายประกาศ, ป้ายบอกทาง', 2000, 'แบบ', '🪧', `${IMG}/photo-1560518883-ce09059eeffa?w=600&q=80`, 5],
  ['ป้าย', 'ป้ายสแตนเลส/อะคริลิค', 'Laser cut, Etching, UV print, LED backlit', 5000, 'แบบ+ผลิต', '🪧', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 6],
  ['ป้าย', 'ป้ายไฟ LED / Neon', 'ป้ายไฟ LED, Light box, Neon sign', 8000, 'แบบ+ผลิต', '🪧', `${IMG}/photo-1513364776144-60967b0f800f?w=600&q=80`, 7],
  ['ป้าย', 'ป้ายจราจรภายใน', 'ป้ายหยุด, ป้ายทางเข้า-ออก, ป้ายเตือน', 3000, 'ชุด', '🪧', `${IMG}/photo-1544620347-c4fd4a3d5957?w=600&q=80`, 8],
  // ตกแต่งภายใน (Interior)
  ['ตกแต่งภายใน', 'ห้องนั่งเล่น', 'Layout, เฟอร์นิเจอร์, Lighting, Color scheme', 8000, 'ห้อง', '🏠', `${IMG}/photo-1600210492486-724fe5c67fb0?w=600&q=80`, 10],
  ['ตกแต่งภายใน', 'ห้องนอน', 'Master bedroom, ห้องเด็ก, ห้องผู้สูงอายุ', 8000, 'ห้อง', '🏠', `${IMG}/photo-1616594039964-ae9021a400a0?w=600&q=80`, 11],
  ['ตกแต่งภายใน', 'ห้องครัว', 'Kitchen layout, Island, Pantry, Built-in', 10000, 'ห้อง', '🏠', `${IMG}/photo-1556909114-f6e7ad7d3136?w=600&q=80`, 12],
  ['ตกแต่งภายใน', 'ห้องน้ำ', 'Layout, สุขภัณฑ์, กระเบื้อง, Walk-in closet', 6000, 'ห้อง', '🏠', `${IMG}/photo-1552321554-5fefe8c9ef14?w=600&q=80`, 13],
  ['ตกแต่งภายใน', 'ห้องทำงาน', 'Home office, Study room, Library', 6000, 'ห้อง', '🏠', `${IMG}/photo-1518455027359-f3f8164ba6bd?w=600&q=80`, 14],
  ['ตกแต่งภายใน', 'คอนโด', 'Space planning, Multi-function furniture', 15000, 'ยูนิต', '🏠', `${IMG}/photo-1502672260266-1c1ef2d93688?w=600&q=80`, 15],
  ['ตกแต่งภายใน', 'ร้านค้า', 'Shop design, Display, Counter, Lighting', 15000, 'ร้าน', '🏠', `${IMG}/photo-1441986300917-64674bd600d8?w=600&q=80`, 16],
  ['ตกแต่งภายใน', 'ร้านอาหาร/คาเฟ่', 'Restaurant, Café, Bar counter, Seating', 25000, 'ร้าน', '🏠', `${IMG}/photo-1517248135467-4c7edcad34c4?w=600&q=80`, 17],
  ['ตกแต่งภายใน', 'ออฟฟิศ', 'Office layout, Meeting room, Reception', 300, 'ตร.ม.', '🏠', `${IMG}/photo-1497366811353-6870744d04b2?w=600&q=80`, 18],
  ['ตกแต่งภายใน', 'โรงแรม/รีสอร์ท', 'Lobby, ห้องพัก, Common area', 15000, 'ห้อง', '🏠', `${IMG}/photo-1566073771259-6a8506099945?w=600&q=80`, 19],
  // สถาปัตยกรรม (Architecture)
  ['สถาปัตยกรรม', 'บ้านเดี่ยว', 'ออกแบบบ้านเดี่ยว พร้อมแบบก่อสร้างครบชุด', 30000, 'หลัง', '🏡', `${IMG}/photo-1600596542815-ffad4c1539a9?w=600&q=80`, 20],
  ['สถาปัตยกรรม', 'ทาวน์โฮม', 'ออกแบบทาวน์โฮม', 20000, 'หลัง', '🏡', `${IMG}/photo-1600585154526-990dced4db0d?w=600&q=80`, 21],
  ['สถาปัตยกรรม', 'อาคารพาณิชย์', 'อาคารพาณิชย์, ออฟฟิศ, โกดัง', 40000, 'อาคาร', '🏡', `${IMG}/photo-1486406146926-c627a92ad1ab?w=600&q=80`, 22],
  ['สถาปัตยกรรม', 'ต่อเติม', 'ต่อเติมครัว, ห้องเพิ่ม, โรงจอดรถ', 8000, 'จุด', '🏡', `${IMG}/photo-1600607687939-ce8a6c25118c?w=600&q=80`, 23],
  ['สถาปัตยกรรม', 'รีโนเวท', 'ปรับปรุงบ้านเก่า, เปลี่ยนฟังก์ชัน', 30000, 'หลัง', '🏡', `${IMG}/photo-1600573472592-401b489a3cdc?w=600&q=80`, 24],
  ['สถาปัตยกรรม', 'สระว่ายน้ำ', 'Pool design, Pool deck, Landscaping', 15000, 'สระ', '🏡', `${IMG}/photo-1572331165267-854da2b021b1?w=600&q=80`, 25],
  ['สถาปัตยกรรม', 'ศาลา/Pavilion', 'Pergola, Terrace, Rooftop', 8000, 'หลัง', '🏡', `${IMG}/photo-1600585154340-be6161a56a0c?w=600&q=80`, 26],
  ['สถาปัตยกรรม', 'รั้ว/ประตู/กำแพง', 'รั้วบ้าน, ประตูรั้ว, กำแพง', 5000, 'ชุด', '🏡', `${IMG}/photo-1600047509807-ba8f99d2cdde?w=600&q=80`, 27],
  // ภูมิทัศน์ (Landscape)
  ['ภูมิทัศน์', 'สวนหน้าบ้าน', 'สวนโมเดิร์น, ญี่ปุ่น, Tropical, อังกฤษ', 5000, 'จุด', '🌳', `${IMG}/photo-1585320806297-9794b3e4eeae?w=600&q=80`, 30],
  ['ภูมิทัศน์', 'สวนรอบบ้าน', 'Landscape ครบวงจร รอบตัวบ้าน', 12000, 'จุด', '🌳', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 31],
  ['ภูมิทัศน์', 'ระบบไฟสนาม', 'Garden lighting, Path lights, Uplight', 5000, 'จุด', '🌳', `${IMG}/photo-1513694203232-719a280e022f?w=600&q=80`, 32],
  ['ภูมิทัศน์', 'น้ำพุ/บ่อปลา', 'Water feature, Koi pond, Fountain', 8000, 'จุด', '🌳', `${IMG}/photo-1520250497591-112f2f40a3f4?w=600&q=80`, 33],
  ['ภูมิทัศน์', 'พื้นที่นั่งเล่นกลางแจ้ง', 'Outdoor living, Fire pit, BBQ area', 8000, 'จุด', '🌳', `${IMG}/photo-1600210491892-03d54c0aaf87?w=600&q=80`, 34],
  ['ภูมิทัศน์', 'Vertical garden', 'สวนแนวตั้ง ผนังเขียว', 3000, 'ตร.ม.', '🌳', `${IMG}/photo-1487530811176-3780de880c2d?w=600&q=80`, 35],
  // เขียนแบบ (Drafting)
  ['เขียนแบบ', 'แบบสถาปัตย์ (2D)', 'เขียนแบบสถาปัตยกรรมมาตรฐาน', 3000, 'แผ่น', '📐', `${IMG}/photo-1503387762-592deb58ef4e?w=600&q=80`, 40],
  ['เขียนแบบ', 'แบบโครงสร้าง (2D)', 'เขียนแบบโครงสร้าง', 4000, 'แผ่น', '📐', `${IMG}/photo-1504307651254-35680f356dfd?w=600&q=80`, 41],
  ['เขียนแบบ', 'แบบขออนุญาต (อก.)', 'แบบยื่นขออนุญาตก่อสร้างครบชุด', 15000, 'ชุด', '📐', `${IMG}/photo-1450101499163-c8848c66ca85?w=600&q=80`, 42],
  ['เขียนแบบ', 'BOQ / ประมาณราคา', 'Bill of Quantities พร้อมราคาวัสดุ+ค่าแรง', 5000, 'ชุด', '📐', `${IMG}/photo-1554224155-6726b3ff858f?w=600&q=80`, 43],
  ['เขียนแบบ', 'แบบ As-built', 'แบบบันทึกหลังก่อสร้างจริง', 10000, 'ชุด', '📐', `${IMG}/photo-1460472178825-e5240623afd5?w=600&q=80`, 44],
  // 3D/Visual
  ['3D/Visual', '3D Perspective (ภายใน)', 'ภาพ Render ภายในห้อง', 3000, 'มุม', '🖼️', `${IMG}/photo-1600607687939-ce8a6c25118c?w=600&q=80`, 50],
  ['3D/Visual', '3D Perspective (ภายนอก)', 'ภาพ Render ภายนอกอาคาร', 4000, 'มุม', '🖼️', `${IMG}/photo-1600596542815-ffad4c1539a9?w=600&q=80`, 51],
  ['3D/Visual', '3D Walkthrough', 'วิดีโอเดินชมเสมือนจริง', 15000, 'นาที', '🖼️', `${IMG}/photo-1600585154340-be6161a56a0c?w=600&q=80`, 52],
  ['3D/Visual', '360° Virtual Tour', 'Panorama หมุนดูได้รอบ', 5000, 'ห้อง', '🖼️', `${IMG}/photo-1600573472592-401b489a3cdc?w=600&q=80`, 53],
  ['3D/Visual', 'Floor Plan 2D/3D', 'แปลนบ้าน 2D สี / 3D Isometric', 2000, 'ชั้น', '🖼️', `${IMG}/photo-1503387762-592deb58ef4e?w=600&q=80`, 54],
  ['3D/Visual', 'Moodboard / Concept Board', 'กระดานอารมณ์+วัสดุ+สี', 2000, 'ชุด', '🖼️', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 55],
  // งานระบบ (MEP)
  ['งานระบบ', 'ระบบไฟฟ้า', 'ไฟบ้าน, Solar cell, Smart home', 8000, 'หลัง', '🔧', `${IMG}/photo-1621905251189-08b45d6a269e?w=600&q=80`, 60],
  ['งานระบบ', 'ระบบประปา', 'ท่อน้ำ, ปั๊ม, ถังเก็บน้ำ, ระบบกรอง', 6000, 'หลัง', '🔧', `${IMG}/photo-1585771724684-38269d6639fd?w=600&q=80`, 61],
  ['งานระบบ', 'ระบบปรับอากาศ', 'AC layout, VRV, Chiller', 5000, 'หลัง', '🔧', `${IMG}/photo-1631545806609-03fee5e2c8b4?w=600&q=80`, 62],
  ['งานระบบ', 'CCTV/Security', 'กล้อง, สัญญาณกันขโมย, Access control', 3000, 'จุด', '🔧', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 63],
  ['งานระบบ', 'Smart Home', 'IoT, ไฟอัตโนมัติ, แอปควบคุม', 10000, 'หลัง', '🔧', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 64],
  // ที่ปรึกษา (Consulting)
  ['ที่ปรึกษา', 'สำรวจพื้นที่', 'Site survey, Topographic survey', 3000, 'ครั้ง', '📋', `${IMG}/photo-1504307651254-35680f356dfd?w=600&q=80`, 70],
  ['ที่ปรึกษา', 'ตรวจสอบโครงสร้าง', 'Structural inspection, ประเมินอาคาร', 5000, 'ครั้ง', '📋', `${IMG}/photo-1504307651254-35680f356dfd?w=600&q=80`, 71],
  ['ที่ปรึกษา', 'คุมงานก่อสร้าง', 'Project management, ดูแลหน้างาน', 20000, 'เดือน', '📋', `${IMG}/photo-1504307651254-35680f356dfd?w=600&q=80`, 72],
  ['ที่ปรึกษา', 'ประเมินราคาก่อสร้าง', 'Cost estimation, Budget planning', 5000, 'ครั้ง', '📋', `${IMG}/photo-1554224155-6726b3ff858f?w=600&q=80`, 73],
  ['ที่ปรึกษา', 'ขออนุญาตก่อสร้าง', 'ดำเนินการขอ อก. แทนเจ้าของ', 10000, 'ครั้ง', '📋', `${IMG}/photo-1450101499163-c8848c66ca85?w=600&q=80`, 74],
  // งานพิมพ์/ผลิต (Print & Production)
  ['งานพิมพ์/ผลิต', 'ป้ายไวนิล / Flex face', 'พิมพ์ไวนิลคุณภาพสูง ทุกขนาด', 300, 'ตร.ม.', '📦', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 80],
  ['งานพิมพ์/ผลิต', 'สติกเกอร์', 'สติกเกอร์ติดกระจก, ผนัง, รถ', 500, 'ตร.ม.', '📦', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 81],
  ['งานพิมพ์/ผลิต', 'Wallpaper สั่งพิมพ์', 'Wallpaper ลวดลายสั่งพิมพ์', 800, 'ตร.ม.', '📦', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 82],
  ['งานพิมพ์/ผลิต', 'ป้ายไฟ LED / Light box', 'ผลิตป้ายไฟ LED ทุกขนาด', 5000, 'ชิ้น', '📦', `${IMG}/photo-1513364776144-60967b0f800f?w=600&q=80`, 83],
  ['งานพิมพ์/ผลิต', 'ป้ายสแตนเลส/อะคริลิค', 'Laser cut, UV print, LED backlit', 3000, 'ชิ้น', '📦', `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`, 84],
];

allServices.forEach(s => insertService.run(...s));
} // end serviceCount check

// Update image_url for services that don't have one yet
const IMG = 'https://images.unsplash.com';
const serviceImages = {
  'ป้ายโครงการ': `${IMG}/photo-1580587771525-78b9dba3b914?w=600&q=80`,
  'ป้ายบริษัท': `${IMG}/photo-1497366216548-37526070297c?w=600&q=80`,
  'ป้ายโฆษณา': `${IMG}/photo-1504384308090-c894fdcc538d?w=600&q=80`,
  'ป้ายร้านค้า': `${IMG}/photo-1556742049-0cfed4f6a45d?w=600&q=80`,
  'ป้ายอสังหา': `${IMG}/photo-1560518883-ce09059eeffa?w=600&q=80`,
  'ป้ายสแตนเลส/อะคริลิค': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
  'ป้ายไฟ LED / Neon': `${IMG}/photo-1513364776144-60967b0f800f?w=600&q=80`,
  'ป้ายจราจรภายใน': `${IMG}/photo-1544620347-c4fd4a3d5957?w=600&q=80`,
  'ห้องนั่งเล่น': `${IMG}/photo-1600210492486-724fe5c67fb0?w=600&q=80`,
  'ห้องนอน': `${IMG}/photo-1616594039964-ae9021a400a0?w=600&q=80`,
  'ห้องครัว': `${IMG}/photo-1556909114-f6e7ad7d3136?w=600&q=80`,
  'ห้องน้ำ': `${IMG}/photo-1552321554-5fefe8c9ef14?w=600&q=80`,
  'ห้องทำงาน': `${IMG}/photo-1518455027359-f3f8164ba6bd?w=600&q=80`,
  'คอนโด': `${IMG}/photo-1502672260266-1c1ef2d93688?w=600&q=80`,
  'ร้านค้า': `${IMG}/photo-1441986300917-64674bd600d8?w=600&q=80`,
  'ร้านอาหาร/คาเฟ่': `${IMG}/photo-1517248135467-4c7edcad34c4?w=600&q=80`,
  'ออฟฟิศ': `${IMG}/photo-1497366811353-6870744d04b2?w=600&q=80`,
  'โรงแรม/รีสอร์ท': `${IMG}/photo-1566073771259-6a8506099945?w=600&q=80`,
  'บ้านเดี่ยว': `${IMG}/photo-1600596542815-ffad4c1539a9?w=600&q=80`,
  'ทาวน์โฮม': `${IMG}/photo-1600585154526-990dced4db0d?w=600&q=80`,
  'อาคารพาณิชย์': `${IMG}/photo-1486406146926-c627a92ad1ab?w=600&q=80`,
  'ต่อเติม': `${IMG}/photo-1600607687939-ce8a6c25118c?w=600&q=80`,
  'รีโนเวท': `${IMG}/photo-1600573472592-401b489a3cdc?w=600&q=80`,
  'สระว่ายน้ำ': `${IMG}/photo-1572331165267-854da2b021b1?w=600&q=80`,
  'ศาลา/Pavilion': `${IMG}/photo-1600585154340-be6161a56a0c?w=600&q=80`,
  'รั้ว/ประตู/กำแพง': `${IMG}/photo-1600047509807-ba8f99d2cdde?w=600&q=80`,
  'สวนหน้าบ้าน': `${IMG}/photo-1585320806297-9794b3e4eeae?w=600&q=80`,
  'สวนรอบบ้าน': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
  'ระบบไฟสนาม': `${IMG}/photo-1513694203232-719a280e022f?w=600&q=80`,
  'น้ำพุ/บ่อปลา': `${IMG}/photo-1520250497591-112f2f40a3f4?w=600&q=80`,
  'พื้นที่นั่งเล่นกลางแจ้ง': `${IMG}/photo-1600210491892-03d54c0aaf87?w=600&q=80`,
  'Vertical garden': `${IMG}/photo-1487530811176-3780de880c2d?w=600&q=80`,
  'แบบสถาปัตย์ (2D)': `${IMG}/photo-1503387762-592deb58ef4e?w=600&q=80`,
  'แบบโครงสร้าง (2D)': `${IMG}/photo-1504307651254-35680f356dfd?w=600&q=80`,
  'แบบขออนุญาต (อก.)': `${IMG}/photo-1450101499163-c8848c66ca85?w=600&q=80`,
  'BOQ / ประมาณราคา': `${IMG}/photo-1554224155-6726b3ff858f?w=600&q=80`,
  'แบบ As-built': `${IMG}/photo-1460472178825-e5240623afd5?w=600&q=80`,
  '3D Perspective (ภายใน)': `${IMG}/photo-1600607687939-ce8a6c25118c?w=600&q=80`,
  '3D Perspective (ภายนอก)': `${IMG}/photo-1600596542815-ffad4c1539a9?w=600&q=80`,
  '3D Walkthrough': `${IMG}/photo-1600585154340-be6161a56a0c?w=600&q=80`,
  '360° Virtual Tour': `${IMG}/photo-1600573472592-401b489a3cdc?w=600&q=80`,
  'Floor Plan 2D/3D': `${IMG}/photo-1503387762-592deb58ef4e?w=600&q=80`,
  'Moodboard / Concept Board': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
  'ระบบไฟฟ้า': `${IMG}/photo-1621905251189-08b45d6a269e?w=600&q=80`,
  'ระบบประปา': `${IMG}/photo-1585771724684-38269d6639fd?w=600&q=80`,
  'ระบบปรับอากาศ': `${IMG}/photo-1631545806609-03fee5e2c8b4?w=600&q=80`,
  'CCTV/Security': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
  'Smart Home': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
  'สำรวจพื้นที่': `${IMG}/photo-1504307651254-35680f356dfd?w=600&q=80`,
  'ตรวจสอบโครงสร้าง': `${IMG}/photo-1504307651254-35680f356dfd?w=600&q=80`,
  'คุมงานก่อสร้าง': `${IMG}/photo-1504307651254-35680f356dfd?w=600&q=80`,
  'ประเมินราคาก่อสร้าง': `${IMG}/photo-1554224155-6726b3ff858f?w=600&q=80`,
  'ขออนุญาตก่อสร้าง': `${IMG}/photo-1450101499163-c8848c66ca85?w=600&q=80`,
  'ป้ายไวนิล / Flex face': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
  'สติกเกอร์': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
  'Wallpaper สั่งพิมพ์': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
  'ป้ายไฟ LED / Light box': `${IMG}/photo-1513364776144-60967b0f800f?w=600&q=80`,
  'ป้ายสแตนเลส/อะคริลิค': `${IMG}/photo-1558618666-fcd25c85f82e?w=600&q=80`,
};
const updateImg = db.prepare('UPDATE services SET image_url = ? WHERE name = ? AND (image_url IS NULL OR image_url = \'\')');
for (const [name, url] of Object.entries(serviceImages)) {
  updateImg.run(url, name);
}

// ===== SEED SERVICE PACKAGES =====
const packageCount = db.prepare('SELECT COUNT(*) as cnt FROM service_packages').get().cnt;
if (packageCount === 0) {
  const insertPackage = db.prepare(`INSERT INTO service_packages (name, description, price_start, features, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?)`);

const allPackages = [
  ['Starter Home', 'เริ่มต้นสำหรับบ้านหลังเล็ก', 15000, '["แปลนบ้าน 2D","3D Perspective 2 มุม","BOQ / ประมาณราคา","แก้ไขแบบ 2 ครั้ง"]', 0, 1],
  ['Pro Home', 'ครบครันสำหรับบ้านทั่วไป', 50000, '["แปลนบ้านครบชุด","Interior Design 3 ห้อง","3D Walkthrough (วิดีโอ)","BOQ / ประมาณราคา","แก้ไขแบบ 3 ครั้ง"]', 1, 2],
  ['Premium Home', 'Full Service สำหรับบ้านหรู', 150000, '["Full Design (สถาปัตย์ + Interior)","Landscape Design","MEP Design ครบ","3D Walkthrough + Virtual Tour","ขออนุญาตก่อสร้าง","คุมงานก่อสร้าง"]', 0, 3],
  ['Project Signage', 'ป้ายโครงการครบชุด', 15000, '["ป้ายหน้าโครงการ","ป้ายซอย","ป้ายบ้านเลขที่","ป้ายบอกทาง"]', 0, 4],
  ['Visual Pack', 'ภาพ 3D ครบเซ็ต', 20000, '["3D Perspective 5 มุม","Floor Plan 2D","Moodboard","Material Board"]', 0, 5],
  ['Office Package', 'ออกแบบออฟฟิศครบวงจร', 60000, '["Interior Design","MEP Design","3D Visualization","BOQ / ประมาณราคา"]', 0, 6],
  ['Restaurant Package', 'ออกแบบร้านอาหาร/คาเฟ่', 50000, '["Interior Design","Kitchen layout","3D Visualization","BOQ / ประมาณราคา"]', 0, 7],
];

allPackages.forEach(p => insertPackage.run(...p));
} // end packageCount check

module.exports = db;
