const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix: for (const id of ids) {...}); -> for (const id of ids) {...}
content = content.replace(/for\s*\((const|let|var)\s+(\w+)\s+of\s+(\w+)\)\s*\{([\s\S]*?)\}\s*\);/g, 'for ($1 $2 of $3) {$4}');

fs.writeFileSync('server.js', content);
console.log('Fixed loop trailing brackets');
