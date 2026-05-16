const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// 1. Simple replacements
content = content.replace(/require\(['"]\.\/server\/db['"]\)/g, "require('./server/db_supabase')");
content = content.replace(/runMigrations\(\);/g, "// runMigrations();");

// 2. Async routes (Surgical)
// Only match the start of the function, don't touch the body
content = content.replace(/(app\.(get|post|put|delete|patch)\s*\(.*?,(\s*authMiddleware\s*,)?\s*)\((.*?)\)\s*=>/g, '$1async ($4) =>');

// 3. Await database calls (Surgical)
// Handle both db.prepare(...).all() and stmt.all()
// We'll wrap the known methods
const methods = ['all', 'get', 'run'];
methods.forEach(m => {
  const regex = new RegExp('(?<!await\\s+)(\\b[a-zA-Z0-9_]+\\.' + m + '\\()', 'g');
  content = content.replace(regex, 'await $1');
});

// Special case for db.prepare(...).method()
content = content.replace(/(?<!await\s+)(db\.prepare\(.*?\)\.(all|get|run)\()/g, 'await $1');

// 4. Exclude non-db awaits
content = content.replace(/await\s+(res|req|app|fs|path|crypto|bcrypt|jwt|multer|helmet|nodemailer|transporter|process|console|Math|JSON|Date|config)\./g, '$1.');

// 5. Ensure helper functions used with await are async
const helpers = ['getEmailTransporter', 'sendLineNotify', 'sendTelegramNotify', 'sendEmailNotification', 'getLineUserProfile', 'replyLineMessage', 'generateQuotationPDF', 'calculateScore', 'getTodayThai'];
helpers.forEach(h => {
  content = content.replace(new RegExp('(?<!async\\s+)function\\s+' + h, 'g'), 'async function ' + h);
  content = content.replace(new RegExp('(?<!await\\s+)' + h + '\\(', 'g'), 'await ' + h + '(');
});

// 6. Fix common async loop
content = content.replace(/(\w+)\.forEach\(\s*(async\s+)?\((.*?)\)\s*=>\s*\{([\s\S]*?await[\s\S]*?)\}\);/g, (match, list, isAsync, args, body) => {
  const parts = args.split(',').map(s => s.trim());
  const item = parts[0];
  const i = parts[1];
  if (i) {
    return `let ${i} = 0; for (const ${item} of ${list}) {${body} ${i}++;}`;
  }
  return `for (const ${item} of ${list}) {${body}}`;
});

// 7. Final cleanup
content = content.replace(/await\s+await/g, 'await');
content = content.replace(/async\s+async/g, 'async');

fs.writeFileSync('server.js', content);
console.log('Rebuild complete');
