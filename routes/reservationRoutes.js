// routes/reservationRoutes.js

const express = require('express');
const router = express.Router();

// Import the controller functions
const {
    createReservation,
    cancelReservation,
    getEventSummary
} = require('../controllers/reservationController');

// --- DEFINE ROUTES ---

// POST /reservations
router.post('/', createReservation);

// GET /reservations
router.get('/', getEventSummary);

// DELETE /reservations/:reservationId
router.delete('/:reservationId', cancelReservation);

// Export the router
module.exports = router;