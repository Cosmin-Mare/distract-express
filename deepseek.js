require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
    console.error("Error: Missing API Key. Make sure it's set in the .env file.");
    process.exit(1);
}

// Store chat history
let chatHistory = [{ role: "system", content: "You are a helpful assistant." }];

// Handle GET request to chat
app.get('/chat', async (req, res) => {
    const userMessage = req.query.message;
    
    if (!userMessage) {
        return res.status(400).json({ error: "Message query parameter is required." });
    }

    // Append user message to chat history
    chatHistory.push({ role: "user", content: userMessage });

    try {
        // Send chat request to DeepSeek
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: "deepseek-chat",
                messages: chatHistory
            },
            {
                headers: {
                    "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const botResponse = response.data.choices[0].message.content;
        
        // Append bot response to chat history
        chatHistory.push({ role: "assistant", content: botResponse });

        // Return bot response
        res.json({ response: botResponse });

    } catch (error) {
        console.error("Error calling DeepSeek API:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to get response from DeepSeek." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
