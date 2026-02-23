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
        name: { type: String, default: "" },

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
            /* נקודות GPS שהוקלטו במהלך הרכיבה */
            path: {
                type: [
                    {
                        lat: { type: Number, required: true },
                        lng: { type: Number, required: true },
                        t:   { type: Date, default: () => new Date() },
                    }
                ],
                default: [],
            },
        },
    { timestamps: true }
);

rideSchema.index({ owner: 1, endedAt: 1, startedAt: -1 });

module.exports = mongoose.model('Ride', rideSchema);