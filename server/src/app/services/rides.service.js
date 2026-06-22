const Bike = require("../models/Bike");
const { createAndEmit } = require("../controllers/notifications.controller");

/**
 * buildRouteSnapshot — בונה snapshot קבוע ממסלול לשמירה בתוך מסמך ה-Ride.
 * @param {import("../models/Route")} route
 * @returns {object}
 */
function buildRouteSnapshot(route) {
  return {
    title: route.title,
    start: route.start,
    end: route.end,
    distanceKm: route.distanceKm,
    etaMinutes: route.etaMinutes,
    polyline: route.polyline,
  };
}

/**
 * applyDistanceToBikeOdometer — מעדכן את מד הקילומטראז' של האופנוע הראשי
 * של המשתמש בסיום רכיבה, ומפעיל התראות יעד-קילומטראז' שנחצו.
 * @param {{ owner: string, distanceKm: number }} params
 */
async function applyDistanceToBikeOdometer({ owner, distanceKm }) {
  const bike = await Bike.findOne({ owner });
  if (!bike) return;

  bike.currentOdometerKm = parseFloat(
    ((bike.currentOdometerKm || 0) + distanceKm).toFixed(2),
  );
  const newOdometer = bike.currentOdometerKm;

  /* בדיקת חצייה של יעדי קילומטראז' */
  const firedAlerts = [];
  for (const alert of bike.mileageAlerts || []) {
    if (newOdometer >= alert.targetKm) {
      firedAlerts.push(alert.toObject());
      alert.targetKm = parseFloat((alert.targetKm + 10000).toFixed(2));
    }
  }

  await bike.save();

  for (const alert of firedAlerts) {
    await createAndEmit({
      recipient: owner,
      type: "mileage_alert",
      title: `${alert.type} — הגיע הזמן! 🔔`,
      body: alert.note
        ? `הגעת ל-${alert.targetKm.toLocaleString("he-IL")} ק"מ — ${alert.note}`
        : `האופנוע שלך חצה את יעד הקילומטראז' עבור ${alert.type}.`,
      link: "bike",
    });
  }
}

module.exports = { buildRouteSnapshot, applyDistanceToBikeOdometer };
