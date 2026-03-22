const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    createdAt: userDoc.createdAt,
    avatarUrl: userDoc.avatarUrl || null,
  };
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", detail: errors.array() },
    });
  }

  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({
      error: { code: "CONFLICT_EMAIL_EXISTS", message: "Email already in use" },
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, passwordHash });

  const token = signToken(user._id.toString());
  return res.status(201).json({
    token,
    user: publicUser(user),
  });
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", detail: errors.array() },
    });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid credentials" },
    });
  }

  const token = signToken(user._id.toString());

  return res.status(200).json({
    token,
    user: publicUser(user),
  });
}

async function me(req, res) {
  const userId = req.user.userId;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "User not found" },
    });
  }

  return res.status(200).json({
    user: publicUser(user),
  });
}

/** GET /api/auth/google/callback — called by passport after Google auth */
function googleCallback(req, res) {
  // req.user is the Mongoose document set by passport strategy
  const token = signToken(req.user._id.toString());
  const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
  // Pass token as query param; client will consume it and remove from URL
  return res.redirect(`${frontendUrl}/?token=${token}`);
}

async function updateProfile(req, res) {
  const { name, avatarUrl } = req.body;
  const updates = {};
  if (name && typeof name === "string") {
    const trimmed = name.trim();
    if (trimmed.length >= 2 && trimmed.length <= 50) {
      updates.name = trimmed;
    }
  }
  if (avatarUrl !== undefined) {
    updates.avatarUrl = avatarUrl || null;
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
  });
  return res.json({ user: publicUser(user) });
}

module.exports = { register, login, me, googleCallback, updateProfile };
