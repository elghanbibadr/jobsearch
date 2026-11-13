"use client";

import { useEffect, useState } from "react";

type Priority = "medium" | "high";

type Lead = {
  id: string;
  email: string;
  company: string;
  priority: Priority;
  sent: string; // email 1 sent date
  followUp: string; // follow up date
};

const STORAGE_KEY = "leads-tracker";

function toDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, days: number) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateInput(new Date(y, m - 1, d + days));
}

export default function Page() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "high">("all");

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLeads(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  // save
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {}
  }, [leads, loaded]);

  function addLead(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;

    const exists = leads.some(
      (l) => l.email.trim().toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      setError("This email already exists");
      return;
    }

    const today = toDateInput(new Date());

    setLeads([
      {
        id: crypto.randomUUID(),
        email: clean,
        company: company.trim(),
        priority,
        sent: today,
        followUp: addDays(today, 5),
      },
      ...leads,
    ]);
    setEmail("");
    setCompany("");
    setPriority("medium");
    setError("");
  }

  function update(id: string, patch: Partial<Lead>) {
    setLeads(leads.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function remove(id: string) {
    setLeads(leads.filter((l) => l.id !== id));
  }

  const visible = filter === "high" ? leads.filter((l) => l.priority === "high") : leads;
  const sentCount = leads.filter((l) => l.sent).length;

  return (
    <main className="wrap">
      <style>{css}</style>

      <header>
        <h1>Applications tracker</h1>
        <p className="stats">
          {leads.length} leads · {sentCount} emailed ·{" "}
          {leads.filter((l) => l.priority === "high").length} high priority
        </p>
      </header>

      <form onSubmit={addLead} className="add">
        <div className="field grow">
          <input
            type="text"
            placeholder="Email or link"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={!!error}
          />
          {error && <span className="error">{error}</span>}
        </div>
        <input
          type="text"
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
        >
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Add lead</button>
      </form>

      <div className="tabs">
        <button
          className={filter === "all" ? "on" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "high" ? "on" : ""}
          onClick={() => setFilter("high")}
        >
          High priority
        </button>
      </div>

      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Company</th>
              <th>Priority</th>
              <th>Email 1 sent</th>
              <th>Follow up</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  No leads yet. Add your first email above.
                </td>
              </tr>
            )}
            {visible.map((l) => (
              <tr key={l.id}>
                <td className="mail">{l.email}</td>
                <td>
                  <input
                    className="cell"
                    value={l.company}
                    placeholder="—"
                    onChange={(e) => update(l.id, { company: e.target.value })}
                  />
                </td>
                <td>
                  <select
                    className={`pill ${l.priority}`}
                    value={l.priority}
                    onChange={(e) =>
                      update(l.id, { priority: e.target.value as Priority })
                    }
                  >
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </td>
                <td>
                  <input
                    className="cell"
                    type="date"
                    value={l.sent}
                    onChange={(e) =>
                      update(l.id, {
                        sent: e.target.value,
                        followUp: addDays(e.target.value, 5),
                      })
                    }
                  />
                </td>
                <td>
                  <input
                    className="cell"
                    type="date"
                    value={l.followUp}
                    onChange={(e) => update(l.id, { followUp: e.target.value })}
                  />
                </td>
                <td>
                  <button
                    className="del"
                    onClick={() => remove(l.id)}
                    aria-label={`Delete ${l.email}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const css = `
  :root {
    --paper: #fbfaf8;
    --ink: #1f2328;
    --muted: #6b7075;
    --line: #e5e2db;
    --accent: #2c5f8a;
    --high-bg: #fbe4de;
    --high-ink: #9b3a24;
    --med-bg: #eceae4;
    --med-ink: #4b4f54;
  }
  body { margin: 0; background: var(--paper); color: var(--ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .wrap { max-width: 980px; margin: 0 auto; padding: 48px 20px 80px; }
  h1 { font-size: 28px; margin: 0 0 6px; letter-spacing: -0.01em; }
  .stats { margin: 0 0 28px; color: var(--muted); font-size: 14px; }

  .add { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 28px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .grow { flex: 1 1 260px; }
  input, select, button { font: inherit; }
  .add input, .add select {
    padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px;
    background: #fff; color: var(--ink); min-width: 0;
  }
  .add input[aria-invalid="true"] { border-color: var(--high-ink); }
  .add input:focus, .add select:focus, .cell:focus, .pill:focus-visible,
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .add button {
    padding: 10px 16px; border: 0; border-radius: 8px; background: var(--ink);
    color: #fff; cursor: pointer; font-weight: 600;
  }
  .add button:hover { background: #000; }
  .error { color: var(--high-ink); font-size: 13px; font-weight: 600; }

  .tabs { display: flex; gap: 6px; margin-bottom: 12px; }
  .tabs button {
    padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line);
    background: transparent; color: var(--muted); cursor: pointer; font-size: 14px;
  }
  .tabs button.on { background: var(--ink); border-color: var(--ink); color: #fff; }

  .scroll { overflow-x: auto; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
  table { width: 100%; border-collapse: collapse; min-width: 760px; }
  th { text-align: left; font-size: 13px; font-weight: 600; color: var(--muted);
    padding: 12px 14px; border-bottom: 1px solid var(--line); }
  td { padding: 6px 14px; border-bottom: 1px solid var(--line); font-size: 14px; }
  tr:last-child td { border-bottom: 0; }
  .mail { font-weight: 500; word-break: break-all; }
  .cell { border: 1px solid transparent; background: transparent; padding: 6px 8px;
    border-radius: 6px; width: 100%; color: var(--ink); box-sizing: border-box; }
  .cell:hover { border-color: var(--line); }
  .pill { border: 0; border-radius: 999px; padding: 5px 10px; font-weight: 600;
    font-size: 13px; cursor: pointer; }
  .pill.high { background: var(--high-bg); color: var(--high-ink); }
  .pill.medium { background: var(--med-bg); color: var(--med-ink); }
  .del { border: 0; background: transparent; color: var(--muted); cursor: pointer;
    font-size: 13px; padding: 6px 8px; border-radius: 6px; }
  .del:hover { color: var(--high-ink); background: var(--high-bg); }
  .empty { text-align: center; color: var(--muted); padding: 32px 14px; }
`;