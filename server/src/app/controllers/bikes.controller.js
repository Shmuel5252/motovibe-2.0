const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Bike = require("../models/Bike");

function sendValidation(res, errors) {
  return res.status(400).json({
    error: { code: "VALIDATION_ERROR", details: errors.array() },
  });
}

async function createBike(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidation(res, errors);

  const owner = req.user.userId;
  const { name, make, model, year, currentOdometerKm, engineCc, imageUrl } = req.body;

  const bike = await Bike.create({
    owner,
    name,
    make,
    model,
    year,
    currentOdometerKm,
    engineCc,
    imageUrl,
  });

  return res.status(201).json({ bike });
}

async function listMyBikes(req, res) {
  const owner = req.user.userId;
  const bikes = await Bike.find({ owner }).sort({ createdAt: -1 });
  return res.status(200).json({ bikes });
}

async function getMyBike(req, res) {
  const owner = req.user.userId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });
  }

  const bike = await Bike.findOne({ _id: id, owner });
  if (!bike) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });
  }

  return res.status(200).json({ bike });
}

async function updateMyBike(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidation(res, errors);

  const owner = req.user.userId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });
  }

  const update = {};
  const fields = ["name", "make", "model", "year", "currentOdometerKm", "engineCc", "imageUrl"];
  for (const key of fields) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const bike = await Bike.findOneAndUpdate({ _id: id, owner }, update, { new: true });
  if (!bike) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });
  }

  return res.status(200).json({ bike });
}

async function deleteMyBike(req, res) {
  const owner = req.user.userId;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });
  }

  const result = await Bike.deleteOne({ _id: id, owner });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Bike not found" } });
  }

  return res.status(204).send();
}

module.exports = {
  createBike,
  listMyBikes,
  getMyBike,
  updateMyBike,
  deleteMyBike,
};
