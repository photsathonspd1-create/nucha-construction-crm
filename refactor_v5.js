const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// 1. Basic changes
content = content.replace(/require\(['"]\.\/server\/db['"]\)/g, "require('./server/db_supabase')");
content = content.replace(/runMigrations\(\);/g, "// runMigrations();");

// 2. Async routes
content = content.replace(/app\.(get|post|put|delete|patch)\s*\(\s*(['"].*?['"])\s*,\s*(.*?)\s*,\s*\((.*?)\)\s*=>/g, 'app.$1($2, $3, async ($4) =>');
content = content.replace(/app\.(get|post|put|delete|patch)\s*\(\s*(['"].*?['"])\s*,\s*\((.*?)\)\s*=>/g, 'app.$1($2, async ($3) =>');

// 3. Await db calls
content = content.replace(/(?<!await\s+)db\.prepare\(/g, 'await db.prepare(');

// 4. Fix forEach loops that use await
content = content.replace(/(\w+)\.forEach\(\s*(async\s+)?\((.*?)\)\s*=>\s*\{([\s\S]*?await[\s\S]*?)\}\);/g, (match, list, isAsync, args, body) => {
  const [item, i] = args.split(',').map(s => s.trim());
  if (i) {
    return `let ${i} = 0; for (const ${item} of ${list}) {${body} ${i}++;}`;
  }
  return `for (const ${item} of ${list}) {${body}}`;
});

// 5. Make helper functions async if they use await
const helperPatterns = [
  /function\s+(\w+)\s*\(.*?\)\s*\{[\s\S]*?await[\s\S]*?\}/g,
  /(\w+)\s*=\s*\(.*?\)\s*=>\s*\{[\s\S]*?await[\s\S]*?\}/g
];

// This is complex for regex, let's just target known helpers
const helpers = ['getEmailTransporter', 'sendLineNotify', 'sendTelegramNotify', 'sendEmailNotification', 'getLineUserProfile', 'replyLineMessage', 'generateQuotationPDF'];
helpers.forEach(h => {
  content = content.replace(new RegExp('(?<!async\\s+)function\\s+' + h, 'g'), 'async function ' + h);
});

// 6. Await helper calls
helpers.forEach(h => {
  content = content.replace(new RegExp('(?<!await\\s+)' + h + '\\(', 'g'), 'await ' + h + '(');
});

// 7. Await stmt calls
content = content.replace(/(?<!await\s+)(\w+)\.(all|get|run)\(/g, (match, variable, method) => {
  const excludeVars = ['res', 'req', 'app', 'fs', 'path', 'crypto', 'bcrypt', 'jwt', 'multer', 'helmet', 'nodemailer', 'transporter', 'process', 'console', 'Math', 'JSON', 'Date', 'config', 'transporter'];
  if (excludeVars.includes(variable)) return match;
  return 'await ' + match;
});

// 8. Clean up
content = content.replace(/await\s+await/g, 'await');
content = content.replace(/async\s+async/g, 'async');

fs.writeFileSync('server.js', content);
console.log('Refactor v5 complete');
