import { MongoClient } from "mongodb";
import type { Chat, Database, User } from "../types/database.js";
import { env } from "../utils/env.js";

export async function connectToDb() {
  const client = new MongoClient(env.MONGO_URI);
  await client.connect();
  const mongoDb = client.db();
  const user = mongoDb.collection<User>("user");
  const chat = mongoDb.collection<Chat>("chat");
  const database: Database = { user, chat };
  return database;
}
