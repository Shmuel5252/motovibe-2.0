/**
 * syncBikeOdometerFromLog — מעדכן את מד הקילומטראז' של האופנוע אם רשומת
 * התחזוקה החדשה מציינת קילומטראז' גבוה יותר מהקיים.
 * @param {import("../models/Bike")} bike
 * @param {number|undefined} odometerKm
 */
async function syncBikeOdometerFromLog(bike, odometerKm) {
  if (
    typeof odometerKm === "number" &&
    (bike.currentOdometerKm == null || odometerKm > bike.currentOdometerKm)
  ) {
    bike.currentOdometerKm = odometerKm;
    await bike.save();
  }
}

module.exports = { syncBikeOdometerFromLog };
