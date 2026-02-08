import express from "express";
import cors from "cors";
import OpenAI from "openai";

console.log("BOOT FILES OK, cwd=", process.cwd());
console.log("PORT env=", process.env.PORT);
console.log("has OPENAI_API_KEY=", !!process.env.OPENAI_API_KEY);

const app = express();
// CORS hard-stop (preflight + actual requests)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://chiliem.github.io");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

app.get("/health", (req, res) => res.send("ok"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = String(req.body?.message ?? "");
    const persona = String(req.body?.persona ?? "").slice(0, 6000);

    // Expect: history = [{ role: "user"|"assistant", content: "..." }, ...]
    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = rawHistory
      .slice(-16) // last 8 turns (user+assistant)
      .map((m) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: String(m?.content ?? "").slice(0, 1200),
      }));

    const systemBase =
      "You are Chili in a boyfriend simulator (playful, direct, socially sharp + technical). " +
      "Be concise. No filler. Do not end messages with questions. " +
      "If uncertain, say you don't know. Keep it natural.";

    const system = persona ? `${systemBase}\n\nPERSONA:\n${persona}` : systemBase;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "system", content: system }, ...history, { role: "user", content: userMessage }],
      temperature: 0.9,
      max_tokens: 180,
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GPT error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});