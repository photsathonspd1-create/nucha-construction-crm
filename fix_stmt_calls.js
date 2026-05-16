const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Safer approach: replace ANY .run/all/get calls that are not awaited and seem to be from DB
content = content.replace(/(?<!await\s+)(\w+)\.(all|get|run)\(/g, (match, variable, method) => {
  const excludeVars = ['res', 'req', 'app', 'fs', 'path', 'crypto', 'bcrypt', 'jwt', 'multer', 'helmet', 'nodemailer', 'transporter', 'process', 'console', 'Math', 'JSON', 'Date'];
  if (excludeVars.includes(variable)) return match;
  return 'await ' + match;
});

content = content.replace(/await\s+await/g, 'await');
fs.writeFileSync('server.js', content);
console.log('Fixed statement calls');
