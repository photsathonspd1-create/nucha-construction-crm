const fs = require('fs');
let lines = fs.readFileSync('server.js', 'utf8').split('\n');

const fixed = lines.map(line => {
  // If line ends with }) ) or }); ) or });) remove the extra )
  if (line.trim().endsWith('}) )')) return line.replace(/}\) \)$/, '})');
  if (line.trim().endsWith('}) ) ;')) return line.replace(/}\) \) ;$/, '});');
  if (line.trim().endsWith('}); )')) return line.replace(/}\); \)$/, '});');
  if (line.trim().endsWith('});)')) return line.replace(/}\);\)$/, '});');
  return line;
});

// A more aggressive one: replace "}) )" with "})"
let content = fixed.join('\n');
content = content.replace(/\}\) \)\s*$/gm, '})');
content = content.replace(/\}\);\)\s*$/gm, '});');
content = content.replace(/\}\)\);\s*$/gm, '});');

fs.writeFileSync('server.js', content);
console.log('Trailing parens fixed');
