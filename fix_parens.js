const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const lines = content.split('\n');
const fixedLines = lines.map(line => {
  if (line.includes('res.json({') || line.includes('res.status(')) {
    let openCount = 0;
    for (let char of line) {
      if (char === '(') openCount++;
      if (char === ')') openCount--;
    }
    if (openCount > 0) {
      return line + ')'.repeat(openCount) + ';';
    }
  }
  return line;
});

fs.writeFileSync('server.js', fixedLines.join('\n'));
console.log('Fixed parentheses on lines');
