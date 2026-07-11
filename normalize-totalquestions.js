const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'test.json');
let text = fs.readFileSync(filePath, 'utf8');
text = text.replace(/"totalQuestions"\s*:\s*"(\d+)"/g, '"totalQuestions": $1');
text = text.replace(/"duration"\s*:\s*"(\d+)"/g, '"duration": $1');
fs.writeFileSync(filePath, text, 'utf8');
console.log('Normalized numeric values.');
