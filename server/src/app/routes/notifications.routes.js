const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const {
  listNotifications,
  markRead,
  markAllRead,
  deleteOne,
} = require("../controllers/notifications.controller");

router.get("/", auth, listNotifications);
// read-all must come before /:id to avoid being caught as an id param
router.patch("/read-all", auth, markAllRead);
router.patch("/:id/read", auth, markRead);
router.delete("/:id", auth, deleteOne);

module.exports = router;
