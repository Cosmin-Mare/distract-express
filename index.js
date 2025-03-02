const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); // Import the cors middleware
require('dotenv').config();

const firebaseCredentials = {
    "type": "service_account",
    "project_id": "distract-8b9b5",
    "private_key_id": "c0d9b7868fa91ca16f2b84241f0bc92fb8dee011",
    "private_key": process.env.FIREBASE_KEY,
    "client_email": "firebase-adminsdk-fbsvc@distract-8b9b5.iam.gserviceaccount.com",
    "client_id": "118294403905377701715",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40distract-8b9b5.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});