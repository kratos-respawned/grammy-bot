import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();
const envVariables = z.object({
  BOT_TOKEN: z.string(),
  ADMIN_ID: z.number(),
  MONGO_URI: z.string(),
  ANNOUNCEMENT_CHANNEL_ID: z.number(),
  LOG_GROUP_ID: z.number(),
  GEMINI_API_KEY: z.string(),
});

export const env = envVariables.parse({
  ...process.env,
  ADMIN_ID: Number(process.env.ADMIN_ID),
  ANNOUNCEMENT_CHANNEL_ID: Number(process.env.ANNOUNCEMENT_CHANNEL_ID),
  LOG_GROUP_ID: Number(process.env.LOG_GROUP_ID),
});
