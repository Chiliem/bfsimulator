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

Core vibe applies ONLY when happiness is neutral or smiling.
If happiness is crying or pouting, override the core vibe completely.

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
let kissModeActive = false;

let pendingMovieLabel = "none"; // "genre" | "title" | "none"
let pendingMovieText = "";

let punchUnlocked = false;
let kissUnlocked = false;

let leaguePickMade = false;
let leaguePickText = "";
let favoritePartAnswered = false;
let flowersArmed = false;   // first turn in flowers: let chat happen
let finaleActive = false;   // second turn in flowers: lock UI + show flowers.jpg

let punchCount = 0;
let kissCount = 0;

function syncSkillUnlocks() {
  // If we ever pass food (stage index >= 2), punch is unlocked forever
  if (gameStageIndex >= 2) punchUnlocked = true;

  // If we ever pass movie (stage index >= 4), kiss is unlocked forever
  if (gameStageIndex >= 4) kissUnlocked = true;

  setSkillVisible("punch", punchUnlocked);
  setSkillVisible("kiss", kissUnlocked);
}

function currentStage() {
  return game_stage[gameStageIndex] ?? "introduction";
}

function setStageIndex(i) {
  console.log("STAGE ->", game_stage[i]);
  gameStageIndex = i;
  syncSkillUnlocks();
}

function stateBlock() {
  return `game_stage: ${currentStage()}
happiness_state: ${happiness_state}/12 (${happinessLabel(happiness_state)})
damage_state: ${damage_state}/12 (${damageLabel(damage_state)})
order_food_detected: ${order_food_detected}

Behavior rules (DO NOT reveal numbers):

HAPPINESS TONE RULES:
- crying: minimal warmth, sharp or fragile, 1 short line only.
- pouting: annoyed, clipped wording, slightly defensive.
- neutral: baseline playful.
- smiling: openly affectionate, soft teasing.

DAMAGE REACTION RULES:
- not damaged: normal speech.
- a bit bruised: occasional wince words ("mm", "ugh").
- very bruised: breathy, shorter sentences, more pauses.
- really bruised up: fragmented speech, struggle to finish thoughts.

If damage >= 8:
- MUST start the reply with a physical reaction (ex: "—ugh", "ah—", "mmph").
- reduce sentence length.
- show physical strain before emotion.

Affection MUST scale with happiness.
At 0 happiness, affection is faint or strained.

LENGTH:
- 1–2 lines only.
- If damage >= 8 → max 15 words.
- If happiness <= 2 → max 18 words.
- Otherwise → max 25 words.
- Never write paragraphs. Never explain. No narration.
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
      return personaAddKiss();

    case "play league":
      return personaPlayLeague();

    case "favorite part of date night":
      return personaFavoritePart();

    case "flowers":
      return personaFlowers();


    default:
      throw new Error(`Unknown stage: ${currentStage()}`);
  }
}

function personaIntroduction() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Greet the user. Welcome to virtual date night. Write "VIRTUAL DATE NIGHT" in caps.
Your tone and warmth should be influenced by the internal stats, but never mention or reveal them.
`;
}

function personaOrderFood() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let your tone, warmth, and energy be influenced by the internal stats, but never mention or reveal them.
Say you'll order more. The words "ORDER FOOD" are in caps.
If food is already ordered offer to order more.
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



function personaWatchMovie() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let tone reflect internal stats.
Ask what movie genre we should watch
The words "MOVIE" should be in caps.
Stay short.
`;
}

function personaAddKiss() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let your tone, warmth, and energy be influenced by the internal stats, but never mention or reveal them.
Mention that a new button just appeared, and that you have no idea what it does.
Do not end with questions.
`;
}

function personaPlayLeague() {
  const leagueLine = leaguePickMade
    ? `The user chose: "${leaguePickText}". React to their pick and start the match. Do NOT ask what champ they want.`
    : `Ask what character (champ) they want to play.`;

  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let tone reflect internal stats.
Tell the user that you booted up League of Legends. The words PLAY LEAGUE should be in caps.
${leagueLine}
Be playful, short, and in-the-moment.
Do not end with questions.
`;
}

function personaFavoritePart() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let tone reflect internal stats.
ask "what is your FAVORITE PART OF VIRTUAL DATE NIGHT".
The words "FAVORITE PART OF VIRTUAL DATE NIGHT" should be in caps.
Do not end with questions.
`;
}

function personaFlowers() {
  return `${PERSONA_PROMPT}

${stateBlock()}

Reply to the user message.
Let tone reflect internal stats.
Say that you got the user flowers for ST VALENTINE'S. The words FLOWERS should be in caps.
Do not end with questions.
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

async function advanceStageOnTurn(text) {
  // Rule: if we're in the kissing stage, ANY user turn goes to next stage immediately
  if (currentStage() === "add kiss") {
    leaguePickMade = false;
    leaguePickText = "";
    setStageIndex(5);
    return;
  }

  // Play League: after user picks a champ, stay here 1 more user turn, then move on
  if (currentStage() === "play league" && text !== "[PUNCH]" && text !== "[KISS]") {
    if (!leaguePickMade) {
      leaguePickMade = true;
      leaguePickText = text;   // store whatever they typed as the pick
      return;                  // stay in play league for this turn
    } else {
      setStageIndex(6);        // "favorite part of date night"
      return;
    }
  }

  // Favorite Part: stay one extra turn before moving to flowers
  if (currentStage() === "favorite part of date night" && text !== "[PUNCH]" && text !== "[KISS]") {
    if (!favoritePartAnswered) {
      favoritePartAnswered = true;
      return; // stay in favorite part for this turn
    } else {
      favoritePartAnswered = false; // reset for future playthrough
      setStageIndex(7); // "flowers"
      return;
    }
  }

  // Flowers: allow 1 extra turn of chat, then show finale image + lock UI
  if (currentStage() === "flowers" && text !== "[PUNCH]" && text !== "[KISS]") {
    if (!flowersArmed) {
      flowersArmed = true;
      return; // stay in flowers for this turn
    } else {
      triggerFlowersFinale();
      return;
    }
  }

  // Intro -> Order food (one-time progression)
  if (currentStage() === "introduction") {
    setStageIndex(1);
    return;
  }

  // If we detect food order during "order food", unlock punch and move on
  if (currentStage() === "order food" && text !== "[PUNCH]" && text !== "[KISS]") {
    try {
      order_food_detected = await detectFoodOrder(text);
      if (order_food_detected) {
        setStageIndex(2); // "gain punch"
      }
    } catch {}
  }

  // If we detect a movie choice during "watch movie", unlock kiss and move on
  if (currentStage() === "watch movie" && text !== "[PUNCH]" && text !== "[KISS]") {
    try {
      const lbl = await detectMovieChoice(text);
      if (lbl === "genre" || lbl === "title") {
        pendingMovieLabel = lbl;
        pendingMovieText = text;
        setStageIndex(4); // "add kiss"
      }
    } catch {}
  }
}

function postTurnStageBumps() {
  // Keep your simple linear bumps (if you still want them)
  if (currentStage() === "gain punch") {
    // After he reacts to "new button", continue the date
    setStageIndex(3); // "watch movie"
  }
}

function triggerFlowersFinale() {
  finaleActive = true;

  // Stop modes
  punchModeActive = false;
  kissModeActive = false;
  stage.classList.remove("punch-mode");
  stage.classList.remove("kiss-mode");

  // Hide bubble + controls
  const bubble = document.querySelector(".speech-bubble");
  if (bubble) bubble.style.display = "none";

  // Disable input
  freeInput.disabled = true;

  // Hide skill buttons (they're <img> tags)
  document.querySelectorAll(".skill-btn").forEach((btn) => {
    btn.classList.add("disabled");
    btn.style.pointerEvents = "none";
  });

  // Show flowers image centered
  img.src = "./images/flowers.jpg";
  img.alt = "flowers";
  setTimeout(showFinaleTextBox, 5000);
}

function showFinaleTextBox() {
  // prevent duplicates
  if (document.getElementById("finaleBox")) return;

  const box = document.createElement("div");
  box.id = "finaleBox";
  box.style.position = "fixed";
  box.style.left = "50%";
  box.style.top = "50%";
  box.style.transform = "translate(-50%, -50%)";
  box.style.background = "rgba(255,255,255,0.95)";
  box.style.border = "2px solid #000";
  box.style.borderRadius = "6px";
  box.style.padding = "18px 22px";
  box.style.maxWidth = "720px";
  box.style.textAlign = "center";
  box.style.fontFamily = `"Trebuchet MS","Verdana","Tahoma","Arial",sans-serif`;
  box.style.fontSize = "22px";
  box.style.lineHeight = "1.25";
  box.style.zIndex = "9999";

  box.innerHTML = `
    <div style="font-size:28px; margin-bottom:10px;">Happy St-Valentines Day BBNOMNOM</div>
    <div style="margin-bottom:14px;">Thank you for playing the BF Simulator. I love you!</div>
    <div style="font-size:20px;">
      Punches given: <b>${punchCount}</b> &nbsp; | &nbsp; Kisses given: <b>${kissCount}</b>
    </div>
  `;

  document.body.appendChild(box);
}

const API_BASE = "https://bfsimulator-production.up.railway.app";

async function handleUserTurn(text) {
  // Always record the user turn exactly once
  chatHistory.push({ role: "user", content: text });

  // Exit modes on any typed message (but allow skill tags to work)
  if (text !== "[PUNCH]" && punchModeActive) {
    punchModeActive = false;
    stage.classList.remove("punch-mode");
  }
  if (text !== "[KISS]" && kissModeActive) {
    kissModeActive = false;
    stage.classList.remove("kiss-mode");
  }

  // Fast sentiment (don’t block the main chat if it fails)
  if (text !== "[PUNCH]" && text !== "[KISS]") {
    try {
      const evalRes = await fetch(`${API_BASE}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const evalData = await evalRes.json();
      applySentiment(evalData.label);
    } catch {}
  }


  // Advance/skip stages BEFORE generating persona (so persona matches the new stage)
  await advanceStageOnTurn(text);
  if (finaleActive) return; //stops api calls after finale is triggered
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

    // Post-turn linear progression steps (kept, but centralized)
    postTurnStageBumps();
  } catch (err) {
    console.error(err);
    document.querySelector(".bubble-text").innerText = "Fetch failed (see console)";
  }
}



freeInput.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();

  const text = freeInput.value.trim();
  if (!text) return;

  freeInput.value = "";
  await handleUserTurn(text);
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
  syncSkillUnlocks();
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

    // Leave kiss mode
    kissModeActive = false;
    stage.classList.remove("kiss-mode");

    // Activate punch mode
    punchModeActive = true;
    stage.classList.add("punch-mode");

  });
}

img.addEventListener("click", () => {
  if (finaleActive) return;

  if (punchModeActive) {
    damage_state = Math.min(12, damage_state + punch_damage);
    happiness_state = Math.max(0, happiness_state + punch_happiness);
    punchCount++;
    updateMainImage();
    handleUserTurn("[PUNCH]");
    return;
  }

  if (kissModeActive) {
    damage_state = Math.min(12, damage_state + kiss_damage);
    happiness_state = Math.min(12, happiness_state + kiss_happiness);
    kissCount++;
    updateMainImage();
    handleUserTurn("[KISS]");
    return;
  }
});


const kissBtn = document.querySelector('.skill-btn[data-skill="kiss"]');

if (kissBtn) {
  kissBtn.addEventListener("click", () => {

    // Leave punch mode
    punchModeActive = false;
    stage.classList.remove("punch-mode");

    // Activate kiss mode
    kissModeActive = true;
    stage.classList.add("kiss-mode");

  });
}