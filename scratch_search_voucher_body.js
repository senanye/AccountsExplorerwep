const fs = require('fs');
const path = require('path');

const contentApp = fs.readFileSync(path.join(__dirname, 'public', 'app.js'), 'utf8');
const lines = contentApp.split('\n');

console.log("=== voucherDetailsBody in app.js ===");
lines.forEach((line, index) => {
  if (line.includes('voucherDetailsBody')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
