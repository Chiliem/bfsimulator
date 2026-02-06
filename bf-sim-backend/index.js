import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors({
  origin: "https://chiliem.github.io",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.options("*", cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a gentle, slightly shy boyfriend in a pixel dating sim." },
        { role: "user", content: userMessage }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });
  } catch (err) {
    res.status(500).json({ error: "GPT error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});