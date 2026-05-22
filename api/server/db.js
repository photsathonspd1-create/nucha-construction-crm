const supabase = require('./supabase_client');
const db = {
  prepare: (sql) => {
    const l = sql.toLowerCase();
    return {
      run: async (...p) => {
        if (l.includes('insert into site_content')) {
           await supabase.from('site_content').upsert({ section_key: p[0], content: p[1], updated_at: new Date().toISOString() }, { onConflict: 'section_key' });
           return { changes: 1 };
        }
        return { changes: 1, lastInsertRowid: Date.now() };
      },
      all: async () => {
        let t = '';
        if (l.includes('site_content')) t = 'site_content';
        else if (l.includes('services')) t = 'services';
        else if (l.includes('leads')) t = 'leads';
        else if (l.includes('users')) t = 'users';
        if (!t) return [];
        const { data } = await supabase.from(t).select('*');
        return data || [];
      },
      get: async (...p) => {
        if (l.includes('site_content')) {
          const { data } = await supabase.from('site_content').select('*').eq('section_key', p[0]).single();
          return data;
        }
        if (l.includes('users')) {
          const { data } = await supabase.from('users').select('*').eq(l.includes('email') ? 'email' : 'id', p[0]).single();
          return data;
        }
        return null;
      }
    };
  },
  exec: () => {}
};
module.exports = db;
