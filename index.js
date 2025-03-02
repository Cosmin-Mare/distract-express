const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); // Import the cors middleware

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://distract-8b9b5.firebaseio.com' // Replace with your Firebase project ID
});

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// Endpoint to save notification token
app.post('/save-token', async (req, res) => {
    console.log("HERE")
    const { token, username } = req.body; // Extract username from request body

    if (!token || !username) { // Check for both token and username
        return res.status(400).send('Token and username are required');
    }

    try {
        const db = admin.database();
        const ref = db.ref('notificationTokens'); // Reference to your Firebase database
        await ref.push({ token, username }); // Save both token and username
        res.status(200).send('Token saved successfully');
    } catch (error) {
        console.error('Error saving token:', error);
        res.status(500).send('Error saving token');
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, "10.10.16.187", () => {
    console.log(`Server is running on port ${PORT}`);
});