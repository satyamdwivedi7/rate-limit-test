"use client";

import { useAction } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../convex/_generated/api";

function formatReset(resetAt: number) {
  const secs = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
  if (secs >= 60) return `${Math.ceil(secs / 60)}m`;
  return `${secs}s`;
}

function ProgressBar({ remaining, limit }: { remaining: number; limit: number }) {
  const pct = (remaining / limit) * 100;
  const color = pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
        <span style={{ color: "#aaa" }}>Remaining</span>
        <span style={{ fontWeight: 600, color }}>{remaining} / {limit}</span>
      </div>
      <div style={{ background: "#2a2a2a", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "all 0.3s ease" }} />
      </div>
    </div>
  );
}

// Card 1: checkRateLimit
function CheckCard({ userId }: { userId: string }) {
  const LIMIT = 5;
  const loginAttempt = useAction(api.actions.loginAttempt);
  const [result, setResult] = useState<{ allowed: boolean; remaining: number; resetAt: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      setResult(await loginAttempt({ userId }));
    } finally {
      setLoading(false);
    }
  }

  const remaining = result?.remaining ?? LIMIT;
  const allowed = result?.allowed ?? true;

  return (
    <div style={{ background: "#1a1a1a", border: `1px solid ${allowed ? "#2a2a2a" : "#ef444440"}`, borderRadius: 12, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#f97316", marginBottom: 8 }}>checkRateLimit</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Check Rate Limit</h2>
        <p style={{ color: "#888", fontSize: 14 }}>Login protection — 5 requests / 1 min. Returns allowed/denied; caller handles the result.</p>
      </div>

      <ProgressBar remaining={remaining} limit={LIMIT} />

      {result && (
        <>
          <div style={{ background: allowed ? "#16231a" : "#230e0e", border: `1px solid ${allowed ? "#22c55e30" : "#ef444430"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "monospace", color: allowed ? "#86efac" : "#fca5a5" }}>
            {allowed ? "✓ allowed" : "✗ rate limited"} · remaining: {result.remaining} · resets in {formatReset(result.resetAt)}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#555", lineHeight: 1.6 }}>
            {`{ allowed: ${result.allowed}, remaining: ${result.remaining}, resetAt: ${result.resetAt} }`}
          </div>
        </>
      )}

      <button onClick={handleClick} disabled={loading} style={{ background: loading ? "#2a2a2a" : "#f97316", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
        {loading ? "Sending…" : "Send Login Request"}
      </button>
    </div>
  );
}

// Card 2: enforceRateLimit
type EnforceResult =
  | { rateLimited: false; remaining: number; resetAt: number }
  | { rateLimited: true; remaining: 0; resetAt: number };

function EnforceCard({ userId }: { userId: string }) {
  const LIMIT = 3;
  const enforceAttempt = useAction(api.actions.enforceAttempt);
  const [result, setResult] = useState<EnforceResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      setResult(await enforceAttempt({ userId }));
    } finally {
      setLoading(false);
    }
  }

  const remaining = result ? result.remaining : LIMIT;
  const rateLimited = result?.rateLimited ?? false;

  return (
    <div style={{ background: "#1a1a1a", border: `1px solid ${rateLimited ? "#ef444440" : "#2a2a2a"}`, borderRadius: 12, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#a78bfa", marginBottom: 8 }}>enforceRateLimit</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Enforce Rate Limit</h2>
        <p style={{ color: "#888", fontSize: 14 }}>Strict action guard — 3 requests / 1 min. Throws <code style={{ background: "#2a2a2a", padding: "1px 4px", borderRadius: 3 }}>ConvexError</code> when exceeded.</p>
      </div>

      <ProgressBar remaining={remaining} limit={LIMIT} />

      {result && (
        <>
          <div style={{ background: rateLimited ? "#230e0e" : "#16231a", border: `1px solid ${rateLimited ? "#ef444430" : "#22c55e30"}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "monospace", color: rateLimited ? "#fca5a5" : "#86efac" }}>
            {rateLimited ? "✗ ConvexError thrown" : "✓ allowed"} · resets in {formatReset(result.resetAt)}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#555", lineHeight: 1.6 }}>
            {rateLimited
              ? `{ code: "RATE_LIMITED", remaining: 0, resetAt: ${result.resetAt} }`
              : `{ remaining: ${result.remaining}, resetAt: ${result.resetAt} }`}
          </div>
        </>
      )}

      <button onClick={handleClick} disabled={loading} style={{ background: loading ? "#2a2a2a" : "#a78bfa", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
        {loading ? "Sending…" : "Send Guarded Request"}
      </button>
    </div>
  );
}

// Card 3: peek
function PeekCard({ userId }: { userId: string }) {
  const LIMIT = 5;
  const getStatus = useAction(api.actions.getStatus);
  const [status, setStatus] = useState<{ remaining: number; resetAt: number | null } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      setStatus(await getStatus({ userId, type: "login" }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#38bdf8", marginBottom: 8 }}>peek</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Peek Status</h2>
        <p style={{ color: "#888", fontSize: 14 }}>Read-only quota check — mirrors login config (5 / 1 min). Zero side effects; never consumes a slot.</p>
      </div>

      {status ? (
        <ProgressBar remaining={status.remaining} limit={LIMIT} />
      ) : (
        <div style={{ background: "#111", border: "1px dashed #2a2a2a", borderRadius: 8, padding: "20px 14px", textAlign: "center", color: "#444", fontSize: 13 }}>
          Click Refresh to read quota
        </div>
      )}

      {status && (
        <>
          <div style={{ background: "#0f1e2a", border: "1px solid #38bdf830", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "monospace", color: "#7dd3fc" }}>
            ◎ read-only · no slot consumed · remaining: {status.remaining}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#555", lineHeight: 1.6 }}>
            {`{ remaining: ${status.remaining}, resetAt: ${status.resetAt ?? "null"} }`}
          </div>
        </>
      )}

      <button onClick={handleClick} disabled={loading} style={{ background: loading ? "#2a2a2a" : "#38bdf8", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
        {loading ? "Reading…" : "Refresh Status"}
      </button>
    </div>
  );
}

function useSessionUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const stored = localStorage.getItem("demo-user-id");
    if (stored) {
      setUserId(stored);
    } else {
      const id = "demo-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("demo-user-id", id);
      setUserId(id);
    }
  }, []);

  return userId;
}

export default function Home() {
  const userId = useSessionUserId();
  if (!userId) return null;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "inline-block", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#f97316", marginBottom: 16, fontFamily: "monospace" }}>
          convex-rate-limiter
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12 }}>Rate Limiter Demo</h1>
        <p style={{ color: "#888", fontSize: 16, lineHeight: 1.6 }}>
          Fixed-window rate limiting for Convex apps. Each card below demonstrates one of the three public APIs.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
        <CheckCard userId={userId} />
        <EnforceCard userId={userId} />
        <PeekCard userId={userId} />
      </div>

      <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#aaa" }}>How it works</h3>
        <pre style={{ fontFamily: "monospace", fontSize: 13, color: "#d4d4d4", lineHeight: 1.7, overflowX: "auto" }}>{`// 1. Wire up in convex/convex.config.ts
import rateLimiter from "convex-rate-limiter/convex.config.js";
const app = defineApp();
app.use(rateLimiter);

// 2a. checkRateLimit — returns result, you decide
const result = await ctx.runMutation(
  components.rateLimiter.rateLimits.checkRateLimit,
  { key: "login:" + userId, limit: 5, window: "1m" }
);
// { allowed: true, remaining: 4, resetAt: 1712345678000 }

// 2b. enforceRateLimit — throws ConvexError if exceeded
await ctx.runMutation(
  components.rateLimiter.rateLimits.enforceRateLimit,
  { key: "action:" + userId, limit: 3, window: "1m" }
);
// throws: ConvexError({ code: "RATE_LIMITED", remaining: 0, resetAt })

// 2c. peek — read-only, no side effects
const status = await ctx.runQuery(
  components.rateLimiter.rateLimits.peek,
  { key: "login:" + userId, limit: 5, window: "1m" }
);
// { remaining: 4, resetAt: 1712345678000 }
// { remaining: 5, resetAt: null }  ← no active window yet`}</pre>
      </div>

      <p style={{ marginTop: 24, color: "#555", fontSize: 13, textAlign: "center" }}>
        <a href="https://www.npmjs.com/package/convex-rate-limiter" style={{ color: "#f97316", textDecoration: "none" }} target="_blank" rel="noopener noreferrer">
          npm install convex-rate-limiter
        </a>
        {" · "}
        <a href="https://github.com/satyamdwivedi7/convex-rate-limiter" style={{ color: "#888", textDecoration: "none" }} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </p>
    </main>
  );
}
