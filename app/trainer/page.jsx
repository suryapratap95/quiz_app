"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Lock, LogIn, AlertCircle } from "lucide-react";

export default function TrainerLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) {
      setError("Please enter the admin password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Test auth by fetching exams with admin header
      const r = await fetch("/api/exams", {
        headers: { "x-admin-password": password },
      });

      if (r.status === 401) {
        setError("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }

      if (!r.ok) {
        setError("Server error. Please try again.");
        setLoading(false);
        return;
      }

      // Store password in session and redirect
      sessionStorage.setItem("trainer_pass", password);
      window.location.href = "/trainer/dashboard";
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-6">
      {/* Background blobs */}
      <div className="pointer-events-none fixed -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-80 w-80 rounded-full bg-purple-100/50 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Back to home */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 no-underline">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              QuizPlatform
            </span>
          </Link>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl md:p-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <Lock size={24} className="text-indigo-500" />
          </div>

          <h1 className="mb-1 text-center text-xl font-extrabold text-gray-900">
            Trainer Login
          </h1>
          <p className="mb-8 text-center text-sm text-gray-400">
            Enter the admin password to access the dashboard
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full rounded-xl border-2 border-gray-100 bg-gray-50/50 px-4 py-3 text-sm transition focus:border-indigo-400 focus:bg-white"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-70"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-300">
            Uses ADMIN_PASSWORD from environment variables
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/exam"
            className="text-sm text-gray-400 no-underline transition hover:text-indigo-500"
          >
            ← Take an exam instead
          </Link>
        </div>
      </div>
    </div>
  );
}
