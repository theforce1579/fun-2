# Moodwave (React + Vite)

Mood-driven song recommendations powered by Google Gemini. Describe how you feel (optionally name an artist) and the app suggests a single track that matches the moment.

## Prerequisites

- Node.js 18+ (Vite 5 requirement)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Setup

```bash
cp .env.example .env       # add your Gemini key + model
npm install
npm run dev                # http://localhost:5173
```

### Environment variables

| Name              | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `GEMINI_API_KEY`  | Server-only Gemini key used by the `/api/recommend` route.         |
| `GEMINI_MODEL`    | Server-only Gemini model, e.g. `gemini-2.5-flash`.                 |
| `VITE_GEMINI_*`   | Optional legacy vars if you still need them exposed in the client. |
| `VITE_API_BASE`   | Optional override if the API lives on a different origin.          |

> On Vercel, add `GEMINI_API_KEY` and `GEMINI_MODEL` as Project Environment Variables so the key never ships to the browser.

## Scripts

- `npm run dev` — start the Vite dev server (local `/api/recommend` middleware included).
- `npm run build` — bundle for production (outputs to `dist/`).
- `npm run preview` — serve the production build locally.
- `npm run lint` — run ESLint with the provided config.

## How it works

- The UI posts mood + optional artist to `/api/recommend` via `src/lib/geminiClient.js`.
- The API route (`api/recommend.js`) shares logic with `server/recommendHandler.js`, which builds the Gemini prompt, calls the model using server-side secrets, parses the result, and returns `{ title, artist, reasoning, vibeTags, raw }`.
- Styling lives in `src/App.css` with a glassy neon aesthetic tuned for desktop and mobile.
