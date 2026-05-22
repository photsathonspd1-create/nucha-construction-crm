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
        if (l.includes('insert into nav_items')) {
            await supabase.from('nav_items').insert([{ label: p[0], href: p[1], sort_order: p[2], is_visible: p[3] }]);
            return { changes: 1 };
        }
        if (l.includes('delete from nav_items')) {
            await supabase.from('nav_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
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
        else if (l.includes('nav_items')) t = 'nav_items';
        else if (l.includes('footer_links')) t = 'footer_links';
        
        if (!t) return [];
        
        let query = supabase.from(t).select('*');
        if (l.includes('order by sort_order')) query = query.order('sort_order');
        if (l.includes('order by created_at desc')) query = query.order('created_at', { ascending: false });
        
        const { data } = await query;
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
