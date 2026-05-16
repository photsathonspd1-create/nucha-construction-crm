-- =============================================
-- NUCHA CRM — Services Seed Data
-- เพิ่มบริการทั้งหมดลงในฐานข้อมูล
-- =============================================

-- สร้างตาราง services (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_start INTEGER DEFAULT 0,
    price_unit TEXT DEFAULT 'รายการ',
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง service_packages
CREATE TABLE IF NOT EXISTS service_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_start INTEGER DEFAULT 0,
    features TEXT, -- JSON array
    is_featured INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ===== SERVICES =====

-- 1. ออกแบบป้าย
INSERT INTO services (category, name, description, price_start, price_unit, icon, sort_order) VALUES
('ป้าย', 'ป้ายโครงการ', 'ป้ายหน้าหมู่บ้าน, ป้ายซอย, ป้ายบ้านเลขที่', 3000, 'แบบ', '🪧', 1),
('ป้าย', 'ป้ายบริษัท', 'ป้ายชื่อบริษัท, ป้ายสำนักงาน, ป้าย Reception', 5000, 'แบบ', '🪧', 2),
('ป้าย', 'ป้ายโฆษณา', 'Billboard, Banner, Roll-up, X-stand, Standee', 8000, 'แบบ', '🪧', 3),
('ป้าย', 'ป้ายร้านค้า', 'ป้ายหน้าร้าน, ป้ายเมนู, ป้าย LED, ป้ายกล่องไฟ', 3000, 'แบบ', '🪧', 4),
('ป้าย', 'ป้ายอสังหา', 'ป้ายขาย/เช่า, ป้ายประกาศ, ป้ายบอกทาง', 2000, 'แบบ', '🪧', 5),
('ป้าย', 'ป้ายสแตนเลส/อะคริลิค', 'Laser cut, Etching, UV print, LED backlit', 5000, 'แบบ+ผลิต', '🪧', 6),
('ป้าย', 'ป้ายไฟ LED / Neon', 'ป้ายไฟ LED, Light box, Neon sign', 8000, 'แบบ+ผลิต', '🪧', 7),
('ป้าย', 'ป้ายจราจรภายใน', 'ป้ายหยุด, ป้ายทางเข้า-ออก, ป้ายเตือน', 3000, 'ชุด', '🪧', 8);

-- 2. Interior
INSERT INTO services (category, name, description, price_start, price_unit, icon, sort_order) VALUES
('ตกแต่งภายใน', 'ห้องนั่งเล่น', 'Layout, เฟอร์นิเจอร์, Lighting, Color scheme', 8000, 'ห้อง', '🏠', 10),
('ตกแต่งภายใน', 'ห้องนอน', 'Master bedroom, ห้องเด็ก, ห้องผู้สูงอายุ', 8000, 'ห้อง', '🏠', 11),
('ตกแต่งภายใน', 'ห้องครัว', 'Kitchen layout, Island, Pantry, Built-in', 10000, 'ห้อง', '🏠', 12),
('ตกแต่งภายใน', 'ห้องน้ำ', 'Layout, สุขภัณฑ์, กระเบื้อง, Walk-in closet', 6000, 'ห้อง', '🏠', 13),
('ตกแต่งภายใน', 'ห้องทำงาน', 'Home office, Study room, Library', 6000, 'ห้อง', '🏠', 14),
('ตกแต่งภายใน', 'คอนโด', 'Space planning, Multi-function furniture', 15000, 'ยูนิต', '🏠', 15),
('ตกแต่งภายใน', 'ร้านค้า', 'Shop design, Display, Counter, Lighting', 15000, 'ร้าน', '🏠', 16),
('ตกแต่งภายใน', 'ร้านอาหาร/คาเฟ่', 'Restaurant, Café, Bar counter, Seating', 25000, 'ร้าน', '🏠', 17),
('ตกแต่งภายใน', 'ออฟฟิศ', 'Office layout, Meeting room, Reception', 300, 'ตร.ม.', '🏠', 18),
('ตกแต่งภายใน', 'โรงแรม/รีสอร์ท', 'Lobby, ห้องพัก, Common area', 15000, 'ห้อง', '🏠', 19);

-- 3. Architecture
INSERT INTO services (category, name, description, price_start, price_unit, icon, sort_order) VALUES
('สถาปัตยกรรม', 'บ้านเดี่ยว', 'ออกแบบบ้านเดี่ยว พร้อมแบบก่อสร้างครบชุด', 30000, 'หลัง', '🏡', 20),
('สถาปัตยกรรม', 'ทาวน์โฮม', 'ออกแบบทาวน์โฮม', 20000, 'หลัง', '🏡', 21),
('สถาปัตยกรรม', 'อาคารพาณิชย์', 'อาคารพาณิชย์, ออฟฟิศ, โกดัง', 40000, 'อาคาร', '🏡', 22),
('สถาปัตยกรรม', 'ต่อเติม', 'ต่อเติมครัว, ห้องเพิ่ม, โรงจอดรถ', 8000, 'จุด', '🏡', 23),
('สถาปัตยกรรม', 'รีโนเวท', 'ปรับปรุงบ้านเก่า, เปลี่ยนฟังก์ชัน', 30000, 'หลัง', '🏡', 24),
('สถาปัตยกรรม', 'สระว่ายน้ำ', 'Pool design, Pool deck, Landscaping', 15000, 'สระ', '🏡', 25),
('สถาปัตยกรรม', 'ศาลา/Pavilion', 'Pergola, Terrace, Rooftop', 8000, 'หลัง', '🏡', 26),
('สถาปัตยกรรม', 'รั้ว/ประตู/กำแพง', 'รั้วบ้าน, ประตูรั้ว, กำแพง', 5000, 'ชุด', '🏡', 27);

-- 4. Landscape
INSERT INTO services (category, name, description, price_start, price_unit, icon, sort_order) VALUES
('ภูมิทัศน์', 'สวนหน้าบ้าน', 'สวนโมเดิร์น, ญี่ปุ่น, Tropical, อังกฤษ', 5000, 'จุด', '🌳', 30),
('ภูมิทัศน์', 'สวนรอบบ้าน', 'Landscape ครบวงจร รอบตัวบ้าน', 12000, 'จุด', '🌳', 31),
('ภูมิทัศน์', 'ระบบไฟสนาม', 'Garden lighting, Path lights, Uplight', 5000, 'จุด', '🌳', 32),
('ภูมิทัศน์', 'น้ำพุ/บ่อปลา', 'Water feature, Koi pond, Fountain', 8000, 'จุด', '🌳', 33),
('ภูมิทัศน์', 'พื้นที่นั่งเล่นกลางแจ้ง', 'Outdoor living, Fire pit, BBQ area', 8000, 'จุด', '🌳', 34),
('ภูมิทัศน์', 'Vertical garden', 'สวนแนวตั้ง ผนังเขียว', 3000, 'ตร.ม.', '🌳', 35);

-- 5. Drafting
INSERT INTO services (category, name, description, price_start, price_unit, icon, sort_order) VALUES
('เขียนแบบ', 'แบบสถาปัตย์ (2D)', 'เขียนแบบสถาปัตยกรรมมาตรฐาน', 3000, 'แผ่น', '📐', 40),
('เขียนแบบ', 'แบบโครงสร้าง (2D)', 'เขียนแบบโครงสร้าง', 4000, 'แผ่น', '📐', 41),
('เขียนแบบ', 'แบบขออนุญาต (อก.)', 'แบบยื่นขออนุญาตก่อสร้างครบชุด', 15000, 'ชุด', '📐', 42),
('เขียนแบบ', 'BOQ / ประมาณราคา', 'Bill of Quantities พร้อมราคาวัสดุ+ค่าแรง', 5000, 'ชุด', '📐', 43),
('เขียนแบบ', 'แบบ As-built', 'แบบบันทึกหลังก่อสร้างจริง', 10000, 'ชุด', '📐', 44);

-- 6. 3D Visual
INSERT INTO services (category, name, description, price_start, price_unit, icon, sort_order) VALUES
('3D/Visual', '3D Perspective (ภายใน)', 'ภาพ Render ภายในห้อง', 3000, 'มุม', '🖼️', 50),
('3D/Visual', '3D Perspective (ภายนอก)', 'ภาพ Render ภายนอกอาคาร', 4000, 'มุม', '🖼️', 51),
('3D/Visual', '3D Walkthrough', 'วิดีโอเดินชมเสมือนจริง', 15000, 'นาที', '🖼️', 52),
('3D/Visual', '360° Virtual Tour', 'Panorama หมุนดูได้รอบ', 5000, 'ห้อง', '🖼️', 53),
('3D/Visual', 'Floor Plan 2D/3D', 'แปลนบ้าน 2D สี / 3D Isometric', 2000, 'ชั้น', '🖼️', 54),
('3D/Visual', 'Moodboard / Concept Board', 'กระดานอารมณ์+วัสดุ+สี', 2000, 'ชุด', '🖼️', 55);

-- 7. MEP
INSERT INTO services (category, name, description, price_start, price_unit, icon, sort_order) VALUES
('งานระบบ', 'ระบบไฟฟ้า', 'ไฟบ้าน, Solar cell, Smart home', 8000, 'หลัง', '🔧', 60),
('งานระบบ', 'ระบบประปา', 'ท่อน้ำ, ปั๊ม, ถังเก็บน้ำ, ระบบกรอง', 6000, 'หลัง', '🔧', 61),
('งานระบบ', 'ระบบปรับอากาศ', 'AC layout, VRV, Chiller', 5000, 'หลัง', '🔧', 62),
('งานระบบ', 'CCTV/Security', 'กล้อง, สัญญาณกันขโมย, Access control', 3000, 'จุด', '🔧', 63),
('งานระบบ', 'Smart Home', 'IoT, ไฟอัตโนมัติ, แอปควบคุม', 10000, 'หลัง', '🔧', 64);

-- 8. Consulting
INSERT INTO services (category, name, description, price_start, price_unit, icon, sort_order) VALUES
('ที่ปรึกษา', 'สำรวจพื้นที่', 'Site survey, Topographic survey', 3000, 'ครั้ง', '📋', 70),
('ที่ปรึกษา', 'ตรวจสอบโครงสร้าง', 'Structural inspection, ประเมินอาคาร', 5000, 'ครั้ง', '📋', 71),
('ที่ปรึกษา', 'คุมงานก่อสร้าง', 'Project management, ดูแลหน้างาน', 20000, 'เดือน', '📋', 72),
('ที่ปรึกษา', 'ประเมินราคาก่อสร้าง', 'Cost estimation, Budget planning', 5000, 'ครั้ง', '📋', 73),
('ที่ปรึกษา', 'ขออนุญาตก่อสร้าง', 'ดำเนินการขอ อก. แทนเจ้าของ', 10000, 'ครั้ง', '📋', 74);

-- ===== PACKAGES =====
INSERT INTO service_packages (name, description, price_start, features, is_featured, sort_order) VALUES
('Starter Home', 'เริ่มต้นสำหรับบ้านหลังเล็ก', 15000,
 '["แปลนบ้าน 2D","3D Perspective 2 มุม","BOQ / ประมาณราคา","แก้ไขแบบ 2 ครั้ง"]',
 0, 1),

('Pro Home', 'ครบครันสำหรับบ้านทั่วไป', 50000,
 '["แปลนบ้านครบชุด","Interior Design 3 ห้อง","3D Walkthrough (วิดีโอ)","BOQ / ประมาณราคา","แก้ไขแบบ 3 ครั้ง"]',
 1, 2),

('Premium Home', 'Full Service สำหรับบ้านหรู', 150000,
 '["Full Design (สถาปัตย์ + Interior)","Landscape Design","MEP Design ครบ","3D Walkthrough + Virtual Tour","ขออนุญาตก่อสร้าง","คุมงานก่อสร้าง"]',
 0, 3),

('Project Signage', 'ป้ายโครงการครบชุด', 15000,
 '["ป้ายหน้าโครงการ","ป้ายซอย","ป้ายบ้านเลขที่","ป้ายบอกทาง"]',
 0, 4),

('Visual Pack', 'ภาพ 3D ครบเซ็ต', 20000,
 '["3D Perspective 5 มุม","Floor Plan 2D","Moodboard","Material Board"]',
 0, 5),

('Office Package', 'ออกแบบออฟฟิศครบวงจร', 60000,
 '["Interior Design","MEP Design","3D Visualization","BOQ / ประมาณราคา"]',
 0, 6),

('Restaurant Package', 'ออกแบบร้านอาหาร/คาเฟ่', 50000,
 '["Interior Design","Kitchen layout","3D Visualization","BOQ / ประมาณราคา"]',
 0, 7);
