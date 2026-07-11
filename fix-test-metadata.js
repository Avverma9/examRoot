const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'test.json');
const text = fs.readFileSync(filePath, 'utf8');

function escapeForJson(value) {
  return JSON.stringify(value);
}

function updateTestEntries(textContent) {
  let updated = 0;
  const regex = /("questions"\s*:\s*\[[\s\S]*?\],\s*"totalQuestions"\s*:\s*)(\d+)(\s*,\s*"isFree")/g;

  const newText = textContent.replace(regex, (match, prefix, oldValue, suffix) => {
    updated += 1;
    return `${prefix}"0"${suffix}`;
  });

  return { newText, updated };
}

const result = updateTestEntries(text);
fs.writeFileSync(filePath, result.newText, 'utf8');
console.log(`Rewrote ${result.updated} entries.`);
