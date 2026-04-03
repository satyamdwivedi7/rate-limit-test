/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: {
    rateLimits: {
      checkRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key: string; limit: number; window: string },
        { allowed: boolean; remaining: number; resetAt: number }
      >;
      enforceRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key: string; limit: number; window: string },
        { remaining: number; resetAt: number }
      >;
      peek: FunctionReference<
        "query",
        "internal",
        { key: string; limit: number; window: string },
        { remaining: number; resetAt: number | null }
      >;
    };
  };
};
