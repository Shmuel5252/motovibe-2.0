const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Route = require("../models/Route");
const { computeDirections } = require("../services/directions.service");
const { createGlobalAndEmit } = require("./notifications.controller");

function sendValidation(res, errors) {
  return res.status(400).json({
    error: { code: "VALIDATION_ERROR", details: errors.array() },
  });
}

async function createRoute(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidation(res, errors);
  }

  const owner = req.user.userId;
  const { title, start, end, routeType, difficulty, isTwisty, visibility } =
    req.body;

  // ברירות מחדל למטא-דאטה של מסלול אם לא נשלחו מהלקוח
  const safeRouteType = routeType ?? "עירוני";
  const safeDifficulty = difficulty ?? "בינוני";
  const safeIsTwisty = isTwisty ?? false;
  const safeVisibility = visibility ?? "private";

  let dir;
  try {
    dir = await computeDirections(start, end);
  } catch (err) {
    return res.status(502).json({
      error: {
        code: "DIRECTIONS_FAILED",
        message: err.message || "Failed to compute directions",
        googleStatus: err.googleStatus,
        googleErrorMessage: err.googleErrorMessage,
      },
    });
  }

  const { distanceKm, etaMinutes, polyline } = dir;

  const route = await Route.create({
    owner,
    title,
    start,
    end,
    routeType: safeRouteType,
    difficulty: safeDifficulty,
    isTwisty: safeIsTwisty,
    visibility: safeVisibility,
    distanceKm,
    etaMinutes,
    polyline,
  });

  // Fire-and-forget global notification when a public route is shared with the community
  if (safeVisibility === "public") {
    console.log(
      `[notifications] 🔔 Public route "${title}" saved (_id=${route._id}) — calling createGlobalAndEmit`,
    );
    createGlobalAndEmit({
      type: "route_new",
      title: "מסלול חדש בקהילה!",
      body: `${title} — ${Math.round(distanceKm)} ק"מ`,
      link: "community",
      sender: owner,
    }).catch((err) => console.error("[notifications] route_new FAILED:", err));
  } else {
    console.log(
      `[notifications] Route "${title}" visibility=${safeVisibility} — no global notification`,
    );
  }

  return res.status(201).json({ route });
}

async function listMyRoutes(req, res) {
  const owner = req.user.userId;

  const routes = await Route.find({ owner }).sort({ createdAt: -1 });

  return res.status(200).json({ routes });
}

async function getMyRoute(req, res) {
  const owner = req.user.userId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  }

  const route = await Route.findOne({ _id: id, owner });
  if (!route) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  }

  return res.status(200).json({ route });
}

async function updateMyRoute(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendValidation(res, errors);
  }
  const owner = req.user.userId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  }

  // Fetch the existing route first so we can detect a private→public transition
  const existing = await Route.findOne({ _id: id, owner });
  if (!existing) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  }
  const wasPublic = existing.visibility === "public";

  const update = {};
  const fields = [
    "title",
    "start",
    "end",
    "routeType",
    "difficulty",
    "isTwisty",
    "visibility",
  ];
  for (const key of fields) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const startChanged = req.body.start !== undefined;
  const endChanged = req.body.end !== undefined;
  if (startChanged || endChanged) {
    const finalStart = startChanged ? req.body.start : existing.start;
    const finalEnd = endChanged ? req.body.end : existing.end;
    let dir;
    try {
      dir = await computeDirections(finalStart, finalEnd);
    } catch (err) {
      return res.status(502).json({
        error: {
          code: "DIRECTIONS_FAILED",
          message: err.message || "Failed to compute directions",
          googleStatus: err.googleStatus,
          googleErrorMessage: err.googleErrorMessage,
        },
      });
    }
    update.distanceKm = dir.distanceKm;
    update.etaMinutes = dir.etaMinutes;
    update.polyline = dir.polyline;
  }

  const route = await Route.findOneAndUpdate({ _id: id, owner }, update, {
    new: true,
  });
  if (!route) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  }

  // Fire notification when route is published for the first time (private → public)
  const isNowPublic = update.visibility === "public";
  if (!wasPublic && isNowPublic) {
    console.log(
      `[notifications] 🔔 Route "${route.title}" published (_id=${route._id}) — calling createGlobalAndEmit`,
    );
    createGlobalAndEmit({
      type: "route_new",
      title: "מסלול חדש בקהילה!",
      body: `${route.title} — ${Math.round(route.distanceKm)} ק"מ`,
      link: "community",
      sender: owner,
    }).catch((err) => console.error("[notifications] route_new FAILED:", err));
  }

  return res.status(200).json({ route });
}

async function deleteMyRoute(req, res) {
  const owner = req.user.userId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  }
  const result = await Route.deleteOne({ _id: id, owner });
  if (result.deletedCount === 0) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  }

  return res.status(204).send();
}

async function listPublicRoutes(req, res) {
  try {
    const { routeType, difficulty, isTwisty } = req.query;

    const filter = { visibility: "public" };
    if (routeType) filter.routeType = routeType;
    if (difficulty) filter.difficulty = difficulty;
    // only filter by isTwisty when explicitly set to "true"
    if (isTwisty === "true") filter.isTwisty = true;

    const routes = await Route.find(filter)
      .select("-polyline") // polyline can be large; omit from list view
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ routes });
  } catch (err) {
    console.error("[listPublicRoutes]", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to load public routes",
      },
    });
  }
}

module.exports = {
  createRoute,
  listMyRoutes,
  getMyRoute,
  updateMyRoute,
  deleteMyRoute,
  listPublicRoutes,
};
