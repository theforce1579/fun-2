import { createRecommendation } from "../server/recommendHandler.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readBody(req);
    const mood = body?.mood?.trim();
    const artist = body?.artist?.trim() || "";

    if (!mood) {
      return res.status(400).json({ error: "Mood is required." });
    }

    const recommendation = await createRecommendation({ mood, artist });
    return res.status(200).json(recommendation);
  } catch (error) {
    console.error("Gemini recommend error:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Unexpected server error." });
  }
}

async function readBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? safeParse(req.body) : req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return safeParse(raw);
}

function safeParse(payload) {
  if (!payload) return {};
  try {
    return JSON.parse(payload);
  } catch (error) {
    console.warn("Failed to parse request body:", error);
    return {};
  }
}
