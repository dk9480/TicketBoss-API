# 🎟️ TicketBoss API - Backend Intern Challenge

This project implements a tiny event-ticketing API with **Optimistic Concurrency Control** (OCC) to prevent over-selling seats for a fixed-size event.

## 💻 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB
* **ORM/ODM:** Mongoose

## 🚀 Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/dk9480/TicketBoss-API
    cd ticketboss-api
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment:**
    Create a file named `.env` in the root directory and add your MongoDB connection string:
    ```
    MONGO_URI="mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>/ticketboss-db"
    PORT=3000
    EVENT_ID="node-meetup-2025"
    ```
4.  **Run the Application:**
    ```bash
    npm start
    ```
    The server will start on port 3000 (or your configured port) and automatically seed the event data on first startup.

## 💡 Technical Decisions (Focus on Concurrency)

| Decision | Justification |
| :--- | :--- |
| **Storage (MongoDB)** | Chosen for its performance and native support for fast, atomic updates on a single document, which is ideal for managing the central seat count. |
| **Concurrency Control** | **Optimistic Concurrency Control (OCC)** is implemented to prevent over-selling. The `Event` document has a **`version`** field (managed by Mongoose). |
| **Reserve Seats Logic** | The `POST /reservations` endpoint uses a single, atomic `Event.updateOne()` query. This query filters on two conditions simultaneously: `availableSeats: {$gte: requestedSeats}` **AND** `version: originalVersion`. If the version has changed due to a concurrent request, the update fails, and a **409 Conflict** is returned, ensuring data integrity. |
| **Project Structure (MVC)** | API logic is separated into `routes/reservationRoutes.js` (URL path mapping) and `controllers/reservationController.js` (business logic). This ensures the `server.js` file remains clean and the code is highly modular, readable, and maintainable.

## 🌐 API Documentation

All endpoints interact with the event "Node.js Meet-up" which has **500 total seats**.

### 1. Event Bootstrap
* **Action:** Runs automatically on server startup. Seeds the database with 500 seats and `version: 0`.

### 2. Reserve Seats
* **Endpoint:** `POST /reservations`
* **Function:** Reserves seats for a partner, ensuring concurrency control.
* **Request Body Example:**
    ```json
    {
        "partnerId": "company-X",
        "seats": 10
    }
    ```
* **Responses:**
    | Status | Scenario | Body Example |
    | :--- | :--- | :--- |
    | **201 Created** | Success | `{"reservationId": "...", "seats": 10, "status": "confirmed"}` |
    | **409 Conflict** | Not enough seats OR a concurrent request beat this one (OCC failure). | `{"error": "Not enough seats left (Concurrency conflict, please retry)"}` |
    | **400 Bad Request** | `seats` is $\le 0$ or $> 10$. | `{"error": "Invalid request..."}` |

### 3. Cancel Reservation
* **Endpoint:** `DELETE /reservations/:reservationId`
* **Function:** Cancels a reservation and atomically returns the seats to the available pool.
* **Responses:**
    | Status | Scenario |
    | :--- | :--- |
    | **204 No Content** | Success. |
    | **404 Not Found** | Reservation ID unknown or already cancelled. |

### 4. Event Summary
* **Endpoint:** `GET /reservations`
* **Function:** Returns the current state of the event inventory.
* **Response Body Example (200 OK):**
    ```json
    {
      "eventId": "node-meetup-2025",
      "name": "Node.js Meet-up",
      "totalSeats": 500,
      "availableSeats": 42,
      "reservationCount": 458,
      "version": 14
    }
    ```
