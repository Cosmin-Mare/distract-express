const express = require('express');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://<YOUR-FIREBASE-PROJECT-ID>.firebaseio.com' // Replace with your Firebase project ID
});

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Endpoint to save notification token
app.post('/save-token', async (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
