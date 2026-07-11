const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'test.json');
const raw = fs.readFileSync(filePath, 'utf8');
let data;

try {
  data = JSON.parse(raw);
} catch (error) {
  console.error('JSON parse failed:', error.message);
  process.exit(1);
}

let updatedCount = 0;

function walk(node) {
  if (Array.isArray(node)) {
    node.forEach(walk);
    return;
  }

  if (!node || typeof node !== 'object') {
    return;
  }

  if (Array.isArray(node.questions)) {
    const count = node.questions.length;
    node.totalQuestions = count;
    node.duration = count > 0 ? Math.ceil(count / 2) : 0;
    updatedCount += 1;
  }

  Object.values(node).forEach(walk);
}

walk(data);
fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Updated ${updatedCount} test entries.`);
