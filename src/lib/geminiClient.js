const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL?.trim();
const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/";

const ERROR_EMPTY = "Gemini returned an empty response. Try again.";

export async function requestRecommendation({ mood, artist }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!GEMINI_MODEL) {
    throw new Error(
      "Missing Gemini model. Add VITE_GEMINI_MODEL to your .env file."
    );
  }

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env file."
    );
  }

  const response = await fetch(
    `${GEMINI_BASE}${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(mood, artist) }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          maxOutputTokens: 2048
        }
      })
    }
  );

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(
      errorPayload?.error?.message ||
        `Gemini request failed (${response.status})`
    );
  }

  const data = await response.json();
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(
      `Gemini blocked the request (${blockReason}). Try a different description.`
    );
  }

  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini did not return any candidates. Try again.");
  }

  const finishReason = candidate.finishReason;
  const text = extractText(candidate);

  if (!text) {
    if (finishReason && finishReason !== "STOP") {
      const message =
        finishReason === "MAX_TOKENS"
          ? "Gemini ran out of room even with a high token allowance. Try a shorter description."
          : `Gemini stopped early (${finishReason}). Try rephrasing your prompt.`;
      throw new Error(message);
    }

    const blockedCategory = candidate.safetyRatings?.find(
      (rating) => rating.blocked
    )?.category;
    if (blockedCategory) {
      throw new Error(
        `Gemini blocked part of the response (${blockedCategory}). Reword the mood description.`
      );
    }

    throw new Error(ERROR_EMPTY);
  }

  return parseRecommendation(text);
}

function buildPrompt(mood, artist) {
  return `You are Moodwave, a concise music curator.
Return exactly one song that matches the vibe in a tight, minimalist format.

Constraints:
- Keep the entire reply under 60 words.
- Prioritize the supplied artist only if it still fits the mood.
- Use this exact structure with no extra sentences:
Song: "<title>"
Artist: <artist>
Why: <one short sentence>
Vibe tags: <comma-separated keywords>

Mood: ${mood}
Artist preference: ${artist || "None"} `;
}

function extractText(candidate) {
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

function parseRecommendation(text) {
  return {
    title:
      matchLine(text, /(?:song|title)\s*[:-]\s*"?([^"\n]+)"?/i) ||
      firstQuoted(text) ||
      "Unknown title",
    artist:
      matchLine(text, /artist\s*[:-]\s*([^\n]+)/i) || "Unknown artist",
    reasoning:
      matchLine(text, /(?:why(?:\sit)?\sfits|why)\s*[:-]\s*([^\n]+)/i) ||
      text
        .split("\n")
        .map((line) => line.replace(/^artist\s*[:-]\s*/i, "").trim())
        .filter(Boolean)
        .slice(1)
        .join(" ")
        .trim() ||
      "Gemini did not explain the selection.",
    raw: text
  };
}

function matchLine(source, regex) {
  const match = source.match(regex);
  return match?.[1]?.trim() || "";
}

function firstQuoted(text) {
  const match = text.match(/"([^"]+)"/);
  return match?.[1] || "";
}
