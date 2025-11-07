import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createRecommendation } from "./server/recommendHandler.js";

export default defineConfig({
  plugins: [react(), devApiMiddleware()],
  server: {
    port: 5173,
    host: true
  }
});

function devApiMiddleware() {
  return {
    name: "moodwave-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/recommend", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Allow", "POST");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const body = await readBody(req);
          const mood = body?.mood?.trim();
          const artist = body?.artist?.trim() || "";

          if (!mood) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Mood is required." }));
            return;
          }

          const recommendation = await createRecommendation({ mood, artist });
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(recommendation));
        } catch (error) {
          console.error("Dev API error:", error);
          res.statusCode = error.statusCode || 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error.message || "Unexpected server error."
            })
          );
        }
      });
    }
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      resolve(safeParse(raw));
    });
    req.on("error", reject);
  });
}

function safeParse(payload) {
  if (!payload) return {};
  try {
    return JSON.parse(payload);
  } catch (error) {
    console.warn("Failed to parse dev request body:", error);
    return {};
  }
}
