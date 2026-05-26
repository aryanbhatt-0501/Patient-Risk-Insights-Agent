"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  rows?: number;
  filename?: string;
  error?: string;
}

const C = {
  bg: "#080d16",
  surface: "#0f1724",
  surfaceAlt: "#131e2e",
  border: "rgba(255,255,255,0.07)",
  borderHov: "rgba(45,212,191,0.35)",
  teal: "#2dd4bf",
  tealDim: "rgba(45,212,191,0.12)",
  cyan: "#22d3ee",
  text: "rgba(255,255,255,0.82)",
  textDim: "rgba(255,255,255,0.38)",
  textFaint: "rgba(255,255,255,0.15)",
};

type StyleFn = (role: "user" | "assistant") => CSSProperties;

type StyleMap = {
  root: CSSProperties;
  nav: CSSProperties;
  navLeft: CSSProperties;
  logo: CSSProperties;
  logoTitle: CSSProperties;
  logoSub: CSSProperties;
  navRight: CSSProperties;
  badge: CSSProperties;
  badgeDot: CSSProperties;
  uploadBtn: CSSProperties;
  chat: CSSProperties;
  emptyWrap: CSSProperties;
  emptyIcon: CSSProperties;
  emptyTitle: CSSProperties;
  emptyDesc: CSSProperties;
  suggestions: CSSProperties;
  suggBtn: CSSProperties;
  msgRow: StyleFn;
  avatar: StyleFn;
  bubble: StyleFn;
  typingRow: CSSProperties;
  typingBubble: CSSProperties;
  dot: (i: number) => CSSProperties;
  inputWrap: CSSProperties;
  inputInner: CSSProperties;
  inputBox: CSSProperties;
  textarea: CSSProperties;
  sendBtn: (active: boolean) => CSSProperties;
  hint: CSSProperties;
};

const s: StyleMap = {
  root: {
    minHeight: "100vh",
    background: C.bg,
    color: C.text,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    borderBottom: `1px solid ${C.border}`,
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(8,13,22,0.85)",
    backdropFilter: "blur(12px)",
    position: "sticky" as const,
    top: 0,
    zIndex: 20,
  },
  navLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: `linear-gradient(135deg, ${C.teal}, ${C.cyan})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#080d16",
    boxShadow: `0 4px 16px rgba(45,212,191,0.25)`,
    flexShrink: 0,
  },
  logoTitle: { fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" },
  logoSub: {
    fontSize: 9,
    color: C.textFaint,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    marginTop: 1,
  },
  navRight: { display: "flex", alignItems: "center", gap: 10 },
  badge: {
    fontSize: 11,
    color: C.teal,
    background: C.tealDim,
    border: `1px solid rgba(45,212,191,0.2)`,
    padding: "4px 12px",
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: C.teal,
  },
  uploadBtn: {
    fontSize: 12,
    border: `1px solid ${C.border}`,
    padding: "7px 14px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.02)",
    color: C.textDim,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 7,
    transition: "all 0.2s",
  },
  chat: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "28px 16px",
    maxWidth: 760,
    width: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  emptyWrap: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "55vh",
    gap: 28,
    textAlign: "center" as const,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    background: C.tealDim,
    border: `1px solid rgba(45,212,191,0.18)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 4px",
  },
  emptyTitle: { fontSize: 20, fontWeight: 600, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: C.textDim, maxWidth: 400, lineHeight: 1.6 },
  suggestions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
    width: "100%",
    maxWidth: 560,
  },
  suggBtn: {
    textAlign: "left" as const,
    fontSize: 12,
    color: C.textDim,
    border: `1px solid ${C.border}`,
    background: "rgba(255,255,255,0.015)",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
    lineHeight: 1.5,
    transition: "all 0.2s",
  },
  msgRow: (role: "user" | "assistant"): CSSProperties => ({
    display: "flex",
    flexDirection: role === "user" ? "row-reverse" : "row",
    gap: 10,
    alignItems: "flex-start",
  }),
  avatar: (role: "user" | "assistant"): CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    marginTop: 2,
    background:
      role === "user"
        ? "rgba(255,255,255,0.08)"
        : `linear-gradient(135deg, ${C.teal}, ${C.cyan})`,
    color: role === "user" ? C.textDim : "#080d16",
    boxShadow:
      role === "assistant" ? `0 2px 10px rgba(45,212,191,0.2)` : "none",
  }),
  bubble: (role: "user" | "assistant"): CSSProperties => ({
    maxWidth: "82%",
    padding: "10px 14px",
    borderRadius: role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
    fontSize: 13.5,
    lineHeight: 1.65,
    background: role === "user" ? "rgba(255,255,255,0.055)" : C.surface,
    border: `1px solid ${role === "user" ? C.border : C.border}`,
    color: C.text,
  }),
  typingRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  typingBubble: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "4px 16px 16px 16px",
    padding: "12px 16px",
    display: "flex",
    gap: 5,
    alignItems: "center",
  },
  dot: (i: number): CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: `rgba(45,212,191,0.55)`,
    animation: "bounce 1.2s infinite",
    animationDelay: `${i * 0.15}s`,
  }),
  inputWrap: {
    position: "sticky" as const,
    bottom: 0,
    background: `linear-gradient(to top, ${C.bg} 70%, transparent)`,
    paddingTop: 16,
    paddingBottom: 24,
    paddingLeft: 16,
    paddingRight: 16,
  },
  inputInner: { maxWidth: 760, margin: "0 auto" },
  inputBox: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "10px 12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    resize: "none" as const,
    fontSize: 13.5,
    color: C.text,
    lineHeight: 1.6,
    minHeight: 24,
    fontFamily: "inherit",
  },
  sendBtn: (active: boolean): CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 10,
    flexShrink: 0,
    background: active
      ? `linear-gradient(135deg, ${C.teal}, ${C.cyan})`
      : "rgba(255,255,255,0.05)",
    border: "none",
    cursor: active ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    boxShadow: active ? `0 4px 14px rgba(45,212,191,0.3)` : "none",
  }),
  hint: {
    textAlign: "center" as const,
    fontSize: 10,
    color: C.textFaint,
    marginTop: 8,
    letterSpacing: "0.03em",
  },
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpload({ status: "uploading", filename: file.name });
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setUpload({ status: "success", rows: data.rows, filename: file.name });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**${file.name}** uploaded — ${data.rows} patients indexed into the vector store. You can now ask questions about the cohort or individual risk assessments.`,
        },
      ]);
    } catch (err: any) {
      setUpload({ status: "error", error: err.message });
    }
  }

  async function handleSend() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    const q = input.trim();
    if (!q || loading) return;
    const next: Message[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history: messages }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Query failed");
      setMessages([...next, { role: "assistant", content: data.answer }]);
    } catch (err: any) {
      setMessages([
        ...next,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function renderContent(text: string) {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} style={{ margin: i > 0 ? "6px 0 0" : 0 }}>
          {parts.map((p, k) =>
            k % 2 === 1 ? (
              <strong key={k} style={{ color: C.teal, fontWeight: 600 }}>
                {p}
              </strong>
            ) : (
              p
            ),
          )}
        </p>
      );
    });
  }

  const suggestions = [
    "What are the main risk factors for diabetes?",
    "Summarise the uploaded patient cohort",
    "Assess risk for: Glucose=148, BMI=33.6, Age=50, Pregnancies=1, BloodPressure=72, SkinThickness=35, Insulin=0, DiabetesPedigreeFunction=0.627",
    "Compare Logistic Regression vs KNN risk scores for this patient",
  ];

  const canSend = input.trim().length > 0 && !loading;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080d16; }
        ::placeholder { color: rgba(255,255,255,0.18); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-row { animation: fadeUp 0.25s ease; }
        .sugg-btn:hover { border-color: rgba(45,212,191,0.3) !important; color: rgba(255,255,255,0.75) !important; background: rgba(45,212,191,0.04) !important; }
        .upload-btn:hover { border-color: rgba(45,212,191,0.4) !important; color: #2dd4bf !important; }
        .send-btn-active:hover { box-shadow: 0 4px 20px rgba(45,212,191,0.45) !important; transform: scale(1.05); }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
      `}</style>

      <div style={s.root}>
        {/* NAV */}
        <nav style={s.nav}>
          <div style={s.navLeft}>
            <div style={s.logo}>RI</div>
            <div>
              <div style={s.logoTitle}>Patient Risk Insights</div>
              <div style={s.logoSub}>AI · ML · Clinical</div>
            </div>
          </div>
          <div style={s.navRight}>
            {upload.status === "success" && (
              <div style={s.badge}>
                <span
                  style={{ ...s.badgeDot, animation: "bounce 2s infinite" }}
                />
                {upload.rows} patients indexed
              </div>
            )}
            {upload.status === "uploading" && (
              <span style={{ fontSize: 12, color: C.textDim }}>Indexing…</span>
            )}
            <button
              className="upload-btn"
              style={s.uploadBtn}
              onClick={() => fileRef.current?.click()}
            >
              <svg
                width="13"
                height="13"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
          </div>
        </nav>

        {/* CHAT */}
        <div style={s.chat}>
          {messages.length === 0 && (
            <div style={s.emptyWrap}>
              <div>
                <div style={s.emptyIcon}>
                  <svg
                    width="26"
                    height="26"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={C.teal}
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4 15.3"
                    />
                  </svg>
                </div>
                <h2 style={s.emptyTitle}>Patient Risk Insights Agent</h2>
                <p style={s.emptyDesc}>
                  Upload a patient CSV, then ask questions about diabetes risk,
                  cohort summaries, or individual assessments powered by ML +
                  RAG.
                </p>
              </div>
              <div style={s.suggestions}>
                {suggestions.map((sg, i) => (
                  <button
                    key={i}
                    className="sugg-btn"
                    style={s.suggBtn}
                    onClick={() => setInput(sg)}
                  >
                    {sg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className="msg-row" style={s.msgRow(m.role)}>
              <div style={s.avatar(m.role)}>
                {m.role === "user" ? "U" : "AI"}
              </div>
              <div style={s.bubble(m.role)}>{renderContent(m.content)}</div>
            </div>
          ))}

          {loading && (
            <div style={s.typingRow}>
              <div style={s.avatar("assistant")}>AI</div>
              <div style={s.typingBubble}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={s.dot(i)} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div style={s.inputWrap}>
          <div style={s.inputInner}>
            <div style={s.inputBox}>
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about patient risk, cohort summary, or specific metrics…"
                style={s.textarea}
              />
              <button
                className={canSend ? "send-btn-active" : ""}
                style={s.sendBtn(canSend)}
                onClick={handleSend}
                disabled={!canSend}
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={canSend ? "#080d16" : C.textFaint}
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
            <p style={s.hint}>
              Enter to send · Shift+Enter for new line · Upload CSV to analyse
              your dataset
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
