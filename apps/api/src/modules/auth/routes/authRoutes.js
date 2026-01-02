const express = require("express");
const bcrypt = require("bcrypt");
const { Organization } = require("../../org/models/Organization");

const { loginSchema } = require("../schemas/authSchemas");
const { signAccessToken } = require("../jwt");
const { requireAuth } = require("../middleware/requireAuth");


const { User } = require("../models/User");
const { registerSchema } = require("../schemas/authSchemas");

const router = express.Router();

router.post("/register", async (req, res) => {
  // 1) validate input
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "ValidationError",
      details: parsed.error.flatten()
    });
  }

  const { email, password } = parsed.data;

  // 2) check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      error: "UserAlreadyExists",
      message: "User with this email already exists"
    });
  }

  // 3) hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 4) create user
  const org = await Organization.create({
  name: parsed.data.organizationName
});

  // 5) create user as admin in this org
const user = await User.create({
  email,
  passwordHash,
  role: "admin",
  orgId: org._id
});
return res.status(201).json({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  orgId: user.orgId.toString(),
  organization: {
    id: org._id.toString(),
    name: org.name
  },
  createdAt: user.createdAt
});
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "ValidationError",
      details: parsed.error.flatten()
    });
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      error: "InvalidCredentials",
      message: "Email or password is incorrect"
    });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({
      error: "InvalidCredentials",
      message: "Email or password is incorrect"
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      error: "ServerMisconfigured",
      message: "JWT_SECRET is not set"
    });
  }

  const token = signAccessToken(
    { id: user._id.toString(), email: user.email, role: user.role },
    secret
  );

  return res.json({
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    }
  });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("_id email role createdAt");
    if (!user) {
      return res.status(404).json({
        error: "UserNotFound",
        message: "User not found"
      });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
