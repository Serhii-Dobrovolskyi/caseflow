const express = require("express");
const bcrypt = require("bcrypt");

const { User } = require("../../auth/models/User");
const { requireAuth } = require("../../auth/middleware/requireAuth");
const { requireRole } = require("../../auth/middleware/requireRole");

const router = express.Router();

/**
 * POST /org/invite
 * Admin invites a user to their organization
 */
router.post("/invite", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        error: "ValidationError",
        message: "email is required"
      });
    }

    const allowedRoles = ["manager", "user"];
    const normalizedRole = allowedRoles.includes(role) ? role : "user";

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        error: "UserAlreadyExists",
        message: "User with this email already exists"
      });
    }

    // For MVP: generate a temporary password (later we will add real invite tokens)
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const invitedUser = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: normalizedRole,
      orgId: req.user.orgId
    });

    return res.status(201).json({
      user: {
        id: invitedUser._id.toString(),
        email: invitedUser.email,
        role: invitedUser.role,
        orgId: invitedUser.orgId.toString(),
        createdAt: invitedUser.createdAt
      },
      tempPassword
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
