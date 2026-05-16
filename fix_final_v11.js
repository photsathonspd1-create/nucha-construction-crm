const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Ensure db.prepare chains are awaited
content = content.replace(/(?<!await\s+)db\.prepare\(([\s\S]*?)\)\.(all|get|run)\(/g, 'await db.prepare($1).$2(');

// Ensure stmt calls are awaited
const methods = ['all', 'get', 'run'];
methods.forEach(m => {
  content = content.replace(/(?<!await\s+)(\b[a-zA-Z0-9_]+\.)(all|get|run)\(/g, (match, variable, method) => {
    const exclude = ['res.', 'req.', 'app.', 'fs.', 'path.', 'crypto.', 'bcrypt.', 'jwt.', 'multer.', 'helmet.', 'nodemailer.', 'transporter.', 'process.', 'console.', 'Math.', 'JSON.', 'Date.', 'config.', 'transporter.'];
    if (exclude.includes(variable)) return match;
    return 'await ' + match;
  });
});

// Convert forEach with await (now that await is present)
content = content.replace(/(\w+)\.forEach\(\s*(async\s+)?\((.*?)\)\s*=>\s*\{([\s\S]*?await[\s\S]*?)\}\);/g, (match, list, isAsync, args, body) => {
  const parts = args.split(',').map(s => s.trim());
  if (parts.length > 1) {
    const [item, i] = parts;
    return `let ${i} = 0; for (const ${item} of ${list}) {${body} ${i}++;}`;
  }
  return `for (const ${parts[0]} of ${list}) {${body}}`;
});

// Fix helper functions
const helpers = ['getEmailTransporter', 'sendLineNotify', 'sendTelegramNotify', 'sendEmailNotification', 'getLineUserProfile', 'replyLineMessage', 'generateQuotationPDF', 'calculateScore', 'getTodayThai'];
helpers.forEach(h => {
  content = content.replace(new RegExp('(?<!async\\s+)function\\s+' + h, 'g'), 'async function ' + h);
  content = content.replace(new RegExp('(?<!await\\s+)' + h + '\\(', 'g'), 'await ' + h + '(');
});

// Clean up
content = content.replace(/await\s+await/g, 'await');
content = content.replace(/async\s+async/g, 'async');

fs.writeFileSync('server.js', content);
