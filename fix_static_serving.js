const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Add static serving for root directory
const staticInjection = "app.use(express.static(__dirname));\n";
if (!content.includes('app.use(express.static(__dirname))')) {
  content = content.replace("app.use('/uploads', express.static(uploadsDir));", "app.use('/uploads', express.static(uploadsDir));\n" + staticInjection);
}

// Fix the catch-all route to not interfere with static files
content = content.replace(/app\.get\s*\(\s*'\/\(\.\*\)'\s*,/g, "app.get(['/', '/admin', '/login', '/services', '/quotation', '/privacy', '/terms'],");

fs.writeFileSync('server.js', content);
console.log('Static serving fixed in server.js');
