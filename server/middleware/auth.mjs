import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Token not provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production");
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

/** Optional auth — sets req.userId if valid token present, never blocks the request */
export const optionalAuth = (req, _res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key-change-in-production");
      req.userId = decoded.userId;
      req.user   = decoded;
    }
  } catch (_) {
    // Invalid token → just ignore, continue as unauthenticated
  }
  next();
};
