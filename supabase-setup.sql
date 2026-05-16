-- ============================================
-- NUCHA Construction CRM — Supabase Schema
-- Run this ONCE in Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query > Paste > Run)
-- ============================================

-- 1. Migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT DEFAULT '',
  role TEXT DEFAULT 'sales',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Leads table (if not exists)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  service_type TEXT DEFAULT '',
  budget_range TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'new',
  score INTEGER DEFAULT 0,
  assigned_to INTEGER,
  source TEXT DEFAULT 'website',
  tags TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lead attachments
CREATE TABLE IF NOT EXISTS lead_attachments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Backups
CREATE TABLE IF NOT EXISTS backups (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  admin_name TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(sender, is_read);

-- 8. Services table (if not exists)
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Service gallery
CREATE TABLE IF NOT EXISTS service_gallery (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  service_category TEXT,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'photo',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_gallery_service ON service_gallery(service_id);
CREATE INDEX IF NOT EXISTS idx_service_gallery_category ON service_gallery(service_category);

-- 10. Service models (3D)
CREATE TABLE IF NOT EXISTS service_models (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  service_category TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  model_url TEXT NOT NULL,
  model_format TEXT DEFAULT 'glb',
  poster_url TEXT DEFAULT '',
  auto_rotate INTEGER DEFAULT 1,
  camera_orbit TEXT DEFAULT '0deg 75deg 105%',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Site content (CMS)
CREATE TABLE IF NOT EXISTS site_content (
  id SERIAL PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Nav items
CREATE TABLE IF NOT EXISTS nav_items (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- 13. Footer links
CREATE TABLE IF NOT EXISTS footer_links (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT DEFAULT '',
  category TEXT DEFAULT 'general'
);

-- Done!
SELECT 'Schema setup complete ✅' as status;
