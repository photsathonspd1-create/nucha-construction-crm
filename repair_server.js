const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix 1: res.status(...).json({ ... } -> res.status(...).json({ ... });
content = content.replace(/res\.status\(\d+\)\.json\(\{(.*?)\}(?!\s*\))/g, 'res.status(200).json({$1})');

// Fix 2: res.json({ ... } -> res.json({ ... });
content = content.replace(/res\.json\(\{(.*?)\}(?!\s*\))/g, 'res.json({$1})');

// Fix 3: Ensure all return res... have a semicolon or closing parenthesis
content = content.replace(/return res\.status\((\d+)\)\.json\(\{(.*?)\}(?!\s*\))/g, 'return res.status($1).json({$2})');

fs.writeFileSync('server.js', content);
console.log('Repair complete');
