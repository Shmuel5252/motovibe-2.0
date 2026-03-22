const router = require("express").Router();
const { body } = require("express-validator");
const passport = require("../../config/passport");
const authMiddleware = require("../middlewares/auth.middleware");
const authController = require("../controllers/auth.controller");

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").isString().trim().isLength({ min: 2, max: 50 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8, max: 72 }),
  ],
  authController.register,
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 1 }),
  ],
  authController.login,
);

// GET /api/auth/me (protected)
router.get("/me", authMiddleware, authController.me);

// PATCH /api/auth/profile (protected)
router.patch("/profile", authMiddleware, authController.updateProfile);

// GET /api/auth/google — redirect to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// GET /api/auth/google/callback — Google redirects here after consent
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/?auth_error=google`,
  }),
  authController.googleCallback,
);

module.exports = router;
