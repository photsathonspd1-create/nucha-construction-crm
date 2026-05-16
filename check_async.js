const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');

const functions = content.split(/function\s+/);
for (let i = 1; i < functions.length; i++) {
  const func = functions[i];
  const bodyMatch = func.match(/\{([\s\S]*)\}/);
  if (bodyMatch) {
    const body = bodyMatch[1];
    if (body.includes('await ') && !functions[i-1].trim().endsWith('async')) {
       // This might be a false positive if it's an arrow function or something
       // But let's log the first line to see
       console.log('Function possibly missing async:', func.split('\n')[0]);
    }
  }
}
