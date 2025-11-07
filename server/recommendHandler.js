const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/";

export async function createRecommendation({ mood, artist }) {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.VITE_GEMINI_API_KEY?.trim();
  const model =
    process.env.GEMINI_MODEL?.trim() ||
    process.env.VITE_GEMINI_MODEL?.trim() ||
    "gemini-2.5-flash";

  if (!apiKey) {
    throw createError(
      "Server is missing GEMINI_API_KEY. Set it in your environment or deployment settings.",
      500
    );
  }

  if (!model) {
    throw createError(
      "Server is missing GEMINI_MODEL. Set it in your environment or deployment settings.",
      500
    );
  }

  const response = await fetch(
    `${GEMINI_BASE}${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
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
    throw createError(
      errorPayload?.error?.message ||
        `Gemini request failed (${response.status})`,
      response.status
    );
  }

  const data = await response.json();
  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    throw createError(
      `Gemini blocked the request (${blockReason}). Try a different description.`,
      400
    );
  }

  const candidate = data?.candidates?.[0];
  if (!candidate) {
    throw createError("Gemini did not return any candidates. Try again.", 502);
  }

  const text = extractText(candidate);
  if (!text) {
    const blockedCategory = candidate.safetyRatings?.find(
      (rating) => rating.blocked
    )?.category;
    if (blockedCategory) {
      throw createError(
        `Gemini blocked part of the response (${blockedCategory}). Reword the mood description.`,
        400
      );
    }

    throw createError("Gemini returned an empty response. Try again.", 502);
  }

  const recommendation = parseRecommendation(text);
  return {
    ...recommendation,
    vibeTags: getVibeTags(text),
    raw: text
  };
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
      "Gemini did not explain the selection."
  };
}

function getVibeTags(text) {
  const match = text.match(/vibe tags\s*[:-]\s*(.+)$/im);
  if (!match) return [];
  return match[1]
    .split(/[,|]/)
    .map((chip) => chip.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function matchLine(source, regex) {
  const match = source.match(regex);
  return match?.[1]?.trim() || "";
}

function firstQuoted(text) {
  const match = text.match(/"([^"]+)"/);
  return match?.[1] || "";
}

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
