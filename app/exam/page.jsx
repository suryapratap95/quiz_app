"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Clock,
  FileText,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { groupExamsForDisplay } from "@/lib/wexam-groups";

export default function ExamListPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayExams = useMemo(() => groupExamsForDisplay(exams), [exams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              QuizPlatform
            </span>
          </Link>
          <Link
            href="/trainer"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 no-underline transition hover:border-indigo-300 hover:text-indigo-600"
          >
            Trainer Panel
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 animate-fade-up">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
            Available Exams
          </h1>
          <p className="text-gray-500">
            Select an exam to begin. Enter your details and answer all questions
            to submit.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
          </div>
        )}

        {/* Empty */}
        {!loading && displayExams.length === 0 && (
          <div className="animate-fade-up rounded-2xl border border-dashed border-gray-200 bg-white/50 py-20 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-700">
              No exams available
            </h3>
            <p className="text-sm text-gray-400">
              Check back later or contact your trainer.
            </p>
          </div>
        )}

        {/* Exam cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {displayExams.map((item, i) => {
            if (item.type === "group") {
              return (
                <Link
                  key={item.id}
                  href={`/exam/${item.id}`}
                  className="group animate-fade-up no-underline"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div
                      className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl"
                      style={{ background: item.color || "#0891B2" }}
                    />
                    <div className="pl-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="mt-1 text-sm leading-relaxed text-gray-500">
                              {item.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs font-medium text-indigo-500">
                            {item.sets?.length || 3} sets · Choose yours on the next step
                          </p>
                        </div>
                        <ArrowRight
                          size={18}
                          className="mt-1 shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-5 text-xs font-medium text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={13} />
                          {item.question_count || 0} Questions
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {item.duration || "30 min"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }

            const exam = item;
            return (
              <Link
                key={exam.id}
                href={`/exam/${exam.id}`}
                className="group animate-fade-up no-underline"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div
                    className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl"
                    style={{ background: exam.color || "#6366f1" }}
                  />

                  <div className="pl-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600">
                          {exam.title}
                        </h3>
                        {exam.description && (
                          <p className="mt-1 text-sm leading-relaxed text-gray-500">
                            {exam.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        size={18}
                        className="mt-1 shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-5 text-xs font-medium text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={13} />
                        {exam.question_count || 0} Questions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {exam.duration || "30 min"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
