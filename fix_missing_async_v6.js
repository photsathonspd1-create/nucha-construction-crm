const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Pattern: function name(args) { ... await ... }
// We use a non-greedy body match and check if it contains await
content = content.replace(/(?<!async\s+)function\s+(\w+)\s*\((.*?)\)\s*\{([\s\S]*?)\}/g, (match, name, args, body) => {
  if (body.includes('await ')) {
    return 'async function ' + name + ' (' + args + ') {' + body + '}';
  }
  return match;
});

// Remove accidental await inside definitions
content = content.replace(/async\s+function\s+await\s+/g, 'async function ');

fs.writeFileSync('server.js', content);
console.log('Fixed missing async v6');
