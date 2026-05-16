// server.js — Entry point
// Delegates to api/index.js which has all the Express routes

const { runMigrations } = require('./server/migrations');

async function main() {
  try {
    // runMigrations is now async — must await
    await runMigrations();
  } catch (err) {
    console.error('Migration error:', err.message);
    // Continue anyway — schema is managed via Supabase SQL Editor
  }

  // Start the Express app
  require('./api/index');
}

main();
