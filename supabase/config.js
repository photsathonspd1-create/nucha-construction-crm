// ============================================
// Supabase Configuration
// Replace with your actual Supabase credentials
// ============================================

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for modules
window.supabaseClient = supabase;
