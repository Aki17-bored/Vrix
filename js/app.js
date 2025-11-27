// ==============================
// Vrix – core logic
// ==============================

const STORAGE_KEYS = {
  dayTasks: "vrix.dayTasks",
  habits: "vrix.habits",
  habitLog: "vrix.habitLog",
  events: "vrix.events",
  dailyNotes: "vrix.dailyNotes",
  theme: "vrix.theme",
};

let dayTasks = [];
let habits = [];
let habitLog = {};
let events = [];
let dailyNotes = {};

let calendarCursor = null;
let selectedDateKey = null;

// ==============================
// Load + Save
// ==============================

function loadState() {
  try { dayTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.dayTasks)) || []; } catch { dayTasks = []; }
  try { habits = JSON.parse(localStorage.getItem(STORAGE_KEYS.habits)) || []; } catch { habits = []; }
  try { habitLog = JSON.parse(localStorage.getItem(STORAGE_KEYS.habitLog)) || {}; } catch { habitLog = {}; }
  try { events = JSON.parse(localStorage.getItem(STORAGE_KEYS.events)) || []; } catch { events = []; }
  try { dailyNotes = JSON.parse(localStorage.getItem(STORAGE_KEYS.dailyNotes)) || {}; } catch { dailyNotes = {}; }
}

function saveDayTasks() {
  localStorage.setItem(STORAGE_KEYS.dayTasks, JSON.stringify(dayTasks));
}
function saveHabits() {
  localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(habits));
}
function saveHabitLog() {
  localStorage.setItem(STORAGE_KEYS.habitLog, JSON.stringify(habitLog));
}
function saveEvents() {
  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
}
function saveDailyNotes() {
  localStorage.setItem(STORAGE_KEYS.dailyNotes, JSON.stringify(dailyNotes));
}

// ==============================
// Date Helpers
// ==============================

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function getCurrentWeekDates() {
  const start = getStartOfWeek(new Date());
  const arr = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push(d);
  }
  return arr;
}

// ==============================
// Parse title for 🎯 priority + #tags
// ==============================

function parseTitleAndTags(raw) {
  if (!raw) return { baseTitle: "", tags: [], priority: false };

  let priority = false;
  let words = raw.split(/\s+/);
  const baseWords = [];
  const tags = [];

  for (let w of words) {
    if (!w) continue;

    if (w.includes("🎯")) {
      priority = true;
      w = w.replace(/🎯/g, "").trim();
      if (!w) continue;
    }

    if (w.startsWith("#") && w.length > 1) {
      const cleaned = w.replace(/[^#\w-]/g, "");
      if (cleaned.length > 1) tags.push(cleaned);
    } else {
      baseWords.push(w);
    }
  }

  return { baseTitle: baseWords.join(" "), tags, priority };
}

// ==============================
// Theme
// ==============================

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light") root.classList.add("light");
  else root.classList.remove("light");
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const theme = saved === "light" ? "light" : "dark";
  applyTheme(theme);

  const toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.textContent = theme === "light" ? "🌙" : "☀️";
    toggle.addEventListener("click", () => {
      const nowLight = document.documentElement.classList.contains("light");
      const newTheme = nowLight ? "dark" : "light";
      applyTheme(newTheme);
      toggle.textContent = newTheme === "light" ? "🌙" : "☀️";
    });
  }
}

// ==============================
// Splash Screen
// ==============================

function initSplash() {
  const s = document.getElementById("splash");
  if (!s) return;
  setTimeout(() => s.classList.add("splash-hide"), 900);
}

// ==============================
// Tasks for Day
// ==============================

function getTasksForDate(dateKey) {
  return dayTasks.filter(t => t.date === dateKey);
}

function addTask(dateKey, title) {
  dayTasks.push({
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: dateKey,
    title: title.trim(),
    done: false,
  });
  saveDayTasks();
}

function toggleTaskDone(id, done) {
  const t = dayTasks.find(x => x.id === id);
  if (!t) return;
  t.done = done;
  saveDayTasks();
}

function deleteTask(id) {
  dayTasks = dayTasks.filter(t => t.id !== id);
  saveDayTasks();
}

// ==============================
// Habits + streak
// ==============================

function addHabit(title) {
  habits.push({
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
  });
  saveHabits();
}

function deleteHabit(id) {
  habits = habits.filter(h => h.id !== id);
  saveHabits();

  Object.keys(habitLog).forEach(d => {
    if (habitLog[d] && habitLog[d][id]) {
      delete habitLog[d][id];
      if (Object.keys(habitLog[d]).length === 0) delete habitLog[d];
    }
  });
  saveHabitLog();
}

function isHabitDoneOn(habitId, dateKey) {
  const row = habitLog[dateKey];
  return !!(row && row[habitId]);
}

function setHabitDoneOn(habitId, dateKey, done) {
  const row = habitLog[dateKey] || {};
  if (done) row[habitId] = true;
  else delete row[habitId];

  if (Object.keys(row).length === 0) delete habitLog[dateKey];
  else habitLog[dateKey] = row;

  saveHabitLog();
}

function getHabitCurrentStreak(habitId) {
  let streak = 0;
  const d = todayStart();
  for (let i = 0; i < 365; i++) {
    const key = formatDateKey(d);
    if (isHabitDoneOn(habitId, key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

function getOverallStreak() {
  let s = 0;
  const d = todayStart();
  for (let i = 0; i < 365; i++) {
    const k = formatDateKey(d);
    const row = habitLog[k];
    const any = row && Object.keys(row).length > 0;
    if (any) {
      s++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return s;
}

// ==============================
// Notes / Reflections
// ==============================

function getNoteForDate(k) {
  return dailyNotes[k] || "";
}

function setNoteForDate(k, text) {
  if (text.trim()) dailyNotes[k] = text;
  else delete dailyNotes[k];

  saveDailyNotes();
}

// ==============================
// WEEKLY BOARD (Dashboard)
// ==============================

function renderWeeklyBoard() {
  const container = document.getElementById("weekBoard");
  if (!container) return;

  const weekDates = getCurrentWeekDates();
  const today = todayStart();
  container.innerHTML = "";

  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  weekDates.forEach((d, idx) => {
    const key = formatDateKey(d);
    const isPast = d < today;
    const isToday = d.getTime() === today.getTime();
    const isFuture = d > today;

    const box = document.createElement("div");
    box.className = "day-box";
    if (isPast) box.classList.add("day-past");
    if (isFuture) box.classList.add("day-future");

    // Header
    const header = document.createElement("div");
    header.className = "day-header";

    const left = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "day-name";
    nameEl.textContent = dayNames[idx];

    const dateEl = document.createElement("div");
    dateEl.className = "day-date";
    dateEl.textContent = d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });

    left.appendChild(nameEl);
    left.appendChild(dateEl);
    header.appendChild(left);

    if (isToday) {
      const t = document.createElement("div");
      t.style.fontSize = "0.7rem";
      t.style.padding = "2px 8px";
      t.style.borderRadius = "999px";
      t.style.border = "1px solid rgba(34,197,94,0.6)";
      t.textContent = "Today";
      header.appendChild(t);
    }

    box.appendChild(header);

    // Ring
    const tasks = getTasksForDate(key);
    const done = tasks.filter(t => t.done).length;
    const totalProgressBase = isFuture ? 0 : tasks.length;
    const tot = totalProgressBase || 1;
    const percent = totalProgressBase ? Math.round((done / totalProgressBase) * 100) : 0;

    const ring = document.createElement("div");
    ring.className = "ring";
    ring.style.setProperty("--p", String(percent));

    const val = document.createElement("div");
    val.className = "ring-value";
    val.textContent = `${percent}%`;
    ring.appendChild(val);

    box.appendChild(ring);

    const cap = document.createElement("div");
    cap.className = "ring-caption";
    if (tasks.length === 0) {
      if (isPast) cap.textContent = "No tasks recorded.";
      else if (isFuture) cap.textContent = "No tasks planned yet.";
      else cap.textContent = "No tasks yet.";
    } else {
      if (isFuture) cap.textContent = `${tasks.length} planned`;
      else cap.textContent = `${done}/${tasks.length} done`;
    }
    box.appendChild(cap);

    // List
    const list = document.createElement("div");
    list.className = "task-list";

    if (tasks.length === 0) {
      const empty = document.createElement("div");
      empty.style.color = "var(--soft)";
      empty.style.fontSize = "0.8rem";
      empty.textContent = "No tasks.";
      list.appendChild(empty);
    } else {
      tasks.forEach(t => {
        const row = document.createElement("div");
        row.className = "task-row task-row-appear";   // <-- animation class

        const meta = parseTitleAndTags(t.title);
        if (t.done && !isFuture) row.classList.add("completed");
        if (meta.priority) row.classList.add("priority-row");

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = t.done;
        cb.disabled = isPast || isFuture;
        cb.addEventListener("change", () => {
          toggleTaskDone(t.id, cb.checked);
          renderAll();
        });

        const main = document.createElement("div");
        main.className = "task-main";

        const titleEl = document.createElement("div");
        titleEl.className = "task-title";
        titleEl.textContent = meta.baseTitle || t.title;
        main.appendChild(titleEl);

        if (meta.tags.length || meta.priority) {
          const tagRow = document.createElement("div");
          tagRow.className = "tag-row";
          if (meta.priority) {
            const p = document.createElement("span");
            p.className = "tag-pill priority-pill";
            p.textContent = "🎯 Priority";
            tagRow.appendChild(p);
          }
          meta.tags.forEach(tag => {
            const pill = document.createElement("span");
            pill.className = "tag-pill";
            pill.textContent = tag;
            tagRow.appendChild(pill);
          });
          main.appendChild(tagRow);
        }

        const del = document.createElement("button");
        del.className = "delete-btn";
        del.textContent = "🗑";
        del.addEventListener("click", () => {
          deleteTask(t.id);
          renderAll();
        });

        row.appendChild(cb);
        row.appendChild(main);
        row.appendChild(del);
        list.appendChild(row);
      });
    }

    box.appendChild(list);

    const addWrap = document.createElement("div");
    if (isPast) {
      const info = document.createElement("div");
      info.style.color = "var(--soft)";
      info.textContent = "Past day – no new tasks.";
      info.style.fontSize = "0.78rem";
      addWrap.appendChild(info);
    } else {
      const form = document.createElement("form");
      form.className = "add-task";
      form.dataset.date = key;

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = isFuture
        ? "Plan a task (🎯, #tags)…"
        : "Add a task (🎯, #tags)…";

      const btn = document.createElement("button");
      btn.type = "submit";
      btn.textContent = "+";

      form.appendChild(input);
      form.appendChild(btn);

      form.addEventListener("submit", e => {
        e.preventDefault();
        const v = input.value.trim();
        if (!v) return;
        addTask(key, v);
        input.value = "";
        renderAll();
      });

      addWrap.appendChild(form);
    }

    box.appendChild(addWrap);
    container.appendChild(box);
  });

  const tl = document.getElementById("todayLabel");
  if (tl) {
    const t = todayStart();
    tl.textContent = t.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

// ==============================
// Habits Section
// ==============================

function renderHabitsSection() {
  const list = document.getElementById("habitList");
  const streakText = document.getElementById("overallStreakText");
  const form = document.getElementById("habitForm");
  if (!list) return;

  const todayKey = formatDateKey(todayStart());
  list.innerHTML = "";

  if (habits.length === 0) {
    const empty = document.createElement("div");
    empty.style.color = "var(--soft)";
    empty.textContent = "No habits yet.";
    empty.style.fontSize = "0.9rem";
    list.appendChild(empty);
  } else {
    habits.forEach(h => {
      const row = document.createElement("div");
      row.className = "task-row task-row-appear";   // <-- animation class

      const meta = parseTitleAndTags(h.title);
      if (meta.priority) row.classList.add("priority-row");

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = isHabitDoneOn(h.id, todayKey);
      cb.addEventListener("change", () => {
        setHabitDoneOn(h.id, todayKey, cb.checked);
        renderHabitsSection();
      });

      const wrap = document.createElement("div");
      wrap.className = "task-main";

      const title = document.createElement("div");
      title.className = "task-title";
      const streak = getHabitCurrentStreak(h.id);
      title.textContent =
        (meta.baseTitle || h.title) + (streak > 0 ? `  🔥 ${streak}` : "");
      wrap.appendChild(title);

      if (meta.tags.length || meta.priority) {
        const tagRow = document.createElement("div");
        tagRow.className = "tag-row";

        if (meta.priority) {
          const p = document.createElement("span");
          p.className = "tag-pill priority-pill";
          p.textContent = "🎯 Priority";
          tagRow.appendChild(p);
        }

        meta.tags.forEach(tag => {
          const pill = document.createElement("span");
          pill.className = "tag-pill";
          pill.textContent = tag;
          tagRow.appendChild(pill);
        });

        wrap.appendChild(tagRow);
      }

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "🗑";
      del.addEventListener("click", () => {
        deleteHabit(h.id);
        renderHabitsSection();
      });

      row.appendChild(cb);
      row.appendChild(wrap);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  if (form && !form._bound) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const input = document.getElementById("habitInput");
      if (!input) return;
      const v = input.value.trim();
      if (!v) return;
      addHabit(v);
      input.value = "";
      renderHabitsSection();
    });
    form._bound = true;
  }

  if (streakText) {
    const overall = getOverallStreak();
    if (overall === 0) {
      streakText.textContent = "No streak yet. Start by ticking a habit today.";
    } else {
      streakText.textContent = `Overall streak: ${overall} day${overall !== 1 ? "s" : ""} 🔥`;
    }
  }
}

// ==============================
// Reflection Section
// ==============================

function renderReflectionSection() {
  const ta = document.getElementById("todayNote");
  if (!ta) return;

  const key = formatDateKey(todayStart());
  ta.value = getNoteForDate(key);

  if (!ta._bound) {
    ta.addEventListener("input", () => {
      setNoteForDate(key, ta.value);
    });
    ta._bound = true;
  }
}

// ==============================
// Today Completed Summary
// ==============================

function renderTodaySummary() {
  const textEl = document.getElementById("todayCompletedText");
  const tagBox = document.getElementById("todayTagSummary");
  if (!textEl || !tagBox) return;

  const key = formatDateKey(todayStart());

  const habitsDone = habits.filter(h => isHabitDoneOn(h.id, key));
  const totalHabits = habits.length;

  const tasksToday = dayTasks.filter(t => t.date === key);
  const tasksDone = tasksToday.filter(t => t.done);
  const totalTasks = tasksToday.length;

  let priorityDone = 0;

  habitsDone.forEach(h => {
    const meta = parseTitleAndTags(h.title);
    if (meta.priority) priorityDone++;
  });

  tasksDone.forEach(t => {
    const meta = parseTitleAndTags(t.title);
    if (meta.priority) priorityDone++;
  });

  const totalCompleted = habitsDone.length + tasksDone.length;

  if (totalHabits || totalTasks) {
    textEl.textContent =
      `Habits: ${habitsDone.length}/${totalHabits} · ` +
      `Tasks: ${tasksDone.length}/${totalTasks} · ` +
      `Total: ${totalCompleted}` +
      (priorityDone > 0 ? ` · 🎯 ${priorityDone}` : "");
  } else {
    textEl.textContent = "Nothing completed yet.";
  }

  tagBox.innerHTML = "";
  const counts = {};

  [...habitsDone, ...tasksDone].forEach(item => {
    const meta = parseTitleAndTags(item.title);
    meta.tags.forEach(tag => {
      const key = tag.toLowerCase();
      if (!counts[key]) counts[key] = { label: tag, count: 0 };
      counts[key].count++;
    });
  });

  const entries = Object.values(counts).sort((a, b) => b.count - a.count);
  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "tag-summary-empty";
    empty.textContent = "No tagged activity today.";
    tagBox.appendChild(empty);
    return;
  }

  entries.slice(0, 6).forEach(entry => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.textContent = `${entry.label} · ${entry.count}`;
    tagBox.appendChild(pill);
  });
}

// ==============================
// Monthly Calendar
// ==============================

function renderMonthlyCalendar() {
  const cal = document.getElementById("calendar");
  const label = document.getElementById("monthLabel");
  if (!cal) return;

  if (!calendarCursor) {
    calendarCursor = new Date();
    calendarCursor.setDate(1);
  }

  const y = calendarCursor.getFullYear();
  const m = calendarCursor.getMonth();
  cal.innerHTML = "";

  if (label) {
    label.textContent = `${y} / ${String(m + 1).padStart(2, "0")}`;
  }

  const first = new Date(y, m, 1);
  const firstW = first.getDay();
  const daysIn = new Date(y, m + 1, 0).getDate();

  const t = todayStart();
  const todayKey = formatDateKey(t);

  // blank cells
  for (let i = 0; i < firstW; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell disabled";
    cal.appendChild(cell);
  }

  for (let d = 1; d <= daysIn; d++) {
    const date = new Date(y, m, d);
    const key = formatDateKey(date);

    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const num = document.createElement("div");
    num.className = "day-number";
    num.textContent = d;
    cell.appendChild(num);

    if (key === todayKey) cell.classList.add("today");

    if (events.some(e => e.date === key)) cell.classList.add("has-event");

    if (key === selectedDateKey) cell.classList.add("selected");

    cell.addEventListener("click", () => {
      selectedDateKey = key;
      renderMonthlyCalendar();
      renderCalendarPanel();
    });

    cal.appendChild(cell);
  }

  if (!selectedDateKey) {
    const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;
    if (todayKey.slice(0, 7) === monthStr) {
      selectedDateKey = todayKey;
    }
  }

  renderCalendarPanel();
}

function renderCalendarPanel() {
  const panel = document.getElementById("calendarPanel");
  const dateEl = document.getElementById("calendarPanelDate");
  const listEl = document.getElementById("calendarPanelEvents");
  const form = document.getElementById("calendarEventForm");
  const input = document.getElementById("calendarEventInput");
  const reflection = document.getElementById("calendarReflection");
  if (!panel) return;

  if (!selectedDateKey) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "block";

  const d = new Date(selectedDateKey);
  dateEl.textContent = d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const todaysEvents = events.filter(e => e.date === selectedDateKey);
  listEl.innerHTML = "";

  if (todaysEvents.length === 0) {
    const empty = document.createElement("div");
    empty.style.color = "var(--soft)";
    empty.textContent = "No events.";
    empty.style.fontSize = "0.85rem";
    listEl.appendChild(empty);
  } else {
    todaysEvents.forEach(ev => {
      const row = document.createElement("div");
      row.className = "calendar-event-row";

      const title = document.createElement("span");
      title.textContent = ev.title;

      const del = document.createElement("button");
      del.className = "calendar-event-delete";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        events = events.filter(e => e.id !== ev.id);
        saveEvents();
        renderMonthlyCalendar();
      });

      row.appendChild(title);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  if (reflection) {
    reflection.value = getNoteForDate(selectedDateKey);
    if (!reflection._bound) {
      reflection.addEventListener("input", () => {
        setNoteForDate(selectedDateKey, reflection.value);
      });
      reflection._bound = true;
    }
  }

  if (!form._bound) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      events.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        date: selectedDateKey,
        title: val,
      });
      saveEvents();
      input.value = "";
      renderMonthlyCalendar();
    });
    form._bound = true;
  }
}

function initCalendarNavigation() {
  const prev = document.getElementById("prevMonth");
  const next = document.getElementById("nextMonth");
  if (!prev || !next) return;

  prev.addEventListener("click", () => {
    calendarCursor.setMonth(calendarCursor.getMonth() - 1);
    selectedDateKey = null;
    renderMonthlyCalendar();
  });

  next.addEventListener("click", () => {
    calendarCursor.setMonth(calendarCursor.getMonth() + 1);
    selectedDateKey = null;
    renderMonthlyCalendar();
  });
}

// ==============================
// Charts
// ==============================

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function drawBars(canvas, labels, values, emptyText) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);

  if (!labels.length) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText(emptyText, 10, height / 2);
    return;
  }

  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 1;

  const lines = 4;
  for (let i = 0; i <= lines; i++) {
    const y = 15 + ((height - 40) * i) / lines;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(width - 10, y);
    ctx.stroke();
  }

  const maxVal = Math.max(1, ...values);
  const left = 30;
  const right = width - 10;
  const bottom = height - 25;
  const top = 10;

  const chartW = right - left;
  const chartH = bottom - top;
  const count = labels.length;

  const barW = (chartW / count) * 0.7;
  const gap = (chartW - barW * count) / (count - 1 || 1);

  values.forEach((v, i) => {
    const x = left + i * (barW + gap);
    const barH = (v / maxVal) * chartH;
    const y = bottom - barH;

    const g = ctx.createLinearGradient(x, y, x, bottom);
    g.addColorStop(0, "rgba(34,197,94,0.9)");
    g.addColorStop(1, "rgba(34,197,94,0.25)");
    ctx.fillStyle = g;

    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + barW - radius, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
    ctx.lineTo(x + barW, bottom);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = "#9ca3af";
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";

  labels.forEach((lab, i) => {
    const x = left + i * (barW + gap) + barW / 2;
    ctx.fillText(lab, x, bottom + 3);
  });
}

function drawDonut(canvas, completed, total) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 18;
  const lineWidth = 14;

  const ratio = total > 0 ? completed / total : 0;

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "#1f2937";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (total > 0 && ratio > 0) {
    const start = -Math.PI / 2;
    const end = start + ratio * Math.PI * 2;
    const g = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
    g.addColorStop(0, "rgba(34,197,94,1)");
    g.addColorStop(1, "rgba(34,197,94,0.4)");
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (total === 0) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText("No tasks", cx, cy);
    return 0;
  } else {
    const percent = Math.round(ratio * 100);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "16px system-ui";
    ctx.fillText(`${percent}%`, cx, cy - 4);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px system-ui";
    ctx.fillText(`${completed}/${total}`, cx, cy + 11);
    return percent;
  }
}

function renderWeeklyStatsPage() {
  const canvas = document.getElementById("weeklyStatsChart");
  const txt = document.getElementById("weeklyStatsText");
  if (!canvas) return;

  const weekDates = getCurrentWeekDates();
  const labels = [];
  const values = [];
  const short = ["S","M","T","W","T","F","S"];

  weekDates.forEach((d, i) => {
    const key = formatDateKey(d);
    labels.push(short[i]);
    values.push(dayTasks.filter(t => t.date === key && t.done).length);
  });

  const total = values.reduce((a,b)=>a+b,0);
  drawBars(canvas, labels, values, "No completed tasks this week yet.");

  if (txt) {
    txt.textContent =
      total === 0
        ? "No tasks completed this week yet."
        : `${total} task${total !== 1 ? "s" : ""} completed this week.`;
  }
}

function renderMonthlyStatsPage() {
  const canvas = document.getElementById("monthlyStatsChart");
  const txt = document.getElementById("monthlyStatsText");
  if (!canvas) return;

  const cw = getStartOfWeek(new Date());
  const labels = [];
  const values = [];

  for (let off = 3; off >= 0; off--) {
    const start = new Date(cw);
    start.setDate(cw.getDate() - off * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    labels.push(off === 0 ? "This wk" : `W-${off}`);

    values.push(
      dayTasks.filter(
        t => t.done &&
        t.date >= formatDateKey(start) &&
        t.date <= formatDateKey(end)
      ).length
    );
  }

  const total = values.reduce((a,b)=>a+b,0);
  drawBars(canvas, labels, values, "No completed tasks in last 4 weeks.");

  if (txt) {
    txt.textContent =
      total === 0
        ? "No tasks completed in the last 4 weeks."
        : `${total} task${total !== 1 ? "s" : ""} completed in the last 4 weeks.`;
  }
}

function renderOverallWeekCircle() {
  const canvas = document.getElementById("overallWeekCircle");
  const txt = document.getElementById("overallWeekText");
  if (!canvas) return;

  const weekDates = getCurrentWeekDates();
  const todayKey = formatDateKey(todayStart());
  const startKey = formatDateKey(weekDates[0]);

  const inRange = dayTasks.filter(t => t.date >= startKey && t.date <= todayKey);
  const done = inRange.filter(t => t.done).length;
  const total = inRange.length;

  const percent = drawDonut(canvas, done, total);
  if (txt) {
    if (!total) txt.textContent = "No tasks yet this week.";
    else txt.textContent = `${done}/${total} tasks (${percent}%).`;
  }
}

function renderOverallMonthCircle() {
  const canvas = document.getElementById("overallMonthCircle");
  const txt = document.getElementById("overallMonthText");
  if (!canvas) return;

  const t = todayStart();
  const todayKey = formatDateKey(t);
  const monthStart = new Date(t.getFullYear(), t.getMonth(), 1);
  const startKey = formatDateKey(monthStart);

  const inRange = dayTasks.filter(t => t.date >= startKey && t.date <= todayKey);
  const done = inRange.filter(t => t.done).length;
  const total = inRange.length;

  const percent = drawDonut(canvas, done, total);

  if (txt) {
    if (!total) txt.textContent = "No tasks yet this month.";
    else txt.textContent = `${done}/${total} tasks (${percent}%).`;
  }
}

// ==============================
// Settings
// ==============================

function initSettingsPage() {
  const exp = document.getElementById("exportData");
  const imp = document.getElementById("importFile");
  const clr = document.getElementById("clearAll");

  if (exp) {
    exp.addEventListener("click", () => {
      const data = { dayTasks, habits, habitLog, events, dailyNotes };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vrix-backup.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (imp) {
    imp.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.dayTasks) dayTasks = data.dayTasks;
          if (data.habits) habits = data.habits;
          if (data.habitLog) habitLog = data.habitLog;
          if (data.events) events = data.events;
          if (data.dailyNotes) dailyNotes = data.dailyNotes;

          saveDayTasks();
          saveHabits();
          saveHabitLog();
          saveEvents();
          saveDailyNotes();

          alert("Import successful. Reloading.");
          location.reload();
        } catch {
          alert("Invalid backup file.");
        }
      };
      reader.readAsText(file);
    });
  }

  if (clr) {
    clr.addEventListener("click", () => {
      if (!confirm("Clear ALL data?")) return;

      dayTasks = [];
      habits = [];
      habitLog = {};
      events = [];
      dailyNotes = {};

      saveDayTasks();
      saveHabits();
      saveHabitLog();
      saveEvents();
      saveDailyNotes();

      alert("All data cleared.");
      location.reload();
    });
  }
}

// ==============================
// Master Render
// ==============================

function renderAll() {
  renderWeeklyBoard();
  renderHabitsSection();
  renderTodaySummary();
  renderReflectionSection();
  renderMonthlyCalendar();
  renderWeeklyStatsPage();
  renderMonthlyStatsPage();
  renderOverallWeekCircle();
  renderOverallMonthCircle();
}

// ==============================
// Init App
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initTheme();
  initSplash();
  renderAll();
  initCalendarNavigation();
  initSettingsPage();
});

// ==============================
// Register SW
// ==============================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}
