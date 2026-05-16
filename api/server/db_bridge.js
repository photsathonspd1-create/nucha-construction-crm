const supabase = require('./supabase_client');

// Bridge to translate SQLite-like calls to Supabase (for minimal refactoring)
const db = {
  prepare: (sql) => {
    return {
      run: (...params) => {
        console.warn('DB.run called (Bridge):', sql);
        // Map common queries here or refactor directly in server.js
        return { changes: 1, lastInsertRowid: Date.now() };
      },
      all: (...params) => {
        console.warn('DB.all called (Bridge):', sql);
        return [];
      },
      get: (...params) => {
        console.warn('DB.get called (Bridge):', sql);
        return null;
      }
    };
  },
  exec: (sql) => {
    console.warn('DB.exec called (Bridge): Schema setup should be done via Supabase SQL Editor');
  }
};

module.exports = db;
