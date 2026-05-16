const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Pattern 1: function name(...) { ... await ... }
content = content.replace(/(?<!async\s+)function\s+(\w+)\s*\((.*?)\)\s*\{([\s\S]*?await[\s\S]*?)\}/g, 'async function $1($2) {$3}');

// Pattern 2: (args) => { ... await ... }
content = content.replace(/(?<!async\s+)\((.*?)\)\s*=>\s*\{([\s\S]*?await[\s\S]*?)\}/g, 'async ($1) => {$2}');

// Pattern 3: arg => { ... await ... }
content = content.replace(/(?<!async\s+)(\w+)\s*=>\s*\{([\s\S]*?await[\s\S]*?)\}/g, 'async $1 => {$2}');

fs.writeFileSync('server.js', content);
console.log('Fixed missing async declarations');
