const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix: list.forEach(arg => { ... await ... })
content = content.replace(/(\w+)\.forEach\(\s*(async\s+)?(\w+|\(.*\))\s*=>\s*\{([\s\S]*?await[\s\S]*?)\}\);/g, (match, list, isAsync, args, body) => {
  const cleanArgs = args.replace(/[\(\)]/g, '').split(',').map(s => s.trim());
  if (cleanArgs.length > 1) {
    const [item, i] = cleanArgs;
    return `let ${i} = 0; for (const ${item} of ${list}) {${body} ${i}++;}`;
  }
  return `for (const ${cleanArgs[0]} of ${list}) {${body}}`;
});

fs.writeFileSync('server.js', content);
