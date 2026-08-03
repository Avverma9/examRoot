import AppActivitySession from "../models/AppActivitySession.mjs";

const ACTIVE_WINDOW_SECONDS = Math.max(30, Number(process.env.APP_ACTIVITY_ACTIVE_WINDOW_SECONDS) || 120);
const ACTIVE_WINDOW_MS = ACTIVE_WINDOW_SECONDS * 1000;

const getNow = () => new Date();
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const firstForwarded = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "";
  const rawIp = firstForwarded || req.ip || req.socket?.remoteAddress || "";
  return String(rawIp).replace(/^::ffff:/, "");
};

const computeDurationSeconds = (session, now = getNow()) => {
  const start = session.firstSeenAt ? new Date(session.firstSeenAt).getTime() : now.getTime();
  return Math.max(0, Math.round((now.getTime() - start) / 1000));
};

const isCurrentlyActive = (session, now = getNow()) => {
  if (!session || session.endedAt) return false;
  const lastSeen = new Date(session.lastSeenAt || session.firstSeenAt || now).getTime();
  return now.getTime() - lastSeen <= ACTIVE_WINDOW_MS;
};

const serializeSession = (session) => {
  const plain = typeof session?.toObject === "function" ? session.toObject() : session;
  return {
    ...plain,
    isCurrentlyActive: isCurrentlyActive(plain),
    durationSeconds: plain?.durationSeconds ?? computeDurationSeconds(plain),
  };
};

const buildSessionPayload = (req) => {
  const {
    sessionId,
    deviceId,
    deviceLabel = "",
    platform = "",
    osVersion = "",
    appVersion = "",
    buildVersion = "",
    locale = "",
    timeZone = "",
    metadata = {},
  } = req.body || {};

  return {
    sessionId: String(sessionId || "").trim(),
    deviceId: String(deviceId || "").trim(),
    deviceLabel: String(deviceLabel || "").trim(),
    platform: String(platform || "").trim(),
    osVersion: String(osVersion || "").trim(),
    appVersion: String(appVersion || "").trim(),
    buildVersion: String(buildVersion || "").trim(),
    locale: String(locale || "").trim(),
    timeZone: String(timeZone || "").trim(),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  };
};

const upsertSession = async (req, res, { forceEnd = false, reason = "" } = {}) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const payload = buildSessionPayload(req);
    if (!payload.sessionId || !payload.deviceId) {
      console.warn('Invalid app session payload, missing sessionId/deviceId', { userId, payload });
      return res.status(400).json({
        success: false,
        message: "sessionId and deviceId are required",
      });
    }

    const now = getNow();
    const ipAddress = getClientIp(req);
    const userAgent = String(req.headers["user-agent"] || "");

    // Upsert by userId + sessionId to avoid cross-user collisions
    let session = await AppActivitySession.findOne({ userId, sessionId: payload.sessionId });

    if (!session) {
      session = await AppActivitySession.create({
        userId,
        sessionId: payload.sessionId,
        deviceId: payload.deviceId,
        deviceLabel: payload.deviceLabel,
        platform: payload.platform,
        osVersion: payload.osVersion,
        appVersion: payload.appVersion,
        buildVersion: payload.buildVersion,
        locale: payload.locale,
        timeZone: payload.timeZone,
        ipAddress,
        lastIpAddress: ipAddress,
        userAgent,
        firstSeenAt: now,
        lastSeenAt: now,
        endedAt: forceEnd ? now : null,
        durationSeconds: 0,
        heartbeatCount: 1,
        isActive: !forceEnd,
        endReason: forceEnd ? reason : "",
        metadata: payload.metadata,
      });
      return res.status(201).json({
        success: true,
        message: forceEnd ? "Session recorded" : "Session started",
        data: serializeSession(session),
      });
    }

    if (forceEnd) {
      // Log unexpected forceEnd events for diagnosis
      console.info('Force-ending app session', { userId, sessionId: payload.sessionId, reason });
      if (session && !session.endedAt) {
        session.endedAt = now;
        session.isActive = false;
        session.endReason = reason || session.endReason || "manual";
        session.lastSeenAt = now;
        session.lastIpAddress = ipAddress || session.lastIpAddress;
        session.durationSeconds = computeDurationSeconds(session, now);
        await session.save();

        return res.status(200).json({
          success: true,
          message: "Session ended",
          data: serializeSession(session),
        });
      }

      // If there's no existing session, still record an ended session record to avoid missing telemetry
      const ended = await AppActivitySession.create({
        userId,
        sessionId: payload.sessionId,
        deviceId: payload.deviceId,
        deviceLabel: payload.deviceLabel,
        platform: payload.platform,
        osVersion: payload.osVersion,
        appVersion: payload.appVersion,
        buildVersion: payload.buildVersion,
        locale: payload.locale,
        timeZone: payload.timeZone,
        ipAddress,
        lastIpAddress: ipAddress,
        userAgent,
        firstSeenAt: now,
        lastSeenAt: now,
        endedAt: now,
        durationSeconds: 0,
        heartbeatCount: 0,
        isActive: false,
        endReason: reason || "manual",
        metadata: payload.metadata,
      });

      return res.status(201).json({ success: true, message: 'Session recorded (ended)', data: serializeSession(ended) });
    }

    session.deviceLabel = payload.deviceLabel || session.deviceLabel;
    session.platform = payload.platform || session.platform;
    session.osVersion = payload.osVersion || session.osVersion;
    session.appVersion = payload.appVersion || session.appVersion;
    session.buildVersion = payload.buildVersion || session.buildVersion;
    session.locale = payload.locale || session.locale;
    session.timeZone = payload.timeZone || session.timeZone;
    session.lastSeenAt = now;
    session.lastIpAddress = ipAddress || session.lastIpAddress;
    session.ipAddress = session.ipAddress || ipAddress;
    session.heartbeatCount = (session.heartbeatCount || 0) + 1;
    session.metadata = {
      ...(session.metadata || {}),
      ...payload.metadata,
    };
    if (!session.endedAt) {
      session.isActive = true;
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Session updated",
      data: serializeSession(session),
    });
  } catch (error) {
    console.error("App activity upsert failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update app activity",
    });
  }
};

export const startAppSession = async (req, res) => upsertSession(req, res);

export const heartbeatAppSession = async (req, res) => upsertSession(req, res);

export const endAppSession = async (req, res) => upsertSession(req, res, { forceEnd: true, reason: req.body?.reason || "manual" });

export const getCurrentAppSessions = async (req, res) => {
  try {
    const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const sessions = await AppActivitySession.find({
      lastSeenAt: { $gte: activeCutoff },
      endedAt: null,
    })
      .sort({ lastSeenAt: -1 })
      .populate("userId", "name email");

    const serialised = sessions.map(serializeSession);
    const uniqueDeviceIds = new Set(serialised.map((item) => item.deviceId));
    const uniqueUserIds = new Set(serialised.map((item) => String(item.userId?._id || item.userId || "")));

    return res.status(200).json({
      success: true,
      data: serialised,
      summary: {
        currentActiveDevices: uniqueDeviceIds.size,
        currentActiveUsers: [...uniqueUserIds].filter(Boolean).length,
        activeWindowSeconds: ACTIVE_WINDOW_SECONDS,
      },
    });
  } catch (error) {
    console.error("getCurrentAppSessions error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch current activity",
    });
  }
};

export const getAppActivityOverview = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
    const endDate = getNow();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);

    const [
      currentSessions,
      totalSessions,
      totalDevices,
      todaySessions,
      todayDevices,
      rawDaily,
    ] = await Promise.all([
      AppActivitySession.find({
        lastSeenAt: { $gte: activeCutoff },
        endedAt: null,
      })
        .sort({ lastSeenAt: -1 })
        .limit(25)
        .populate("userId", "name email"),
      AppActivitySession.countDocuments({ firstSeenAt: { $gte: startDate } }),
      AppActivitySession.distinct("deviceId", { firstSeenAt: { $gte: startDate } }).then((arr) => arr.length),
      AppActivitySession.countDocuments({
        firstSeenAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      AppActivitySession.distinct("deviceId", {
        firstSeenAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }).then((arr) => arr.length),
      AppActivitySession.aggregate([
        {
          $match: {
            firstSeenAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$firstSeenAt" } },
            },
            sessions: { $sum: 1 },
            devices: { $addToSet: "$deviceId" },
            users: { $addToSet: "$userId" },
            activeSeconds: { $sum: { $ifNull: ["$durationSeconds", 0] } },
            maxSessionSeconds: { $max: { $ifNull: ["$durationSeconds", 0] } },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
    ]);

    const dateMap = {};
    for (let i = 0; i < days; i += 1) {
      const cursor = new Date(startDate);
      cursor.setDate(startDate.getDate() + i);
      const key = cursor.toISOString().slice(0, 10);
      dateMap[key] = {
        date: key,
        sessions: 0,
        uniqueDevices: 0,
        uniqueUsers: 0,
        activeMinutes: 0,
        maxSessionMinutes: 0,
      };
    }

    rawDaily.forEach((row) => {
      const dateKey = row?._id?.date;
      if (!dateMap[dateKey]) return;
      dateMap[dateKey] = {
        date: dateKey,
        sessions: row.sessions || 0,
        uniqueDevices: Array.isArray(row.devices) ? row.devices.length : 0,
        uniqueUsers: Array.isArray(row.users) ? row.users.length : 0,
        activeMinutes: Math.round(((row.activeSeconds || 0) / 60) * 10) / 10,
        maxSessionMinutes: Math.round(((row.maxSessionSeconds || 0) / 60) * 10) / 10,
      };
    });

    const currentActiveDevices = new Set(currentSessions.map((session) => session.deviceId)).size;
    const currentActiveUsers = new Set(currentSessions.map((session) => String(session.userId?._id || session.userId || ""))).size;
    const totalActiveMinutes = currentSessions.reduce((sum, session) => sum + Math.max(0, session.durationSeconds || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          currentActiveDevices,
          currentActiveUsers,
          todaySessions,
          todayDevices,
          totalSessions,
          totalDevices,
          totalActiveMinutes: Math.round((totalActiveMinutes / 60) * 10) / 10,
          activeWindowSeconds: ACTIVE_WINDOW_SECONDS,
        },
        currentSessions: currentSessions.map(serializeSession),
        daily: Object.values(dateMap),
      },
    });
  } catch (error) {
    console.error("getAppActivityOverview error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activity overview",
    });
  }
};

export const getAppActivitySessions = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    const startDate = getNow();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const query = { firstSeenAt: { $gte: startDate } };
    const [items, total] = await Promise.all([
      AppActivitySession.find(query)
        .sort({ firstSeenAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name email")
        .lean(),
      AppActivitySession.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: items.map((item) => ({
        ...item,
        isCurrentlyActive: isCurrentlyActive(item),
        durationSeconds: item.durationSeconds ?? computeDurationSeconds(item),
      })),
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error("getAppActivitySessions error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activity sessions",
    });
  }
};
