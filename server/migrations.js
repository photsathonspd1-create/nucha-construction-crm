// ===== Database Migrations =====
const db = require('./db');

function runMigrations() {
  console.log('🔄 Running database migrations...');

  // Create migrations tracking table
  db.exec(`CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const applied = db.prepare('SELECT name FROM migrations').all().map(r => r.name);

  const migrations = [
    {
      name: '001_add_users_role_column',
      sql: () => {
        // Add role column if not exists (already has default 'admin')
        const cols = db.prepare("PRAGMA table_info(users)").all();
        if (!cols.find(c => c.name === 'role')) {
          db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'sales'");
        }
      }
    },
    {
      name: '002_add_leads_new_columns',
      sql: () => {
        const cols = db.prepare("PRAGMA table_info(leads)").all();
        if (!cols.find(c => c.name === 'assigned_to')) {
          db.exec("ALTER TABLE leads ADD COLUMN assigned_to INTEGER");
        }
        if (!cols.find(c => c.name === 'source')) {
          db.exec("ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'website'");
        }
        if (!cols.find(c => c.name === 'tags')) {
          db.exec("ALTER TABLE leads ADD COLUMN tags TEXT DEFAULT ''");
        }
      }
    },
    {
      name: '003_create_lead_attachments_table',
      sql: () => {
        db.exec(`CREATE TABLE IF NOT EXISTS lead_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id INTEGER NOT NULL,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          url TEXT NOT NULL,
          file_size INTEGER DEFAULT 0,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
        )`);
      }
    },
    {
      name: '004_create_password_resets_table',
      sql: () => {
        db.exec(`CREATE TABLE IF NOT EXISTS password_resets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          used INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
      }
    },
    {
      name: '005_create_backups_table',
      sql: () => {
        db.exec(`CREATE TABLE IF NOT EXISTS backups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          file_size INTEGER DEFAULT 0,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )`);
      }
    },
    {
      name: '006_seed_notification_settings',
      sql: () => {
        const existing = db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
        if (!existing) {
          const settings = {
            line_notify_enabled: true,
            line_notify_token: '',
            telegram_enabled: false,
            telegram_bot_token: '',
            telegram_chat_id: '',
            auto_reply_enabled: false,
            auto_reply_templates: {
              sms: 'ขอบคุณที่สนใจบริการของเรา ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง',
              line: 'ขอบคุณที่สนใจ NUCHA INNOVATION! ทีมงานจะติดต่อกลับเร็วๆ นี้ค่ะ',
              email: 'เรียน คุณ{name}, ขอบคุณที่สนใจบริการของเรา ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง'
            }
          };
          db.prepare("INSERT INTO site_content (section_key, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)")
            .run('notification_settings', JSON.stringify(settings));
        }
      }
    },
    {
      name: '007_create_chat_messages_table',
      sql: () => {
        db.exec(`CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          sender TEXT NOT NULL,
          message TEXT NOT NULL,
          customer_name TEXT,
          customer_phone TEXT,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(sender, is_read)`);
      }
    },
    {
      name: '008_update_notification_settings_line_messaging',
      sql: () => {
        const existing = db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
        if (existing) {
          const config = JSON.parse(existing.content);
          if (!config.line_channel_access_token) {
            config.line_channel_access_token = '';
            config.line_user_id = '';
            config.line_messaging_enabled = false;
            db.prepare("UPDATE site_content SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE section_key = 'notification_settings'")
              .run(JSON.stringify(config));
          }
        }
      }
    },
    {
      name: '009_add_chat_admin_name',
      sql: () => {
        const cols = db.prepare("PRAGMA table_info(chat_messages)").all();
        if (!cols.find(c => c.name === 'admin_name')) {
          db.exec("ALTER TABLE chat_messages ADD COLUMN admin_name TEXT");
        }
      }
    },
    {
      name: '010_add_services_image_url',
      sql: () => {
        const cols = db.prepare("PRAGMA table_info(services)").all();
        if (!cols.find(c => c.name === 'image_url')) {
          db.exec("ALTER TABLE services ADD COLUMN image_url TEXT DEFAULT ''");
        }
      }
    },
    {
      name: '011_create_service_gallery_table',
      sql: () => {
        db.exec(`CREATE TABLE IF NOT EXISTS service_gallery (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER,
          service_category TEXT,
          title TEXT DEFAULT '',
          description TEXT DEFAULT '',
          image_url TEXT NOT NULL,
          image_type TEXT DEFAULT 'photo',
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_service_gallery_service ON service_gallery(service_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_service_gallery_category ON service_gallery(service_category)`);
      }
    },
    {
      name: '012_create_service_models_table',
      sql: () => {
        db.exec(`CREATE TABLE IF NOT EXISTS service_models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_id INTEGER,
          service_category TEXT,
          title TEXT NOT NULL,
          description TEXT DEFAULT '',
          model_url TEXT NOT NULL,
          model_format TEXT DEFAULT 'glb',
          poster_url TEXT DEFAULT '',
          auto_rotate INTEGER DEFAULT 1,
          camera_orbit TEXT DEFAULT '0deg 75deg 105%',
          sort_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
        )`);
      }
    },
    {
      name: '013_seed_service_gallery',
      sql: () => {
        const count = db.prepare('SELECT COUNT(*) as c FROM service_gallery').get().c;
        if (count > 0) return;

        const galleryItems = [
          // สถาปัตยกรรม - บ้านเดี่ยว
          { cat: 'สถาปัตยกรรม', title: 'บ้านเดี่ยว Modern Luxury', desc: 'บ้าน 2 ชั้น สไตล์โมเดิร์น 3 ห้องนอน', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', type: 'photo' },
          { cat: 'สถาปัตยกรรม', title: 'บ้าน Contemporary', desc: 'ดีไซน์ร่วมสมัย ผสมผสานธรรมชาติ', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', type: 'photo' },
          { cat: 'สถาปัตยกรรม', title: 'บ้านโมเดิร์น Tropical', desc: 'ออกแบบเขตร้อน ระบายอากาศดี', url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80', type: 'photo' },
          { cat: 'สถาปัตยกรรม', title: 'ทาวน์โฮม Modern', desc: 'ทาวน์โฮม 3 ชั้น ดีไซน์ทันสมัย', url: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80', type: 'photo' },
          { cat: 'สถาปัตยกรรม', title: 'อาคารพาณิชย์', desc: 'อาคาร 4 ชั้น ทำเลทอง', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', type: 'photo' },
          { cat: 'สถาปัตยกรรม', title: 'สระว่ายน้ำ', desc: 'สระว่ายน้ำระบบเกลือ พร้อมศาลา', url: 'https://images.unsplash.com/photo-1572331165267-854da2b021b1?w=800&q=80', type: 'photo' },

          // ตกแต่งภายใน
          { cat: 'ตกแต่งภายใน', title: 'ห้องนั่งเล่น Modern Luxury', desc: 'ตกแต่งสไตล์โมเดิร์น โทนอบอุ่น', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80', type: 'photo' },
          { cat: 'ตกแต่งภายใน', title: 'ห้องนอน Master', desc: 'ห้องนอนใหญ่ วิวเมือง', url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80', type: 'photo' },
          { cat: 'ตกแต่งภายใน', title: 'ครัว Built-in', desc: 'ครัว Modern วัสดุพรีเมียม', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', type: 'photo' },
          { cat: 'ตกแต่งภายใน', title: 'ห้องน้ำ Spa', desc: 'ห้องน้ำสไตล์รีสอร์ท', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80', type: 'photo' },
          { cat: 'ตกแต่งภายใน', title: 'ออฟฟิศ Modern', desc: 'ออฟฟิศเปิดโล่ง บรรยากาศดี', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', type: 'photo' },
          { cat: 'ตกแต่งภายใน', title: 'ร้านอาหาร Fine Dining', desc: 'ตกแต่งร้านอาหารหรู', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', type: 'photo' },

          // บิ้วอิน
          { cat: 'บิ้วอิน', title: 'ครัวบิ้วอิน Hi-Gloss', desc: 'เคาน์เตอร์ครัว Hi-Gloss พร้อมตู้แขวน', url: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80', type: 'photo' },
          { cat: 'บิ้วอิน', title: 'Walk-in Closet', desc: 'ตู้เสื้อผ้าบิ้วอิน ไฟ LED', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', type: 'photo' },
          { cat: 'บิ้วอิน', title: 'ชั้นวางทีวี', desc: 'ชั้นวางทีวีบิ้วอิน ผนังตกแต่ง', url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&q=80', type: 'photo' },
          { cat: 'บิ้วอิน', title: 'ตู้หนังสือ Built-in', desc: 'ห้องสมุดส่วนตัว บิ้วอินเต็มผนัง', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', type: 'photo' },

          // ออกแบบ
          { cat: 'ออกแบบ', title: '3D Perspective ภายนอก', desc: 'ภาพ Render 3D มุมสูง', url: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80', type: 'render' },
          { cat: 'ออกแบบ', title: '3D Interior Rendering', desc: 'ภาพ Render ภายใน สมจริง', url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80', type: 'render' },
          { cat: 'ออกแบบ', title: 'Floor Plan 3D', desc: 'แปลนบ้าน 3 มิติ', url: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80', type: 'render' },
          { cat: 'ออกแบบ', title: 'Moodboard แนวคิด', desc: 'Moodboard สไตล์ Natural Modern', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80', type: 'render' },

          // ภูมิทัศน์
          { cat: 'ภูมิทัศน์', title: 'สวนหน้าบ้าน Modern', desc: 'สวนโมเดิร์น น้ำพุกลาง', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', type: 'photo' },
          { cat: 'ภูมิทัศน์', title: 'สวนญี่ปุ่น', desc: 'สวนหินสไตล์ญี่ปุ่น', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80', type: 'photo' },
          { cat: 'ภูมิทัศน์', title: 'พื้นที่นั่งเล่นกลางแจ้ง', desc: 'Pergola พร้อมเฟอร์นิเจอร์ Outdoor', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', type: 'photo' },
          { cat: 'ภูมิทัศน์', title: 'ระบบไฟสนาม', desc: 'ไฟสนาม Landscape Lighting', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', type: 'photo' },

          // ป้าย
          { cat: 'ป้าย', title: 'ป้ายโครงการ', desc: 'ป้ายโครงการจัดสรร ขนาดใหญ่', url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80', type: 'photo' },
          { cat: 'ป้าย', title: 'ป้ายไฟ LED', desc: 'ป้ายไฟ LED หน้าร้าน', url: 'https://images.unsplash.com/photo-1563901935883-cb61f6629477?w=800&q=80', type: 'photo' },
          { cat: 'ป้าย', title: 'ป้ายสแตนเลส', desc: 'ป้ายสแตนเลสเงา ตัวอักษร 3D', url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80', type: 'photo' },

          // งานระบบ
          { cat: 'งานระบบ', title: 'ระบบไฟฟ้า', desc: 'ติดตั้งระบบไฟฟ้า ตู้คอนโทรล', url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80', type: 'photo' },
          { cat: 'งานระบบ', title: 'ระบบปรับอากาศ', desc: 'ติดตั้งแอร์ VRF ทั้งอาคาร', url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80', type: 'photo' },
          { cat: 'งานระบบ', title: 'Smart Home', desc: 'ระบบบ้านอัจฉริยะ สั่งงานด้วยเสียง', url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80', type: 'photo' },

          // เขียนแบบ
          { cat: 'เขียนแบบ', title: 'แบบสถาปัตย์ 2D', desc: 'แบบก่อสร้าง สถาปัตยกรรม', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80', type: 'photo' },
          { cat: 'เขียนแบบ', title: 'แบบโครงสร้าง', desc: 'แบบโครงสร้าง วิศวกรรม', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80', type: 'photo' },

          // ที่ปรึกษา
          { cat: 'ที่ปรึกษา', title: 'สำรวจพื้นที่', desc: 'สำรวจหน้างาน รังวัดที่ดิน', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', type: 'photo' },
          { cat: 'ที่ปรึกษา', title: 'คุมงานก่อสร้าง', desc: 'Site Engineer ดูแลหน้างาน', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', type: 'photo' },

          // 3D/Visual
          { cat: '3D/Visual', title: '3D Perspective ภายใน', desc: 'ภาพ Render ภายใน คุณภาพสูง', url: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80', type: 'render' },
          { cat: '3D/Visual', title: '3D Walkthrough', desc: 'ทัวร์เสมือนจริง เดินชมบ้าน', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', type: 'render' },
          { cat: '3D/Visual', title: '360° Virtual Tour', desc: 'ทัวร์ 360 องศา ทุกห้อง', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', type: 'render' },

          // งานพิมพ์/ผลิต
          { cat: 'งานพิมพ์/ผลิต', title: 'ป้ายไวนิลขนาดใหญ่', desc: 'ป้ายไวนิล Flex Face ขนาดใหญ่', url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80', type: 'photo' },
          { cat: 'งานพิมพ์/ผลิต', title: 'Wallpaper สั่งพิมพ์', desc: 'Wallpaper ลวดลาย Custom', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80', type: 'photo' },
        ];

        const stmt = db.prepare(`INSERT INTO service_gallery (service_category, title, description, image_url, image_type, sort_order) VALUES (?, ?, ?, ?, ?, ?)`);
        galleryItems.forEach((item, i) => {
          stmt.run(item.cat, item.title, item.desc, item.url, item.type, i);
        });
      }
    },
    {
      name: '014_add_line_webhook_and_email_settings',
      sql: () => {
        const existing = db.prepare("SELECT content FROM site_content WHERE section_key = 'notification_settings'").get();
        if (existing) {
          const config = JSON.parse(existing.content);
          let changed = false;
          if (!config.line_channel_secret) { config.line_channel_secret = ''; changed = true; }
          if (config.email_enabled === undefined) { config.email_enabled = false; changed = true; }
          if (!config.smtp_host) { config.smtp_host = 'smtp.gmail.com'; changed = true; }
          if (!config.smtp_port) { config.smtp_port = '587'; changed = true; }
          if (!config.smtp_user) { config.smtp_user = ''; changed = true; }
          if (!config.smtp_pass) { config.smtp_pass = ''; changed = true; }
          if (!config.notify_email) { config.notify_email = ''; changed = true; }
          if (changed) {
            db.prepare("UPDATE site_content SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE section_key = 'notification_settings'")
              .run(JSON.stringify(config));
          }
        }
      }
    }
  ];

  for (const migration of migrations) {
    if (!applied.includes(migration.name)) {
      try {
        migration.sql();
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
        console.log(`  ✅ ${migration.name}`);
      } catch (err) {
        console.error(`  ❌ ${migration.name}: ${err.message}`);
      }
    }
  }

  console.log('✅ Migrations complete');
}

module.exports = { runMigrations };
