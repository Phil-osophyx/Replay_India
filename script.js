const screens = [...document.querySelectorAll(".screen")];
const navDots = [...document.querySelectorAll(".nav-dots button")];
const appShell = document.querySelector(".app-shell");
const previousButton = document.getElementById("prevScreen");
const nextButton = document.getElementById("nextScreen");
let currentScreen = -1;
let touchStartX = 0;
let touchStartY = 0;

const storedState = JSON.parse(localStorage.getItem("replayJourneyState"));
const state = storedState || {
  score: 0,
  oldGames: [],
  fieldPlayed: false,
  futurePlayed: false,
  pledged: false
};

function saveState() {
  localStorage.setItem("replayJourneyState", JSON.stringify(state));
}

function goToScreen(index) {
  const nextIndex = Math.max(0, Math.min(screens.length - 1, index));
  if (nextIndex === currentScreen && screens[nextIndex].classList.contains("active")) return;
  screens.forEach((screen, screenIndex) => {
    screen.classList.remove("active", "exit-left");
    if (screenIndex < nextIndex) screen.classList.add("exit-left");
  });
  screens[nextIndex].classList.add("active");
  currentScreen = nextIndex;
  navDots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === nextIndex));
  document.getElementById("chapterNumber").textContent = String(nextIndex + 1).padStart(2, "0");
  document.getElementById("chapterName").textContent = screens[nextIndex].dataset.title;
  previousButton.disabled = nextIndex === 0;
  nextButton.disabled = nextIndex === screens.length - 1;
  appShell.classList.toggle("dark-ui", nextIndex === 1 || nextIndex === 4);
  updateLegacy();
}

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => goToScreen(Number(button.dataset.go)));
});

document.querySelectorAll("[data-next]").forEach(button => {
  button.addEventListener("click", () => goToScreen(currentScreen + 1));
});

previousButton.addEventListener("click", () => goToScreen(currentScreen - 1));
nextButton.addEventListener("click", () => goToScreen(currentScreen + 1));

document.addEventListener("keydown", event => {
  if (event.target.matches("input, button")) return;
  if (event.key === "ArrowRight") goToScreen(currentScreen + 1);
  if (event.key === "ArrowLeft") goToScreen(currentScreen - 1);
});

document.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", event => {
  const changeX = event.changedTouches[0].clientX - touchStartX;
  const changeY = event.changedTouches[0].clientY - touchStartY;
  if (Math.abs(changeX) > 65 && Math.abs(changeX) > Math.abs(changeY) * 1.3) {
    goToScreen(currentScreen + (changeX < 0 ? 1 : -1));
  }
}, { passive: true });

let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");
  document.getElementById("toastText").textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function addPoints(points, message) {
  state.score += points;
  saveState();
  updateLegacy();
  showToast(`+${points} · ${message}`);
}

function rememberOldGame(game) {
  if (!state.oldGames.includes(game)) {
    state.oldGames.push(game);
    saveState();
  }
  updateLegacy();
}

const oldGameData = {
  gilli: {
    region: "Across India",
    label: "Timing challenge",
    instruction: "Tap when the marker crosses the centre",
    action: "Strike"
  },
  lattoo: {
    region: "Rajasthan · Gujarat",
    label: "Spin challenge",
    instruction: "Give the wooden top a powerful spin",
    action: "Spin"
  },
  stapoo: {
    region: "North India",
    label: "Balance challenge",
    instruction: "Start, then tap the glowing squares in order",
    action: "Start"
  },
  lagori: {
    region: "Karnataka · Maharashtra",
    label: "Aim challenge",
    instruction: "Throw the ball and scatter all seven stones",
    action: "Throw"
  }
};

let activeOldGame = "gilli";
let gilliPosition = 0;
let gilliDirection = 1;
let oldActionLocked = false;
let hopNumber = 0;

function selectOldGame(game) {
  activeOldGame = game;
  const data = oldGameData[game];
  document.querySelectorAll(".game-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.oldGame === game));
  document.querySelectorAll(".old-scene").forEach(scene => scene.classList.toggle("active", scene.dataset.scene === game));
  document.getElementById("oldRegion").textContent = data.region;
  document.getElementById("oldInstructionLabel").textContent = data.label;
  document.getElementById("oldInstruction").textContent = data.instruction;
  document.getElementById("oldAction").innerHTML = `${data.action} <span class="icon-arrow-up" aria-hidden="true"></span>`;
  document.getElementById("oldRound").textContent = "Ready";
  oldActionLocked = false;
  resetHopGrid();
}

document.querySelectorAll(".game-tab").forEach(tab => {
  tab.addEventListener("click", () => selectOldGame(tab.dataset.oldGame));
});

function moveGilliMarker() {
  gilliPosition += 1.15 * gilliDirection;
  if (gilliPosition >= 100 || gilliPosition <= 0) gilliDirection *= -1;
  gilliPosition = Math.max(0, Math.min(100, gilliPosition));
  document.getElementById("gilliMarker").style.left = `${gilliPosition}%`;
  requestAnimationFrame(moveGilliMarker);
}

function showOldMessage(message) {
  const element = document.getElementById("oldMessage");
  element.textContent = message;
  element.classList.add("show");
  setTimeout(() => element.classList.remove("show"), 1100);
}

function playGilli() {
  const accuracy = Math.max(0, 1 - Math.abs(50 - gilliPosition) / 50);
  const points = Math.round(10 + accuracy * 40);
  const message = accuracy > .82 ? "Perfect strike!" : accuracy > .55 ? "Strong hit!" : "Keep your eye on it!";
  const flight = document.getElementById("gilliFlight");
  const stick = document.getElementById("gilliStick");
  flight.classList.add("fly");
  stick.classList.add("swing");
  showOldMessage(`${message} +${points}`);
  document.getElementById("oldRound").textContent = `${points} points`;
  addPoints(points, "Gilli-Danda played");
  rememberOldGame("gilli");
  setTimeout(() => {
    flight.classList.remove("fly");
    stick.classList.remove("swing");
    oldActionLocked = false;
  }, 950);
}

function playLattoo() {
  const lattoo = document.getElementById("lattoo");
  lattoo.classList.add("spinning");
  document.getElementById("oldRound").textContent = "3.4 sec spin";
  showOldMessage("Beautiful balance! +30");
  addPoints(30, "Lattoo spun");
  rememberOldGame("lattoo");
  setTimeout(() => {
    lattoo.classList.remove("spinning");
    oldActionLocked = false;
  }, 1600);
}

function resetHopGrid() {
  hopNumber = 0;
  document.querySelectorAll("[data-hop]").forEach(tile => tile.classList.remove("next-hop", "hopped"));
}

function startStapoo() {
  resetHopGrid();
  hopNumber = 1;
  document.querySelector('[data-hop="1"]').classList.add("next-hop");
  document.getElementById("oldRound").textContent = "Hop 1 of 7";
  document.getElementById("oldAction").innerHTML = 'Restart <span class="icon-refresh" aria-hidden="true"></span>';
  oldActionLocked = false;
}

document.querySelectorAll("[data-hop]").forEach(tile => {
  tile.addEventListener("click", () => {
    if (activeOldGame !== "stapoo" || Number(tile.dataset.hop) !== hopNumber) return;
    tile.classList.remove("next-hop");
    tile.classList.add("hopped");
    hopNumber += 1;
    if (hopNumber <= 7) {
      document.querySelector(`[data-hop="${hopNumber}"]`).classList.add("next-hop");
      document.getElementById("oldRound").textContent = `Hop ${hopNumber} of 7`;
    } else {
      document.getElementById("oldRound").textContent = "Course clear";
      showOldMessage("Perfect balance! +50");
      addPoints(50, "Stapoo cleared");
      rememberOldGame("stapoo");
      hopNumber = 0;
    }
  });
});

function playLagori() {
  const ball = document.getElementById("throwBall");
  const stack = document.getElementById("stoneStack");
  ball.classList.add("throw");
  setTimeout(() => stack.classList.add("hit"), 430);
  document.getElementById("oldRound").textContent = "7 stones down";
  showOldMessage("Direct hit! +40");
  addPoints(40, "Lagori stack hit");
  rememberOldGame("lagori");
  setTimeout(() => {
    ball.classList.remove("throw");
    stack.classList.remove("hit");
    oldActionLocked = false;
  }, 1400);
}

document.getElementById("oldAction").addEventListener("click", () => {
  if (oldActionLocked && activeOldGame !== "stapoo") return;
  oldActionLocked = true;
  if (activeOldGame === "gilli") playGilli();
  if (activeOldGame === "lattoo") playLattoo();
  if (activeOldGame === "stapoo") startStapoo();
  if (activeOldGame === "lagori") playLagori();
});

const fieldData = {
  cricket: { action: "Play shot", className: "cricket-ball", success: "Perfect cover drive!", miss: "Stopped at the boundary" },
  football: { action: "Take shot", className: "football-ball", success: "Top corner goal!", miss: "Just past the post" },
  hockey: { action: "Flick ball", className: "hockey-ball", success: "Clean finish!", miss: "Saved by the keeper" }
};

let activeField = "cricket";
let targetPosition = 72;
let fieldTotal = 0;
let fieldLocked = false;
const aimSlider = document.getElementById("aimSlider");
const fieldBall = document.getElementById("fieldBall");

function setField(game) {
  activeField = game;
  const data = fieldData[game];
  document.querySelectorAll("[data-field]").forEach(button => button.classList.toggle("active", button.dataset.field === game));
  fieldBall.className = `field-ball ${data.className}`;
  document.getElementById("fieldAction").innerHTML = `${data.action} <span class="icon-ball" aria-hidden="true"></span>`;
  document.getElementById("fieldResult").classList.remove("show");
  aimSlider.value = 50;
  updateAim();
  randomTarget();
}

function updateAim() {
  const angle = -52 + Number(aimSlider.value) * 1.04;
  document.getElementById("aimArrow").style.setProperty("--aim-angle", `${angle}deg`);
}

function randomTarget() {
  targetPosition = 18 + Math.round(Math.random() * 62);
  document.getElementById("targetRing").style.left = `${targetPosition}%`;
}

document.querySelectorAll("[data-field]").forEach(button => {
  button.addEventListener("click", () => setField(button.dataset.field));
});

aimSlider.addEventListener("input", updateAim);

document.getElementById("fieldAction").addEventListener("click", () => {
  if (fieldLocked) return;
  fieldLocked = true;
  const aim = 15 + Number(aimSlider.value) * .7;
  const difference = Math.abs(aim - targetPosition);
  const success = difference < 9;
  const points = success ? 35 : difference < 18 ? 15 : 5;
  const result = document.getElementById("fieldResult");
  fieldBall.style.setProperty("--shot-x", `${aim}%`);
  fieldBall.classList.add("shot");
  result.textContent = success ? fieldData[activeField].success : fieldData[activeField].miss;
  result.classList.add("show");
  fieldTotal += points;
  document.getElementById("fieldScore").textContent = String(fieldTotal).padStart(2, "0");
  if (!state.fieldPlayed) {
    state.fieldPlayed = true;
    saveState();
  }
  addPoints(points, `${activeField} challenge`);
  setTimeout(() => {
    fieldBall.classList.remove("shot");
    result.classList.remove("show");
    randomTarget();
    fieldLocked = false;
  }, 1200);
});

const futureGames = [
  { name: "Gilli Galaxy", type: "HERITAGE ARCADE", text: "Launch the gilli through a neon galaxy with perfect timing.", colors: ["#513ee0", "#1b1d48"] },
  { name: "Stapoo Beat", type: "RHYTHM EDITION", text: "Hop through glowing beats without breaking the rhythm.", colors: ["#d63778", "#371b55"] },
  { name: "Street 22", type: "NEXT-GEN CRICKET", text: "Build your street team and own a city of rooftop pitches.", colors: ["#168b72", "#172d45"] },
  { name: "Lagori Arena", type: "TACTICAL TEAM PLAY", text: "Build, defend and strike in a futuristic seven-stone arena.", colors: ["#c6622d", "#402044"] }
];

let activeFuture = 0;
let portalAngle = 0;
let portalSpeed = 2.3;

function selectFuture(index) {
  activeFuture = index;
  const game = futureGames[index];
  document.querySelectorAll("[data-future]").forEach((button, buttonIndex) => button.classList.toggle("active", buttonIndex === index));
  document.getElementById("futureType").textContent = game.type;
  document.getElementById("futureName").innerHTML = game.name.replace(" ", "<br>");
  document.getElementById("futureText").textContent = game.text;
  document.getElementById("consoleFeature").style.background = `linear-gradient(115deg, ${game.colors[0]}, ${game.colors[1]})`;
}

document.querySelectorAll("[data-future]").forEach(button => {
  button.addEventListener("click", () => selectFuture(Number(button.dataset.future)));
});

function animatePortal() {
  portalAngle = (portalAngle + portalSpeed) % 360;
  document.getElementById("portalTarget").style.transform = `rotate(${portalAngle}deg)`;
  requestAnimationFrame(animatePortal);
}

document.getElementById("launchFuture").addEventListener("click", () => {
  const game = futureGames[activeFuture];
  document.getElementById("overlayTitle").textContent = game.name;
  document.getElementById("overlayMessage").textContent = "Tap when the light reaches the top of the portal.";
  document.getElementById("gameOverlay").classList.add("open");
  document.getElementById("gameOverlay").setAttribute("aria-hidden", "false");
  if (!state.futurePlayed) {
    state.futurePlayed = true;
    addPoints(40, "Future arcade launched");
  }
});

function closeOverlay() {
  document.getElementById("gameOverlay").classList.remove("open");
  document.getElementById("gameOverlay").setAttribute("aria-hidden", "true");
}

document.getElementById("closeOverlay").addEventListener("click", closeOverlay);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeOverlay();
});

document.getElementById("portalButton").addEventListener("click", () => {
  const distance = Math.min(portalAngle, 360 - portalAngle);
  const points = distance < 20 ? 50 : distance < 60 ? 25 : 10;
  document.getElementById("overlayMessage").textContent = distance < 20 ? `Perfect sync! +${points} points` : `Portal hit! +${points} points`;
  portalSpeed = 2.3 + Math.random() * 1.8;
  addPoints(points, "Arcade portal hit");
});

document.getElementById("pledgeButton").addEventListener("click", () => {
  if (state.pledged) return;
  state.pledged = true;
  document.getElementById("pledgeText").textContent = "Pledge taken. One game. One friend. One tradition forward.";
  document.getElementById("pledgeButton").innerHTML = 'Pledged <span class="icon-check" aria-hidden="true"></span>';
  addPoints(50, "RePlay pledge taken");
});

function updateLegacy() {
  const badges = {
    memory: state.oldGames.length >= 2,
    field: state.fieldPlayed,
    future: state.futurePlayed
  };
  document.getElementById("totalScore").textContent = state.score;
  document.getElementById("legacyScore").textContent = state.score;
  document.querySelectorAll("[data-badge]").forEach(badge => badge.classList.toggle("unlocked", badges[badge.dataset.badge]));
  const completeParts = Object.values(badges).filter(Boolean).length + (state.pledged ? 1 : 0);
  const percent = completeParts * 25;
  document.getElementById("legacyPercent").textContent = `${percent}%`;
  document.getElementById("legacyFill").style.width = `${percent}%`;
  if (state.pledged) {
    document.getElementById("pledgeText").textContent = "Pledge taken. One game. One friend. One tradition forward.";
    document.getElementById("pledgeButton").innerHTML = 'Pledged <span class="icon-check" aria-hidden="true"></span>';
  }
}

function updateClock() {
  const now = new Date();
  document.getElementById("consoleTime").textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

goToScreen(0);
selectOldGame("gilli");
setField("cricket");
selectFuture(0);
updateLegacy();
updateClock();
moveGilliMarker();
animatePortal();
setInterval(updateClock, 30000);
