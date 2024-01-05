import { Bot, GrammyError, HttpError, InputFile } from "grammy";
import { env } from "./utils/env.js";
import { connectToDb } from "./db/db.js";
import { safeAwait } from "./utils/error.js";
import { existsSync, fstat, mkdirSync, writeFileSync } from "fs";
import { executeCommand } from "./helpers/shell.js";
import { writeFile } from "fs/promises";
import { startAIChat } from "./helpers/aiChat.js";
const bot = new Bot(env.BOT_TOKEN, {
  client: {
    apiRoot: "http://127.0.0.1:8081",
  },
});

const { result: db } = await safeAwait(connectToDb());
if (!db) throw new Error("Could not connect to db!");
const ai = await startAIChat();
if (!existsSync("uploads")) {
  mkdirSync("uploads");
  console.log("Created uploads folder");
}

if (!existsSync("images")) {
  mkdirSync("images");
  console.log("Created images folder");
}
/////////////////////////////////
// Logs
///////////////////////////////
await bot.api.sendMessage(
  env.LOG_GROUP_ID,
  "Bot started! 🚀 and connected to db! 📦"
);
bot.command("ping", async (ctx) => {
  await ctx.reply("pong");
});
bot.command("start", async (ctx) => {
  await ctx.reply(
    'Hello! I am a bot that can help you with your daily tasks. Type "/help" to see what I can do!',
    {
      reply_markup: {
        force_reply: true,
      },
    }
  );
});
bot.hears(/echo *(.+)?/, async (ctx) => {
  const match = ctx.match[1];
  if (match) await ctx.reply(match);
});
bot.command("help", async (ctx) => {});
bot.command("large", async (ctx) => {
  await ctx.replyWithDocument(new InputFile("./dd.exe"));
});
/////////////////////////////////
// shell command
///////////////////////////////
bot.hears(/\/shell (.+)/, async (ctx) => {
  if (ctx.from?.id !== env.ADMIN_ID) {
    await ctx.reply("You are not admin!");
    return;
  }
  const cmd = ctx.match[1];
  if (!cmd) {
    await ctx.reply("No command provided!");
    return;
  }
  await ctx.reply("Running command...").then(async (msg) => {
    const { result } = await safeAwait(executeCommand(cmd));
    if (!result) {
      await ctx.api.editMessageText(
        msg.chat.id,
        msg.message_id,
        `Error executing command: ${cmd}`
      );
      return;
    }
    await ctx.api.editMessageText(msg.chat.id, msg.message_id, result);
  });
});
/////////////////////////////////
// file upload
///////////////////////////////
bot.on("message:file", async (ctx) => {
  const data = ctx.message?.document;
  if (!data) {
    await ctx.reply("No file provided!");
    return;
  }
});
bot.command("upload", async (ctx) => {
  if (ctx.from?.id !== env.ADMIN_ID) {
    await ctx.reply("You are not admin!");
    return;
  }
  const file = ctx.msg.reply_to_message?.document?.file_id;
  if (!file) {
    await ctx.reply("No provided!");
    return;
  }

  // await ctx.reply();
});
// //////////////////////////////////
// message
// //////////////////////////////////

bot.on("message:text", async (ctx) => {
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

  const chat = ai.startChat({
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

  const text = ctx.message?.text;
  if (!text) return;
  const { result: geminiResponse, error } = await safeAwait(
    chat.sendMessage(text)
  );
  if (!geminiResponse || error) {
    await ctx.reply("Error sending message to AI!");
    return;
  }
  const reply = geminiResponse.response.text();
  if (!reply) {
    await ctx.reply("Error getting response from AI!");
    return;
  }
  const { result: dbResponse } = await safeAwait(
    db.chat.insertMany([
      { role: "user", parts: text },
      { role: "model", parts: reply },
    ])
  );
  if (!dbResponse) {
    await ctx.reply("Error saving chat to db!");
    return;
  }
  await bot.api.sendMessage(
    env.LOG_GROUP_ID,
    `User: ${text} \n Gemini: ${reply}`
  );
  await ctx.reply(reply);
});
bot.start();
bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});
