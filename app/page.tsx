"use client";

import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../convex/_generated/api";

type Result = { allowed: boolean; remaining: number; resetAt: number };

function formatReset(resetAt: number) {
  const secs = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
  if (secs >= 60) return `${Math.ceil(secs / 60)}m`;
  return `${secs}s`;
}

function RateLimitCard({
  title,
  description,
  limit,
  actionFn,
  statusQuery,
  userId,
}: {
  title: string;
  description: string;
  limit: number;
  actionFn: (args: { userId: string }) => Promise<Result>;
  statusQuery: { remaining: number; resetAt: number | null } | undefined;
  userId: string;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const r = await actionFn({ userId });
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  const remaining = result?.remaining ?? statusQuery?.remaining ?? limit;
  const resetAt = result?.resetAt ?? statusQuery?.resetAt ?? null;
  const allowed = result?.allowed ?? true;
  const pct = (remaining / limit) * 100;
  const barColor = pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{
      background: "#1a1a1a",
      border: `1px solid ${allowed ? "#2a2a2a" : "#ef444440"}`,
      borderRadius: 12,
      padding: 28,
      display: "flex",
      flexDirection: "column",
      gap: 20,
    }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{title}</h2>
        <p style={{ color: "#888", fontSize: 14 }}>{description}</p>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
          <span style={{ color: "#aaa" }}>Remaining</span>
          <span style={{ fontWeight: 600, color: barColor }}>{remaining} / {limit}</span>
        </div>
        <div style={{ background: "#2a2a2a", borderRadius: 4, height: 6, overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`,
            height: "100%",
            background: barColor,
            borderRadius: 4,
            transition: "all 0.3s ease",
          }} />
        </div>
        {resetAt && (
          <p style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
            Resets in {formatReset(resetAt)}
          </p>
        )}
      </div>

      {result && (
        <div style={{
          background: allowed ? "#16231a" : "#230e0e",
          border: `1px solid ${allowed ? "#22c55e30" : "#ef444430"}`,
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          fontFamily: "monospace",
          color: allowed ? "#86efac" : "#fca5a5",
        }}>
          {allowed ? "✓ allowed" : "✗ rate limited"} · remaining: {result.remaining} · resets in {formatReset(result.resetAt)}
        </div>
      )}

      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          background: loading ? "#2a2a2a" : "#f97316",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {loading ? "Sending…" : "Send Request"}
      </button>
    </div>
  );
}

export default function Home() {
  const userId = "demo-user";

  const loginAction = useAction(api.actions.loginAttempt);
  const aiAction = useAction(api.actions.aiRequest);
  const loginStatus = useQuery(api.actions.getStatus, { userId, type: "login" });
  const aiStatus = useQuery(api.actions.getStatus, { userId, type: "ai" });

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{
          display: "inline-block",
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: 12,
          color: "#f97316",
          marginBottom: 16,
          fontFamily: "monospace",
        }}>
          convex-rate-limiter
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
          Rate Limiter Demo
        </h1>
        <p style={{ color: "#888", fontSize: 16, lineHeight: 1.6 }}>
          Fixed-window rate limiting for Convex apps. Click the buttons below to consume
          rate limit slots and see the counter update in real time.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
        <RateLimitCard
          title="Login Protection"
          description="5 attempts per minute. Protects login endpoints from brute force."
          limit={5}
          actionFn={loginAction}
          statusQuery={loginStatus}
          userId={userId}
        />
        <RateLimitCard
          title="AI API Quota"
          description="10 requests per hour. Enforces per-user AI usage limits."
          limit={10}
          actionFn={aiAction}
          statusQuery={aiStatus}
          userId={userId}
        />
      </div>

      <div style={{
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#aaa" }}>How it works</h3>
        <pre style={{
          fontFamily: "monospace",
          fontSize: 13,
          color: "#d4d4d4",
          lineHeight: 1.7,
          overflowX: "auto",
        }}>{`// Wire up in convex/convex.config.ts
const app = defineApp();
app.use(rateLimiter);

// Use in any action
const result = await ctx.runMutation(
  components.rateLimiter.rateLimits.checkRateLimit,
  { key: "login:" + userId, limit: 5, window: "1m" }
);
// { allowed: true, remaining: 4, resetAt: 1712345678000 }`}</pre>
      </div>

      <p style={{ marginTop: 24, color: "#555", fontSize: 13, textAlign: "center" }}>
        <a
          href="https://www.npmjs.com/package/convex-rate-limiter"
          style={{ color: "#f97316", textDecoration: "none" }}
          target="_blank"
          rel="noopener noreferrer"
        >
          npm install convex-rate-limiter
        </a>
        {" · "}
        <a
          href="https://github.com/satyamdwivedi7/convex-rate-limiter"
          style={{ color: "#888", textDecoration: "none" }}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>
    </main>
  );
}
