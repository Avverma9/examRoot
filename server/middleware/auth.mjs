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
    console.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
