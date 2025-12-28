const express = require("express");
const bcrypt = require("bcrypt");

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
  const user = await User.create({
    email,
    passwordHash,
    role: "user"
  });

  // 5) return safe response (without passwordHash)
  return res.status(201).json({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  });
});

module.exports = router;
