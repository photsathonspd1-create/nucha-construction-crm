const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// 1. Find all function names that are now async or need to be
// We'll look for functions containing await
const asyncFuncs = new Set();
content.replace(/function\s+(\w+)\s*\(.*?\)\s*\{([\s\S]*?await[\s\S]*?)\}/g, (match, name) => {
  asyncFuncs.add(name);
  return match;
});

// 2. Make them async if not already
asyncFuncs.forEach(name => {
  const regex = new RegExp('(?<!async\\s+)function\\s+' + name + '\\s*\\(', 'g');
  content = content.replace(regex, 'async function ' + name + ' (');
});

// 3. Find calls to these functions and add await
asyncFuncs.forEach(name => {
  const regex = new RegExp('(?<!await\\s+)' + name + '\\s*\\(', 'g');
  content = content.replace(regex, 'await ' + name + '(');
});

// Fix common helper functions that we know are now async
const helpers = ['getEmailTransporter', 'sendLineNotify', 'sendTelegramNotify', 'sendEmailNotification', 'getLineUserProfile', 'replyLineMessage', 'generateQuotationPDF', 'calculateScore', 'getTodayThai'];
helpers.forEach(name => {
  const regex = new RegExp('(?<!await\\s+)' + name + '\\s*\\(', 'g');
  content = content.replace(regex, 'await ' + name + '(');
});

// Fix double awaits and redundant async
content = content.replace(/await\s+await/g, 'await');
content = content.replace(/async\s+async/g, 'async');

fs.writeFileSync('server.js', content);
console.log('Cascading async fixed');
