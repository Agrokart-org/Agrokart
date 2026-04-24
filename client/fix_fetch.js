const fs = require('fs');
const filePath = './src/services/api.js';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Replace "await fetch(" with "await safeFetch(" on all lines AFTER line 92
// (line 92 is 0-indexed = line 93 in file, which is after the safeFetch function definition)
for (let i = 92; i < lines.length; i++) {
  // Skip lines that already use safeFetch
  if (lines[i].includes('safeFetch(')) continue;
  // Replace fetch( with safeFetch(
  if (lines[i].includes('await fetch(')) {
    lines[i] = lines[i].replace('await fetch(', 'await safeFetch(');
    console.log(`Line ${i + 1}: replaced fetch -> safeFetch`);
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done!');
