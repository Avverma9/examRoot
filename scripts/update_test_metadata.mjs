#!/usr/bin/env node
import fs from 'fs/promises'
import path from 'path'

const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/update_test_metadata.mjs <file> [--dry-run]')
  process.exit(0)
}

const fileArg = args[0] || 'test.json'
const dryRun = args.includes('--dry-run') || args.includes('-n')
const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg)

async function loadJSON(p) {
  const raw = await fs.readFile(p, 'utf8')
  return JSON.parse(raw)
}

async function saveJSON(p, data) {
  await fs.writeFile(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function findTestsContainer(json) {
  if (Array.isArray(json) && json.length > 0 && Array.isArray(json[0].tests)) return { container: json[0], key: 'tests' }
  if (json && Array.isArray(json.tests)) return { container: json, key: 'tests' }
  if (Array.isArray(json) && json.length > 0 && json.every(i => typeof i === 'object' && ('questions' in i || 'title' in i))) return { container: json, key: null }
  return null
}

async function main() {
  try {
    const json = await loadJSON(filePath)
    const found = findTestsContainer(json)
    if (!found) {
      console.error('Could not locate tests array in JSON file.')
      process.exit(1)
    }
    const tests = found.key ? found.container[found.key] : found.container
    let changed = 0
    for (const t of tests) {
      const q = Array.isArray(t.questions) ? t.questions : []
      const count = q.length
      const newTotal = count
      const newDuration = Math.ceil((count * 30) / 60)
      if (t.totalQuestions !== newTotal || t.duration !== newDuration) {
        t.totalQuestions = newTotal
        t.duration = newDuration
        changed++
      }
    }
    if (changed === 0) {
      console.log('No changes needed.')
      process.exit(0)
    }
    if (!dryRun) {
      const backup = filePath + '.bak-' + Date.now()
      await fs.copyFile(filePath, backup)
      await saveJSON(filePath, json)
      console.log(`Updated ${changed} tests. Backup: ${backup}`)
    } else {
      console.log(`[dry-run] Would update ${changed} tests.`)
    }
  } catch (err) {
    console.error('Error:', err.message || err)
    process.exit(1)
  }
}

main()
