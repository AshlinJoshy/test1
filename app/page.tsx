"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, type Task } from "@/lib/supabaseClient";

const PRIORITIES = ["Low", "Medium", "High"] as const;
const STATUSES = ["Lead", "Contacted", "Proposal", "Won", "Lost"] as const;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const emptyForm = {
  title: "",
  client: "",
  deal_value: "",
  priority: "Medium" as Task["priority"],
  status: "Lead" as Task["status"],
  follow_up_date: "",
  notes: "",
};

// --- date helpers (local time) ---
function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfWeek(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  const diff = (nd.getDay() + 6) % 7; // days since Monday
  nd.setDate(nd.getDate() - diff);
  return nd;
}
function addDays(d: Date, n: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView] = useState<"list" | "week">("list");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  async function loadTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales_tasks")
      .select("*")
      .order("done", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setTasks((data as Task[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("sales_tasks").insert({
      title: form.title.trim(),
      client: form.client.trim() || null,
      deal_value: form.deal_value ? Number(form.deal_value) : null,
      priority: form.priority,
      status: form.status,
      follow_up_date: form.follow_up_date || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm({ ...emptyForm });
    loadTasks();
  }

  async function toggleDone(task: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    const { error } = await supabase
      .from("sales_tasks")
      .update({ done: !task.done })
      .eq("id", task.id);
    if (error) {
      setError(error.message);
      loadTasks();
    }
  }

  async function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("sales_tasks").delete().eq("id", id);
    if (error) {
      setError(error.message);
      loadTasks();
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.client ?? "").toLowerCase().includes(q) ||
        (t.notes ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [tasks, search, statusFilter]);

  const stats = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const pipeline = open
      .filter((t) => t.status !== "Lost")
      .reduce((sum, t) => sum + (t.deal_value ?? 0), 0);
    const won = tasks
      .filter((t) => t.status === "Won")
      .reduce((sum, t) => sum + (t.deal_value ?? 0), 0);
    return { total: open.length, pipeline, won, all: tasks.length };
  }, [tasks]);

  const money = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const todayStr = toDateStr(new Date());

  // --- week view derived data ---
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = weekDays[6];
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const d of weekDays) map[toDateStr(d)] = [];
    for (const t of filtered) {
      if (t.follow_up_date && map[t.follow_up_date]) {
        map[t.follow_up_date].push(t);
      }
    }
    return map;
  }, [filtered, weekDays]);
  const unscheduledCount = useMemo(
    () => filtered.filter((t) => !t.follow_up_date).length,
    [filtered]
  );

  const weekLabel = () => {
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
  };

  return (
    <main className="container">
      <header className="app-header">
        <h1>Sales Task Manager</h1>
        <p>Track your leads, follow-ups and deals in one place.</p>
      </header>

      <div className="stats">
        <div className="stat">
          <div className="label">Open tasks</div>
          <div className="value">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="label">Pipeline value</div>
          <div className="value">{money(stats.pipeline)}</div>
        </div>
        <div className="stat">
          <div className="label">Won value</div>
          <div className="value">{money(stats.won)}</div>
        </div>
        <div className="stat">
          <div className="label">Total tasks</div>
          <div className="value">{stats.all}</div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <section className="card">
        <h2>Add a task</h2>
        <form onSubmit={addTask}>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="title">Task *</label>
              <input
                id="title"
                placeholder="e.g. Call back John about the villa"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="client">Client / Company</label>
              <input
                id="client"
                placeholder="e.g. Acme Corp"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="deal">Deal value</label>
              <input
                id="deal"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={form.deal_value}
                onChange={(e) =>
                  setForm({ ...form, deal_value: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as Task["priority"],
                  })
                }
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as Task["status"],
                  })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="followup">Follow-up date</label>
              <input
                id="followup"
                type="date"
                value={form.follow_up_date}
                onChange={(e) =>
                  setForm({ ...form, follow_up_date: e.target.value })
                }
              />
            </div>
            <div className="field full">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                placeholder="Anything worth remembering..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add task"}
            </button>
          </div>
        </form>
      </section>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search tasks, clients, notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="view-toggle" role="tablist" aria-label="View">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
          >
            List
          </button>
          <button
            className={view === "week" ? "active" : ""}
            onClick={() => setView("week")}
            aria-pressed={view === "week"}
          >
            Week
          </button>
        </div>
      </div>

      {view === "week" && (
        <div className="week-nav">
          <button
            className="icon-btn"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            aria-label="Previous week"
          >
            ‹ Prev
          </button>
          <button
            className="icon-btn"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Today
          </button>
          <button
            className="icon-btn"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            aria-label="Next week"
          >
            Next ›
          </button>
          <span className="week-label">{weekLabel()}</span>
        </div>
      )}

      {loading ? (
        <div className="empty">Loading...</div>
      ) : view === "week" ? (
        <>
          <div className="week-grid">
            {weekDays.map((day) => {
              const ds = toDateStr(day);
              const dayTasks = tasksByDay[ds] ?? [];
              const isToday = ds === todayStr;
              return (
                <div
                  key={ds}
                  className={`week-day ${isToday ? "today" : ""}`}
                >
                  <div className="week-day-header">
                    <span className="dow">{DAY_NAMES[(day.getDay() + 6) % 7]}</span>
                    <span className="dom">{day.getDate()}</span>
                  </div>
                  <div className="week-day-body">
                    {dayTasks.length === 0 ? (
                      <div className="week-empty">—</div>
                    ) : (
                      dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`week-task pri-border-${task.priority} ${
                            task.done ? "done" : ""
                          }`}
                        >
                          <label className="week-task-top">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => toggleDone(task)}
                              aria-label="Mark done"
                            />
                            <span className="week-task-title">
                              {task.title}
                            </span>
                          </label>
                          {task.client && (
                            <div className="week-task-client">
                              👤 {task.client}
                            </div>
                          )}
                          <div className="week-task-meta">
                            <span className={`badge status-${task.status}`}>
                              {task.status}
                            </span>
                            {task.deal_value != null && (
                              <span className="week-task-value">
                                {money(task.deal_value)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {unscheduledCount > 0 && (
            <div className="unscheduled-note">
              {unscheduledCount} task{unscheduledCount === 1 ? "" : "s"} with no
              follow-up date {unscheduledCount === 1 ? "is" : "are"} not shown on
              the calendar. Switch to List view to see {unscheduledCount === 1 ? "it" : "them"}.
            </div>
          )}
        </>
      ) : filtered.length === 0 ? (
        <div className="empty">No tasks yet. Add your first one above.</div>
      ) : (
        filtered.map((task) => {
          const overdue =
            task.follow_up_date &&
            !task.done &&
            task.follow_up_date < todayStr;
          return (
            <div
              key={task.id}
              className={`task ${task.done ? "done" : ""}`}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task)}
                aria-label="Mark done"
              />
              <div className="task-body">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  {task.client && <span>👤 {task.client}</span>}
                  {task.deal_value != null && (
                    <span>💰 {money(task.deal_value)}</span>
                  )}
                  <span className={`badge pri-${task.priority}`}>
                    {task.priority}
                  </span>
                  <span className={`badge status-${task.status}`}>
                    {task.status}
                  </span>
                  {task.follow_up_date && (
                    <span className={overdue ? "overdue" : ""}>
                      📅 {task.follow_up_date}
                      {overdue ? " (overdue)" : ""}
                    </span>
                  )}
                </div>
                {task.notes && <div className="task-notes">{task.notes}</div>}
              </div>
              <div className="task-actions">
                <button
                  className="icon-btn"
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })
      )}
    </main>
  );
}
