// controllers/reservationController.js

const { v4: uuidv4 } = require('uuid');
const Event = require('../models/Event');
const Reservation = require('../models/Reservation');

const EVENT_ID = process.env.EVENT_ID;

// --- 1. CREATE RESERVATION (from POST /reservations) ---
const createReservation = async (req, res) => {
    const { partnerId, seats } = req.body;

    // A. Input Validation (400 Bad Request)
    if (!partnerId || !seats || seats <= 0 || seats > 10) {
        return res.status(400).json({ error: 'Invalid request: partnerId is required, and seats must be between 1 and 10.' });
    }

    // 1. Read Initial State to get the current version
    const eventDoc = await Event.findOne({ eventId: EVENT_ID });

    if (!eventDoc) {
        return res.status(500).json({ error: 'Event not found. Bootstrap failed.' });
    }

    // Simple pre-check: If not enough, fail fast
    if (seats > eventDoc.availableSeats) {
        return res.status(409).json({ error: 'Not enough seats left' });
    }

    // 3. CRITICAL: Atomic Update with Optimistic Concurrency Control
    const originalVersion = eventDoc.version;
    
    try {
        const updateResult = await Event.updateOne(
            {
                // FILTER (The atomic WHERE clause):
                eventId: EVENT_ID,
                availableSeats: { $gte: seats }, // Check 1: Still enough seats
                version: originalVersion        // Check 2: Version has not changed
            },
            {
                // UPDATE (The atomic SET clause):
                $inc: {
                    availableSeats: -seats, // Decrement seats
                    version: 1            // Increment version
                }
            }
        );

        // 4. Check for Conflict
        if (updateResult.modifiedCount === 0) {
            return res.status(409).json({ error: 'Not enough seats left (Concurrency conflict, please retry)' });
        }

        // 5. Success: Create the Reservation
        const newReservation = await Reservation.create({
            reservationId: uuidv4(),
            eventId: EVENT_ID,
            partnerId: partnerId,
            seats: seats,
            status: 'confirmed',
            eventVersion: originalVersion + 1 
        });

        // 6. Return 201 Created
        return res.status(201).json({
            reservationId: newReservation.reservationId,
            seats: newReservation.seats,
            status: newReservation.status,
        });

    } catch (error) {
        console.error('Reservation Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- 2. CANCEL RESERVATION (from DELETE /reservations/:reservationId) ---
const cancelReservation = async (req, res) => {
    const { reservationId } = req.params;

    // 1. Find the reservation
    const reservation = await Reservation.findOne({ reservationId });

    if (!reservation || reservation.status === 'cancelled') {
        return res.status(404).json({ error: 'Reservation not found or already cancelled.' });
    }

    const seatsToReturn = reservation.seats;

    try {
        // Step A: Atomically update Event seats and version
        const eventUpdateResult = await Event.updateOne(
            { eventId: EVENT_ID },
            { 
                $inc: { 
                    availableSeats: seatsToReturn, // Return seats
                    version: 1                    // Increment version
                } 
            }
        );
        
        if (eventUpdateResult.modifiedCount === 0) {
             console.warn('Event document failed to update during cancellation.');
             return res.status(500).json({ error: 'Failed to update event seats.' });
        }

        // Step B: Update Reservation status
        reservation.status = 'cancelled';
        await reservation.save(); 

        // 2. Return 204 No Content
        return res.status(204).send();

    } catch (error) {
        console.error('Cancellation Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- 3. EVENT SUMMARY (from GET /reservations) ---
const getEventSummary = async (req, res) => {
    try {
        // 1. Fetch the core Event state
        const eventDoc = await Event.findOne({ eventId: EVENT_ID });

        if (!eventDoc) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        // 2. Calculate the total number of confirmed reservations
        const reservationCount = await Reservation.countDocuments({ 
            eventId: EVENT_ID,
            status: 'confirmed'
        });

        // 3. Return the formatted summary (200 OK)
        return res.status(200).json({
            eventId: eventDoc.eventId,
            name: eventDoc.name,
            totalSeats: eventDoc.totalSeats,
            availableSeats: eventDoc.availableSeats,
            reservationCount: reservationCount,
            version: eventDoc.version
        });

    } catch (error) {
        console.error('Summary Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// --- EXPORT ALL FUNCTIONS ---
module.exports = {
    createReservation,
    cancelReservation,
    getEventSummary
};
