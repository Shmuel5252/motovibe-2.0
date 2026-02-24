const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Bike = require("../models/Bike");
const MaintenanceLog = require("../models/MaintenanceLog");
const MaintenancePlan = require("../models/MaintenancePlan");

function sendValidation(res, errors) {
  return res.status(400).json({
    error: { code: "VALIDATION_ERROR", details: errors.array() },
  });
}

async function assertBikeOwner(owner, bikeId) {
  if (!mongoose.isValidObjectId(bikeId)) return null;
  return Bike.findOne({ _id: bikeId, owner });
}

// GET /api/bikes/:id/maintenance  -> { plans, logs }
async function getBikeMaintenance(req, res) {
  const owner = req.user.userId;
  const bikeId = req.params.id;

  const bike = await assertBikeOwner(owner, bikeId);
  if (!bike) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });

  const [plans, logs] = await Promise.all([
    MaintenancePlan.find({ owner, bikeId }).sort({ createdAt: -1 }),
    MaintenanceLog.find({ owner, bikeId }).sort({ date: -1, createdAt: -1 }).limit(50),
  ]);

  return res.status(200).json({ plans, logs });
}

// POST /api/bikes/:id/maintenance/logs
async function addMaintenanceLog(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidation(res, errors);

  const owner = req.user.userId;
  const bikeId = req.params.id;

  const bike = await assertBikeOwner(owner, bikeId);
  if (!bike) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });

  const { type, date, odometerKm, notes, cost } = req.body;

  const log = await MaintenanceLog.create({
    owner,
    bikeId,
    type,
    date,
    odometerKm,
    notes,
    cost,
  });

  // optional: keep bike odometer in sync if log odometer is newer
  if (typeof odometerKm === "number" && (bike.currentOdometerKm == null || odometerKm > bike.currentOdometerKm)) {
    bike.currentOdometerKm = odometerKm;
    await bike.save();
  }

  return res.status(201).json({ log });
}

// POST /api/bikes/:id/maintenance/plans
async function upsertMaintenancePlan(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidation(res, errors);

  const owner = req.user.userId;
  const bikeId = req.params.id;

  const bike = await assertBikeOwner(owner, bikeId);
  if (!bike) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });

  const { type, intervalKm, intervalDays, lastServiceOdometerKm, lastServiceDate } = req.body;

  const plan = await MaintenancePlan.findOneAndUpdate(
    { owner, bikeId, type },
    { intervalKm, intervalDays, lastServiceOdometerKm, lastServiceDate },
    { new: true, upsert: true }
  );

  return res.status(200).json({ plan });
}

// GET /api/maintenance/alerts
// returns [{ bikeId, bikeName, type, status, dueInKm, dueInDays }]
async function getMaintenanceAlerts(req, res) {
  const owner = req.user.userId;

  const [bikes, plans] = await Promise.all([
    Bike.find({ owner }).select("_id name currentOdometerKm"),
    MaintenancePlan.find({ owner }),
  ]);

  const bikeMap = new Map(bikes.map((b) => [b._id.toString(), b]));
  const now = Date.now();

  const alerts = plans
    .map((p) => {
      const bike = bikeMap.get(p.bikeId.toString());
      if (!bike) return null;

      const currentKm = bike.currentOdometerKm ?? 0;

      // KM calc
      let dueInKm = null;
      if (p.intervalKm && p.lastServiceOdometerKm != null) {
        const nextAt = p.lastServiceOdometerKm + p.intervalKm;
        dueInKm = Math.round(nextAt - currentKm);
      }

      // Days calc
      let dueInDays = null;
      if (p.intervalDays && p.lastServiceDate) {
        const nextAtMs = new Date(p.lastServiceDate).getTime() + p.intervalDays * 24 * 60 * 60 * 1000;
        dueInDays = Math.round((nextAtMs - now) / (24 * 60 * 60 * 1000));
      }

      // Status logic (simple)
      const overdueKm = dueInKm != null && dueInKm <= 0;
      const overdueDays = dueInDays != null && dueInDays <= 0;

      const dueSoonKm = dueInKm != null && dueInKm > 0 && dueInKm <= 300;
      const dueSoonDays = dueInDays != null && dueInDays > 0 && dueInDays <= 14;

      let status = "ok";
      if (overdueKm || overdueDays) status = "overdue";
      else if (dueSoonKm || dueSoonDays) status = "dueSoon";

      if (status === "ok") return null; // only return meaningful alerts

      return {
        bikeId: bike._id,
        bikeName: bike.name,
        type: p.type,
        status,
        dueInKm,
        dueInDays,
      };
    })
    .filter(Boolean);

  return res.status(200).json({ alerts });
}

// PATCH /api/bikes/:id/maintenance/logs/:logId
async function updateMaintenanceLog(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidation(res, errors);

  const owner = req.user.userId;
  const bikeId = req.params.id;
  const logId = req.params.logId;

  const bike = await assertBikeOwner(owner, bikeId);
  if (!bike) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });

  if (!mongoose.isValidObjectId(logId)) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Log not found" } });
  }

  const update = {};
  const fields = ["type", "date", "odometerKm", "notes", "cost"];
  for (const key of fields) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const log = await MaintenanceLog.findOneAndUpdate(
    { _id: logId, bikeId, owner },
    update,
    { new: true }
  );
  if (!log) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Log not found" } });

  return res.status(200).json({ log });
}

// DELETE /api/bikes/:id/maintenance/logs/:logId
async function deleteMaintenanceLog(req, res) {
  const owner = req.user.userId;
  const bikeId = req.params.id;
  const logId = req.params.logId;

  const bike = await assertBikeOwner(owner, bikeId);
  if (!bike) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });

  if (!mongoose.isValidObjectId(logId)) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Log not found" } });
  }

  const result = await MaintenanceLog.deleteOne({ _id: logId, bikeId, owner });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Log not found" } });
  }

  return res.status(204).send();
}

module.exports = {
  getBikeMaintenance,
  addMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  upsertMaintenancePlan,
  getMaintenanceAlerts,
};
