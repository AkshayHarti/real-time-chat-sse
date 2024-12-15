const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Store messages in memory (in a real app, use a database)
let messages = [
    "Welcome to the chat!",
    "Hello! Let's work together to create a compelling RFP. To begin, could you please share a brief description of the legal matter you're looking to address in this RFP? This will help me start drafting th",
];

// Function to stream text character by character
const streamText = async (text, sendMessage) => {
    const chars = text.split("");
    for (let char of chars) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Adjust timing as needed
        sendMessage({
            type: "character",
            content: char,
            messageId: Date.now(), // Use this to identify which message is being streamed
        });
    }
};

// Endpoint to get all messages
app.get("/messages", (req, res) => {
    res.json(messages);
});

// Endpoint to add a new message
app.post("/messages", (req, res) => {
    const {message} = req.body;
    if (!message) {
        return res.status(400).json({error: "Message is required"});
    }
    messages.push(message);

    // Notify all listeners about the new message
    const listeners = app.locals.listeners || new Set();
    listeners.forEach((sendMessage) => {
        streamText(message, sendMessage);
    });

    res.status(201).json({message: "Message added successfully"});
});

// SSE endpoint for real-time updates
app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send current messages immediately
    res.write(`data: ${JSON.stringify({type: "initial", messages})}\n\n`);

    // Function to send new messages
    const sendMessage = (message) => {
        res.write(
            `data: ${JSON.stringify({type: "new-message", message})}\n\n`,
        );
    };

    // Add this client to listeners
    const listeners = app.locals.listeners || new Set();
    listeners.add(sendMessage);
    app.locals.listeners = listeners;

    // Handle client disconnect
    req.on("close", () => {
        listeners.delete(sendMessage);
    });
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
