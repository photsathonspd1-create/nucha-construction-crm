const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Match var.all/get/run( and ensure await prefix if missing
content = content.replace(/(?<!await\s+)(\w+)\.(all|get|run)\(/g, (match, variable, method) => {
  const excludeVars = ['res', 'req', 'app', 'fs', 'path', 'crypto', 'bcrypt', 'jwt', 'multer', 'helmet', 'nodemailer', 'transporter', 'process', 'console', 'Math', 'JSON', 'Date', 'config', 'transporter'];
  if (excludeVars.includes(variable)) return match;
  return 'await ' + match;
});

content = content.replace(/await\s+await/g, 'await');
fs.writeFileSync('server.js', content);
console.log('Stmt calls fixed');
