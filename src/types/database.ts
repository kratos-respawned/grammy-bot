import type { Collection } from "mongodb";

export interface User {
  userId: number;
  name: string;
}

export interface Chat {
  role: "model" | "user";
  parts: string;
}

export interface Database {
  user: Collection<User>;
  chat: Collection<Chat>;
}
