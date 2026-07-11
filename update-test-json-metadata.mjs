import fs from 'fs/promises';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'test.json');

function repairBareStringValues(text) {
  return text.replace(/("([^"\\]+)"\s*:\s*)([^",\n\r\{\[\]\}]+)(["\n\r,])/g, (match, prefix, key, value, endChar) => {
    const trimmed = value.trim();

    if (!trimmed || /^(true|false|null|-?\d+(?:\.\d+)?|[\[{])/.test(trimmed)) {
      return match;
    }

    return `${prefix}"${trimmed.replace(/"/g, '\\"')}"${endChar}`;
  });
}

function updateTestMetadata(node, stats) {
  if (Array.isArray(node)) {
    node.forEach((item) => updateTestMetadata(item, stats));
    return;
  }

  if (!node || typeof node !== 'object') {
    return;
  }

  if (Array.isArray(node.questions)) {
    const questionCount = node.questions.length;
    node.totalQuestions = questionCount;
    node.duration = questionCount > 0 ? Math.ceil(questionCount / 2) : 0;
    stats.updated += 1;
  }

  Object.values(node).forEach((value) => updateTestMetadata(value, stats));
}

async function main() {
  const raw = await fs.readFile(filePath, 'utf8');
  const repaired = repairBareStringValues(raw);
  const data = JSON.parse(repaired);
  const stats = { updated: 0 };

  updateTestMetadata(data, stats);

  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  console.log(`Updated ${stats.updated} test entries in ${path.basename(filePath)}.`);
}

main().catch((error) => {
  console.error('Failed to update test metadata:', error);
  process.exit(1);
});
