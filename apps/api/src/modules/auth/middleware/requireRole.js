function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.role) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Not authenticated"
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have access to this resource"
      });
    }

    return next();
  };
}

module.exports = { requireRole };
