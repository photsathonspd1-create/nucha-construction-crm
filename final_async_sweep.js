const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function ') && lines[i].includes('{') && !lines[i].includes('async ')) {
    // Look ahead for await
    for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
      if (lines[j].includes('await ')) {
        lines[i] = lines[i].replace('function ', 'async function ');
        console.log('Fixed function at line', i + 1);
        break;
      }
    }
  }
}

fs.writeFileSync('server.js', lines.join('\n'));
