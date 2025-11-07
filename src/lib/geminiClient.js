const API_ENDPOINT =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "/api";

export async function requestRecommendation({ mood, artist }) {
  const response = await fetch(`${API_ENDPOINT}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mood, artist })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to fetch recommendation.");
  }

  return payload;
}
