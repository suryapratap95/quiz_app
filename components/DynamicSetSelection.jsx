"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
  Loader2,
  Layers,
} from "lucide-react";

export default function DynamicSetSelection({ groupId }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupTitle, setGroupTitle] = useState("Exam");

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((d) => {
        const allExams = d.exams || [];
        const groupSets = allExams.filter((e) => e.parent_exam_id === groupId);
        setSets(groupSets.sort((a, b) => (a.set_label || "").localeCompare(b.set_label || "")));
        if (groupSets.length > 0) {
          const baseTitle = groupSets[0]?.title?.replace(/\s*—\s*Set\s+[A-C]$/i, "") || "Exam";
          setGroupTitle(baseTitle);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  const totalQuestions = sets.reduce((sum, s) => sum + (s.question_count || 0), 0);

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
                  {groupTitle}
                </h1>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  Choose one set (A, B, or C) assigned to you by your trainer.
                </p>
                <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} />
                    {totalQuestions} questions across {sets.length} sets
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {sets[0]?.duration || "30 min"} per set
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
                same topics with different question ordering.
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
                      style={{ background: set.color || "#6366f1" }}
                    />
                    <div className="flex items-start justify-between gap-4 pl-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className="rounded-lg px-2.5 py-0.5 text-xs font-bold text-white"
                            style={{ background: set.color || "#6366f1" }}
                          >
                            {set.set_label || set.title}
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
                        {set.description && (
                          <p className="mb-3 text-sm leading-relaxed text-gray-500">
                            {set.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} />
                            {set.question_count || 0} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {set.duration || "30 min"}
                          </span>
                        </div>
                      </div>
                      <div
                        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition group-hover:scale-105"
                        style={{ background: set.color || "#6366f1" }}
                      >
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {sets.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-16 text-center">
                <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
                <h3 className="mb-1 text-base font-semibold text-gray-700">
                  No sets available
                </h3>
                <p className="text-sm text-gray-400">
                  This exam group has no sets configured yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
