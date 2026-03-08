const mongoose = require("mongoose");

const MaintenanceLogSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bikeId: { type: mongoose.Schema.Types.ObjectId, ref: "Bike", required: true, index: true },

    type: { type: String, required: true, trim: true, maxlength: 40 }, // oil/chain/tires/...
    date: { type: Date, required: true },
    odometerKm: { type: Number, required: true, min: 0 },

    notes: { type: String, trim: true, maxlength: 400 },
    cost: { type: Number, min: 0 },
    customServiceType: { type: String, trim: true, maxlength: 60 },
    receiptUrl: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceLog", MaintenanceLogSchema);
