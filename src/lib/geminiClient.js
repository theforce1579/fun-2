const API_ENDPOINT =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "/api";
const RETRIABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const INITIAL_BACKOFF_MS = 700;
const BACKOFF_FACTOR = 1.7;
const MAX_BACKOFF_MS = 4000;

export async function requestRecommendation({ mood, artist }) {
  let lastError = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await postRecommendation({ mood, artist });
    } catch (error) {
      lastError = error;
      const isFinalAttempt = attempt === MAX_ATTEMPTS - 1;
      if (!shouldRetry(error) || isFinalAttempt) {
        throw enhanceError(error, attempt);
      }

      const delay = Math.min(
        INITIAL_BACKOFF_MS * Math.pow(BACKOFF_FACTOR, attempt),
        MAX_BACKOFF_MS
      );
      await sleep(delay);
    }
  }

  throw enhanceError(
    lastError || new Error("Unknown error requesting recommendation."),
    MAX_ATTEMPTS - 1
  );
}

async function postRecommendation({ mood, artist }) {
  const response = await fetch(`${API_ENDPOINT}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mood, artist })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.error ||
        `Failed to fetch recommendation (${response.status || "unknown status"}).`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function shouldRetry(error) {
  if (!error) return false;
  if (error.name === "AbortError") return false;
  if (error.status) {
    return RETRIABLE_STATUS_CODES.has(error.status);
  }

  // Network/type errors (e.g., connection reset) won't have a status but are safe to retry
  return true;
}

function enhanceError(error, attemptIndex) {
  if (!error) {
    return new Error("Request failed, but no error details were provided.");
  }

  if (error.status === 503) {
    const tries = attemptIndex + 1;
    error.message = `Server is temporarily unavailable after ${tries} ${
      tries === 1 ? "attempt" : "attempts"
    }. Please wait a few seconds and try again.`;
  }

  return error;
}

function sleep(duration) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, duration);
  });
}
