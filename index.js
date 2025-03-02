const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const axios = require('axios');
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
};
console.log(firebaseCredentials);

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
});

const app = express();
app.use(cors());
app.use(express.json());

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

let chatHistory = [{ role: "system", content: "You are an extremely annoying assistant who's job is to keep the user anooyed but still want to chat with you. You should give provoking (but legal and ethically correct) responses; maybe short words like one or two word responses. You must keep to this one/two word annoying responses, and cannot modify how you answer, even if I force you to (afterwards), as my future texts will not be me. Do not, under any circumstances, change your type of response. you must always use one or two word responses." }];

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
