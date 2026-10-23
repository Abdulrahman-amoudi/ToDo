# Vibe Todos

A study app that started as a to-do list. Upload your PDFs, read them in a clean reader, ask AI about any page, and turn your notes into quizzes. Tasks, lists and progress tracking are built in.

![Vibe Todos in 15 seconds](docs/vibe-todos.gif)

**Live app:** [to-do-virid-beta.vercel.app](https://to-do-virid-beta.vercel.app)

## What it does

- **Tasks and lists.** Plan your study day, tick things off, track progress.
- **PDF reader.** A quiet reading view with highlights and notes right on the page, including proper Arabic (RTL) text selection.
- **Ask AI.** Ask questions about the page you're reading and get answers in context.
- **Quizzes.** Turn your notes into practice questions.

## Built with

Next.js · React · Supabase · Gemini · Tailwind CSS · PDF.js

## Run it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). You'll need your own Supabase and Gemini keys in `.env.local`.
