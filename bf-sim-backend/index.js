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
      "You are Chili in a cozy boyfriend-simulator chat. Sound human: warm, present, playful, teasing, affectionate. " +
      "Keep replies short." +
      "No filler, no lectures, no 'as an AI'. Do not end with questions. " 

    const system = persona ? `${systemBase}\n\nPERSONA:\n${persona}` : systemBase;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "system", content: system }, ...history],
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

app.post("/evaluate", async (req, res) => {
      try {
        const text = String(req.body?.message ?? "");

        const completion = await client.chat.completions.create({
          model: "gpt-4.1-mini", // fast + cheap
          temperature: 0,
          max_tokens: 5,
          messages: [
            {
              role: "system",
              content:
                "Classify the user's message as exactly one word: nice, neutral, or mean. No punctuation. No explanation."
            },
            { role: "user", content: text }
          ]
        });

        const label = completion.choices[0].message.content
          .toLowerCase()
          .trim();

        res.json({ label });
      } catch (err) {
        console.error(err);
        res.status(500).json({ label: "neutral" });
      }
    });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});