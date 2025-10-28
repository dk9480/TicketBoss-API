// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// Import Schemas (Only Event is needed for seeding)
const Event = require('./models/Event');

// --- IMPORT ROUTES ---
const reservationRoutes = require('./routes/reservationRoutes');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const EVENT_ID = process.env.EVENT_ID;

// --- 1. EVENT BOOTSTRAP (Seed Data) ---
const seedEventData = async () => {
    try {
        const initialEvent = {
            eventId: EVENT_ID,
            name: "Node.js Meet-up",
            totalSeats: 500, // <-- Set to 500 seats
            availableSeats: 500, // <-- Set to 500 seats
        };

        const existingEvent = await Event.findOne({ eventId: EVENT_ID });

        if (!existingEvent) {
            await Event.create(initialEvent);
            console.log('✅ Database seeded: Event created with 500 seats.'); // <-- Console message updated
        } else {
            console.log(`ℹ️ Database check: Event '${existingEvent.name}' already exists with version ${existingEvent.version}.`);
        }
    } catch (error) {
        console.error('Error seeding database:', error.message);
    }
};

// --- 2. USE ROUTES ---
// Tell Express to use the reservationRoutes for any URL starting with /reservations
app.use('/reservations', reservationRoutes);

// --- DATABASE CONNECTION & SERVER START ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB.');
        // Seed the database *after* connection is successful
        seedEventData();

        // --- START SERVER ---
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection error. Check MONGO_URI in .env:', err);
    });