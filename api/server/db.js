const supabase = require('./supabase_client');

// helper to simulate SQLite's result objects
const db = {
  prepare: (sql) => {
    return {
      run: async (...params) => {
        console.log('Supabase Proxy (run):', sql);
        // Map simple INSERTs
        if (sql.includes('INSERT INTO leads')) {
           const [name, phone, service_type, budget_range, message, status, score] = params;
           const { data, error } = await supabase.from('leads').insert([{ name, phone, service_type, budget_range, message, status, score }]);
           if (error) throw error;
           return { changes: 1, lastInsertRowid: Date.now() };
        }
        return { changes: 0 };
      },
      all: async (...params) => {
        console.log('Supabase Proxy (all):', sql);
        if (sql.includes('FROM site_content')) {
           const { data, error } = await supabase.from('site_content').select('*');
           if (error) return [];
           return data;
        }
        if (sql.includes('FROM services')) {
           const { data, error } = await supabase.from('services').select('*').eq('is_active', 1).order('sort_order');
           if (error) return [];
           return data;
        }
        return [];
      },
      get: async (...params) => {
        console.log('Supabase Proxy (get):', sql);
        if (sql.includes('FROM site_content WHERE section_key = ?')) {
           const { data, error } = await supabase.from('site_content').select('*').eq('section_key', params[0]).single();
           if (error) return null;
           return data;
        }
        if (sql.includes('FROM users WHERE email = ?')) {
           const { data, error } = await supabase.from('users').select('*').eq('email', params[0]).single();
           if (error) return null;
           return data;
        }
        return null;
      }
    };
  },
  exec: (sql) => {
    console.log('DB.exec ignored (schema is on Supabase)');
  }
};

module.exports = db;
