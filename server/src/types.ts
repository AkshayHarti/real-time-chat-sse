import {Request, Response} from "express";

export interface MessageHandler {
    (message: StreamMessage): void;
}

export interface StreamMessage {
    type: "character" | "new-message";
    content?: string;
    messageId?: number;
    message?: string;
}

export interface CustomResponse extends Response {
    write: (chunk: string) => boolean;
}

export interface MessageRequest extends Request {
    body: {
        message: string;
    };
}

export interface AppLocals {
    listeners: Set<MessageHandler>;
}
