export interface Message {
    content: string;
    messageId: number;
}

export interface StreamEvent {
    type: "initial" | "character" | "new-message";
    messages?: string[];
    content?: string;
    messageId?: number;
    message?: string;
}

export interface AppState {
    messages: string[];
    currentStreamingMessage: string;
    newMessage: string;
    error: string | null;
    isConnected: boolean;
}
