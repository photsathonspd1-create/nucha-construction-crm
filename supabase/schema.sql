-- ============================================
-- NUCHA INNOVATION CRM — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== LEADS =====
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    service_type TEXT NOT NULL DEFAULT 'อื่นๆ',
    budget_range TEXT DEFAULT 'ไม่ระบุ',
    message TEXT,
    status TEXT NOT NULL DEFAULT 'New Lead'
        CHECK (status IN ('New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed Won', 'Closed Lost')),
    score NUMERIC(4,1) DEFAULT 0,
    source TEXT DEFAULT 'website',
    assigned_to UUID REFERENCES auth.users(id),
    first_contact_at TIMESTAMPTZ,
    lost_reason TEXT
        CHECK (lost_reason IS NULL OR lost_reason IN (
            'ราคาแพง', 'คู่แข่งเร็วกว่า', 'ลูกค้ายังไม่พร้อม',
            'งบประมาณไม่พอ', 'ไม่ตอบกลับ', 'โครงการเลื่อน', 'อื่นๆ'
        )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== APPOINTMENTS =====
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    lead_name TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    meeting_type TEXT DEFAULT 'onsite'
        CHECK (meeting_type IN ('onsite', 'online', 'phone')),
    service_type TEXT,
    location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'completed', 'cancelled', 'rescheduled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PROPOSALS =====
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    proposal_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    items JSONB DEFAULT '[]',
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    valid_until DATE,
    notes TEXT,
    status TEXT DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== NOTES / FOLLOW-UPS =====
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type TEXT DEFAULT 'general'
        CHECK (note_type IN ('general', 'follow_up', 'call', 'meeting', 'system')),
    follow_up_date DATE,
    follow_up_done BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== ACTIVITY LOG =====
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== USER PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'staff'
        CHECK (role IN ('admin', 'manager', 'staff')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_notes_lead ON notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_notes_followup ON notes(follow_up_date) WHERE follow_up_done = FALSE;
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead ON proposals(lead_id);

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== AUTO-CREATE PROFILE ON SIGNUP =====
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'staff');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===== LEAD SCORING FUNCTION =====
CREATE OR REPLACE FUNCTION calculate_lead_score(
    p_budget TEXT,
    p_service TEXT,
    p_message TEXT,
    p_has_appointment BOOLEAN
) RETURNS NUMERIC AS $$
DECLARE
    score NUMERIC := 0;
BEGIN
    -- Budget scoring
    CASE p_budget
        WHEN 'มากกว่า 10,000,000' THEN score := score + 5;
        WHEN '5,000,000 - 10,000,000' THEN score := score + 4;
        WHEN '3,000,000 - 5,000,000' THEN score := score + 3;
        WHEN '1,000,000 - 3,000,000' THEN score := score + 2;
        WHEN '500,000 - 1,000,000' THEN score := score + 1;
        WHEN 'ต่ำกว่า 500,000' THEN score := score + 0.5;
        ELSE score := score + 0;
    END CASE;

    -- Service clarity
    IF p_service IS NOT NULL AND p_service != 'อื่นๆ' THEN
        score := score + 2;
    END IF;

    -- Engagement
    IF p_message IS NOT NULL AND LENGTH(p_message) > 10 THEN
        score := score + 1;
    END IF;

    -- Has appointment
    IF p_has_appointment THEN
        score := score + 2;
    END IF;

    RETURN ROUND(score, 1);
END;
$$ LANGUAGE plpgsql;

-- ===== AUTO-LOG ACTIVITY ON LEAD STATUS CHANGE =====
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO activities (lead_id, action, details)
        VALUES (
            NEW.id,
            'status_changed',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lead_status_changed
    AFTER UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();

-- ===== RLS POLICIES =====
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Leads: authenticated users can do everything
CREATE POLICY "leads_all_authenticated" ON leads
    FOR ALL USING (auth.role() = 'authenticated');

-- Appointments: authenticated users can do everything
CREATE POLICY "appointments_all_authenticated" ON appointments
    FOR ALL USING (auth.role() = 'authenticated');

-- Proposals: authenticated users can do everything
CREATE POLICY "proposals_all_authenticated" ON proposals
    FOR ALL USING (auth.role() = 'authenticated');

-- Notes: authenticated users can do everything
CREATE POLICY "notes_all_authenticated" ON notes
    FOR ALL USING (auth.role() = 'authenticated');

-- Activities: authenticated users can read
CREATE POLICY "activities_read_authenticated" ON activities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Activities: authenticated users can insert
CREATE POLICY "activities_insert_authenticated" ON activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Profiles: users can read all, update own
CREATE POLICY "profiles_read_all" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ===== PUBLIC INSERT POLICY (for website booking form) =====
-- Allows anonymous users to insert leads (website form submission)
CREATE POLICY "leads_insert_public" ON leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "appointments_insert_public" ON appointments
    FOR INSERT WITH CHECK (true);

-- ===== SEED DEMO DATA =====
INSERT INTO leads (name, phone, service_type, budget_range, message, status, score) VALUES
    ('สมชาย วงศ์สุข', '081-234-5678', 'รับเหมาก่อสร้าง', '3,000,000 - 5,000,000', 'ต้องการสร้างบ้าน 2 ชั้น ซอยสุขุมวิท 50', 'New Lead', 5),
    ('ประภา ศรีสุวรรณ', '089-876-5432', 'บิ้วอิน', '500,000 - 1,000,000', 'บิ้วอินครัวและตู้เสื้อผ้า', 'Contacted', 3),
    ('วิชัย พัฒนาทรัพย์', '092-345-6789', 'ออกแบบ', '1,000,000 - 3,000,000', 'ออกแบบบ้านโมเดิร์น', 'Appointment Set', 5),
    ('อรุณ จันทร์เจริญ', '085-678-9012', 'ตกแต่ง', '500,000 - 1,000,000', 'รีโนเวทคอนโด', 'Proposal Sent', 3),
    ('สุดา มั่นคง', '093-456-7890', 'รับเหมาก่อสร้าง', '5,000,000 - 10,000,000', 'สร้างออฟฟิศ 3 ชั้น', 'New Lead', 4),
    ('กมล ศิริพร', '087-890-1234', 'บริหารโครงการ', 'มากกว่า 10,000,000', 'บริหารโครงการหมู่บ้านจัดสรร', 'Contacted', 7);

-- ===== SLA TRACKING =====
-- Auto-set first_contact_at when status changes from 'New Lead'
CREATE OR REPLACE FUNCTION auto_set_first_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'New Lead' AND NEW.status != 'New Lead' AND NEW.first_contact_at IS NULL THEN
        NEW.first_contact_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_first_contact
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION auto_set_first_contact();

-- SLA breach check function (call via Edge Function or cron)
CREATE OR REPLACE FUNCTION get_sla_breaches()
RETURNS TABLE(
    lead_id UUID,
    lead_name TEXT,
    lead_phone TEXT,
    lead_score NUMERIC,
    lead_created TIMESTAMPTZ,
    minutes_since_created NUMERIC,
    assigned_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name,
        l.phone,
        l.score,
        l.created_at,
        EXTRACT(EPOCH FROM (NOW() - l.created_at)) / 60,
        p.full_name
    FROM leads l
    LEFT JOIN profiles p ON l.assigned_to = p.id
    WHERE l.status = 'New Lead'
      AND l.first_contact_at IS NULL
      AND (
          (l.score >= 5 AND EXTRACT(EPOCH FROM (NOW() - l.created_at)) > 300) OR     -- 5 min for high
          (l.score >= 3 AND EXTRACT(EPOCH FROM (NOW() - l.created_at)) > 7200) OR     -- 2 hr for mid
          (l.score < 3 AND EXTRACT(EPOCH FROM (NOW() - l.created_at)) > 86400)        -- 24 hr for low
      )
    ORDER BY l.score DESC, l.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Index for SLA queries
CREATE INDEX IF NOT EXISTS idx_leads_first_contact ON leads(first_contact_at) WHERE first_contact_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_lost_reason ON leads(lost_reason) WHERE lost_reason IS NOT NULL;
