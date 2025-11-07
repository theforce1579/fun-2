import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { requestRecommendation } from "./lib/geminiClient.js";
import "./App.css";

const initialForm = { mood: "", artist: "" };

function App() {
  const [form, setForm] = useState(initialForm);
  const [recommendation, setRecommendation] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const isBusy = status.state === "loading";

  const vibeChips = useMemo(() => {
    if (!recommendation?.raw) return [];
    const match = recommendation.raw.match(/vibe tags\s*[:-]\s*(.+)$/im);
    if (!match) return [];
    return match[1]
      .split(/[,|]/)
      .map((chip) => chip.trim())
      .filter(Boolean)
      .slice(0, 4);
  }, [recommendation]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.mood.trim()) {
      setStatus({ state: "error", message: "Tell me how you're feeling first." });
      return;
    }

    setStatus({ state: "loading", message: "Curating the perfect track..." });
    setRecommendation(null);

    try {
      const data = await requestRecommendation({
        mood: form.mood.trim(),
        artist: form.artist.trim()
      });
      setRecommendation(data);
      setStatus({ state: "success", message: "Here’s your soundtrack." });
    } catch (error) {
      console.error(error);
      setStatus({
        state: "error",
        message: error.message || "Something went wrong."
      });
    }
  };

  const handleTryAgain = () => {
    setForm(initialForm);
    setRecommendation(null);
    setStatus({ state: "idle", message: "" });
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="pill">Moodwave</p>
        <h1>Let your mood pick the soundtrack</h1>
        <p className="lede">
          Feed in today&apos;s vibe, optionally add an artist, and Moodwave will
          tap Gemini for a single song that matches the moment.
        </p>
      </header>

      <main className="content-grid">
        <section className="panel">
          <form onSubmit={handleSubmit} className="stack" autoComplete="off">
            <FormField
              label="Mood or vibe"
              htmlFor="mood"
              helper="Describe what you’re feeling in a sentence."
            >
              <textarea
                id="mood"
                name="mood"
                rows="3"
                maxLength="220"
                placeholder="e.g. Soft focus, rainy night energy"
                value={form.mood}
                onChange={handleChange}
                disabled={isBusy}
                required
              />
            </FormField>

            <FormField
              label="Optional artist"
              htmlFor="artist"
              helper="We’ll prioritize a track from them if it still fits."
            >
              <input
                id="artist"
                name="artist"
                type="text"
                maxLength="80"
                placeholder="e.g. Laufey"
                value={form.artist}
                onChange={handleChange}
                disabled={isBusy}
              />
            </FormField>

            <button className="cta" type="submit" disabled={isBusy}>
              {isBusy ? "Finding a match…" : "Recommend a song"}
              <span aria-hidden="true">↗</span>
            </button>
          </form>
        </section>

        <section className="panel response-panel">
          <header className="response-header">
            <h2>Recommendation</h2>
            {recommendation && (
              <button className="ghost" type="button" onClick={handleTryAgain}>
                Try a new mood
              </button>
            )}
          </header>

          <StatusBanner status={status} />

          {recommendation && (
            <article className="result-card">
              <div>
                <p className="sup">{recommendation.artist}</p>
                <h3>{recommendation.title}</h3>
                <p className="summary">
                  <span className="label">Why:</span> {recommendation.reasoning}
                </p>
              </div>

              {vibeChips.length > 0 && (
                <>
                  <p className="summary vibe-line">
                    <span className="label">Vibe tags:</span>
                  </p>
                  <div className="chips">
                    {vibeChips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>
                </>
              )}
            </article>
          )}
        </section>
      </main>
    </div>
  );
}

function FormField({ label, htmlFor, helper, children }) {
  return (
    <label className="field" htmlFor={htmlFor}>
      <span className="field-label">{label}</span>
      {children}
      {helper && <span className="helper">{helper}</span>}
    </label>
  );
}

function StatusBanner({ status }) {
  if (status.state === "idle") {
    return (
      <p className="placeholder">
        Describe a mood on the left to get a tailored song.
      </p>
    );
  }

  return (
    <div
      className={clsx("status-banner", status.state, {
        loading: status.state === "loading"
      })}
      role="status"
    >
      {status.state === "loading" && <LoaderDots />}
      <span>{status.message}</span>
    </div>
  );
}

function LoaderDots() {
  return (
    <span className="loader" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default App;
