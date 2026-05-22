const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://kwhlpiyhtmywtcmgdqnj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aGxwaXlodG15d3RjbWdkcW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg5OTgwNCwiZXhwIjoyMDk0NDc1ODA0fQ.Rmxin4fjJF5T3CaXiKmS0AzI0c_c_Bmdb1qNhWdXuGY';
const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = supabase;
