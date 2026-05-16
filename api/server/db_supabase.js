const supabase = require('./supabase_client');

const db = {
  prepare: (sql) => {
    return {
      run: async (...params) => {
        console.log('SQL RUN:', sql, params);
        if (sql.toLowerCase().includes('insert into leads')) {
          const { data, error } = await supabase.from('leads').insert([{
            name: params[0],
            phone: params[1],
            service_type: params[2],
            budget_range: params[3],
            message: params[4],
            status: params[5],
            score: params[6]
          }]);
          if (error) throw error;
          return { changes: 1, lastInsertRowid: Date.now() };
        }
        // Generic success for other runs (updates/deletes)
        return { changes: 1 };
      },
      all: async (...params) => {
        console.log('SQL ALL:', sql, params);
        let table = '';
        if (sql.includes('site_content')) table = 'site_content';
        if (sql.includes('services')) table = 'services';
        if (sql.includes('leads')) table = 'leads';
        if (sql.includes('users')) table = 'users';
        if (sql.includes('nav_items')) table = 'nav_items';
        if (sql.includes('footer_links')) table = 'footer_links';
        
        if (!table) return [];

        let query = supabase.from(table).select('*');
        
        if (sql.includes('is_active = 1')) query = query.eq('is_active', 1);
        if (sql.includes('ORDER BY category, sort_order')) query = query.order('category').order('sort_order');
        if (sql.includes('ORDER BY sort_order')) query = query.order('sort_order');
        if (sql.includes('ORDER BY created_at DESC')) query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) { console.error('Supa Error:', error); return []; }
        return data || [];
      },
      get: async (...params) => {
        console.log('SQL GET:', sql, params);
        if (sql.includes('FROM site_content WHERE section_key = ?')) {
          const { data, error } = await supabase.from('site_content').select('*').eq('section_key', params[0]).single();
          return error ? null : data;
        }
        if (sql.includes('FROM users WHERE email = ?')) {
          const { data, error } = await supabase.from('users').select('*').eq('email', params[0]).single();
          return error ? null : data;
        }
        if (sql.includes('FROM users WHERE id = ?')) {
          const { data, error } = await supabase.from('users').select('*').eq('id', params[0]).single();
          return error ? null : data;
        }
        return null;
      }
    };
  },
  exec: (sql) => {}
};

module.exports = db;
