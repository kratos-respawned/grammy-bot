import type { Collection } from "mongodb";

export interface User {
  userId: number;
  name: string;
}

export interface Chat {
  role: "model" | "user";
  parts: string;
}
export interface file {
  file_name: string;
  file_url: string;
  file_type: string;
}

export interface Database {
  user: Collection<User>;
  chat: Collection<Chat>;
  file: Collection<file>;
}
