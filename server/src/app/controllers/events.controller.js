const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const RideEvent = require("../models/RideEvent");
const { createGlobalAndEmit } = require("./notifications.controller");

function sendValidation(res, errors) {
  return res.status(400).json({
    error: { code: "VALIDATION_ERROR", details: errors.array() },
  });
}

function notFound(res) {
  return res.status(404).json({
    error: { code: "NOT_FOUND", message: "Event not found" },
  });
}

/** POST /api/events — create a new ride event (auth required) */
async function createEvent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidation(res, errors);

  const { title, description, scheduledAt, maxParticipants, route } = req.body;
  const organizer = req.user.userId;

  const event = await RideEvent.create({
    organizer,
    route: route ?? null,
    title,
    description: description ?? "",
    scheduledAt,
    maxParticipants: maxParticipants ?? null,
    participants: [organizer], // organizer automatically joins
  });

  // Fire-and-forget global notification for new community ride event
  createGlobalAndEmit({
    type: "event_new",
    title: "רכיבה קבוצתית חדשה!",
    body: title,
    link: "community",
    sender: organizer,
  }).catch((err) => console.error("[notifications] event_new:", err));

  return res.status(201).json({ event });
}

/** GET /api/events — list upcoming open events (public, no auth) */
async function listEvents(req, res) {
  const filter = { status: "open", scheduledAt: { $gte: new Date() } };

  const events = await RideEvent.find(filter)
    .populate("organizer", "name")
    .populate("route", "title distanceKm routeType difficulty")
    .sort({ scheduledAt: 1 })
    .limit(50);

  return res.status(200).json({ events });
}

/** GET /api/events/:id — get single event (public) */
async function getEvent(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) return notFound(res);

  const event = await RideEvent.findById(id)
    .populate("organizer", "name")
    .populate(
      "route",
      "title distanceKm routeType difficulty polyline start end",
    )
    .populate("participants", "name");

  if (!event) return notFound(res);

  return res.status(200).json({ event });
}

/** POST /api/events/:id/join — join a ride event (auth required) */
async function joinEvent(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) return notFound(res);

  const event = await RideEvent.findById(id);
  if (!event) return notFound(res);

  if (event.status !== "open") {
    return res.status(409).json({
      error: {
        code: "EVENT_NOT_OPEN",
        message: "This event is no longer open",
      },
    });
  }

  if (event.scheduledAt < new Date()) {
    return res.status(409).json({
      error: { code: "EVENT_PAST", message: "This event has already passed" },
    });
  }

  const userId = new mongoose.Types.ObjectId(req.user.userId);
  const alreadyJoined = event.participants.some((p) => p.equals(userId));

  if (alreadyJoined) {
    return res.status(409).json({
      error: {
        code: "ALREADY_JOINED",
        message: "You have already joined this event",
      },
    });
  }

  if (
    event.maxParticipants !== null &&
    event.participants.length >= event.maxParticipants
  ) {
    return res.status(409).json({
      error: { code: "EVENT_FULL", message: "This event is full" },
    });
  }

  event.participants.push(userId);
  await event.save();

  return res.status(200).json({
    message: "Joined successfully",
    participantCount: event.participants.length,
  });
}

/** DELETE /api/events/:id/leave — leave a ride event (auth required) */
async function leaveEvent(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) return notFound(res);

  const event = await RideEvent.findById(id);
  if (!event) return notFound(res);

  const userId = new mongoose.Types.ObjectId(req.user.userId);

  if (event.organizer.equals(userId)) {
    return res.status(400).json({
      error: {
        code: "ORGANIZER_CANNOT_LEAVE",
        message: "The organizer cannot leave; cancel the event instead",
      },
    });
  }

  const originalLength = event.participants.length;
  event.participants = event.participants.filter((p) => !p.equals(userId));

  if (event.participants.length === originalLength) {
    return res.status(404).json({
      error: {
        code: "NOT_PARTICIPANT",
        message: "You are not a participant of this event",
      },
    });
  }

  await event.save();

  return res.status(200).json({
    message: "Left successfully",
    participantCount: event.participants.length,
  });
}

/** PATCH /api/events/:id/cancel — cancel an event (organizer only) */
async function cancelEvent(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) return notFound(res);

  const event = await RideEvent.findById(id);
  if (!event) return notFound(res);

  const userId = new mongoose.Types.ObjectId(req.user.userId);
  if (!event.organizer.equals(userId)) {
    return res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "Only the organizer can cancel this event",
      },
    });
  }

  if (event.status !== "open") {
    return res.status(409).json({
      error: { code: "ALREADY_CLOSED", message: "Event is already closed" },
    });
  }

  event.status = "cancelled";
  await event.save();

  return res.status(200).json({ event });
}

/** PATCH /api/events/:id — update event details (organizer only) */
async function updateEvent(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidation(res, errors);

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return notFound(res);

  const event = await RideEvent.findById(id);
  if (!event) return notFound(res);

  const userId = new mongoose.Types.ObjectId(req.user.userId);
  if (!event.organizer.equals(userId)) {
    return res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "Only the organizer can edit this event",
      },
    });
  }

  const { title, description, scheduledAt, maxParticipants } = req.body;
  if (title != null) event.title = title;
  if (description != null) event.description = description;
  if (scheduledAt != null) event.scheduledAt = scheduledAt;
  if ("maxParticipants" in req.body)
    event.maxParticipants = maxParticipants ?? null;

  await event.save();
  return res.status(200).json({ event });
}

/** DELETE /api/events/:id — permanently delete event (organizer only) */
async function deleteEvent(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return notFound(res);

  const event = await RideEvent.findById(id);
  if (!event) return notFound(res);

  const userId = new mongoose.Types.ObjectId(req.user.userId);
  if (!event.organizer.equals(userId)) {
    return res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "Only the organizer can delete this event",
      },
    });
  }

  await event.deleteOne();
  return res.status(200).json({ message: "Event deleted" });
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  joinEvent,
  leaveEvent,
  cancelEvent,
  updateEvent,
  deleteEvent,
};
