const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix 1: ids.forEach(id => { await ... }) -> for (const id of ids) { await ... }
content = content.replace(/(\w+)\.forEach\(([a-zA-Z0-9_, ]+)\s*=>\s*\{([\s\S]*?await[\s\S]*?)\}\);/g, (match, list, args, body) => {
  // Simple check for single arg
  if (!args.includes(',')) {
    return `for (const ${args.trim()} of ${list}) {${body}}`;
  }
  return match; // skip complex ones for now
});

// Fix 2: .map(async ... => { await ... }) is usually okay if wrapped in Promise.all
// But let's look for functions missing async

fs.writeFileSync('server.js', content);
console.log('Fixed loops in server.js');
