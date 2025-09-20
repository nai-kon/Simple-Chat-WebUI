import OpenAI from "openai";

export type ChatMessage = {
  model?: string;
  role: OpenAI.Chat.Completions.ChatCompletionRole;
  content: string;
  cost: number;
  date?: number;  // unix timestamp
};

export type Chat = {
  title: string;
  chat: ChatMessage[];
};

export type ChatHistory = Chat[];
