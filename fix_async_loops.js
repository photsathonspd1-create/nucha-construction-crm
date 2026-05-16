const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix: items.forEach(item => { await ... }) -> for (const item of items) { await ... }
content = content.replace(/(\w+)\.forEach\(([a-zA-Z0-9_, ]+)\s*=>\s*\{([\s\S]*?await[\s\S]*?)\}\);/g, (match, list, args, body) => {
  if (!args.includes(',')) {
    return `for (const ${args.trim()} of ${list}) {${body}}`;
  }
  // For (item, i) pattern
  const [item, i] = args.split(',').map(s => s.trim());
  return `let ${i} = 0; for (const ${item} of ${list}) {${body} ${i}++;}`;
});

fs.writeFileSync('server.js', content);
console.log('Async loops fixed');
