const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Fix 1: Double closures
content = content.replace(/\);\s*\);\s*/g, ');');
content = content.replace(/\}\s*\);\s*\);\s*/g, '});');

// Fix 2: Unbalanced on single line
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('res.') || line.includes('await ')) {
    let open = 0;
    for (let c of line) {
      if (c === '(') open++;
      if (c === ')') open--;
    }
    if (open > 0) {
       lines[i] = line.trim() + ')'.repeat(open) + ';';
    } else if (open < 0) {
       // Remove extra closing parens
       for (let k = 0; k < Math.abs(open); k++) {
         lines[i] = lines[i].replace(/\)\s*;?\s*$/, '');
       }
       if (!lines[i].endsWith(';')) lines[i] += ';';
    }
  }
}

fs.writeFileSync('server.js', lines.join('\n'));
console.log('Final repair v10 done');
