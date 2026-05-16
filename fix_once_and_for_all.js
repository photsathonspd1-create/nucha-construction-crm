const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Remove any ")" that appear immediately after a "}" at the end of a line
content = content.replace(/\}\s*\)\s*$/gm, '}');

// Fix common mistakes from previous scripts
content = content.replace(/res\.json\(\{(.*?)\}\s*\)\s*\)/g, 'res.json({$1})');
content = content.replace(/res\.status\((\d+)\)\.json\(\{(.*?)\}\s*\)\s*\)/g, 'res.status($1).json({$2})');

fs.writeFileSync('server.js', content);
