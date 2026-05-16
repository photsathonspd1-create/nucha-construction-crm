const fs = require('fs');
let content = fs.readFileSync('api/index.js', 'utf8');

// Update imports
content = content.replace("require('./server/db_supabase')", "require('./server/db_supabase')");
content = content.replace("require('./server/migrations')", "require('./server/migrations')");
content = content.replace("require('./scripts/backup')", "require('../scripts/backup')");
content = content.replace("require('./utils/validate')", "require('./utils/validate')");

// Disable app.listen in Vercel
content = content.replace(/const server = app\.listen[\s\S]*?\}\);/g, "// Export for Vercel\nmodule.exports = app;");

// Fix Express 5 path error
content = content.replace(/app\.get\s*\(\s*'\*'\s*,/g, "app.get('/(.*)',");

fs.writeFileSync('api/index.js', content);
console.log('API index fixed');
