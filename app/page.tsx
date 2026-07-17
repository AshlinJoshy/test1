"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, type Task } from "@/lib/supabaseClient";

const PRIORITIES = ["Low", "Medium", "High"] as const;
const STATUSES = ["Lead", "Contacted", "Proposal", "Won", "Lost"] as const;

const emptyForm = {
  title: "",
  client: "",
  deal_value: "",
  priority: "Medium" as Task["priority"],
  status: "Lead" as Task["status"],
  follow_up_date: "",
  notes: "",
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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

  const todayStr = new Date().toISOString().slice(0, 10);

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
      </div>

      {loading ? (
        <div className="empty">Loading...</div>
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
