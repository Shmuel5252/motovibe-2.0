/**
 * maintenance.cron.js — Daily reminder notifications for:
 *   1. Upcoming motorcycle test validity (MOT)
 *   2. Upcoming scheduled maintenance (based on MaintenancePlan intervalDays)
 *
 * Runs once per day at 08:00 (server local time).
 * Only sends a notification if one hasn't already been sent today for the same item.
 */

const cron = require("node-cron");
const Bike = require("../app/models/Bike");
const MaintenancePlan = require("../app/models/MaintenancePlan");
const Notification = require("../app/models/Notification");
const {
  createAndEmit,
} = require("../app/controllers/notifications.controller");

/** How many days ahead to warn before a due date */
const REMINDER_DAYS = 7;

async function runMaintenanceReminders() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const windowEnd = new Date(todayStart);
  windowEnd.setDate(windowEnd.getDate() + REMINDER_DAYS);

  let testCount = 0;
  let maintenanceCount = 0;

  // ── 1. Bike test (MOT) reminders ────────────────────────────────
  const bikesWithTestDue = await Bike.find({
    testValidity: { $gte: todayStart, $lte: windowEnd },
  }).lean();

  for (const bike of bikesWithTestDue) {
    // Dedup: skip if we already sent a test_reminder for this bike today
    const alreadySent = await Notification.exists({
      recipient: bike.owner,
      type: "test_reminder",
      ref: String(bike._id),
      createdAt: { $gte: todayStart },
    });
    if (alreadySent) continue;

    const daysLeft = Math.ceil(
      (new Date(bike.testValidity) - todayStart) / (1000 * 60 * 60 * 24),
    );

    await createAndEmit({
      recipient: bike.owner,
      type: "test_reminder",
      title: `טסט לאופנוע "${bike.name}" בקרוב`,
      body:
        daysLeft === 0
          ? "תוקף הטסט פג היום – חדש אותו!"
          : `הטסט יפוג בעוד ${daysLeft} ימים`,
      link: "bike",
      ref: String(bike._id),
    });

    testCount++;
  }

  // ── 2. Maintenance plan reminders ───────────────────────────────
  const plans = await MaintenancePlan.find({
    lastServiceDate: { $exists: true, $ne: null },
    intervalDays: { $exists: true, $gt: 0 },
  }).lean();

  for (const plan of plans) {
    const nextDate = new Date(plan.lastServiceDate);
    nextDate.setDate(nextDate.getDate() + plan.intervalDays);

    // Outside the reminder window — skip
    if (nextDate < todayStart || nextDate > windowEnd) continue;

    // Dedup: skip if already sent a maintenance_reminder for this plan today
    const alreadySent = await Notification.exists({
      recipient: plan.owner,
      type: "maintenance_reminder",
      ref: String(plan._id),
      createdAt: { $gte: todayStart },
    });
    if (alreadySent) continue;

    const daysLeft = Math.ceil((nextDate - todayStart) / (1000 * 60 * 60 * 24));

    await createAndEmit({
      recipient: plan.owner,
      type: "maintenance_reminder",
      title: `תזכורת טיפול: ${plan.type}`,
      body:
        daysLeft === 0
          ? "מועד הטיפול הגיע היום!"
          : `הטיפול צפוי בעוד ${daysLeft} ימים`,
      link: "bike",
      ref: String(plan._id),
    });

    maintenanceCount++;
  }

  console.log(
    `[maintenance-cron] Sent ${testCount} test reminders, ${maintenanceCount} maintenance reminders`,
  );
}

/**
 * Start the daily cron job.
 * Call this once after the DB connection is established.
 */
function startMaintenanceCron() {
  // Every day at 08:00
  cron.schedule("0 8 * * *", () => {
    runMaintenanceReminders().catch((err) =>
      console.error("[maintenance-cron] Unhandled error:", err),
    );
  });
  console.log("✅ Maintenance reminder cron scheduled (daily at 08:00)");
}

module.exports = { startMaintenanceCron, runMaintenanceReminders };
