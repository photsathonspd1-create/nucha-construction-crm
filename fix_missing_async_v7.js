const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function ') && lines[i].includes('{') && !lines[i].includes('async ')) {
    // Check next 20 lines for await
    let hasAwait = false;
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
      if (lines[j].includes('await ')) {
        hasAwait = true;
        break;
      }
    }
    if (hasAwait) {
      lines[i] = lines[i].replace('function ', 'async function ');
      console.log('Fixed function at line', i + 1, ':', lines[i].trim());
    }
  }
}

fs.writeFileSync('server.js', lines.join('\n'));
