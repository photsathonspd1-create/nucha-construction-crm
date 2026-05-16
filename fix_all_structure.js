const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix 1: for (...) { ... }); -> for (...) { ... }
content = content.replace(/(for\s*\(.*?\)\s*\{[\s\S]*?\})\s*\);/g, '$1');

// Fix 2: res.json(...) missing );
content = content.replace(/res\.json\(\{(.*?)\}(?!\s*\)\s*;|\s*\)\s*\.|\s*\)\s*,)/g, 'res.json({$1});');

// Fix 3: res.status(...).json(...) missing );
content = content.replace(/res\.status\(\d+\)\.json\(\{(.*?)\}(?!\s*\)\s*;|\s*\)\s*\.|\s*\)\s*,)/g, 'res.status(200).json({$1});');

// Fix 4: any line ending in }); ) -> });
content = content.replace(/\}\s*\);\s*\)\s*$/gm, '});');

// Fix 5: Double semicolons
content = content.replace(/;;$/gm, ';');

fs.writeFileSync('server.js', content);
