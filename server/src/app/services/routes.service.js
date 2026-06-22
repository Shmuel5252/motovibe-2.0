const { createGlobalAndEmit } = require("../controllers/notifications.controller");

/**
 * notifyPublicRouteShared — שולח התראה גלובלית כשמסלול ציבורי נשמר/מתפרסם.
 * @param {{ title: string, distanceKm: number, owner: string, logContext: string }} params
 */
async function notifyPublicRouteShared({ title, distanceKm, owner, logContext }) {
  console.log(`[notifications] 🔔 ${logContext} — calling createGlobalAndEmit`);
  return createGlobalAndEmit({
    type: "route_new",
    title: "מסלול חדש בקהילה!",
    body: `${title} — ${Math.round(distanceKm)} ק"מ`,
    link: "community",
    sender: owner,
  }).catch((err) => console.error("[notifications] route_new FAILED:", err));
}

module.exports = { notifyPublicRouteShared };
