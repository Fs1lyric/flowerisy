const DURATIONS = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const STORAGE_KEY = "flowerisy-v1";
const CIRCUMFERENCE = 2 * Math.PI * 96;

const els = {
  time: document.getElementById("time-display"),
  modeLabel: document.getElementById("mode-label"),
  activeTask: document.getElementById("active-task"),
  toggle: document.getElementById("toggle-btn"),
  reset: document.getElementById("reset-btn"),
  skip: document.getElementById("skip-btn"),
  status: document.getElementById("status"),
  blooms: document.getElementById("bloom-count"),
  form: document.getElementById("task-form"),
  input: document.getElementById("task-input"),
  list: document.getElementById("task-list"),
  listPanel: document.querySelector(".list-panel"),
  listMeta: document.getElementById("list-meta"),
  notify: document.getElementById("notify-btn"),
  theme: document.getElementById("theme-btn"),
  install: document.getElementById("install-btn"),
  progress: document.querySelector(".ring-progress"),
};

const state = loadState();
let intervalId = null;

els.progress.style.strokeDasharray = String(CIRCUMFERENCE);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState() {
  const fallback = {
    mode: "focus",
    remaining: DURATIONS.focus,
    running: false,
    blooms: 0,
    bloomDay: todayKey(),
    tasks: [],
    activeTaskId: null,
    alerts: false,
    theme: "system",
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function saveState() {
  const snapshot = {
    mode: state.mode,
    remaining: state.remaining,
    running: false,
    blooms: state.blooms,
    bloomDay: state.bloomDay,
    tasks: state.tasks,
    activeTaskId: state.activeTaskId,
    alerts: state.alerts,
    theme: state.theme,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function applyTheme() {
  if (state.theme === "system") {
    document.documentElement.removeAttribute("data-theme");
    els.theme.textContent = "Theme";
    return;
  }
  document.documentElement.setAttribute("data-theme", state.theme);
  els.theme.textContent = state.theme === "dark" ? "Light" : "Dark";
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function modeName(mode) {
  if (mode === "short") return "Short break";
  if (mode === "long") return "Long break";
  return "Focus";
}

function setStatus(text) {
  els.status.textContent = text;
}

function renderTimer() {
  if (state.bloomDay !== todayKey()) {
    state.blooms = 0;
    state.bloomDay = todayKey();
  }
  els.time.textContent = formatTime(state.remaining);
  els.modeLabel.textContent = modeName(state.mode);
  els.toggle.textContent = state.running ? "Pause" : "Start";
  els.blooms.textContent = String(state.blooms);
  const total = DURATIONS[state.mode];
  const offset = CIRCUMFERENCE * (1 - state.remaining / total);
  els.progress.style.strokeDashoffset = String(offset);
  document.querySelectorAll(".mode").forEach((btn) => {
    const on = btn.dataset.mode === state.mode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-selected", String(on));
  });
  const active = state.tasks.find((t) => t.id === state.activeTaskId);
  els.activeTask.textContent = active && !active.done ? active.title : "No task selected";
}

function renderTasks() {
  const open = state.tasks.filter((t) => !t.done).length;
  els.listMeta.textContent = `${open} open`;
  els.listPanel.classList.toggle("is-empty", state.tasks.length === 0);
  els.list.replaceChildren(
    ...state.tasks.map((task) => {
      const li = document.createElement("li");
      li.className = "task-row";
      if (task.done) li.classList.add("is-done");
      if (task.id === state.activeTaskId) li.classList.add("is-active");

      const check = document.createElement("button");
      check.type = "button";
      check.className = "icon-btn";
      check.setAttribute("aria-label", task.done ? "Mark incomplete" : "Mark complete");
      check.textContent = task.done ? "Undo" : "Done";
      check.addEventListener("click", () => toggleDone(task.id));

      const titleWrap = document.createElement("div");
      titleWrap.className = "task-title";
      const select = document.createElement("button");
      select.type = "button";
      select.textContent = task.title;
      select.addEventListener("click", () => setActiveTask(task.id));
      titleWrap.append(select);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-btn";
      remove.setAttribute("aria-label", `Delete ${task.title}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => deleteTask(task.id));

      li.append(check, titleWrap, remove);
      return li;
    })
  );
}

function tick() {
  if (!state.running) return;
  state.remaining -= 1;
  if (state.remaining <= 0) {
    completeSession();
  }
  renderTimer();
}

function startTimer() {
  if (state.running) return;
  state.running = true;
  intervalId = setInterval(tick, 1000);
  setStatus("In session. Space pauses.");
  renderTimer();
}

function pauseTimer() {
  state.running = false;
  clearInterval(intervalId);
  intervalId = null;
  setStatus("Paused. Space continues.");
  renderTimer();
  saveState();
}

function resetTimer() {
  pauseTimer();
  state.remaining = DURATIONS[state.mode];
  setStatus("Reset. Ready when you are.");
  renderTimer();
  saveState();
}

function nextMode() {
  if (state.mode === "focus") {
    return state.blooms > 0 && state.blooms % 4 === 0 ? "long" : "short";
  }
  return "focus";
}

function completeSession({ count = true } = {}) {
  pauseTimer();
  const finished = state.mode;
  if (count && finished === "focus") {
    state.blooms += 1;
  }
  chime();
  notify(`${modeName(finished)} finished`);
  const upcoming = nextMode();
  setMode(upcoming, `${modeName(finished)} is done. ${modeName(upcoming)} is next.`);
}

function setMode(mode, message) {
  state.mode = mode;
  state.remaining = DURATIONS[mode];
  pauseTimer();
  setStatus(message || `${modeName(mode)} loaded.`);
  renderTimer();
  saveState();
}

function skipSession() {
  completeSession({ count: false });
}

function addTask(title) {
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    done: false,
  });
  if (!state.activeTaskId) state.activeTaskId = state.tasks[0].id;
  renderTasks();
  renderTimer();
  saveState();
}

function toggleDone(id) {
  state.tasks = state.tasks.map((task) =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  renderTasks();
  renderTimer();
  saveState();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  if (state.activeTaskId === id) state.activeTaskId = null;
  renderTasks();
  renderTimer();
  saveState();
}

function setActiveTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task || task.done) return;
  state.activeTaskId = id;
  renderTasks();
  renderTimer();
  saveState();
}

function chime() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 528;
  gain.gain.value = 0.04;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

async function enableAlerts() {
  if (!("Notification" in window)) {
    setStatus("This browser has no notification API.");
    return;
  }
  const permission = await Notification.requestPermission();
  state.alerts = permission === "granted";
  els.notify.textContent = state.alerts ? "Alerts on" : "Alerts off";
  els.notify.setAttribute("aria-pressed", String(state.alerts));
  saveState();
}

function notify(body) {
  if (!state.alerts || Notification.permission !== "granted") return;
  new Notification("Flowerisy", { body });
}

document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

els.toggle.addEventListener("click", () => {
  if (state.running) pauseTimer();
  else startTimer();
});
els.reset.addEventListener("click", resetTimer);
els.skip.addEventListener("click", skipSession);
els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = els.input.value.trim();
  if (!title) return;
  addTask(title);
  els.input.value = "";
  els.input.focus();
});
els.notify.addEventListener("click", enableAlerts);
els.theme.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : state.theme === "dark" ? "system" : "light";
  applyTheme();
  saveState();
});
document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  event.preventDefault();
  if (state.running) pauseTimer();
  else startTimer();
});

if (state.bloomDay !== todayKey()) {
  state.blooms = 0;
  state.bloomDay = todayKey();
}
applyTheme();
els.notify.textContent = state.alerts ? "Alerts on" : "Alerts off";
els.notify.setAttribute("aria-pressed", String(state.alerts));
renderTimer();
renderTasks();
saveState();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  els.install.hidden = false;
});
els.install.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  els.install.hidden = true;
});
window.addEventListener("appinstalled", () => {
  els.install.hidden = true;
  setStatus("Installed. Open Flowerisy from your app list.");
});
