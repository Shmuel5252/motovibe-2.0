const router = require("express").Router();
const { body } = require("express-validator");

const authMiddleware = require("../middlewares/auth.middleware");
const bikesController = require("../controllers/bikes.controller");
const maintenanceController = require("../controllers/maintenance.controller");

router.use(authMiddleware);

// ===== Bike CRUD =====

router.get("/", bikesController.listMyBikes);
router.get("/:id", bikesController.getMyBike);

router.post(
  "/",
  [
    body("name").isString().trim().isLength({ min: 2, max: 60 }),
    body("make").optional().isString().trim().isLength({ max: 60 }),
    body("model").optional().isString().trim().isLength({ max: 60 }),
    body("year").optional().isInt({ min: 1900, max: 2100 }).toInt(),
    body("currentOdometerKm").optional().isFloat({ min: 0 }).toFloat(),
    body("engineCc").optional().isInt({ min: 0 }).toInt(),
    body("imageUrl").optional().isString().trim().isLength({ max: 500 }),
  ],
  bikesController.createBike
);

router.patch(
  "/:id",
  [
    body("name").optional().isString().trim().isLength({ min: 2, max: 60 }),
    body("make").optional().isString().trim().isLength({ max: 60 }),
    body("model").optional().isString().trim().isLength({ max: 60 }),
    body("year").optional().isInt({ min: 1900, max: 2100 }).toInt(),
    body("currentOdometerKm").optional().isFloat({ min: 0 }).toFloat(),
    body("engineCc").optional().isInt({ min: 0 }).toInt(),
    body("imageUrl").optional().isString().trim().isLength({ max: 500 }),
  ],
  bikesController.updateMyBike
);

router.delete("/:id", bikesController.deleteMyBike);

// ===== Maintenance logs =====

router.get("/:id/maintenance", maintenanceController.getBikeMaintenance);

router.post(
  "/:id/maintenance/logs",
  [
    body("type").isString().trim().isLength({ min: 2, max: 40 }),
    body("date").isISO8601(),
    body("odometerKm").isFloat({ min: 0 }).toFloat(),
    body("notes").optional().isString().trim().isLength({ max: 400 }),
    body("cost").optional().isFloat({ min: 0 }).toFloat(),
  ],
  maintenanceController.addMaintenanceLog
);

router.patch(
  "/:id/maintenance/logs/:logId",
  [
    body("type").optional().isString().trim().isLength({ min: 2, max: 40 }),
    body("date").optional().isISO8601(),
    body("odometerKm").optional().isFloat({ min: 0 }).toFloat(),
    body("notes").optional().isString().trim().isLength({ max: 400 }),
    body("cost").optional().isFloat({ min: 0 }).toFloat(),
  ],
  maintenanceController.updateMaintenanceLog
);

router.delete("/:id/maintenance/logs/:logId", maintenanceController.deleteMaintenanceLog);

// ===== Maintenance plans =====

router.post(
  "/:id/maintenance/plans",
  [
    body("type").isString().trim().isLength({ min: 2, max: 40 }),
    body("intervalKm").optional().isFloat({ min: 0 }).toFloat(),
    body("intervalDays").optional().isFloat({ min: 0 }).toFloat(),
    body("lastServiceOdometerKm").optional().isFloat({ min: 0 }).toFloat(),
    body("lastServiceDate").optional().isISO8601(),
  ],
  maintenanceController.upsertMaintenancePlan
);

module.exports = router;
