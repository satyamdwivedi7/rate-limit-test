import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { components } from "./_generated/api";

// Simulate a login attempt — rate limited to 5 per minute per user
export const loginAttempt = action({
  args: { userId: v.string() },
  returns: v.object({
    allowed: v.boolean(),
    remaining: v.number(),
    resetAt: v.number(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.rateLimiter.rateLimits.checkRateLimit, {
      key: "login:" + args.userId,
      limit: 5,
      window: "1m",
    });
  },
});

// Simulate an AI API call — rate limited to 10 per hour per user
export const aiRequest = action({
  args: { userId: v.string() },
  returns: v.object({
    allowed: v.boolean(),
    remaining: v.number(),
    resetAt: v.number(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.rateLimiter.rateLimits.checkRateLimit, {
      key: "ai:" + args.userId,
      limit: 10,
      window: "1h",
    });
  },
});

// Peek at current quota without consuming a slot
export const getStatus = query({
  args: { userId: v.string(), type: v.union(v.literal("login"), v.literal("ai")) },
  returns: v.object({
    remaining: v.number(),
    resetAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const key = args.type === "login" ? "login:" + args.userId : "ai:" + args.userId;
    const limit = args.type === "login" ? 5 : 10;
    const window = args.type === "login" ? "1m" : "1h";
    return await ctx.runQuery(components.rateLimiter.rateLimits.peek, { key, limit, window });
  },
});
