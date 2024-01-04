import { Bot } from "grammy";
import { env } from "./utils/env.js";
import { connectToDb } from "./db/db.js";
import { safeAwait } from "./utils/error.js";
const bot = new Bot(env.BOT_TOKEN);
const { result } = await safeAwait(connectToDb());
if (!result) throw new Error("Could not connect to db!");
await bot.api.sendMessage(
  env.LOG_GROUP_ID,
  "Bot started! 🚀 and connected to db! 📦"
);
bot.command("ping", async (ctx) => {
  await ctx.reply("pong");
});
bot.command("start", async (ctx) => {
  await ctx.reply("Hi! I can only read messages that explicitly reply to me!", {
    reply_markup: { force_reply: true },
  });
});

bot.start();
