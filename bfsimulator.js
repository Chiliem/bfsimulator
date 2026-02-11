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
const game_stage = ['introduction', 'order food', 'gain punch', 'watch movie', 'add kiss', 'play league', 'favorite part of date night', 'flowers']
let gameStageIndex = 0; // 0=introduction, 1=order food, ...
let order_food_detected = false;
let punchModeActive = false;

function currentStage() {
  return game_stage[gameStageIndex] ?? "introduction";
}

function stateBlock() {
  return `game_stage: ${currentStage()}
happiness_state: ${happiness_state}/12 (${happinessLabel(happiness_state)})
damage_state: ${damage_state}/12 (${damageLabel(damage_state)})
order_food_detected: ${order_food_detected}

Behavior rules (DO NOT reveal numbers):
- Happiness controls emotional tone exactly per label above.
- Damage controls pain intensity exactly per label above (physical reactions, short lines).
- stay a little loving/affectionate even when upset or hurt.
- When the user does [PUNCH], react like you got hit (sound, flinch, protest), then recover.

LENGTH LIMITS (must follow):
- reply MUST be 1-2 lines (20 words)
- Never write paragraphs. Never explain. No narration.
`;
}

function personaIntroduction() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Greet the user. Welcome to date night.
Your tone and warmth should be influenced by the internal stats, but never mention or reveal them.
`;
}

function personaOrderFood() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let your tone, warmth, and energy be influenced by the internal stats, but never mention or reveal them.
MUST ask what exact food item do we want to order until we get an exact item.
`
}

function personaGainPunch() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let your tone, warmth, and energy be influenced by the internal stats, but never mention or reveal them.
Mention that a new button just appeared, and that you have no idea what it does.
Do not end with questions.
`;
}

function personaForStage() {
  switch (currentStage()) {
    case "introduction":
      return personaIntroduction();

    case "order food":
      return personaOrderFood();

    case "gain punch":
      return personaGainPunch();

    case "watch movie":
      return personaWatchMovie();

    case "add kiss":
      return personaAddKiss?.();

    case "play league":
      return personaPlayLeague?.();

    case "favorite part of date night":
      return personaFavoritePart?.();

    case "flowers":
      return personaFlowers?.();

    default:
      throw new Error(`Unknown stage: ${currentStage()}`);
  }
}

function personaWatchMovie() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let tone reflect internal stats.
Ask what movie genre we should watch until the user gives either:
- a movie genre (like horror, romcom, sci-fi, thriller)
- or a real movie title.

Stay short.
`;
}

function setSkillVisible(skill, visible) {
  const btn = document.querySelector(`.skill-btn[data-skill="${skill}"]`);
  if (!btn) return;
  btn.classList.toggle("disabled", !visible);
}

function applySentiment(label) {
  if (label === "nice") happiness_state = Math.min(12, happiness_state + 1);
  if (label === "mean") happiness_state = Math.max(0, happiness_state - 1);
  updateMainImage();
}

function happinessTier(h) {
  if (h <= 2) return 0;
  if (h <= 5) return 1;
  if (h <= 8) return 2;
  return 3;
}

function damageTier(d) {
  if (d <= 2) return 1;
  if (d <= 5) return 2;
  if (d <= 8) return 3;
  return 4;
}

function happinessLabel(h) {
  if (h <= 2) return "crying (hurt, angry, needs comfort)";
  if (h <= 5) return "pouting (annoyed, frustrated, a little sad)";
  if (h <= 8) return "neutral (steady, playful baseline)";
  return "smiling (warm, affectionate, playful)";
}

function damageLabel(d) {
  if (d <= 2) return "not damaged (fine)";
  if (d <= 5) return "a bit bruised (wincing sometimes)";
  if (d <= 8) return "very bruised (obvious pain)";
  return "really bruised up (struggling, tender)";
}

function emotionFromHappiness(h) {
  // 0-2, 3-5, 6-8, 9-12 => cry, pout, neutral, smile
  const emotions = ["cry", "pout", "neutral", "smile"];
  return emotions[happinessTier(h)];
}

function updateMainImage() {
  const emotion = emotionFromHappiness(happiness_state);
  const n = damageTier(damage_state);
  img.src = `images/${emotion} ${n}.jpg`;   // assumes images are in the same folder as the html/js
  img.alt = `${emotion} ${n}`;
}



const API_BASE = "https://bfsimulator-production.up.railway.app";

async function sendUserTurn(text) {
  chatHistory.push({ role: "user", content: text });
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
    if (!res.ok) {
      document.querySelector(".bubble-text").innerText = `Server error (${res.status})`;
      return;
    }

    const data = JSON.parse(raw);
    const reply = data.reply ?? "(no reply field)";
    document.querySelector(".bubble-text").innerText = reply;

    chatHistory.push({ role: "assistant", content: reply });
    if (currentStage() === "introduction") gameStageIndex = 1; // keep your existing behavior
    if (currentStage() === "gain punch") gameStageIndex = 3;
    if (currentStage() === "watch movie") {
      try {
        const movieLabel = await detectMovieChoice(text);
        if (movieLabel === "genre" || movieLabel === "title") {
          gameStageIndex = 4; // move to next stage (add kiss)
        }
      } catch {
        // fail silently
      }
    }
  } catch (err) {
    console.error(err);
    document.querySelector(".bubble-text").innerText = "Fetch failed (see console)";
  }
}


freeInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const text = freeInput.value.trim();
    if (!text) return;
    chatHistory.push({ role: "user", content: text });

    // evaluate sentiment (fast model)
    try {
      const evalRes = await fetch(`${API_BASE}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const evalData = await evalRes.json();
      applySentiment(evalData.label);
    } catch {
      // fail silently, keep state unchanged
    }

    freeInput.value = "";
    document.querySelector(".bubble-text").innerText = "…";
    
    if (currentStage() === "order food") {
      try {
        order_food_detected = await detectFoodOrder(text);
        if (order_food_detected) {
          gameStageIndex = 2;          // gain punch
          setSkillVisible("punch", true);
          setSkillVisible("kiss", false);
        }
      } catch {
        // fail silently
      }
}
    
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

async function detectFoodOrder(text) {
  const r = await fetch(`${API_BASE}/foodcheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });
  const j = await r.json();
  return j.label === "order";
}

async function detectMovieChoice(text) {
  const r = await fetch(`${API_BASE}/moviecheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text })
  });

  const j = await r.json();
  return j.label; 
  // expected: "genre", "title", or "none"
}

async function runIntro() {
  document.querySelector(".bubble-text").innerText = "…";
  updateMainImage();
  setSkillVisible("punch", false);
  setSkillVisible("kiss", false);
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "", // no user input yet
        persona: personaIntroduction(),
        history: []
      }),
    });

    const data = await res.json();
    const reply = data.reply ?? "";
    document.querySelector(".bubble-text").innerText = reply;

    chatHistory.push({ role: "assistant", content: reply });
  } catch {
    document.querySelector(".bubble-text").innerText = "…";
  }
}

runIntro();

const punchBtn = document.querySelector('.skill-btn[data-skill="punch"]');

if (punchBtn) {
  punchBtn.addEventListener("click", () => {
    punchModeActive = !punchModeActive;
    stage.classList.toggle("punch-mode", punchModeActive);
  });
}

img.addEventListener("click", () => {
  if (!punchModeActive) return;

  // stats first so personaForStage() sees updated state
  damage_state = Math.min(12, damage_state + punch_damage);
  happiness_state = Math.max(0, happiness_state + punch_happiness);
  updateMainImage();

  // real user turn
  sendUserTurn("[PUNCH]");
});