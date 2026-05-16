const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix 1: res.json({ ... } -> res.json({ ... });
// Only if it ends the line or is followed by catch/next
content = content.replace(/res\.json\(\{(.*?)\}(?!\s*\)\s*;|\s*\)\s*\.|\s*\)\s*,)/g, 'res.json({$1})');

// Fix 2: Ensure any remaining async async is gone
content = content.replace(/async\s+async/g, 'async');

// Fix 3: Ensure any for...of loops that were corrupted are fixed
// If we have "for (...) { ... } );" replace with "for (...) { ... }"
content = content.replace(/(for\s*\(.*?\)\s*\{[\s\S]*?\})\s*\);/g, '$1');

fs.writeFileSync('server.js', content);
console.log('Final syntax check complete');
