import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AppActivitySession from '../models/AppActivitySession.mjs';

// Ensure we load server/.env (this script may be run from repo root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Prefer MONGO_URI (used in server/.env), fall back to other common names
const MONGO = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/examroot';

async function run() {
  // Use default mongoose connection options (avoid legacy parser options)
  await mongoose.connect(MONGO);
  console.log('Connected to', MONGO);

  const coll = mongoose.connection.collection('appactivitysessions');

  // List indexes
  const indexes = await coll.indexes();
  console.log('Existing indexes:', indexes.map(i => i.name));

  // Drop global unique on sessionId if exists
  const possible = indexes.find(i => i.key && i.key.sessionId === 1 && i.unique);
  if (possible) {
    console.log('Dropping index', possible.name);
    await coll.dropIndex(possible.name);
  } else {
    console.log('No global unique sessionId index found');
  }

  // Create compound unique index
  try {
    await coll.createIndex({ userId: 1, sessionId: 1 }, { unique: true, background: false });
    console.log('Created compound unique index {userId, sessionId}');
  } catch (err) {
    console.error('Failed creating compound index:', err.message);
  }

  // Report duplicates: sessionId used by multiple users
  const dupCursor = await coll.aggregate([
    { $group: { _id: { sessionId: '$sessionId', userId: '$userId' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $group: { _id: '$_id.sessionId', users: { $push: '$_id.userId' }, total: { $sum: '$count' }, docs: { $push: '$ids' } } },
    { $match: { 'users.1': { $exists: true } } },
    { $limit: 50 }
  ]).toArray();

  if (dupCursor.length === 0) {
    console.log('No sessionId used across multiple users found');
  } else {
    console.log('Found sessionIds used by multiple users (sample):');
    dupCursor.forEach(d => console.log(d._id, 'users:', d.users.length, 'totalEntries:', d.total));
  }

  await mongoose.disconnect();
  console.log('Migration complete');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
