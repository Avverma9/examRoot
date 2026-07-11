import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { MongoMemoryServer } from 'mongodb-memory-server'
import TestSeries from './models/TestSeries.mjs'

dotenv.config()

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
    const seriesDocs = await TestSeries.find({})
    let touched = 0

    for (const series of seriesDocs) {
      const normalizedTests = (series.tests || []).map((test, index) => {
        const questions = Array.isArray(test.questions) ? test.questions : []
        return {
          ...test.toObject?.() ?? test,
          questions,
          totalQuestions: questions.length,
          order: test.order ?? index,
        }
      })

      const totalTests = normalizedTests.length
      const shouldUpdate =
        series.totalTests !== totalTests ||
        normalizedTests.some((test, index) =>
          test.totalQuestions !== (series.tests?.[index]?.totalQuestions || 0)
        )

      if (shouldUpdate) {
        series.tests = normalizedTests
        series.totalTests = totalTests
        await series.save()
        touched += 1
      }
    }

    console.log(`Updated ${touched} test series with fixed question counts.`)
  } finally {
    await mongoose.disconnect()
    if (mongod) await mongod.stop()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
