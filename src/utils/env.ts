import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();
const envVariables = z.object({
  BOT_TOKEN: z.string(),
  ADMIN_ID: z.string(),
  MONGO_URI: z.string(),
  ANNOUNCEMENT_CHANNEL_ID: z.string(),
  LOG_GROUP_ID: z.string(),
  GEMINI_API_KEY: z.string(),
});

export const env = envVariables.parse(process.env);
