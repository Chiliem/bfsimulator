//bf simulator, dating sim to the style of stardew valley

const stage = document.getElementById("stage");

const img = document.getElementById("bfImg");



const freeInput = document.getElementById("freeInput");

let lastUserInput = "";

freeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();

    lastUserInput = freeInput.value.trim();
    if (!lastUserInput) return;

    console.log("User submitted:", lastUserInput);

    freeInput.value = ""; // clear after send
  }
});