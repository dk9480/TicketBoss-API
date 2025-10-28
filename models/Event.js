// models/Event.js

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    totalSeats: { type: Number, required: true, min: 0 },
    availableSeats: { type: Number, required: true, min: 0 },
}, {
    // CRITICAL: Tells Mongoose to use 'version' for OCC
    versionKey: 'version',
    version: {
        type: Number,
        default: 0
    }
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;