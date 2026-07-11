const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'test.json');
const text = fs.readFileSync(filePath, 'utf8');

function repairBareStringValues(raw) {
  let result = '';
  let i = 0;
  let inString = false;
  let escapeNext = false;
  let currentKey = '';

  while (i < raw.length) {
    const ch = raw[i];

    if (escapeNext) {
      result += ch;
      escapeNext = false;
      i += 1;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escapeNext = true;
      i += 1;
      continue;
    }

    if (ch === '"') {
      if (!inString) {
        inString = true;
        result += ch;
        i += 1;
        continue;
      }
      inString = false;
      result += ch;
      currentKey = result.slice(result.lastIndexOf('"', result.length - 2) + 1, -1);
      i += 1;
      continue;
    }

    if (!inString && ch === ':') {
      let j = i + 1;
      while (j < raw.length && /\s/.test(raw[j])) {
        j += 1;
      }

      if (j < raw.length && raw[j] !== '"' && raw[j] !== '{' && raw[j] !== '[' && raw[j] !== 't' && raw[j] !== 'f' && raw[j] !== 'n' && raw[j] !== '-' && !/\d/.test(raw[j])) {
        let k = j;
        while (k < raw.length && raw[k] !== ',' && raw[k] !== '\n' && raw[k] !== '\r' && raw[k] !== '}' && raw[k] !== ']') {
          k += 1;
        }
        const value = raw.slice(j, k).trim();
        if (value) {
          result += ':' + '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
          i = k;
          continue;
        }
      }
    }

    result += ch;
    i += 1;
  }

  return result;
}

function parseJSONWithRepair(raw) {
  const repaired = repairBareStringValues(raw);
  return JSON.parse(repaired);
}

const data = parseJSONWithRepair(text);
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
    const qCount = node.questions.length;
    node.totalQuestions = qCount;
    node.duration = qCount > 0 ? Math.ceil(qCount / 2) : 0;
    updatedCount += 1;
  }
  Object.values(node).forEach(walk);
}

walk(data);
fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Updated ${updatedCount} test entries.`);
