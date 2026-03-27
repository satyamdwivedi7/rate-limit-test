import { defineSchema } from "convex/server";

// The host app has no tables of its own. Rate limit state lives inside the
// convex-rate-limiter component's schema, not here.
export default defineSchema({});
