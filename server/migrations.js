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
