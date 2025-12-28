const { verifyAccessToken } = require("../jwt");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header"
    });
  }

  const token = authHeader.substring("Bearer ".length);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: "ServerMisconfigured",
      message: "JWT_SECRET is not set"
    });
  }

  try {
    const payload = verifyAccessToken(token, secret);
    req.user = payload; // { id, email, role }
    return next();
  } catch (err) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token"
    });
  }
}

module.exports = { requireAuth };
