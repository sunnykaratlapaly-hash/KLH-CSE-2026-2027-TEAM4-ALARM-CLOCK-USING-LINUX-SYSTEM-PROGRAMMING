const alarms = [];
let alarmId = 1;

const currentTimeEl = document.getElementById("currentTime");
const currentDateEl = document.getElementById("currentDate");
const alarmTimeEl = document.getElementById("alarmTime");
const alarmNameEl = document.getElementById("alarmName");
const alarmListEl = document.getElementById("alarmList");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const notificationEl = document.getElementById("notification");
const notificationTextEl = document.getElementById("notificationText");

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", { hour12: false });
}

function getDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

// Module 2: System Time
function updateClock() {
  currentTimeEl.textContent = getTime();
  currentDateEl.textContent = getDate();
  checkAlarms();
}

setInterval(updateClock, 1000);
updateClock();

// Module 7: Testing & Documentation
function addLog(message) {
  const p = document.createElement("p");
  p.textContent = `[${new Date().toLocaleTimeString("en-IN")}] ${message}`;
  logEl.prepend(p);
}

// Module 1 + Module 3: User Input and Alarm Scheduling
document.getElementById("setAlarmBtn").addEventListener("click", () => {
  const time = alarmTimeEl.value;
  const name = alarmNameEl.value.trim() || "Alarm";

  if (!time) {
    statusEl.textContent = "Please select an alarm time.";
    return;
  }

  const alarm = {
    id: alarmId++,
    time: time,
    name: name,
    active: true,
    lastTriggered: null
  };

  alarms.push(alarm);
  renderAlarms();

  statusEl.textContent = `Alarm "${name}" scheduled for ${time}.`;
  addLog(`Alarm scheduled: ${name} at ${time}`);

  alarmTimeEl.value = "";
  alarmNameEl.value = "";
});

// Display alarms
function renderAlarms() {
  if (alarms.length === 0) {
    alarmListEl.innerHTML = '<p class="empty">No alarms yet.</p>';
    return;
  }

  alarmListEl.innerHTML = "";

  alarms.forEach(alarm => {
    const div = document.createElement("div");
    div.className = "alarm";

    div.innerHTML = `
      <div class="alarm-info">
        <strong>${escapeHtml(alarm.name)}</strong>
        <span>${alarm.time} • ${alarm.active ? "Active" : "Completed"}</span>
        <small>Alarm ID: ${alarm.id}</small>
      </div>
      <button class="delete-btn" onclick="deleteAlarm(${alarm.id})">Delete</button>
    `;

    alarmListEl.appendChild(div);
  });
}

function deleteAlarm(id) {
  const index = alarms.findIndex(alarm => alarm.id === id);

  if (index !== -1) {
    addLog(`Alarm deleted: ${alarms[index].name}`);
    alarms.splice(index, 1);
    renderAlarms();
    statusEl.textContent = "Alarm deleted.";
  }
}

// Module 4: Signal Handling simulation
// In a browser we cannot use Linux SIGALRM directly.
// JavaScript timers simulate the event.
function checkAlarms() {
  const now = new Date();
  const current = now.toTimeString().slice(0, 8);

  alarms.forEach(alarm => {
    if (
      alarm.active &&
      current === alarm.time &&
      alarm.lastTriggered !== now.toDateString()
    ) {
      alarm.lastTriggered = now.toDateString();
      triggerAlarm(alarm);
    }
  });
}

// Module 5: Alarm Notification
function triggerAlarm(alarm) {
  alarm.active = false;
  renderAlarms();

  notificationTextEl.textContent = `${alarm.name} — scheduled for ${alarm.time}.`;
  notificationEl.classList.remove("hidden");

  addLog(`SIGALRM simulation: alarm triggered for ${alarm.name}`);

  // Browser notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("⏰ Alarm Triggered", {
      body: `${alarm.name} — ${alarm.time}`
    });
  }

  // Simple browser sound using Web Audio API
  playBeep();
}

// Module 6: Process/Application status
function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();

    for (let i = 0; i < 4; i++) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.frequency.value = 800;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const start = ctx.currentTime + i * 0.35;
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    }
  } catch (error) {
    addLog("Audio notification unavailable in this browser.");
  }
}

document.getElementById("dismissBtn").addEventListener("click", () => {
  notificationEl.classList.add("hidden");
  addLog("Alarm notification dismissed.");
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Ask permission for browser notifications
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission().then(permission => {
    addLog(`Browser notification permission: ${permission}`);
  });
}

addLog("Alarm Clock application started.");
addLog("System time module initialized.");
