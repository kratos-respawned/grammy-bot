import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { env } from "../utils/env.js";

export const startAIChat = async () => {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
      maxOutputTokens: 150,
    },
  });
  return model;
};
