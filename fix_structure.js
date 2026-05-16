const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix 1: for (...) { ... }); -> for (...) { ... }
content = content.replace(/(for\s*\(.*?\)\s*\{[\s\S]*?\})\s*\);/g, '$1');

// Fix 2: let i = 0; for (...) { ... }); -> let i = 0; for (...) { ... }
content = content.replace(/(let\s+\w+\s*=\s*0\s*;\s*for\s*\(.*?\)\s*\{[\s\S]*?\})\s*\);/g, '$1');

fs.writeFileSync('server.js', content);
