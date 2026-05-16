-- ============================================
-- Supabase Storage Bucket Setup
-- Run this AFTER creating the 'uploads' bucket
-- Dashboard → Storage → New Bucket → name: uploads, Public: ✅
-- Then run this in SQL Editor:
-- ============================================

-- Allow public read access to uploads bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Anyone can read files (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Policy: Authenticated users can delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Note: If you're using service_role key in your backend,
-- these policies don't apply (service role bypasses RLS).
-- The above policies are for client-side uploads if needed.
