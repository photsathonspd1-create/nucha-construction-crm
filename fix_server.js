const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix 1: Ensure all db.prepare calls that chain to .all/get/run are awaited
content = content.replace(/(?<!await\s+)(db\.prepare\([\s\S]*?)\.(all|get|run)\(/g, 'await $1.$2(');

// Fix 2: Remove redundant async async (just in case)
content = content.replace(/async\s+async/g, 'async');

// Fix 3: Ensure Express routes are async if they use await
// (This is harder with regex, but usually routes start with app.get/post)
// The previous agent already did some of this.

fs.writeFileSync('server.js', content);
console.log('Fixed server.js');
