const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// 1. Change DB import
content = content.replace(/require\(['"]\.\/server\/db['"]\)/g, "require('./server/db_supabase')");

// 2. Disable migrations
content = content.replace(/runMigrations\(\);/g, "// runMigrations();");

// 3. Make Express routes async
content = content.replace(/app\.(get|post|put|delete|patch)\s*\(\s*(['"].*?['"])\s*,\s*(.*?)\s*,\s*\((.*?)\)\s*=>/g, 'app.$1($2, $3, async ($4) =>');
content = content.replace(/app\.(get|post|put|delete|patch)\s*\(\s*(['"].*?['"])\s*,\s*\((.*?)\)\s*=>/g, 'app.$1($2, async ($3) =>');

// 4. Add await to db.prepare calls
// This one is tricky if chained. Let's do it in steps.
content = content.replace(/(?<!await\s+)db\.prepare\(/g, 'await db.prepare(');

// Fix double awaits
content = content.replace(/await\s+await/g, 'await');

fs.writeFileSync('server.js', content);
console.log('Surgical refactor complete');
