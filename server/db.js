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
`);

// ===== SEED DEFAULT CONTENT =====

const defaultContent = {
  site_config: {
    site_name: 'NUCHA INNOVATION',
    site_tagline: 'บริการออกแบบ ก่อสร้าง ตกแต่งครบวงจร',
    logo_text: 'N',
    logo_full: 'NUCHA\nINNOVATION',
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
      { icon: '🏗️', name: 'รับเหมาก่อสร้าง', desc: 'รับเหมาก่อสร้างครบวงจร บ้าน อาคาร สำนักงาน โรงงาน ด้วยทีมวิศวกรมืออาชีพ', budget: 'งบประมาณเริ่มต้น 500,000 บาท', key: 'construction' },
      { icon: '🪑', name: 'บิ้วอิน', desc: 'ออกแบบและติดตั้งเฟอร์นิเจอร์บิ้วอิน ครัว ตู้เสื้อผ้า ชั้นวาง วัสดุคุณภาพสูง', budget: 'งบประมาณเริ่มต้น 200,000 บาท', key: 'builtin' },
      { icon: '✏️', name: 'ออกแบบ', desc: 'ออกแบบสถาปัตยกรรม ตกแต่งภายใน 3D Rendering ครบวงจร โดยทีมดีไซเนอร์มืออาชีพ', budget: 'งบประมาณเริ่มต้น 100,000 บาท', key: 'design' },
      { icon: '🎨', name: 'ตกแต่ง', desc: 'ตกแต่งภายในและภายนอก ปรับปรุง รีโนเวท เปลี่ยนพื้นที่เดิมให้สวยงามทันสมัย', budget: 'งบประมาณเริ่มต้น 150,000 บาท', key: 'decoration' },
      { icon: '📋', name: 'บริหารงานขายโครงการ', desc: 'บริหารจัดการโครงการก่อสร้างครบวงจร วางแผน ควบคุมงาน ตรวจสอบคุณภาพ ดูแลงบประมาณ', budget: 'งบประมาณตามขนาดโครงการ', key: 'project-management' }
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
      { label: 'บริหารโครงการ', href: '#' }
    ],
    legal_links: [
      { label: 'นโยบายความเป็นส่วนตัว', href: '#' },
      { label: 'ข้อตกลงการใช้บริการ', href: '#' }
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
  }
};

// Seed default content
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

module.exports = db;
