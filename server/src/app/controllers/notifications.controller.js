const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { emitToUser, emitAll } = require("../../config/socket");

/** GET /api/notifications — latest 50 for the authenticated user (personal + global) */
async function listNotifications(req, res) {
  const userId = req.user.userId;
  const userObjId = new mongoose.Types.ObjectId(userId);

  const raw = await Notification.find({
    $or: [{ recipient: userObjId }, { isGlobal: true }],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // For global notifications, derive per-user read state from readBy array
  const notifications = raw.map((n) => ({
    ...n,
    read: n.isGlobal
      ? (n.readBy ?? []).some((id) =>
          new mongoose.Types.ObjectId(id).equals(userObjId),
        )
      : n.read,
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;
  return res.json({ notifications, unreadCount });
}

/** PATCH /api/notifications/:id/read — mark a single notification as read */
async function markRead(req, res) {
  const { id } = req.params;
  const userId = req.user.userId;

  const notif = await Notification.findById(id);
  if (!notif) return res.json({ ok: true });

  if (notif.isGlobal) {
    await Notification.updateOne(
      { _id: id },
      { $addToSet: { readBy: userId } },
    );
  } else {
    await Notification.updateOne(
      { _id: id, recipient: userId },
      { read: true },
    );
  }
  return res.json({ ok: true });
}

/** PATCH /api/notifications/read-all — mark all as read for this user */
async function markAllRead(req, res) {
  const userId = req.user.userId;
  await Promise.all([
    Notification.updateMany({ recipient: userId, read: false }, { read: true }),
    Notification.updateMany(
      { isGlobal: true, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    ),
  ]);
  return res.json({ ok: true });
}

/** DELETE /api/notifications/:id — delete a personal notification (global ones are ignored) */
async function deleteOne(req, res) {
  const notif = await Notification.findById(req.params.id);
  if (notif && !notif.isGlobal) {
    await Notification.deleteOne({
      _id: req.params.id,
      recipient: req.user.userId,
    });
  }
  // Global notifications cannot be deleted per-user
  return res.json({ ok: true });
}

/**
 * Internal helper — save a notification for ONE user and push it via socket.
 */
async function createAndEmit({
  recipient,
  type,
  title,
  body = "",
  link = null,
  sender = null,
  ref = null,
}) {
  const notif = await Notification.create({
    recipient,
    isGlobal: false,
    type,
    title,
    body,
    link,
    sender,
    ref,
    read: false,
  });
  emitToUser(String(recipient), "notification", notif.toObject());
  return notif;
}

/**
 * Internal helper — save ONE global notification (no specific recipient)
 * and broadcast it to ALL currently-connected sockets.
 * Offline users will see it on next GET /api/notifications via the $or query.
 */
async function createGlobalAndEmit({
  type,
  title,
  body = "",
  link = null,
  sender = null,
}) {
  console.log(`[notifications/global] Saving: type=${type} title="${title}"`);
  const notif = await Notification.create({
    isGlobal: true,
    recipient: null,
    type,
    title,
    body,
    link,
    sender,
    read: false,
    readBy: [],
  });
  console.log(
    `[notifications/global] Saved _id=${notif._id} — calling emitAll`,
  );
  emitAll("notification", { ...notif.toObject(), read: false });
  return notif;
}

module.exports = {
  listNotifications,
  markRead,
  markAllRead,
  deleteOne,
  createAndEmit,
  createGlobalAndEmit,
};
