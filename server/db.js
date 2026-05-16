const supabase = require('./supabase_client');

// Supabase proxy that simulates better-sqlite3 API
// All methods are async (return Promises) — callers must use await
const db = {
  prepare: (sql) => {
    return {
      run: async (...params) => {
        console.log('Supabase Proxy (run):', sql);

        // INSERT INTO leads
        if (sql.includes('INSERT INTO leads')) {
          const [name, phone, service_type, budget_range, message, status, score] = params;
          const { data, error } = await supabase.from('leads').insert([{
            name, phone, service_type, budget_range, message, status, score
          }]);
          if (error) throw error;
          return { changes: 1, lastInsertRowid: Date.now() };
        }

        // INSERT INTO migrations
        if (sql.includes('INSERT INTO migrations')) {
          const [name] = params;
          const { error } = await supabase.from('migrations').insert([{ name }]);
          if (error) throw error;
          return { changes: 1 };
        }

        // INSERT INTO site_content
        if (sql.includes('INSERT INTO site_content')) {
          const [section_key, content] = params;
          const { error } = await supabase.from('site_content').insert([{
            section_key, content, updated_at: new Date().toISOString()
          }]);
          if (error) throw error;
          return { changes: 1 };
        }

        // INSERT INTO service_gallery
        if (sql.includes('INSERT INTO service_gallery')) {
          const [service_category, title, description, image_url, image_type, sort_order] = params;
          const { error } = await supabase.from('service_gallery').insert([{
            service_category, title, description, image_url, image_type, sort_order
          }]);
          if (error) throw error;
          return { changes: 1 };
        }

        // UPDATE site_content
        if (sql.includes('UPDATE site_content')) {
          const [content, section_key] = params;
          const { error } = await supabase.from('site_content')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('section_key', section_key);
          if (error) throw error;
          return { changes: 1 };
        }

        // Generic success for other writes
        return { changes: 1 };
      },

      all: async (...params) => {
        console.log('Supabase Proxy (all):', sql);

        // Migrations table
        if (sql.includes('FROM migrations')) {
          const { data, error } = await supabase.from('migrations').select('name');
          if (error) return [];
          return data || [];
        }

        // site_content
        if (sql.includes('FROM site_content')) {
          const { data, error } = await supabase.from('site_content').select('*');
          if (error) return [];
          return data || [];
        }

        // services
        if (sql.includes('FROM services')) {
          let query = supabase.from('services').select('*');
          if (sql.includes('is_active')) query = query.eq('is_active', 1);
          query = query.order('sort_order');
          const { data, error } = await query;
          if (error) return [];
          return data || [];
        }

        // leads
        if (sql.includes('FROM leads')) {
          let query = supabase.from('leads').select('*');
          if (sql.includes('ORDER BY created_at DESC')) query = query.order('created_at', { ascending: false });
          const { data, error } = await query;
          if (error) return [];
          return data || [];
        }

        // users
        if (sql.includes('FROM users')) {
          const { data, error } = await supabase.from('users').select('*');
          if (error) return [];
          return data || [];
        }

        // nav_items
        if (sql.includes('FROM nav_items')) {
          const { data, error } = await supabase.from('nav_items').select('*').order('sort_order');
          if (error) return [];
          return data || [];
        }

        // footer_links
        if (sql.includes('FROM footer_links')) {
          const { data, error } = await supabase.from('footer_links').select('*');
          if (error) return [];
          return data || [];
        }

        // service_gallery
        if (sql.includes('FROM service_gallery')) {
          let query = supabase.from('service_gallery').select('*');
          if (sql.includes('ORDER BY sort_order')) query = query.order('sort_order');
          const { data, error } = await query;
          if (error) return [];
          return data || [];
        }

        // chat_messages
        if (sql.includes('FROM chat_messages')) {
          let query = supabase.from('chat_messages').select('*');
          if (sql.includes('ORDER BY created_at')) query = query.order('created_at');
          const { data, error } = await query;
          if (error) return [];
          return data || [];
        }

        // password_resets
        if (sql.includes('FROM password_resets')) {
          const { data, error } = await supabase.from('password_resets').select('*');
          if (error) return [];
          return data || [];
        }

        // backups
        if (sql.includes('FROM backups')) {
          const { data, error } = await supabase.from('backups').select('*').order('created_at', { ascending: false });
          if (error) return [];
          return data || [];
        }

        console.warn('Supabase Proxy (all): unmatched SQL:', sql);
        return [];
      },

      get: async (...params) => {
        console.log('Supabase Proxy (get):', sql);

        // site_content by section_key
        if (sql.includes('FROM site_content WHERE section_key')) {
          const { data, error } = await supabase.from('site_content')
            .select('*')
            .eq('section_key', params[0])
            .single();
          return error ? null : data;
        }

        // users by email
        if (sql.includes('FROM users WHERE email')) {
          const { data, error } = await supabase.from('users')
            .select('*')
            .eq('email', params[0])
            .single();
          return error ? null : data;
        }

        // users by id
        if (sql.includes('FROM users WHERE id')) {
          const { data, error } = await supabase.from('users')
            .select('*')
            .eq('id', params[0])
            .single();
          return error ? null : data;
        }

        // COUNT queries
        if (sql.includes('COUNT(*)')) {
          const table = sql.match(/FROM\s+(\w+)/)?.[1];
          if (table) {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            return error ? { c: 0 } : { c: count || 0 };
          }
        }

        // leads by id
        if (sql.includes('FROM leads WHERE id')) {
          const { data, error } = await supabase.from('leads')
            .select('*')
            .eq('id', params[0])
            .single();
          return error ? null : data;
        }

        // password_resets by token
        if (sql.includes('FROM password_resets WHERE token')) {
          const { data, error } = await supabase.from('password_resets')
            .select('*')
            .eq('token', params[0])
            .single();
          return error ? null : data;
        }

        console.warn('Supabase Proxy (get): unmatched SQL:', sql);
        return null;
      }
    };
  },

  // exec is a no-op for Supabase (schema managed via SQL Editor)
  exec: (sql) => {
    console.log('DB.exec (no-op):', sql.substring(0, 80));
  }
};

module.exports = db;
