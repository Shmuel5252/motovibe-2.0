const mongoose = require("mongoose");

const BikeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 60 },
    make: { type: String, trim: true, maxlength: 60 },
    model: { type: String, trim: true, maxlength: 60 },
    year: { type: Number, min: 1900, max: 2100 },

    currentOdometerKm: { type: Number, default: 0, min: 0 },
    engineCc: { type: Number, min: 0 },
    imageUrl: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bike", BikeSchema);
