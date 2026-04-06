import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { db } from "../db";
import { users } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // For local dev: auto-login as user id=1
  // For production: implement proper auth here
  const allUsers = db.select().from(users).limit(1).all();
  const user = allUsers[0] || null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
