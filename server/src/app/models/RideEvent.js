const mongoose = require("mongoose");

/**
 * RideEvent — an organised group ride.
 *
 * participants is an embedded array of ObjectIds (Users) for simplicity.
 * For high-scale use, replace with a separate RideEventParticipant collection.
 */
const rideEventSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    maxParticipants: {
      type: Number,
      default: null,
      min: 2,
    },
    status: {
      type: String,
      enum: ["open", "cancelled", "completed"],
      default: "open",
    },
    // Array of User ObjectIds — deduplication enforced at application level
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

rideEventSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model("RideEvent", rideEventSchema);
