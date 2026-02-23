const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: false, default: null },

        routeSnapshot: {
            title: String,
            start: {
                lat: Number,
                lng: Number,
                label: String
            },
            end: {
                lat: Number,
                lng: Number,
                label: String   
            },
            distanceKm: Number,
            etaMinutes: Number,
            polyline: String,
        },

            startedAt: { type: Date, required: true },
            endedAt: { type: Date, default: null },
            durationSeconds: { type: Number, default: 0 },
        },
    { timestamps: true }
);

rideSchema.index({ owner: 1, endedAt: 1, startedAt: -1 });

module.exports = mongoose.model('Ride', rideSchema);