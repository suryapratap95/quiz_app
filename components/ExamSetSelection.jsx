"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
  Loader2,
  Layers,
} from "lucide-react";
import { getExam } from "@/lib/exams";
import {
  WEXAM_GROUP_ID,
  WEXAM_SET_IDS,
  getWexamSetLabel,
} from "@/lib/wexam-groups";

const STATIC_WEXAM = getExam(WEXAM_GROUP_ID);

export default function ExamSetSelection() {
  const [dbSets, setDbSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((d) => {
        const sets = (d.exams || []).filter((e) => WEXAM_SET_IDS.includes(e.id));
        setDbSets(sets);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sets = useMemo(() => {
    return WEXAM_SET_IDS.map((setId) => {
      const staticSet = STATIC_WEXAM?.sets?.find((s) => s.id === setId);
      const dbSet = dbSets.find((e) => e.id === setId);
      return {
        id: setId,
        label: getWexamSetLabel(setId),
        title: staticSet?.title || getWexamSetLabel(setId),
        description:
          dbSet?.description ||
          staticSet?.desc ||
          "Generative AI, Prompting & LLM-Assisted EDA",
        color: staticSet?.color || dbSet?.color || "#6366f1",
        duration: dbSet?.duration || staticSet?.duration || "~25 min",
        question_count: dbSet?.question_count || 0,
        is_active: dbSet?.is_active !== false,
      };
    });
  }, [dbSets]);

  const totalQuestions = sets.reduce((sum, s) => sum + s.question_count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              QuizPlatform
            </span>
          </Link>
          <Link
            href="/exam"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 no-underline transition hover:border-indigo-300 hover:text-indigo-600"
          >
            ← All Exams
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="animate-fade-up">
            {/* Exam overview */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div
                className="px-8 py-6"
                style={{
                  background:
                    "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #e0e7ff 100%)",
                }}
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  <Layers size={14} />
                  Multi-set exam
                </div>
                <h1 className="mb-2 text-2xl font-extrabold text-gray-900">
                  {STATIC_WEXAM?.label || "WExam Assessment"}
                </h1>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  {STATIC_WEXAM?.subtitle ||
                    "Assessment Week 2 · Choose one set (A, B, or C) assigned to you"}
                </p>
                <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} />
                    {totalQuestions} questions across 3 sets
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    ~25 min per set
                  </span>
                </div>
              </div>
            </div>

            {/* Set selection */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Select your set
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Pick the set assigned to you by your trainer. Each set covers the
                same topics with different questions.
              </p>
            </div>

            <div className="space-y-4">
              {sets.map((set) => (
                <Link
                  key={set.id}
                  href={`/exam/${set.id}`}
                  className={`group block no-underline ${
                    set.is_active ? "" : "pointer-events-none opacity-50"
                  }`}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                    <div
                      className="absolute left-0 top-0 h-full w-1.5"
                      style={{ background: set.color }}
                    />
                    <div className="flex items-start justify-between gap-4 pl-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className="rounded-lg px-2.5 py-0.5 text-xs font-bold text-white"
                            style={{ background: set.color }}
                          >
                            {set.label}
                          </span>
                          {!set.is_active && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <h3 className="mb-1 text-base font-bold text-gray-900 group-hover:text-indigo-600">
                          {set.title}
                        </h3>
                        <p className="mb-3 text-sm leading-relaxed text-gray-500">
                          {set.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} />
                            {set.question_count} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {set.duration}
                          </span>
                        </div>
                      </div>
                      <div
                        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition group-hover:scale-105"
                        style={{ background: set.color }}
                      >
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
