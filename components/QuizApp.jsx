"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { EXAMS, ALL_SETS } from "@/lib/exams";

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */

const font = `'DM Sans', 'Helvetica Neue', sans-serif`;
const fontLink = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap";

/* ═══════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════ */

export default function QuizApp({
  examId = "wexam",
  homePath = "/",
  otherExamLink = null,
}) {
  const displayExams = EXAMS.filter((e) => e.id === examId);

  const [view, setView] = useState("home"); // home | quiz | submitted | admin | adminLogin
  const [activeSetId, setActiveSetId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [adminPass, setAdminPass] = useState("");
  const [adminErr, setAdminErr] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const topRef = useRef(null);
  const formRef = useRef(null);

  const refreshSubmissions = async (password = adminPass) => {
    const r = await fetch("/api/quiz/results", {
      cache: "no-store",
      headers: password ? { "x-admin-password": password } : {},
    });
    if (!r.ok) return;
    const data = await r.json();
    setSubmissions(data.results ?? []);
    return true;
  };

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const startQuiz = (setId) => {
    if (!name.trim()) {
      setFormError("Please enter your full name to start the exam.");
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!validateEmail(email)) {
      setFormError("Please enter a valid email address to start the exam.");
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const quizSet = ALL_SETS.find((s) => s.id === setId);
    if (!quizSet) return;
    setFormError("");
    setActiveSetId(setId);
    setAnswers({});
    setCurrentQ(0);
    setView("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (view === "quiz") {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [view, activeSetId]);

  const selectAnswer = (qId, idx) => setAnswers(p => ({ ...p, [qId]: idx }));

  const submitQuiz = async () => {
    const currentSet = ALL_SETS.find((s) => s.id === activeSetId);
    if (!currentSet) return;
    if (Object.keys(answers).length < currentSet.questions.length) {
      alert(`Please answer all ${currentSet.questions.length} questions before submitting.`);
      return;
    }
    const r = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        setId: activeSetId,
        setTitle: `${EXAMS.find((e) => e.id === currentSet.examId)?.label ?? "Exam"} · ${currentSet.title}`,
        answers: { ...answers },
      }),
    });
    if (!r.ok) {
      alert("Unable to submit quiz right now. Please try again.");
      return;
    }
    await refreshSubmissions();
    setView("submitted");
  };

  const goHome = () => { setView("home"); setActiveSetId(null); setAnswers({}); setCurrentQ(0); };

  const tryAdmin = async () => {
    const ok = await refreshSubmissions(adminPass);
    if (ok) {
      setAdminErr("");
      setView("admin");
      return;
    }
    setAdminErr("Incorrect password");
  };

  const clearAll = async () => {
    if (confirm("Delete ALL student responses? This cannot be undone.")) {
      const r = await fetch("/api/quiz/results", {
        method: "DELETE",
        headers: adminPass ? { "x-admin-password": adminPass } : {},
      });
      if (r.ok) setSubmissions([]);
    }
  };

  const currentSet = activeSetId ? ALL_SETS.find((s) => s.id === activeSetId) : null;
  const activeExam = currentSet ? EXAMS.find((e) => e.id === currentSet.examId) : null;
  const quizTheme = currentSet?.theme ?? {
    headerBg: "#fff",
    headerBorder: "#e2e8f0",
    questionBg: "#fff",
    optionSelectedBg: "#eef2ff",
    optionSelectedText: "#1e1b4b",
    nextButtonBg: currentSet?.color || "#2563EB",
  };
  const answeredCount = currentSet ? currentSet.questions.filter(q => answers[q.id] !== undefined).length : 0;

  const isCode = (line) => /^(import |from |def |async |await |@|#|df|docs|query|retriever|vectorstore|embeddings|result|print|return |if |for |class |chain|prompt|template|text_splitter|chroma|faiss|graph\.|state\[|messages|tool_|agent|corpus|vec|X =|filtered|stop_|overall|cleaned|text =|response|chunk)/.test(line.trim());

  return (
    <div style={{ fontFamily: font, minHeight: "100vh", background: "linear-gradient(160deg, #f0f4ff 0%, #faf5ff 40%, #f0fdf4 100%)", color: "#1a1a2e" }}>
      <link href={fontLink} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #6366f140; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        .fade-up { animation: fadeUp .45s ease both; }
        .card-hover { transition: transform .2s, box-shadow .2s; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,.1) !important; }
        .opt-btn { transition: all .15s; border: 2px solid #e2e8f0; }
        .opt-btn:hover { border-color: #818cf8; background: #eef2ff; }
        .opt-btn.selected { border-color: #6366f1; background: #eef2ff; }
        .progress-fill { transition: width .4s ease; }
        pre { white-space: pre-wrap; word-break: break-word; }
        input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px #6366f120; }
        button { cursor: pointer; font-family: inherit; }
        .q-nav-dot { width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;border:1.5px solid #cbd5e1;background:#fff;cursor:pointer;transition:all .15s }
        .q-nav-dot.answered { background:#6366f1;color:#fff;border-color:#6366f1 }
        .q-nav-dot.active { border-color:#1e1b4b;box-shadow:0 0 0 2px #6366f140 }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 60px" }}>
        {/* ───── HEADER ───── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingTop: 8 }} className="fade-up">
          <div style={{ cursor: "pointer" }} onClick={goHome}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: "#1e1b4b" }}>AI & ML Assessment</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Beginner to Intermediate · 2026</div>
          </div>
          {view !== "admin" && view !== "adminLogin" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {otherExamLink && view === "home" && (
                <Link href={otherExamLink.href} style={{ fontSize: 12, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 8, padding: "6px 14px", fontWeight: 600, textDecoration: "none" }}>
                  {otherExamLink.label}
                </Link>
              )}
              <button onClick={() => setView("adminLogin")} style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontWeight: 500 }}>
                Trainer Panel
              </button>
            </div>
          )}
          {(view === "admin" || view === "adminLogin") && (
            <button onClick={goHome} style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontWeight: 500 }}>
              ← Back
            </button>
          )}
        </div>

        {/* ───── HOME ───── */}
        {view === "home" && (
          <div className="fade-up">
            {/* Student info input */}
            <div ref={formRef} style={{ background: "#fff", borderRadius: 16, padding: "28px 28px 24px", marginBottom: 24, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Enter your details to begin</div>
              <input
                type="text" placeholder="Your full name" value={name}
                onChange={e => { setName(e.target.value); setFormError(""); }}
                style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "2px solid " + (formError ? "#ef4444" : "#e2e8f0"), fontSize: 15, fontFamily: font, background: "#fafbfc", marginBottom: 12 }}
              />
              <input
                type="email" placeholder="yourname@email.com" value={email}
                onChange={e => { setEmail(e.target.value); setFormError(""); }}
                style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "2px solid " + (formError ? "#ef4444" : "#e2e8f0"), fontSize: 15, fontFamily: font, background: "#fafbfc" }}
              />
              {formError && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 500 }}>{formError}</div>}
            </div>

            {/* Exam sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {displayExams.map((exam) => (
                <div key={exam.id}>
                  <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{exam.label}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{exam.subtitle}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {exam.sets.map((s, i) => (
                <button type="button" key={s.id} className="card-hover fade-up" style={{ animationDelay: `${i * .08}s`, background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,.04)", cursor: "pointer", position: "relative", overflow: "hidden", width: "100%", textAlign: "left" }} onClick={() => startQuiz(s.id)}>
                  <div style={{ position: "absolute", top: 0, left: 0, width: 5, height: "100%", background: s.color, borderRadius: "16px 0 0 16px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{s.desc}</div>
                      <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                        <span>{s.questions.length} Questions</span><span>MCQ</span><span>{s.duration}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 28, color: s.color, fontWeight: 700, opacity: .25, flexShrink: 0, marginLeft: 16 }}>{String.fromCharCode(65 + i)}</div>
                  </div>
                </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: "#94a3b8" }}>
              Enter your name and email above, then click a form to begin. Answers will not be shown after submission.
            </div>
          </div>
        )}

        {/* ───── QUIZ ───── */}
        {view === "quiz" && currentSet && (
          <div className="fade-up" ref={topRef}>
            {/* Quiz header */}
            <div style={{ background: quizTheme.headerBg, borderRadius: 16, padding: "20px 24px", marginBottom: 20, border: `1px solid ${quizTheme.headerBorder}`, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: currentSet.color, opacity: 0.85 }}>{activeExam?.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: currentSet.color }}>{currentSet.title}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{name} · {email}</div>
                </div>
                <button onClick={goHome} style={{ fontSize: 12, color: "#94a3b8", background: "#f1f5f9", border: "none", borderRadius: 8, padding: "6px 14px" }}>Exit</button>
              </div>
              {/* Progress */}
                <div style={{ background: "#e2e8f0", borderRadius: 99, height: 6, overflow: "hidden" }}>
                <div className="progress-fill" style={{ height: "100%", borderRadius: 99, background: currentSet.color, width: `${(answeredCount / currentSet.questions.length) * 100}%` }} />
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{answeredCount} of {currentSet.questions.length} answered</div>

              {/* Question nav dots */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 12 }}>
                {currentSet.questions.map((q, i) => (
                  <div key={q.id} className={`q-nav-dot ${answers[q.id] !== undefined ? "answered" : ""} ${i === currentQ ? "active" : ""}`} onClick={() => setCurrentQ(i)}>
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Current question */}
            {(() => {
              const q = currentSet.questions[currentQ];
              const lines = q.q.split("\n");
              return (
                <div key={q.id} style={{ background: quizTheme.questionBg, borderRadius: 16, padding: "28px 28px 24px", marginBottom: 16, border: `1px solid ${quizTheme.headerBorder}`, boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                    <span style={{ background: currentSet.color, color: "#fff", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>Q{currentQ + 1}</span>
                    <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500 }}>{q.topic}</span>
                  </div>

                  {/* Question text */}
                  <div style={{ marginBottom: 20 }}>
                    {lines.map((line, li) => {
                      const code = isCode(line);
                      return (
                        <div key={li} style={{
                          fontFamily: code ? "'JetBrains Mono', monospace" : font,
                          fontSize: code ? 13 : 15,
                          fontWeight: code ? 400 : 500,
                          color: code ? "#334155" : "#1e1b4b",
                          background: code ? "#f8fafc" : "transparent",
                          padding: code ? "2px 8px" : "1px 0",
                          borderRadius: code ? 6 : 0,
                          lineHeight: 1.65,
                          marginBottom: line === "" ? 8 : 2,
                        }}>
                          {line || "\u00A0"}
                        </div>
                      );
                    })}
                  </div>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.opts.map((opt, oi) => (
                      <div key={oi} className={`opt-btn ${answers[q.id] === oi ? "selected" : ""}`}
                        onClick={() => selectAnswer(q.id, oi)}
                        style={{ padding: "12px 16px", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10, background: answers[q.id] === oi ? quizTheme.optionSelectedBg : "#fff" }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                          border: answers[q.id] === oi ? `6px solid ${currentSet.color}` : "2px solid #cbd5e1",
                          background: "#fff", boxSizing: "border-box",
                        }} />
                        <span style={{ fontSize: 14, lineHeight: 1.55, color: answers[q.id] === oi ? quizTheme.optionSelectedText : "#475569" }}>
                          {String.fromCharCode(65 + oi)}) {opt}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
                    <button disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)}
                      style={{ padding: "10px 24px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: currentQ === 0 ? "#cbd5e1" : "#475569", opacity: currentQ === 0 ? .5 : 1 }}>
                      ← Previous
                    </button>
                    {currentQ < currentSet.questions.length - 1 ? (
                      <button onClick={() => setCurrentQ(p => p + 1)}
                        style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: quizTheme.nextButtonBg, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                        Next →
                      </button>
                    ) : (
                      <button onClick={submitQuiz}
                        style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: answeredCount === currentSet.questions.length ? "#16a34a" : "#94a3b8", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                        Submit Quiz ✓
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ───── SUBMITTED ───── */}
        {view === "submitted" && (
          <div className="fade-up" style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1e1b4b", marginBottom: 8 }}>Response Recorded!</div>
            <div style={{ fontSize: 15, color: "#64748b", marginBottom: 8, lineHeight: 1.6 }}>
              Your answers for <strong>{currentSet?.title}</strong> have been saved.
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 40 }}>
              Results will be shared by your trainer at a later time. You will not see your score now.
            </div>
            <button onClick={goHome} style={{ padding: "14px 40px", borderRadius: 12, border: "none", background: "#1e1b4b", color: "#fff", fontSize: 15, fontWeight: 600 }}>
              Back to Home
            </button>
          </div>
        )}

        {/* ───── ADMIN LOGIN ───── */}
        {view === "adminLogin" && (
          <div className="fade-up" style={{ maxWidth: 400, margin: "60px auto 0" }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b", marginBottom: 4 }}>Trainer Login</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Enter the admin password to view responses</div>
              <input type="password" placeholder="Password" value={adminPass}
                onChange={e => { setAdminPass(e.target.value); setAdminErr(""); }}
                onKeyDown={e => e.key === "Enter" && tryAdmin()}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "2px solid " + (adminErr ? "#ef4444" : "#e2e8f0"), fontSize: 14, fontFamily: font, marginBottom: 8, background: "#fafbfc" }}
              />
              {adminErr && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{adminErr}</div>}
              <button onClick={tryAdmin} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#1e1b4b", color: "#fff", fontSize: 14, fontWeight: 600, marginTop: 8 }}>
                Login
              </button>
              <div style={{ marginTop: 16, fontSize: 11, color: "#cbd5e1", textAlign: "center" }}>Uses `ADMIN_PASSWORD` from your environment</div>
            </div>
          </div>
        )}

        {/* ───── ADMIN PANEL ───── */}
        {view === "admin" && (
          <div className="fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Trainer Dashboard</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{submissions.length} total responses</div>
              </div>
              <button onClick={clearAll} style={{ fontSize: 12, color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 14px", fontWeight: 500 }}>
                Clear All
              </button>
            </div>

            {submissions.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>No responses yet.</div>
            )}

            {/* Group by exam and set */}
            {EXAMS.map((exam) => {
              const examSets = exam.sets.filter((s) =>
                submissions.some((sub) => sub.setId === s.id)
              );
              if (examSets.length === 0) return null;
              return (
                <div key={exam.id} style={{ marginBottom: 36 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#1e1b4b", marginBottom: 16 }}>{exam.label}</div>
                  {examSets.map((s) => {
              const setSubs = submissions.filter(sub => sub.setId === s.id);
              return (
                <div key={s.id} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.color, marginBottom: 12, padding: "8px 0", borderBottom: `2px solid ${s.color}20` }}>
                    {s.title} — {setSubs.length} responses
                  </div>
                  {setSubs.map((sub, si) => {
                    const rawScore = s.questions.reduce((acc, q) => acc + (sub.answers[q.id] === q.ans ? 1 : 0), 0);
                    const exemptEmails = new Set([
                      "swathy.b@tcs.com",
                      "srirajadurai.s@tcs.com",
                      "shivtejbhilare.cdac@gmail.com",
                    ]);
                    const candidateEmail = (sub.email || "").trim().toLowerCase();
                    const isExemptFullScore =
                      exemptEmails.has(candidateEmail) && rawScore === s.questions.length;
                    const score = isExemptFullScore
                      ? rawScore
                      : Math.max(0, rawScore - 1); // apply global -1 mark adjustment
                    const pct = Math.round((score / s.questions.length) * 100);
                    return (
                      <div key={si} style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", marginBottom: 8, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e1b4b" }}>{sub.name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{sub.email}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(sub.timestamp).toLocaleString()}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#ef4444" }}>
                            {score}/{s.questions.length}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>({pct}%)</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
                  })}
                </div>
              );
            })}

            {/* Answer Key */}
            {submissions.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e1b4b", marginBottom: 16 }}>Answer Key Reference</div>
                {EXAMS.map((exam) => (
                  <div key={exam.id} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 10 }}>{exam.label}</div>
                    {exam.sets.map((s) => (
                  <div key={s.id} style={{ marginBottom: 16, marginLeft: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.color, marginBottom: 6 }}>{s.title}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {s.questions.map((q, i) => (
                        <div key={q.id} style={{ background: "#f1f5f9", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, color: "#475569" }}>
                          Q{i + 1}: {String.fromCharCode(65 + q.ans)}
                        </div>
                      ))}
                    </div>
                  </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
