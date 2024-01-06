import type { Context, HearsContext, Middleware, NextFunction } from "grammy";

export const ignoreOld =
  <T extends Context>(threshold = 5 * 60) =>
  (ctx: T, next: NextFunction): Promise<void> | undefined => {
    const now = Date.now() / 1000;
    if (ctx.msg && ctx.msg.date && now - ctx.msg.date > threshold) {
      console.log("Ignoring old message");
      return;
    }
    return next();
  };
