const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const Ride = require("../models/Ride");
const Route = require("../models/Route");


function notFound(res) {
    return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Not found" }
    });
}

async function startRide(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                details: errors.array()
            }
        });
    }

    const owner = req.user.userId;
    const { routeId } = req.body;

    /* בדיקת רכיבה פעילה קודמת — קודמת לכל לוגיקת ניתוב */
    const active = await Ride.findOne({ owner, endedAt: null });
    if (active) {
        return res.status(409).json({
            error: { code: "ACTIVE_RIDE_EXISTS", message: "You already have an active ride" }
        });
    }

    /* ברירת מחדל לרכיבה חופשית (ללא מסלול) */
    let route = null;
    let routeSnapshot = { title: "רכיבה חופשית" };

    if (routeId) {
        /* הגנה דפנסיבית — express-validator כבר מסנן, אך שומרים את הבדיקה */
        if (!mongoose.isValidObjectId(routeId)) {
            return res.status(400).json({
                error: { code: "VALIDATION_ERROR", details: [{ msg: "Invalid routeId" }] }
            });
        }

        /* חיפוש מסלול שייך למשתמש */
        const foundRoute = await Route.findOne({ _id: routeId, owner });
        if (!foundRoute) {
            return notFound(res);
        }

        /* בניית snapshot מהמסלול */
        routeSnapshot = {
            title: foundRoute.title,
            start: foundRoute.start,
            end: foundRoute.end,
            distanceKm: foundRoute.distanceKm,
            etaMinutes: foundRoute.etaMinutes,
            polyline: foundRoute.polyline,
        };
        route = foundRoute._id;
    }

    const ride = await Ride.create({
        owner,
        route: route ?? null,
        routeSnapshot,
        startedAt: new Date(),
        endedAt: null,
        durationSeconds: 0,
    });
    return res.status(201).json({ ride });
}

async function stopRide(req, res) {
    const owner = req.user.userId;

    const ride = await Ride.findOne({ owner, endedAt: null }).sort({ startedAt: -1 });
    if (!ride) {
        return res.status(409).json({
            error: { code: "NO_ACTIVE_RIDE", message: "No active ride to stop" }
        });
    }

    const endedAt = new Date();
    const durationSeconds = Math.max(
        0,
        Math.floor((endedAt.getTime() - ride.startedAt.getTime()) / 1000));

    ride.endedAt = endedAt;
    ride.durationSeconds = durationSeconds;

    /* שמירת נתיב GPS ומרחק אם נשלחו מהלקוח */
    const { path, distanceKm } = req.body;
    if (Array.isArray(path) && path.length > 0) {
        /* סינון נקודות תקינות בלבד + הגבלת גודל למניעת שימוש לרעה */
        const sanitized = path
            .filter(p => typeof p.lat === 'number' && isFinite(p.lat) &&
                typeof p.lng === 'number' && isFinite(p.lng))
            .slice(-2000);
        ride.path = sanitized;
    }

    /* עדכון מד אוצץ באופנוע הראשי של המשתמש */
    if (typeof distanceKm === 'number' && distanceKm > 0) {
        const Bike = require("../models/Bike");
        const bike = await Bike.findOne({ owner });
        if (bike) {
            bike.currentOdometerKm = parseFloat(((bike.currentOdometerKm || 0) + distanceKm).toFixed(2));
            await bike.save();
        }
    }

    await ride.save();
    return res.status(200).json({ ride });
}

async function getActiveRide(req, res) {
    const owner = req.user.userId;

    const ride = await Ride.findOne({ owner, endedAt: null })
        .sort({ startedAt: -1 });

    return res.status(200).json({ ride: ride || null });
}

async function getRideHistory(req, res) {
    const owner = req.user.userId;

    const rides = await Ride.find({ owner, endedAt: { $ne: null } })
        .sort({ startedAt: -1 })
        .limit(50);

    return res.status(200).json({ rides });
}

/* עדכון שם רכיבה לפי מזהה */
async function updateRide(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: { code: "VALIDATION_ERROR", details: errors.array() }
        });
    }

    const owner = req.user.userId;
    const { id } = req.params;
    const { name } = req.body;

    const ride = await Ride.findOne({ _id: id, owner });
    if (!ride) {
        return notFound(res);
    }

    /* עדכון השם אם סופק */
    if (name) {
        ride.name = name.trim();
    }

    await ride.save();
    return res.status(200).json({ ride });
}

/* מחיקת רכיבה לפי מזהה */
async function deleteRide(req, res) {
    const { id } = req.params;
    const owner = req.user.userId;

    const ride = await Ride.findOne({ _id: id, owner });
    if (!ride) {
        return notFound(res);
    }

    await ride.deleteOne();
    return res.status(200).json({ ok: true });
}

module.exports = {
    startRide,
    stopRide,
    getActiveRide,
    getRideHistory,
    updateRide,
    deleteRide,
};