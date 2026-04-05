import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { components } from "./_generated/api";

const RATE_LIMITS = {
  login: { limit: 5, window: "1m" as const },
  enforce: { limit: 3, window: "1m" as const },
} as const;

// checkRateLimit — returns allowed/denied result, caller decides what to do
export const loginAttempt = action({
  args: { userId: v.string() },
  returns: v.object({
    allowed: v.boolean(),
    remaining: v.number(),
    resetAt: v.number(),
  }),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      components.rateLimiter.rateLimits.checkRateLimit,
      { key: "login:" + args.userId, ...RATE_LIMITS.login }
    );
  },
});

// enforceRateLimit — throws ConvexError on limit exceeded; action catches and returns structured result
export const enforceAttempt = action({
  args: { userId: v.string() },
  returns: v.object({
    rateLimited: v.boolean(),
    remaining: v.number(),
    resetAt: v.number(),
  }),
  handler: async (ctx, args) => {
    try {
      const result = await ctx.runMutation(
        components.rateLimiter.rateLimits.enforceRateLimit,
        { key: "enforce:" + args.userId, ...RATE_LIMITS.enforce }
      );
      return { rateLimited: false as const, ...result };
    } catch (e: any) {
      // ConvexError from a component mutation: check both instanceof and raw data shape
      // (serialization across component boundaries can vary between dev and prod)
      const isConvexRateLimit =
        (e instanceof ConvexError && (e.data as any)?.code === "RATE_LIMITED") ||
        e?.data?.code === "RATE_LIMITED";
      if (isConvexRateLimit) {
        const resetAt = (e instanceof ConvexError ? (e.data as any)?.resetAt : e?.data?.resetAt) as number;
        return { rateLimited: true as const, remaining: 0 as const, resetAt };
      }
      throw e;
    }
  },
});

// peek — read-only quota check, no side effects, mirrors login config
export const getStatus = action({
  args: { userId: v.string(), type: v.union(v.literal("login"), v.literal("enforce")) },
  returns: v.object({
    remaining: v.number(),
    resetAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const cfg = RATE_LIMITS[args.type];
    return await ctx.runQuery(
      components.rateLimiter.rateLimits.peek,
      { key: args.type + ":" + args.userId, ...cfg }
    );
  },
});
