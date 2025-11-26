// ==============================
// Vrix – core logic (one JS for all pages)
// ==============================

const STORAGE_KEYS = {
  dayTasks: "vrix.dayTasks",
  todos: "vrix.todos",
  events: "vrix.events",
  theme: "vrix.theme",
};

let dayTasks = [];   // {id,date,title,done}
let todos = [];      // {id,title,done}
let events = [];     // {id,date,title}

let calendarCursor = null;
let selectedDateKey = null;

// ---------- storage ----------
function loadState() {
  try {
    dayTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.dayTasks)) || [];
    todos = JSON.parse(localStorage.getItem(STORAGE_KEYS.todos)) || [];
    events = JSON.parse(localStorage.getItem(STORAGE_KEYS.events)) || [];
  } catch (e) {
    dayTasks = [];
    todos = [];
    events = [];
  }
}
function saveDayTasks() {
  localStorage.setItem(STORAGE_KEYS.dayTasks, JSON.stringify(dayTasks));
}
function saveTodos() {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(todos));
}
function saveEvents() {
  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
}

// ---------- date helpers ----------
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

// ---------- theme ----------
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

// ---------- data helpers ----------
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

function addTodo(title) {
  todos.push({
    id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
    done: false,
  });
  saveTodos();
}
function toggleTodoDone(id, done) {
  const t = todos.find(x => x.id === id);
  if (!t) return;
  t.done = done;
  saveTodos();
}
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
}

function addEvent(dateKey, title) {
  events.push({
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: dateKey,
    title: title.trim(),
  });
  saveEvents();
}
function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  saveEvents();
}

// ---------- weekly dashboard ----------
function renderWeeklyBoard() {
  const container = document.getElementById("weekBoard");
  if (!container) return;

  const weekDates = getCurrentWeekDates();
  const today = todayStart();
  container.innerHTML = "";

  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  weekDates.forEach((d, idx) => {
    const dateKey = formatDateKey(d);
    const isPast = d < today;
    const isToday = d.getTime() === today.getTime();

    const dayBox = document.createElement("div");
    dayBox.className = "day-box";
    if (isPast) dayBox.classList.add("day-past");

    // header
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
      const todayTag = document.createElement("div");
      todayTag.style.fontSize = "0.7rem";
      todayTag.style.padding = "2px 8px";
      todayTag.style.borderRadius = "999px";
      todayTag.style.border = "1px solid rgba(34,197,94,0.6)";
      todayTag.textContent = "Today";
      header.appendChild(todayTag);
    }

    dayBox.appendChild(header);

    // ring
    const tasksForDay = getTasksForDate(dateKey);
    const doneCount = tasksForDay.filter(t => t.done).length;
    const total = tasksForDay.length || 1;
    const percent = tasksForDay.length ? Math.round((doneCount / total) * 100) : 0;

    const ring = document.createElement("div");
    ring.className = "ring";
    ring.style.setProperty("--p", String(percent));
    const rv = document.createElement("div");
    rv.className = "ring-value";
    rv.textContent = `${percent}%`;
    ring.appendChild(rv);
    dayBox.appendChild(ring);

    const cap = document.createElement("div");
    cap.className = "ring-caption";
    cap.textContent =
      tasksForDay.length === 0
        ? isPast ? "No tasks recorded." : "No tasks yet."
        : `${doneCount}/${tasksForDay.length} tasks done`;
    dayBox.appendChild(cap);

    // list
    const list = document.createElement("div");
    list.className = "task-list";
    if (tasksForDay.length === 0) {
      const empty = document.createElement("div");
      empty.style.fontSize = "0.8rem";
      empty.style.color = "var(--soft)";
      empty.textContent = "No tasks.";
      list.appendChild(empty);
    } else {
      tasksForDay.forEach(task => {
        const row = document.createElement("div");
        row.className = "task-row";
        if (task.done) row.classList.add("completed");
        if (isPast) row.classList.add("past");

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = task.done;
        cb.disabled = isPast;
        cb.addEventListener("change", () => {
          toggleTaskDone(task.id, cb.checked);
          renderAll();
        });

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = task.title;

        const del = document.createElement("button");
        del.className = "delete-btn";
        del.textContent = "🗑";
        del.addEventListener("click", () => {
          // instant delete, no browser confirm
          deleteTask(task.id);
          renderAll();
        });

        row.appendChild(cb);
        row.appendChild(title);
        row.appendChild(del);
        list.appendChild(row);
      });
    }
    dayBox.appendChild(list);

    // add task / locked
    const addWrap = document.createElement("div");
    if (isPast) {
      const info = document.createElement("div");
      info.style.fontSize = "0.78rem";
      info.style.color = "var(--soft)";
      info.textContent = "Past day – no new tasks.";
      addWrap.appendChild(info);
    } else {
      const form = document.createElement("form");
      form.className = "add-task";
      form.dataset.date = dateKey;

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Add task…";

      const btn = document.createElement("button");
      btn.type = "submit";
      btn.textContent = "+";

      form.appendChild(input);
      form.appendChild(btn);
      form.addEventListener("submit", e => {
        e.preventDefault();
        const v = input.value.trim();
        if (!v) return;
        addTask(dateKey, v);
        input.value = "";
        renderAll();
      });

      addWrap.appendChild(form);
    }
    dayBox.appendChild(addWrap);

    container.appendChild(dayBox);
  });
}

// ---------- Todo dashboard ----------
function renderTodoDashboard() {
  const form = document.getElementById("todoForm");
  const list = document.getElementById("todoList");
  if (!form || !list) return;

  list.innerHTML = "";
  if (todos.length === 0) {
    const empty = document.createElement("div");
    empty.style.fontSize = "0.9rem";
    empty.style.color = "var(--soft)";
    empty.textContent = "No daily to-dos. Add one below.";
    list.appendChild(empty);
  } else {
    todos.forEach(t => {
      const row = document.createElement("div");
      row.className = "task-row";
      if (t.done) row.classList.add("completed");

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = t.done;
      cb.addEventListener("change", () => {
        toggleTodoDone(t.id, cb.checked);
        renderTodoDashboard();
      });

      const title = document.createElement("div");
      title.className = "task-title";
      title.textContent = t.title;

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "🗑";
      del.addEventListener("click", () => {
        // instant delete, no browser confirm
        deleteTodo(t.id);
        renderTodoDashboard();
      });

      row.appendChild(cb);
      row.appendChild(title);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  if (!form._bound) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const input = document.getElementById("todoInput");
      if (!input) return;
      const v = input.value.trim();
      if (!v) return;
      addTodo(v);
      input.value = "";
      renderTodoDashboard();
    });
    form._bound = true;
  }
}

// ---------- phone-style monthly calendar ----------
function renderMonthlyCalendar() {
  const cal = document.getElementById("calendar");
  const labelEl = document.getElementById("monthLabel");
  if (!cal) return;

  if (!calendarCursor) {
    calendarCursor = new Date();
    calendarCursor.setDate(1);
  }

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();

  cal.innerHTML = "";

  if (labelEl) {
    const mm = String(month + 1).padStart(2, "0");
    labelEl.textContent = `${year} / ${mm}`;
  }

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = todayStart();
  const todayKey = formatDateKey(today);

  // blanks
  for (let i = 0; i < firstWeekday; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell disabled";
    cal.appendChild(cell);
  }

  // real days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateKey = formatDateKey(d);

    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const num = document.createElement("div");
    num.className = "day-number";
    num.textContent = day;
    cell.appendChild(num);

    if (d.getTime() === today.getTime()) {
      cell.classList.add("today");
    }

    const evForDay = events.filter(e => e.date === dateKey);
    if (evForDay.length > 0) cell.classList.add("has-event");

    if (selectedDateKey === dateKey) cell.classList.add("selected");

    cell.addEventListener("click", () => {
      selectedDateKey = dateKey;
      renderMonthlyCalendar();
      renderCalendarPanel();
    });

    cal.appendChild(cell);
  }

  // default selection = today if in this month
  if (!selectedDateKey) {
    const monthKeyCursor = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthKeyToday = todayKey.slice(0, 7);
    if (monthKeyCursor === monthKeyToday) {
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
  if (!panel || !dateEl || !listEl || !form || !input) return;

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
    empty.textContent = "No events for this day.";
    empty.style.color = "var(--soft)";
    empty.style.fontSize = "0.85rem";
    listEl.appendChild(empty);
  } else {
    todaysEvents.forEach(ev => {
      const row = document.createElement("div");
      row.className = "calendar-event-row";

      const titleSpan = document.createElement("span");
      titleSpan.textContent = ev.title;

      const delBtn = document.createElement("button");
      delBtn.className = "calendar-event-delete";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", () => {
        // instant delete, no browser confirm
        deleteEvent(ev.id);
        renderMonthlyCalendar(); // re-renders + panel
      });

      row.appendChild(titleSpan);
      row.appendChild(delBtn);
      listEl.appendChild(row);
    });
  }

  if (!form._bound) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || !selectedDateKey) return;
      addEvent(selectedDateKey, text);
      input.value = "";
      renderMonthlyCalendar(); // also refreshes panel
    });
    form._bound = true;
  }
}

function initCalendarNavigation() {
  const prev = document.getElementById("prevMonth");
  const next = document.getElementById("nextMonth");
  if (!prev || !next) return;
  prev.addEventListener("click", () => {
    if (!calendarCursor) calendarCursor = new Date();
    calendarCursor.setMonth(calendarCursor.getMonth() - 1);
    selectedDateKey = null;
    renderMonthlyCalendar();
  });
  next.addEventListener("click", () => {
    if (!calendarCursor) calendarCursor = new Date();
    calendarCursor.setMonth(calendarCursor.getMonth() + 1);
    selectedDateKey = null;
    renderMonthlyCalendar();
  });
}

// ---------- charts ----------
function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}
function drawBars(canvas, labels, values, emptyMessage) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  if (!labels.length) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "12px system-ui";
    ctx.fillText(emptyMessage, 10, height / 2);
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
  const chartWidth = right - left;
  const chartHeight = bottom - top;
  const count = labels.length;
  const barWidth = (chartWidth / count) * 0.7;
  const gap = (chartWidth - barWidth * count) / (count - 1 || 1);
  values.forEach((v, i) => {
    const x = left + i * (barWidth + gap);
    const barHeight = (v / maxVal) * chartHeight;
    const y = bottom - barHeight;
    const grad = ctx.createLinearGradient(x, y, x, bottom);
    grad.addColorStop(0, "rgba(34,197,94,0.9)");
    grad.addColorStop(1, "rgba(34,197,94,0.25)");
    ctx.fillStyle = grad;
    const r = 5;
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + barWidth - r, y);
    ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
    ctx.lineTo(x + barWidth, bottom);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = "#9ca3af";
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  labels.forEach((lab, i) => {
    const x = left + i * (barWidth + gap) + barWidth / 2;
    ctx.fillText(lab, x, bottom + 3);
  });
}
function drawOverall(canvas, completed, total) {
  const { ctx, width, height } = setupCanvas(canvas);
  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px system-ui";
  ctx.fillStyle = "#9ca3af";
  if (total === 0) {
    ctx.fillText("No tasks in this week yet.", 10, height / 2);
    return;
  }
  const ratio = completed / total;
  const barWidth = width - 60;
  const barHeight = 16;
  const x = 30;
  const y = height / 2 - barHeight / 2;
  ctx.fillStyle = "#1f2937";
  ctx.beginPath();
  ctx.roundRect(x, y, barWidth, barHeight, 999);
  ctx.fill();
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.roundRect(x, y, barWidth * ratio, barHeight, 999);
  ctx.fill();
  const percent = Math.round(ratio * 100);
  ctx.fillStyle = "#e5e7eb";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${completed}/${total} tasks (${percent}%)`, x, y - 4);
}

function renderWeeklyStatsPage() {
  const canvas = document.getElementById("weeklyStatsChart");
  const text = document.getElementById("weeklyStatsText");
  if (!canvas) return;

  const weekDates = getCurrentWeekDates();
  const labels = [];
  const values = [];
  const short = ["S","M","T","W","T","F","S"];
  weekDates.forEach((d, idx) => {
    const key = formatDateKey(d);
    labels.push(short[idx]);
    values.push(dayTasks.filter(t => t.date === key && t.done).length);
  });

  const total = values.reduce((a,b)=>a+b,0);
  drawBars(canvas, labels, values, "No completed tasks this week yet.");
  if (text) {
    text.textContent =
      total === 0
        ? "No tasks completed this week yet."
        : `${total} task${total !== 1 ? "s" : ""} completed this week.`;
  }
}
function renderMonthlyStatsPage() {
  const canvas = document.getElementById("monthlyStatsChart");
  const text = document.getElementById("monthlyStatsText");
  if (!canvas) return;

  const currentWeekStart = getStartOfWeek(new Date());
  const labels = [];
  const values = [];
  for (let offset = 3; offset >= 0; offset--) {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startKey = formatDateKey(start);
    const endKey = formatDateKey(end);
    labels.push(offset === 0 ? "This wk" : `W-${offset}`);
    values.push(dayTasks.filter(
      t => t.done && t.date >= startKey && t.date <= endKey
    ).length);
  }
  const total = values.reduce((a,b)=>a+b,0);
  drawBars(canvas, labels, values, "No completed tasks in these 4 weeks.");
  if (text) {
    text.textContent =
      total === 0
        ? "No tasks completed in the last 4 weeks."
        : `${total} task${total !== 1 ? "s" : ""} completed across the last 4 weeks.`;
  }
}
function renderOverallStatsPage() {
  const canvas = document.getElementById("overallStatsChart");
  const text = document.getElementById("overallStatsText");
  if (!canvas) return;

  const weekDates = getCurrentWeekDates();
  const startKey = formatDateKey(weekDates[0]);
  const endKey = formatDateKey(weekDates[6]);

  const inWeek = dayTasks.filter(t => t.date >= startKey && t.date <= endKey);
  const completed = inWeek.filter(t => t.done).length;

  drawOverall(canvas, completed, inWeek.length);
  if (text) {
    if (inWeek.length === 0) text.textContent = "No tasks scheduled this week.";
    else {
      const percent = Math.round((completed / inWeek.length) * 100);
      text.textContent = `Overall: ${completed}/${inWeek.length} tasks completed (${percent}%).`;
    }
  }
}

// ---------- settings ----------
function initSettingsPage() {
  const exportBtn = document.getElementById("exportData");
  const importInput = document.getElementById("importFile");
  const clearBtn = document.getElementById("clearAll");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const data = { dayTasks, todos, events };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vrix-backup.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (importInput) {
    importInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.dayTasks) dayTasks = data.dayTasks;
          if (data.todos) todos = data.todos;
          if (data.events) events = data.events;
          saveDayTasks(); saveTodos(); saveEvents();
          alert("Import successful. Reloading.");
          location.reload();
        } catch {
          alert("Invalid backup file.");
        }
      };
      reader.readAsText(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!confirm("Clear ALL Vrix data?")) return;
      dayTasks = []; todos = []; events = [];
      saveDayTasks(); saveTodos(); saveEvents();
      alert("All data cleared.");
      location.reload();
    });
  }
}

// ---------- master render ----------
function renderAll() {
  renderWeeklyBoard();
  renderTodoDashboard();
  renderMonthlyCalendar();
  renderWeeklyStatsPage();
  renderMonthlyStatsPage();
  renderOverallStatsPage();
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initTheme();
  renderAll();
  initCalendarNavigation();
  initSettingsPage();
});
