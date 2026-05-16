const fs = require('fs');

function wrapMkdir(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/fs\.mkdirSync\(.*?\);/g, 'try { $& } catch (e) { console.warn("Mkdir skipped (read-only):", e.message); }');
  fs.writeFileSync(filePath, content);
}

wrapMkdir('server.js');
if (fs.existsSync('scripts/backup.js')) wrapMkdir('scripts/backup.js');

console.log('Runtime mkdir wrapped');
