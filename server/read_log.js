const fs = require('fs');
try {
    const content = fs.readFileSync('browser_logs.txt', 'utf8'); // Try utf8 first
    console.log(content);
} catch (e) {
    console.log('Error reading file:', e.message);
}
