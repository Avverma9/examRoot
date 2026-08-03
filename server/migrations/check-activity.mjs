import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/examroot';
const ACTIVE_WINDOW_SECONDS = Math.max(30, Number(process.env.APP_ACTIVITY_ACTIVE_WINDOW_SECONDS) || 120);

async function run() {
  await mongoose.connect(MONGO);
  console.log('Connected to', MONGO.split('@').pop ? MONGO.split('@').pop() : MONGO);

  const coll = mongoose.connection.collection('appactivitysessions');
  const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_SECONDS * 1000);

  const activeSessions = await coll.find({ lastSeenAt: { $gte: activeCutoff }, endedAt: null }).toArray();
  const activeCount = activeSessions.length;
  const uniqueDevices = new Set(activeSessions.map(s => s.deviceId)).size;
  const uniqueUsers = new Set(activeSessions.map(s => String(s.userId || ''))).size;

  console.log('\n--- Activity Summary ---');
  console.log('Active window seconds:', ACTIVE_WINDOW_SECONDS);
  console.log('Active sessions:', activeCount);
  console.log('Unique active devices:', uniqueDevices);
  console.log('Unique active users:', uniqueUsers);

  console.log('\nSample active sessions (up to 10):');
  activeSessions.slice(0, 10).forEach(s => {
    console.log('-', s._id.toString(), 'userId:', s.userId, 'deviceId:', s.deviceId, 'lastSeenAt:', s.lastSeenAt);
  });

  // Also show counts for firstSeenAt >= today start
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySessionsCount = await coll.countDocuments({ firstSeenAt: { $gte: todayStart } });
  const todayDevices = await coll.distinct('deviceId', { firstSeenAt: { $gte: todayStart } });

  console.log('\nToday sessions:', todaySessionsCount, 'today unique devices:', todayDevices.length);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
