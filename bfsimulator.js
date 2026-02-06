//bf simulator, dating sim to the style of stardew valley

const stage = document.getElementById("stage");

const img = document.getElementById("bfImg");



const freeInput = document.getElementById("freeInput");

let lastUserInput = "";

const API_BASE = "bfsimulator-production.up.railway.app";

freeInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const text = freeInput.value.trim();
    if (!text) return;

    freeInput.value = "";

    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();
    document.querySelector(".bubble-text").innerText = data.reply;
  }
});
