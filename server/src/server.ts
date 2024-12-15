import express, {Express} from "express";
import cors from "cors";
import {
    MessageHandler,
    StreamMessage,
    CustomResponse,
    MessageRequest,
    AppLocals,
} from "./types.js";

const app: Express = express();
app.use(cors());
app.use(express.json());

// Store messages in memory (in a real app, use a database)
let messages: string[] = [
    "Welcome to the chat!",
    "Hello! Let's work together to create a compelling RFP. To begin, could you please share a brief description of the legal matter you're looking to address in this RFP? This will help me start drafting th",
];

// Function to stream text character by character
const streamText = async (
    text: string,
    sendMessage: MessageHandler,
): Promise<void> => {
    const chars: string[] = text.split("");
    for (const char of chars) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        sendMessage({
            type: "character",
            content: char,
            messageId: Date.now(),
        });
    }
    sendMessage({
        type: "new-message",
        content: "",
        messageId: Date.now(),
    });
};

// Endpoint to get all messages
app.get("/messages", (_req, res: CustomResponse): void => {
    res.json(messages);
});

// Endpoint to add a new message
app.post("/messages", (req: MessageRequest, res: CustomResponse): void => {
    const {message} = req.body;
    if (!message) {
        res.status(400).json({error: "Message is required"});
        return;
    }
    messages.push(message);

    // Notify all listeners about the new message
    const listeners: Set<MessageHandler> =
        (app.locals as AppLocals).listeners || new Set();
    listeners.forEach((sendMessage) => {
        void streamText(message, sendMessage);
    });

    res.status(201).json({message: "Message added successfully"});
});

// SSE endpoint for real-time updates
app.get("/events", (req, res: CustomResponse): void => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send current messages immediately
    res.write(`data: ${JSON.stringify({type: "initial", messages})}\n\n`);

    // Function to send new messages
    const sendMessage = (message: StreamMessage): void => {
        res.write(`data: ${JSON.stringify(message)}\n\n`);
    };

    // Add this client to listeners
    const listeners: Set<MessageHandler> =
        (app.locals as AppLocals).listeners || new Set();
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
