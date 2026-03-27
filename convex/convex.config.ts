import { defineApp } from "convex/server";
import rateLimiter from "convex-rate-limiter/convex.config.js";

const app = defineApp();
app.use(rateLimiter);
export default app;
