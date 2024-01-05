import { Bot, GrammyError, HttpError, InputFile } from "grammy";
import { env } from "./utils/env.js";
import { connectToDb } from "./db/db.js";
import { safeAwait } from "./utils/error.js";
import { existsSync, mkdirSync } from "fs";
import { executeCommand } from "./helpers/shell.js";
import { startAIChat } from "./helpers/aiChat.js";
import { getAnime } from "./helpers/anime.js";
import { getSmallImage } from "./utils/compressImage.js";
const bot = new Bot(env.BOT_TOKEN, {
  client: {
    apiRoot: "http://127.0.0.1:8081",
  },
});
let shellMode = false;
const { result: db } = await safeAwait(connectToDb());
if (!db) throw new Error("Could not connect to db!");
const aiChat = await startAIChat(db);
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
/////////////////////////////////
// id command
///////////////////////////////
bot.command("id", async (ctx) => {
  const id = ctx.msg.chat.id;
  await ctx.reply(`Chat id is ${id}`, {
    reply_parameters: {
      message_id: ctx.msg.message_id,
    },
  });
});
bot.command("whoami", async (ctx) => {
  const user = ctx.msg.from;
  if (!user) return;
  const name = user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.first_name;
  await ctx.reply(`You are ${name} \nYour id is ${user.id}`, {
    reply_parameters: {
      message_id: ctx.msg.message_id,
    },
  });
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

bot.command("shellmode", async (ctx) => {
  if (ctx.from?.id !== env.ADMIN_ID) {
    await ctx.reply("You are not admin!");
    return;
  }
  shellMode = !shellMode;
  await ctx.reply(`Shell mode is now ${shellMode ? "on" : "off"}`);
});
// ////////////////////////////////////
// file upload
// ///////////////////////////////////
bot.hears(/\/upload (.+)/, async (ctx) => {
  if (ctx.from?.id !== env.ADMIN_ID) {
    await ctx.reply("You are not admin!");
    return;
  }
  const message = ctx.msg.reply_to_message;
  if (!message) {
    await ctx.reply("No message provided!");
    return;
  }
  const fileName = ctx.match[1];
  if (!fileName) {
    await ctx.reply("No filename provided!");
    return;
  }
  const fileId =
    message.document?.file_id ||
    message.photo?.at(0)?.file_id ||
    message.video?.file_id ||
    message.audio?.file_id;
  if (!fileId) {
    await ctx.reply("No file provided!");
    return;
  }
  // const { result: file } = await safeAwait(ctx.api.getFile(fileId));
});

// ///////////////////////////////////////////////////
// anime command
// //////////////////////////////////////////////////
bot.command("anime", async (ctx) => {
  const { result: chat } = await safeAwait(
    ctx.reply("Searching for anime...", {
      reply_parameters: {
        message_id: ctx.msg.message_id,
      },
    })
  );
  if (!chat) return;
  const image = await getAnime();
  await bot.api.deleteMessage(chat.chat.id, chat.message_id);
  if (!image) {
    await ctx.reply("Error getting anime image!", {
      reply_parameters: {
        message_id: ctx.msg.message_id,
      },
    });
    return;
  }
  await ctx
    .replyWithPhoto(image.url, {
      reply_parameters: {
        message_id: ctx.msg.message_id,
      },
    })
    .catch(async (err) => {
      const imgaddress = await getSmallImage(image);
      if (!imgaddress) return;
      await ctx.replyWithPhoto(new InputFile(imgaddress), {
        reply_parameters: {
          message_id: ctx.msg.message_id,
        },
      });
    });
});

// ///////////////////////////////////////////////////
// ai chat : this will be ignored if shell mode is on
// //////////////////////////////////////////////////
bot.on("message:text", async (ctx) => {
  const text = ctx.message?.text;
  if (!text) return;
  if (ctx.from?.id !== env.ADMIN_ID) return;
  if (shellMode) {
    await ctx.reply("Running command...").then(async (msg) => {
      const { result } = await safeAwait(executeCommand(text));
      if (!result) {
        await ctx.api.editMessageText(
          msg.chat.id,
          msg.message_id,
          `Error executing command: ${text}`
        );
        return;
      }
      await ctx.api.editMessageText(msg.chat.id, msg.message_id, result);
    });
    return;
  }
  const { result: geminiResponse, error } = await safeAwait(
    aiChat.sendMessage(text)
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
  await ctx.reply(reply);
  await bot.api.sendMessage(
    env.LOG_GROUP_ID,
    `User: ${text} \n Gemini: ${reply}`
  );
  const { result: dbResponse } = await safeAwait(
    db.chat.insertMany([
      { role: "user", parts: text },
      { role: "model", parts: reply },
    ])
  );
  if (!dbResponse) {
    await bot.api.sendMessage(env.LOG_GROUP_ID, "Error saving chat to db!");
    return;
  }
});
bot.start();
bot.catch(async (err) => {
  const ctx = err.ctx;
  const e = err.error;
  if (e instanceof GrammyError) {
    await bot.api.sendMessage(
      env.LOG_GROUP_ID,
      `Error in request: ${e.message}`
    );
  } else if (e instanceof HttpError) {
    await bot.api.sendMessage(env.LOG_GROUP_ID, `Error in request: ${e.error}`);
  } else {
    console.log(e);
    await bot.api.sendMessage(
      env.LOG_GROUP_ID,
      `Unknown Error: ${JSON.stringify(e).slice(0, 100)}`
    );
  }
});
