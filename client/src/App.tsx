import React, {useState, useEffect, useRef} from "react";
import "./App.css";
import {StreamEvent, AppState} from "./types";

const API_URL = "http://localhost:5001";

function App(): JSX.Element {
    const [state, setState] = useState<AppState>({
        messages: [],
        currentStreamingMessage: "",
        newMessage: "",
        error: null,
        isConnected: false,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (): void => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [state.messages, state.currentStreamingMessage]);

    useEffect(() => {
        // First fetch existing messages
        fetch(`${API_URL}/messages`)
            .then((res) => res.json())
            .then((data: string[]) => {
                setState((prev) => ({...prev, messages: data}));
            })
            .catch(() => {
                setState((prev) => ({
                    ...prev,
                    error: "Failed to load messages",
                }));
            });

        // Then connect to SSE for real-time updates
        const eventSource = new EventSource(`${API_URL}/events`);

        eventSource.onopen = () => {
            setState((prev) => ({...prev, isConnected: true, error: null}));
        };

        eventSource.onmessage = (event: MessageEvent) => {
            const data: StreamEvent = JSON.parse(event.data);

            setState((prev) => {
                switch (data.type) {
                    case "initial":
                        return {
                            ...prev,
                            messages: data.messages || [],
                        };
                    case "character":
                        return {
                            ...prev,
                            currentStreamingMessage:
                                prev.currentStreamingMessage +
                                (data.content || ""),
                        };
                    case "new-message":
                        if (prev.currentStreamingMessage) {
                            return {
                                ...prev,
                                messages: [
                                    ...prev.messages,
                                    prev.currentStreamingMessage,
                                ],
                                currentStreamingMessage: "",
                            };
                        }
                        return prev;
                    default:
                        return prev;
                }
            });
        };

        eventSource.onerror = () => {
            setState((prev) => ({
                ...prev,
                isConnected: false,
                error: "Connection lost. Trying to reconnect...",
            }));
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!state.newMessage.trim()) return;

        try {
            const response = await fetch(`${API_URL}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({message: state.newMessage}),
            });

            if (!response.ok) throw new Error("Failed to send message");

            setState((prev) => ({...prev, newMessage: "", error: null}));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: "Failed to send message. Please try again.",
            }));
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Real-Time Chat</h1>
                <div className="connection-status">
                    {state.isConnected ? (
                        <span className="connected">Connected</span>
                    ) : (
                        <span className="disconnected">Disconnected</span>
                    )}
                </div>
            </header>

            <main className="chat-container">
                <div className="messages-container">
                    {state.messages.map((message, index) => (
                        <div
                            key={index}
                            className="message"
                        >
                            {message}
                        </div>
                    ))}
                    {state.currentStreamingMessage && (
                        <div className="message streaming">
                            {state.currentStreamingMessage}
                            <span className="cursor"></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {state.error && (
                    <div className="error-message">{state.error}</div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="message-form"
                >
                    <input
                        type="text"
                        value={state.newMessage}
                        onChange={(e) =>
                            setState((prev) => ({
                                ...prev,
                                newMessage: e.target.value,
                            }))
                        }
                        placeholder="Type a message..."
                        className="message-input"
                    />
                    <button
                        type="submit"
                        className="send-button"
                    >
                        Send
                    </button>
                </form>
            </main>
        </div>
    );
}

export default App;
