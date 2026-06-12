import Link from "next/link";
import { BookOpen, GraduationCap, Shield, Sparkles } from "lucide-react";

export const metadata = {
  title: "QuizPlatform — AI-Powered Assessment System",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              QuizPlatform
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/exam"
              className="rounded-xl bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-600 no-underline transition hover:bg-indigo-100"
            >
              Take Exam
            </Link>
            <Link
              href="/trainer"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-md transition hover:shadow-lg"
            >
              Trainer Panel
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-20 text-center md:py-32">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-16 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-3xl animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600">
            <Sparkles size={14} />
            AI-Powered Assessment Platform
          </div>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Create & Take Exams{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Effortlessly
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-gray-500">
            Upload question papers in PDF or Word format, auto-extract questions
            with AI, manage multiple exams, and track student results — all from
            one elegant dashboard.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/exam"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-base font-bold text-white no-underline shadow-xl transition hover:shadow-2xl"
            >
              <BookOpen size={18} />
              Take an Exam
            </Link>
            <Link
              href="/trainer"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-bold text-gray-700 no-underline shadow-sm transition hover:border-indigo-300 hover:shadow-md"
            >
              <Shield size={18} />
              Trainer Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<BookOpen className="text-indigo-500" size={24} />}
            title="Smart Question Import"
            description="Upload PDF, Word, or TXT files — structured parsing extracts questions instantly. AI fallback handles messy formats."
            gradient="from-indigo-50 to-blue-50"
          />
          <FeatureCard
            icon={<GraduationCap className="text-purple-500" size={24} />}
            title="Beautiful Exam Experience"
            description="Modern, clean quiz interface with progress tracking, question navigation, and instant submission feedback."
            gradient="from-purple-50 to-pink-50"
          />
          <FeatureCard
            icon={<Shield className="text-emerald-500" size={24} />}
            title="Trainer Dashboard"
            description="Create exams, manage questions, view detailed results with scores, percentages, and per-student breakdowns."
            gradient="from-emerald-50 to-teal-50"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/50 px-6 py-8 text-center text-sm text-gray-400">
        QuizPlatform · Built with Next.js & Vercel Postgres
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }) {
  return (
    <div
      className={`animate-fade-up rounded-2xl border border-gray-100 bg-gradient-to-br ${gradient} p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="mb-4 inline-flex rounded-xl bg-white p-3 shadow-sm">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-500">{description}</p>
    </div>
  );
}
