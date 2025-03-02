const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); // Import the cors middleware
require('dotenv').config();
const { Expo } = require('expo-server-sdk');

const firebaseCredentials = {
    "type": "service_account",
    "project_id": "distract-8c17a",
    "private_key_id": "666f8349196319ed70b12897535c34eb85adda97",
    "private_key": process.env.FIREBASE_KEY,
    "client_email": "firebase-adminsdk-fbsvc@distract-8c17a.iam.gserviceaccount.com",
    "client_id": "118028237806851432777",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40distract-8c17a.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};
console.log(firebaseCredentials)

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
});

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

const sendNotification = async (title, body, sendNotifToken) => {
    if (!sendNotifToken) {
        console.log("Notification token is not available");
        return;
    }

    // Log the token for debugging purposes
    console.log('Sending notification with token:', sendNotifToken);

    // Create a new Expo SDK client
    let expo = new Expo();

    // Check if the token is a valid Expo push token
    if (!Expo.isExpoPushToken(sendNotifToken)) {
        console.error(`Push token ${sendNotifToken} is not a valid Expo push token`);
        console.log("Invalid Expo push token");
        return;
    }

    try {
        // Construct a message
        let messages = [{
            to: sendNotifToken,
            sound: 'default',
            title: title,
            body: body,
            data: { withSome: 'data' },
        }];

        // Send the message
        let ticketChunk = await expo.sendPushNotificationsAsync(messages);
        console.log('Successfully sent message:', ticketChunk);
        console.log("Notification sent successfully");
    } catch (error) {
        console.log('Error sending message:', error);
        console.log("Error sending notification", error.message);
    }
};

const sendNotificationsToAllTokens = async () => {
    try {
        const db = admin.firestore();
        const tokensSnapshot = await db.collection('notificationTokens').get();
        console.log(tokensSnapshot)
        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
        for (const token of tokens) {
            console.log("sent to ", token)
            await sendNotification("Take a break", "You weren't supposed to be productive today", token);
        }
    } catch (error) {
        console.error('Error fetching tokens:', error);
    }
};

// Send notifications to all tokens every 60 seconds
setInterval(sendNotificationsToAllTokens, 1000);

// Endpoint to save notification token
app.post('/save-token', async (req, res) => {
    console.log("HERE")
    const { token, username } = req.body; // Extract username from request body

    if (!token || !username) { // Check for both token and username
        return res.status(400).send('Token and username are required');
    }

    try {
        const db = admin.firestore();
        const docRef = db.collection('notificationTokens').doc(); // Reference to your Firestore collection
        await docRef.set({ token, username }); // Save both token and username
        res.status(200).send('Token saved successfully');
    } catch (error) {
        console.error('Error saving token:', error);
        res.status(500).send('Error saving token');
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});