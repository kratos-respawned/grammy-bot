import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { env } from "../utils/env.js";
import type { Database } from "../types/database.js";

export const startAIChat = async (db: Database) => {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
      maxOutputTokens: 150,
    },
  });
  const previousChat = await db.chat
    .find(
      {
        $where() {
          return this.role === "user";
        },
      },
      { projection: { _id: 0 } }
    )
    .toArray();

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: "You are a very obedient personal assistant.",
      },
      {
        role: "model",
        parts: "Yes, I will do anything you say and I will do it with a smile.",
      },
      ...previousChat,
    ],
  });
  return chat;
};
