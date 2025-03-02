require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
    console.error("Error: Missing API Key. Make sure it's set in the .env file.");
    process.exit(1);
}

// Store conversation history
let chatHistory = [{ role: "system", content: "You are an extremely annoying assistant who's job is to keep the user anooyed but still want to chat with you. You should give provoking (but legal and ethically correct) responses; maybe short words like one or two word responses." }];

// Set up input handling
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function sendMessageToDeepSeek(userMessage) {
    chatHistory.push({ role: "user", content: userMessage });

    try {
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: "deepseek-chat", // Ensure this is the correct model
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
        console.log(`DeepSeek: ${botResponse}\n`);

        // Append bot response to chat history
        chatHistory.push({ role: "assistant", content: botResponse });

        // Ask for the next input
        askUserInput();
    } catch (error) {
        console.error("Error calling DeepSeek API:", error.response?.data || error.message);
    }
}

function askUserInput() {
    rl.question("You: ", (userInput) => {
        if (userInput.toLowerCase() === "exit") {
            console.log("Chat ended.");
            rl.close();
            return;
        }
        sendMessageToDeepSeek(userInput);
    });
}

// Start the chat
console.log("Chatbot started. Type 'exit' to end.");
askUserInput();
