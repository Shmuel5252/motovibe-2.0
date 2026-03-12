const router = require("express").Router();
const { body } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware");
const eventsController = require("../controllers/events.controller");

// Public endpoints — no auth required
router.get("/", eventsController.listEvents);
router.get("/:id", eventsController.getEvent);

// Protected endpoints
router.use(authMiddleware);

router.post(
  "/",
  [
    body("title").isString().trim().isLength({ min: 2, max: 100 }),
    body("description").optional().isString().trim().isLength({ max: 1000 }),
    body("scheduledAt")
      .isISO8601()
      .withMessage("scheduledAt must be a valid ISO-8601 date"),
    body("maxParticipants").optional({ nullable: true }).isInt({ min: 2 }),
    body("route").optional({ nullable: true }).isMongoId(),
  ],
  eventsController.createEvent,
);

router.post("/:id/join", eventsController.joinEvent);

router.delete("/:id/leave", eventsController.leaveEvent);

router.patch("/:id/cancel", eventsController.cancelEvent);

module.exports = router;
