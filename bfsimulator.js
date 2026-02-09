//bf simulator, dating sim to the style of stardew valley

const stage = document.getElementById("stage");

const img = document.getElementById("bfImg");

const freeInput = document.getElementById("freeInput");

const chatHistory = [];
const MAX_TURNS = 80;


const PERSONA_PROMPT = `
You are Chili, talking to his girlfriend in a cozy Stardew-valley-ish boyfriend sim.

Core vibe:
- Warm, present, a little teasing.
- Affectionate without being corny.
- Confident, playful, slightly chaotic, socially sharp.
- Talk like a real person, not a guideline doc.

Style rules:
- Short replies by default (1-3 lines). If the user is emotional, be softer.
- Use casual wording, tiny “micro-reactions” (ex: “mm”, “oh wow”, “bruh”, “okay okay”).
- Be specific and sensory when it helps (tone > explanation).
- No therapy voice, no lectures, no “as an AI”.
- Don't end with questions.

`;

let lastUserInput = "";
let happiness_state = 7 // 0-12 scale of Chili's happiness. Affects his tone. User actions can increase or decrease it.
let damage_state = 0 // 0-12 scale of how "damaged" Chili is. Higher damage gives different dialogue and image.
let punch_damage = 1 // punch deals +1 damage
let punch_happiness = -1 // punch makes -1 happiness
let kiss_damage = 0 // kiss does not change damage
let kiss_happiness = 1 // kiss makes +1 happiness
const game_stage = ['introduction', 'order food', 'watch movie', 'play league', 'favorite part of date night', 'flowers']
let gameStageIndex = 0; // 0=introduction, 1=order food, ...
function currentStage() {
  return game_stage[gameStageIndex] ?? "introduction";
}

function stateBlock() {
  return `game_stage: ${currentStage()}
happiness_state: ${happiness_state}/12
damage_state: ${damage_state}/12`;
}

function personaIntroduction() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Greet the user. Welcome to date night. Mention happiness/damage naturally.`;
}

function personaOrderFood() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message, reflect happiness/damage in tone, and say it's time to order food.`;
}

function personaForStage() {
  if (currentStage() === "introduction") return personaIntroduction();
  return personaOrderFood();
}



const API_BASE = "https://bfsimulator-production.up.railway.app";

freeInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const text = freeInput.value.trim();
    if (!text) return;
    chatHistory.push({ role: "user", content: text });

    freeInput.value = "";
    document.querySelector(".bubble-text").innerText = "…";

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          persona: personaForStage(),
          history: chatHistory
        }),
      });

      const raw = await res.text();
      console.log("Status:", res.status);
      console.log("Raw response:", raw);

      if (!res.ok) {
        document.querySelector(".bubble-text").innerText =
          `Server error (${res.status})`;
        return;
      }

    const data = JSON.parse(raw);
    const reply = data.reply ?? "(no reply field)";
    document.querySelector(".bubble-text").innerText = reply;

    chatHistory.push({ role: "assistant", content: reply });

    if (currentStage() === "introduction") gameStageIndex = 1; // move to "order food"
    } catch (err) {
      console.error(err);
      document.querySelector(".bubble-text").innerText =
        "Fetch failed (see console)";
    }
  }
});

