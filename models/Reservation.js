// models/Reservation.js

const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    reservationId: { type: String, required: true, unique: true },
    eventId: { type: String, required: true },
    partnerId: { type: String, required: true },
    seats: { type: Number, required: true, min: 1, max: 10 },
    status: { type: String, required: true, enum: ['confirmed', 'cancelled'] },
    eventVersion: { type: Number, required: true }
}, {
    timestamps: true
});

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;