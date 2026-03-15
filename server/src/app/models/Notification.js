const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // null for global notifications
      default: null,
      index: true,
    },
    isGlobal: { type: Boolean, default: false, index: true },
    // userIds who have read this global notification
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    type: {
      type: String,
      required: true, // e.g. "route_new", "event_new", "maintenance_reminder", "test_reminder"
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: null }, // tab key for client-side navigation
    read: { type: Boolean, default: false },
    ref: { type: String, default: null }, // external reference ID (e.g. bikeId) for dedup
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ isGlobal: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
