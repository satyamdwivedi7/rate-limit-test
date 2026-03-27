import { v } from "convex/values";
import { action } from "./_generated/server";
import { components } from "./_generated/api";

const RATE_LIMITS = {
  login: { limit: 5, window: "1m" as const },
  ai: { limit: 10, window: "1h" as const },
} as const;

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
      ...RATE_LIMITS.login,
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
      ...RATE_LIMITS.ai,
    });
  },
});

// Peek at current quota without consuming a slot
export const getStatus = action({
  args: { userId: v.string(), type: v.union(v.literal("login"), v.literal("ai")) },
  returns: v.object({
    remaining: v.number(),
    resetAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const cfg = RATE_LIMITS[args.type];
    return await ctx.runQuery(components.rateLimiter.rateLimits.peek, {
      key: args.type + ":" + args.userId,
      ...cfg,
    });
  },
});
