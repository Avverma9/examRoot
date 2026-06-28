import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { MongoMemoryServer } from 'mongodb-memory-server'
import TestSeries from './models/TestSeries.mjs'

dotenv.config()

const TARGET_GROUP = process.argv[2] || 'History'
const LIMIT_TO_SERIES_ID = process.argv[3] || ''

async function connect() {
  const uri = process.env.MONGO_URI
  if (uri) {
    await mongoose.connect(uri)
    return null
  }

  const mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  return mongod
}

async function main() {
  const mongod = await connect()
  try {
    const filter = LIMIT_TO_SERIES_ID ? { _id: LIMIT_TO_SERIES_ID } : {}
    const seriesDocs = await TestSeries.find(filter)

    let seriesTouched = 0
    let testsTouched = 0

    for (const series of seriesDocs) {
      let changed = false
      series.tests = (series.tests || []).map((test) => {
        if (test.group === TARGET_GROUP) return test
        changed = true
        testsTouched += 1
        return {
          ...test.toObject?.() ?? test,
          group: TARGET_GROUP,
        }
      })

      if (changed) {
        series.totalTests = series.tests.length
        await series.save()
        seriesTouched += 1
      }
    }

    console.log(`Updated ${seriesTouched} test series`)
    console.log(`Updated ${testsTouched} tests to group "${TARGET_GROUP}"`)
  } finally {
    await mongoose.disconnect()
    if (mongod) await mongod.stop()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
