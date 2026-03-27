import { defineApp } from "convex/server";
import rateLimiter from "convex-rate-limiter";

const app = defineApp();
app.use(rateLimiter);
export default app;
