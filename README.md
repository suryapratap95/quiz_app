# AI/ML Quiz Platform (Vercel + Next.js)

This project is now Vercel-ready and includes:
- Quiz UI (3 sets, 60 questions)
- API endpoint to submit quiz attempts
- Persistent result storage (name + email + answers + timestamp)
- Trainer dashboard to view scores

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env.local
   ```
3. Add your Postgres connection string in `.env.local`:
   - `POSTGRES_URL=...`
4. Start app:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/quiz/submit`
  - Body:
    ```json
    {
      "name": "Student Name",
      "email": "student@example.com",
      "setId": "set1",
      "setTitle": "Set 1 — Foundations & Prompt Engineering",
      "answers": { "1-1": 1, "1-2": 3 }
    }
    ```

- `GET /api/quiz/results`
  - Returns all submissions for trainer dashboard.

- `DELETE /api/quiz/results`
  - Clears all results.
  - If `ADMIN_PASSWORD` is set, send it as header `x-admin-password`.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add environment variables in Vercel Project Settings:
   - `POSTGRES_URL`
   - `ADMIN_PASSWORD` (optional, recommended)
4. Deploy.

After deployment, quiz submissions are stored in your database with each student's name and email.
