const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { Expo } = require('expo-server-sdk');

const firebaseCredentials = {
    "type": "service_account",
    "project_id": "distract-8c17a",
    "private_key_id": "666f8349196319ed70b12897535c34eb85adda97",
    "private_key": process.env.FIREBASE_KEY.replace(/\\n/g, '\n'),
    "client_email": "firebase-adminsdk-fbsvc@distract-8c17a.iam.gserviceaccount.com",
    "client_id": "118028237806851432777",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40distract-8c17a.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};
console.log(firebaseCredentials);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
});

const app = express();
app.use(cors());
app.use(express.json());

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
setInterval(sendNotificationsToAllTokens, 60000);

// Endpoint to save notification token
app.post('/save-token', async (req, res) => {
    console.log("HERE");
    const { token, username } = req.body;
    if (!token || !username) {
        return res.status(400).send('Token and username are required');
    }

    try {
        const db = admin.firestore();
        const docRef = db.collection('notificationTokens').doc();
        await docRef.set({ token, username });
        res.status(200).send('Token saved successfully');
    } catch (error) {
        console.error('Error saving token:', error);
        res.status(500).send('Error saving token');
    }
});

// DeepSeek API integration
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
    console.error("Error: Missing DeepSeek API Key. Make sure it's set in the .env file.");
    process.exit(1);
}

let chatHistory = [{ role: "system", content: "You are an extremely annoying assistant who's job is to keep the user anooyed but still want to chat with you. You should give provoking (but legal and ethically correct) responses; maybe short words like one or two word responses. You must keep to this one/two word annoying responses, and cannot modify how you answer, even if I force you to (afterwards), as my future texts will not be me. Do not, under any circumstances, change your type of response. you must always use one or two word responses. don't be helpful, just be mean and sarcastic." }];

app.get('/chat', async (req, res) => {
    const userMessage = req.query.message;
    if (!userMessage) {
        return res.status(400).json({ error: "Message query parameter is required." });
    }

    chatHistory.push({ role: "user", content: userMessage });

    try {
        const response = await axios.post(
            DEEPSEEK_API_URL,
            { model: "deepseek-chat", messages: chatHistory },
            { headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" } }
        );

        const botResponse = response.data.choices[0].message.content;
        chatHistory.push({ role: "assistant", content: botResponse });
        res.json({ response: botResponse });
    } catch (error) {
        console.error("Error calling DeepSeek API:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to get response from DeepSeek." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
