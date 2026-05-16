const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('res.json({') || line.includes('json({')) {
    // Count parentheses on this line
    let open = 0;
    for (let c of line) {
      if (c === '(') open++;
      if (c === ')') open--;
    }
    if (open > 0) {
      // If line ends with } or whitespace, add )
      if (line.trim().endsWith('}')) {
        lines[i] = line.trim() + ')'.repeat(open) + ';';
      } else {
         // Maybe it's spread across lines, but usually res.json is single line in this app
         console.log('Skipping line', i+1, 'due to complex structure');
      }
    }
  }
}

fs.writeFileSync('server.js', lines.join('\n'));
