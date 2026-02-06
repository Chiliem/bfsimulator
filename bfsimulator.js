//bf simulator, dating sim to the style of stardew valley

const stage = document.getElementById("stage");

const img = document.getElementById("bfImg");



const freeInput = document.getElementById("freeInput");

let lastUserInput = "";

const API_BASE = "https://bfsimulator-production.up.railway.app";

freeInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    const text = freeInput.value.trim();
    if (!text) return;

    freeInput.value = "";
    document.querySelector(".bubble-text").innerText = "…";

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
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
      document.querySelector(".bubble-text").innerText =
        data.reply ?? "(no reply field)";
    } catch (err) {
      console.error(err);
      document.querySelector(".bubble-text").innerText =
        "Fetch failed (see console)";
    }
  }
});

