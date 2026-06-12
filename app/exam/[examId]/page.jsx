"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Clock,
  User,
  Mail,
} from "lucide-react";

export default function TakeExamPage() {
  const { examId } = useParams();
  const router = useRouter();

  const [phase, setPhase] = useState("loading"); // loading | register | quiz | submitting | submitted | error
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  // Registration
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  // Quiz
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitResult, setSubmitResult] = useState(null);
  const topRef = useRef(null);

  // Load exam
  useEffect(() => {
    fetch(`/api/exams/${examId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Exam not found");
        return r.json();
      })
      .then((d) => {
        setExam(d.exam);
        setQuestions(d.questions || []);
        setPhase("register");
      })
      .catch((e) => {
        setError(e.message);
        setPhase("error");
      });
  }, [examId]);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const startExam = async () => {
    if (!name.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!validateEmail(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setFormError("");
    // Check if already submitted
    try {
      const r = await fetch(`/api/exams/${examId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await r.json();
      if (data.submitted) {
        setFormError("You have already submitted this exam. Only one attempt is allowed per email.");
        return;
      }
    } catch {
      // If check fails, let them proceed
    }

    setAnswers({});
    setCurrentQ(0);
    setPhase("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectAnswer = (qId, idx) =>
    setAnswers((p) => ({ ...p, [qId]: idx }));

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined
  ).length;

  const submitQuiz = async () => {
    if (answeredCount < questions.length) {
      alert(
        `Please answer all ${questions.length} questions before submitting.`
      );
      return;
    }

    setPhase("submitting");
    try {
      const r = await fetch(`/api/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          answers,
        }),
      });
      const data = await r.json();

      if (r.status === 409) {
        alert(data.error || "You have already submitted this exam.");
        setPhase("register");
        return;
      }
      if (!r.ok) {
        alert(data.error || "Failed to submit. Please try again.");
        setPhase("quiz");
        return;
      }

      setSubmitResult(data);
      setPhase("submitted");
    } catch {
      alert("Failed to submit. Please try again.");
      setPhase("quiz");
    }
  };

  useEffect(() => {
    if (phase === "quiz") {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentQ]);

  // ── Loading ──
  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={36} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  // ── Error ──
  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <h2 className="mb-2 text-xl font-bold text-gray-900">Exam Not Found</h2>
        <p className="mb-6 text-gray-500">{error}</p>
        <Link
          href="/exam"
          className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white no-underline"
        >
          Browse Exams
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Sparkles size={14} />
            </div>
            <span className="text-sm font-bold text-gray-900">QuizPlatform</span>
          </Link>
          {phase === "quiz" && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to exit? Your answers will be lost.")) {
                  router.push("/exam");
                }
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:text-red-500"
            >
              Exit Exam
            </button>
          )}
          {phase !== "quiz" && (
            <Link
              href="/exam"
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 no-underline transition hover:text-indigo-500"
            >
              ← All Exams
            </Link>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* ── REGISTER ── */}
        {phase === "register" && (
          <div className="animate-fade-up">
            {/* Exam Info Card */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div
                className="px-8 py-6"
                style={{
                  background: `linear-gradient(135deg, ${exam.color || "#6366f1"}15, ${exam.color || "#6366f1"}08)`,
                }}
              >
                <h1 className="mb-2 text-2xl font-extrabold text-gray-900">
                  {exam.title}
                </h1>
                {exam.description && (
                  <p className="mb-4 text-sm leading-relaxed text-gray-600">
                    {exam.description}
                  </p>
                )}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} />
                    {questions.length} Questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {exam.duration || "30 min"}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="mb-1 text-lg font-bold text-gray-900">
                Enter your details
              </h2>
              <p className="mb-6 text-sm text-gray-400">
                Required before starting the exam
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setFormError("");
                      }}
                      className="w-full rounded-xl border-2 border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm transition focus:border-indigo-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFormError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && startExam()}
                      className="w-full rounded-xl border-2 border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm transition focus:border-indigo-400 focus:bg-white"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                <button
                  onClick={startExam}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl"
                >
                  Start Exam →
                </button>
              </div>

              <p className="mt-5 text-center text-xs text-gray-400">
                One submission per email. Answers are not shown after submission.
              </p>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {(phase === "quiz" || phase === "submitting") && questions.length > 0 && (
          <div className="animate-fade-up" ref={topRef}>
            {/* Submitting overlay */}
            {phase === "submitting" && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-8 py-5 shadow-xl">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    Submitting your answers...
                  </span>
                </div>
              </div>
            )}

            {/* Quiz Header */}
            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2
                    className="text-base font-bold"
                    style={{ color: exam.color || "#6366f1" }}
                  >
                    {exam.title}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {name} · {email}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {answeredCount}/{questions.length}
                  </div>
                  <div className="text-xs text-gray-400">answered</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                    background: exam.color || "#6366f1",
                  }}
                />
              </div>

              {/* Question nav dots */}
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQ(i)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition
                      ${
                        answers[q.id] !== undefined
                          ? "bg-indigo-500 text-white"
                          : "border border-gray-200 bg-white text-gray-500 hover:border-indigo-300"
                      }
                      ${i === currentQ ? "ring-2 ring-indigo-300 ring-offset-1" : ""}
                    `}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Question */}
            {(() => {
              const q = questions[currentQ];
              if (!q) return null;
              const opts =
                typeof q.options === "string"
                  ? JSON.parse(q.options)
                  : q.options;

              return (
                <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
                  {/* Question badge */}
                  <div className="mb-5 flex items-center gap-2">
                    <span
                      className="rounded-lg px-3 py-1 text-xs font-bold text-white"
                      style={{ background: exam.color || "#6366f1" }}
                    >
                      Q{currentQ + 1}
                    </span>
                    {q.topic && q.topic !== "General" && (
                      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
                        {q.topic}
                      </span>
                    )}
                  </div>

                  {/* Question text */}
                  <div className="mb-6 whitespace-pre-wrap text-base font-medium leading-relaxed text-gray-900">
                    {q.question_text}
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {opts.map((opt, oi) => {
                      const selected = answers[q.id] === oi;
                      return (
                        <button
                          key={oi}
                          onClick={() => selectAnswer(q.id, oi)}
                          className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                            selected
                              ? "border-indigo-400 bg-indigo-50/60"
                              : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected
                                ? "border-indigo-500 bg-indigo-500"
                                : "border-gray-300"
                            }`}
                          >
                            {selected && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span
                            className={`text-sm leading-relaxed ${
                              selected
                                ? "font-medium text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}) {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between gap-4">
                    <button
                      disabled={currentQ === 0}
                      onClick={() => setCurrentQ((p) => p - 1)}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-gray-300 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>

                    {currentQ < questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQ((p) => p + 1)}
                        className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                        style={{ background: exam.color || "#6366f1" }}
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={submitQuiz}
                        disabled={
                          phase === "submitting" ||
                          answeredCount !== questions.length
                        }
                        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-600 hover:shadow-lg disabled:opacity-50"
                      >
                        {phase === "submitting" ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Submit Exam
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── SUBMITTED ── */}
        {phase === "submitted" && (
          <div className="animate-fade-up py-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-gray-900">
              Exam Submitted!
            </h2>
            <p className="mb-2 text-gray-600">
              Your answers for <strong>{exam.title}</strong> have been recorded.
            </p>

            {exam.show_results && submitResult && (
              <div className="mx-auto my-8 max-w-xs rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-1 text-3xl font-extrabold text-indigo-600">
                  {submitResult.score}/{submitResult.total}
                </div>
                <div className="text-sm text-gray-500">
                  Score: {submitResult.percentage}%
                </div>
              </div>
            )}

            {!exam.show_results && (
              <p className="mb-8 text-sm text-gray-400">
                Results will be shared by your trainer. You will not see your
                score now.
              </p>
            )}

            <Link
              href="/exam"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-bold text-white no-underline shadow-md transition hover:shadow-lg"
            >
              ← Back to Exams
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
