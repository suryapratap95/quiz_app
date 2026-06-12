# QuizPlatform — AI-Powered Assessment System

A modern, full-featured quiz platform built with **Next.js 14**, **Tailwind CSS**, and **Vercel Postgres**. Trainers can create exams, upload question papers (PDF/Word/TXT), and track student results. Students get a clean, responsive exam-taking experience.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue?style=flat-square)
![Postgres](https://img.shields.io/badge/Postgres-Vercel-green?style=flat-square)

---

## Features

### 🎓 Student Experience
- Browse available exams
- Register with name & email, then take the quiz
- Progress tracking with question navigation dots
- One submission per email (configurable per exam)
- Optional score reveal after submission

### 👩‍🏫 Trainer Dashboard
- **Create exams** with custom title, description, duration, and color
- **Upload question papers** — PDF, DOCX, or TXT files
  - Structured parsing extracts questions automatically
  - AI fallback (OpenAI) handles messy formats when API key is set
- **Add questions manually** with a form builder
- **View results** per exam — scores, percentages, timestamps
- **All Results** tab with a sortable table across all exams
- Activate/deactivate exams, clear results, delete exams

### 🧠 Smart Question Import
1. **Structured parsing** — recognizes numbered questions (Q1, 1., 1)), A-D options, and Answer: lines
2. **AI fallback** — if structured parsing yields 0 results and `OPENAI_API_KEY` is set, uses GPT-4o-mini to extract questions from any format

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Database | Vercel Postgres / Neon |
| File Parsing | pdf-parse, mammoth |
| AI (optional) | OpenAI GPT-4o-mini |

---

## Project Structure

```
app/
├── page.jsx                    # Landing page
├── layout.jsx                  # Root layout
├── globals.css                 # Tailwind + custom CSS
├── exam/
│   ├── page.jsx                # Exam listing
│   └── [examId]/page.jsx       # Take exam (register → quiz → submitted)
├── trainer/
│   ├── page.jsx                # Trainer login
│   └── dashboard/page.jsx      # Full dashboard (exams, results, create)
└── api/
    ├── exams/
    │   ├── route.js             # GET list / POST create exam
    │   ├── upload/route.js      # POST upload & parse file
    │   └── [examId]/
    │       ├── route.js         # GET/PUT/DELETE exam
    │       ├── questions/route.js  # POST add / DELETE clear questions
    │       ├── submit/route.js  # POST submit quiz
    │       ├── check/route.js   # POST check existing submission
    │       └── results/route.js # GET/DELETE exam results
    └── results/route.js         # GET all results (admin)

lib/
├── db.js                       # Database connection + schema
├── parse-questions.js           # Structured + AI question parser
├── quiz-utils.js                # Seeded shuffle utilities (legacy)
└── exams.js                     # Legacy exam definitions

data/
└── wexam-questions.js           # Legacy question pool (reference)
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `POSTGRES_URL` — your Vercel Postgres or Neon connection string (required)
- `ADMIN_PASSWORD` — protects the trainer panel (recommended)
- `OPENAI_API_KEY` — enables AI-powered question extraction (optional)

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy on Vercel

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com/new)
3. Add environment variables in Project Settings:
   - `POSTGRES_URL`
   - `ADMIN_PASSWORD`
   - `OPENAI_API_KEY` (optional)
4. Deploy — tables are auto-created on first request

---

## API Reference

### Exams

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/exams` | Public/Admin | List exams (active only for public) |
| POST | `/api/exams` | Admin | Create new exam |
| GET | `/api/exams/:id` | Public/Admin | Get exam with questions |
| PUT | `/api/exams/:id` | Admin | Update exam settings |
| DELETE | `/api/exams/:id` | Admin | Delete exam + questions + results |

### Questions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/exams/:id/questions` | Admin | Add questions to exam |
| DELETE | `/api/exams/:id/questions` | Admin | Clear all questions |
| POST | `/api/exams/upload` | Admin | Upload PDF/DOCX/TXT → extract questions |

### Submissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/exams/:id/submit` | Public | Submit quiz answers |
| POST | `/api/exams/:id/check` | Public | Check if email already submitted |
| GET | `/api/exams/:id/results` | Admin | Get results for an exam |
| DELETE | `/api/exams/:id/results` | Admin | Clear exam results |
| GET | `/api/results` | Admin | Get all results across exams |

Admin auth: send `x-admin-password` header matching `ADMIN_PASSWORD` env var.

---

## License

MIT
