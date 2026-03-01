import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, LineChart, Line, Cell
} from "recharts";

const TODAY = new Date().toISOString().split("T")[0];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDayKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => getDayKey(6 - i));
}

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => getDayKey(29 - i));
}

function getStreak(completions = {}) {
  let streak = 0, offset = 0;
  while (completions[getDayKey(offset)]) { streak++; offset++; }
  return streak;
}

function getTotalCompletions(completions = {}) {
  return Object.values(completions).filter(Boolean).length;
}

const EMOJIS = ["⚡","🏃","📚","💧","🧘","🎯","💪","🥗","😴","🖥️","✍️","🎸","🧠","🌿","☕"];
const BLUE = "#2563eb";
const BLUE_LIGHT = "#eff6ff";
// ← PASTE CustomTick HERE, outside the component
const CustomTick = ({ x, y, payload }) => (
  <text x={x - 4} y={y} dy={4} textAnchor="end" fontSize={10} fill="#334155" dominantBaseline="middle">
    {payload.value}
  </text>
);


export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [view, setView] = useState("dashboard");
  const [newHabit, setNewHabit] = useState({ name: "", emoji: "⚡" });
  const [newGoal, setNewGoal] = useState({ name: "", target: "", unit: "", current: "" });
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const h = localStorage.getItem("habits_v2");
    if (h) setHabits(JSON.parse(h));
    const g = localStorage.getItem("goals_v2");
    if (g) setGoals(JSON.parse(g));
    setLoaded(true);
  }, []);

  const saveHabits = useCallback((data) => {
    setHabits(data);
    localStorage.setItem("habits_v2", JSON.stringify(data));
  }, []);

  const saveGoals = useCallback((data) => {
    setGoals(data);
    localStorage.setItem("goals_v2", JSON.stringify(data));
  }, []);

  const toggleHabit = (id) => {
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const completions = { ...h.completions };
      completions[TODAY] = !completions[TODAY];
      return { ...h, completions };
    });
    saveHabits(updated);
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    saveHabits([...habits, { id: Date.now().toString(), ...newHabit, completions: {}, createdAt: TODAY }]);
    setNewHabit({ name: "", emoji: "⚡" });
    setShowHabitForm(false);
  };

  const addGoal = () => {
    if (!newGoal.name.trim() || !newGoal.target) return;
    saveGoals([...goals, { id: Date.now().toString(), ...newGoal, current: Number(newGoal.current) || 0, target: Number(newGoal.target), createdAt: TODAY }]);
    setNewGoal({ name: "", target: "", unit: "", current: "" });
    setShowGoalForm(false);
  };

  const updateGoalProgress = (id, val) => {
    saveGoals(goals.map(g => g.id === id ? { ...g, current: Math.min(Number(val), g.target) } : g));
  };

  const last7 = getLast7Days();
  const last30 = getLast30Days();
  const todayDone = habits.filter(h => h.completions[TODAY]).length;
  const totalHabits = habits.length;
  const completedGoals = goals.filter(g => g.current >= g.target).length;
  const overallStreak = habits.length > 0 ? Math.max(...habits.map(h => getStreak(h.completions))) : 0;

  const weeklyData = last7.map(day => {
    const d = new Date(day + "T12:00:00");
    const done = habits.filter(h => h.completions[day]).length;
    return { day: WEEKDAYS[d.getDay()].slice(0,3), rate: habits.length > 0 ? Math.round((done / habits.length) * 100) : 0, isToday: day === TODAY };
  });

  const monthlyData = last30.map((day, i) => ({
    idx: i + 1,
    completed: habits.filter(h => h.completions[day]).length
  }));

  const goalsRadial = goals.slice(0, 5).map((g, i) => ({
    name: g.name,
    value: Math.round((g.current / g.target) * 100),
    fill: ["#2563eb","#7c3aed","#0891b2","#059669","#d97706"][i % 5],
  }));

  const COLORS = [BLUE, "#7c3aed", "#0891b2", "#059669", "#d97706", "#e11d48", "#6366f1"];

  if (!loaded) return (
    <div style={{ background: "#f8fafc", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${BLUE}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <span style={{ color: "#94a3b8", fontFamily: "Inter, sans-serif", fontSize: "0.85rem" }}>Loading...</span>
      </div>
    </div>
  );

  const NAV = [
    { id: "dashboard", label: "Dashboard" },
    { id: "habits", label: "Habits" },
    { id: "goals", label: "Goals" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #f1f5f9; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }
        .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04); }
        .input { background: #f8fafc; border: 1.5px solid #e2e8f0; color: #0f172a; font-family: inherit; padding: 10px 14px; font-size: 0.875rem; outline: none; border-radius: 10px; width: 100%; transition: all 0.15s; }
        .input:focus { border-color: ${BLUE}; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .btn-primary { background: ${BLUE}; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-family: inherit; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
        .btn-ghost { background: transparent; color: #64748b; border: 1.5px solid #e2e8f0; padding: 10px 18px; border-radius: 10px; font-family: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .btn-ghost:hover { border-color: #94a3b8; }
        .habit-row { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
        .habit-row:hover { background: #fafbff; }
        .habit-row:last-child { border-bottom: none; }
        .check { width: 24px; height: 24px; border: 2px solid #cbd5e1; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; transition: all 0.2s; }
        .check.done { border-color: ${BLUE}; background: ${BLUE}; color: #fff; }
        .check:not(.done):hover { border-color: ${BLUE}; }
        .add-btn { display: flex; align-items: center; gap: 10px; padding: 12px 20px; font-size: 0.875rem; color: ${BLUE}; border: 2px dashed #bfdbfe; border-radius: 12px; cursor: pointer; background: ${BLUE_LIGHT}; width: 100%; text-align: left; font-family: inherit; font-weight: 500; transition: all 0.15s; }
        .add-btn:hover { border-color: ${BLUE}; background: #dbeafe; }
        .del { color: #cbd5e1; font-size: 0.75rem; cursor: pointer; background: none; border: none; padding: 6px; border-radius: 6px; transition: all 0.15s; }
        .del:hover { color: #ef4444; background: #fef2f2; }
        .nav-btn { padding: 8px 16px; border-radius: 9px; cursor: pointer; font-size: 0.875rem; font-weight: 500; border: none; font-family: inherit; transition: all 0.15s; }
        .nav-btn.on { background: ${BLUE_LIGHT}; color: ${BLUE}; font-weight: 600; }
        .nav-btn.off { background: transparent; color: #64748b; }
        .nav-btn.off:hover { background: #f1f5f9; color: #334155; }
        .emoji-opt { width: 36px; height: 36px; border: 2px solid #e2e8f0; border-radius: 9px; cursor: pointer; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: all 0.12s; }
        .emoji-opt.sel { border-color: ${BLUE}; background: ${BLUE_LIGHT}; }
        .emoji-opt:hover { border-color: #93c5fd; }
        .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
        .slabel { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fu { animation: fadeUp 0.22s ease; }
      `}</style>

      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 62, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: BLUE, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1rem" }}>H</div>
          <span style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>HabitFlow</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id} className={`nav-btn ${view === n.id ? "on" : "off"}`} onClick={() => setView(n.id)}>{n.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.82rem" }} onClick={() => { setView("habits"); setShowHabitForm(true); }}>+ Add Habit</button>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.8rem" }}>U</div>
        </div>
      </nav>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div className="fu">
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} 👋
              </h1>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: 4 }}>Here's your habit overview for today.</p>
            </div>

            {/* Stat row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { label: "Today's Progress", value: totalHabits > 0 ? `${todayDone}/${totalHabits}` : "—", sub: "habits done", color: BLUE, bg: BLUE_LIGHT },
                { label: "Best Streak", value: overallStreak || "—", sub: "days in a row", color: "#7c3aed", bg: "#f5f3ff" },
                { label: "Goals", value: goals.length > 0 ? `${completedGoals}/${goals.length}` : "—", sub: "achieved", color: "#0891b2", bg: "#ecfeff" },
                { label: "Total Check-ins", value: habits.reduce((a, h) => a + getTotalCompletions(h.completions), 0) || "—", sub: "all time", color: "#059669", bg: "#ecfdf5" },
              ].map(s => (
                <div key={s.label} className="card shadow" style={{ padding: "20px 22px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize: "1.9rem", fontWeight: 800, color: s.color, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 5 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Weekly bar chart */}
              <div className="card shadow" style={{ padding: "22px 24px" }}>
                <div className="slabel">Weekly Completion Rate</div>
                <ResponsiveContainer width="100%" height={195}>
                  <BarChart data={weeklyData} barSize={32} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => [`${v}%`, "Rate"]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#fff", fontSize: "0.8rem" }} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="rate" radius={[6,6,0,0]}>
                      {weeklyData.map((e, i) => <Cell key={i} fill={e.isToday ? BLUE : "#bfdbfe"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Today list */}
              <div className="card shadow" style={{ padding: "22px 24px" }}>
                <div className="slabel">Today's Habits</div>
                {habits.length === 0 ? (
                  <div style={{ color: "#cbd5e1", fontSize: "0.85rem", textAlign: "center", paddingTop: 50 }}>No habits yet</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {habits.slice(0, 7).map(h => (
                      <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => toggleHabit(h.id)}>
                        <div className={`check ${h.completions[TODAY] ? "done" : ""}`}>{h.completions[TODAY] && "✓"}</div>
                        <span style={{ fontSize: "1rem" }}>{h.emoji}</span>
                        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: h.completions[TODAY] ? "#94a3b8" : "#334155", textDecoration: h.completions[TODAY] ? "line-through" : "none" }}>{h.name}</span>
                        {getStreak(h.completions) > 1 && <span className="badge" style={{ background: "#fff7ed", color: "#ea580c" }}>🔥{getStreak(h.completions)}</span>}
                      </div>
                    ))}
                    {habits.length > 7 && <div style={{ fontSize: "0.74rem", color: "#94a3b8", textAlign: "center" }}>+{habits.length - 7} more</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Goals mini-grid */}
            {goals.length > 0 && (
              <div className="card shadow" style={{ padding: "22px 24px" }}>
                <div className="slabel">Goals at a Glance</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: 12 }}>
                  {goals.map((g, i) => {
                    const pct = Math.min((g.current / g.target) * 100, 100);
                    const c = COLORS[i % COLORS.length];
                    return (
                      <div key={g.id} style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                        <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 3, transition: "width 0.4s" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{g.current}/{g.target} {g.unit}</span>
                          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: c }}>{Math.round(pct)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HABITS */}
        {view === "habits" && (
          <div className="fu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em" }}>My Habits</h2>
                <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: 3 }}>{todayDone}/{totalHabits} completed today</p>
              </div>
              {!showHabitForm && <button className="btn-primary" onClick={() => setShowHabitForm(true)}>+ New Habit</button>}
            </div>

            {showHabitForm && (
              <div className="card shadow fu" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 14 }}>New Habit</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "#64748b", marginBottom: 8 }}>ICON</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {EMOJIS.map(e => <button key={e} className={`emoji-opt ${newHabit.emoji === e ? "sel" : ""}`} onClick={() => setNewHabit(p => ({ ...p, emoji: e }))}>{e}</button>)}
                  </div>
                </div>
                <input className="input" style={{ marginBottom: 12 }} placeholder="Habit name..." value={newHabit.name} onChange={e => setNewHabit(p => ({ ...p, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && addHabit()} autoFocus />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={addHabit}>Add Habit</button>
                  <button className="btn-ghost" onClick={() => setShowHabitForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="card shadow" style={{ overflow: "hidden" }}>
              {habits.length > 0 && (
                <div style={{ display: "flex", padding: "10px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", gap: 4, marginRight: 28 }}>
                    {last7.map(day => {
                      const d = new Date(day + "T12:00:00");
                      return <div key={day} style={{ width: 24, textAlign: "center", fontSize: "0.62rem", fontWeight: 700, color: day === TODAY ? BLUE : "#94a3b8" }}>{WEEKDAYS[d.getDay()].slice(0,1)}</div>;
                    })}
                  </div>
                </div>
              )}
              {habits.length === 0 && (
                <div style={{ padding: "64px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✨</div>
                  <div style={{ fontWeight: 600, color: "#334155", marginBottom: 6 }}>No habits yet</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Click "New Habit" to get started</div>
                </div>
              )}
              {habits.map(habit => {
                const streak = getStreak(habit.completions);
                const done = habit.completions[TODAY];
                return (
                  <div key={habit.id} className="habit-row">
                    <div className={`check ${done ? "done" : ""}`} onClick={() => toggleHabit(habit.id)}>{done && "✓"}</div>
                    <span style={{ fontSize: "1.15rem" }}>{habit.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: done ? "#94a3b8" : "#1e293b", textDecoration: done ? "line-through" : "none" }}>{habit.name}</div>
                      {streak > 0 && <div style={{ fontSize: "0.72rem", color: "#f97316", marginTop: 2, fontWeight: 500 }}>🔥 {streak} day streak</div>}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {last7.map(day => (
                        <div key={day} style={{ width: 24, height: 24, borderRadius: 6, background: habit.completions[day] ? BLUE : day === TODAY ? BLUE_LIGHT : "#f1f5f9", border: `1.5px solid ${day === TODAY ? "#bfdbfe" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {habit.completions[day] && <span style={{ color: "#fff", fontSize: "0.6rem", fontWeight: 700 }}>✓</span>}
                        </div>
                      ))}
                    </div>
                    <button className="del" onClick={() => saveHabits(habits.filter(h => h.id !== habit.id))}>✕</button>
                  </div>
                );
              })}
            </div>
            {!showHabitForm && (
              <button className="add-btn" style={{ marginTop: 12 }} onClick={() => setShowHabitForm(true)}>
                <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>+</span> Add a new habit
              </button>
            )}
          </div>
        )}

        {/* GOALS */}
        {view === "goals" && (
          <div className="fu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em" }}>My Goals</h2>
                <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: 3 }}>{completedGoals} of {goals.length} achieved</p>
              </div>
              {!showGoalForm && <button className="btn-primary" onClick={() => setShowGoalForm(true)}>+ New Goal</button>}
            </div>

            {showGoalForm && (
              <div className="card shadow fu" style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 14 }}>New Goal</div>
                <input className="input" style={{ marginBottom: 10 }} placeholder="Goal name (e.g. Read 12 books)" value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} autoFocus />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <input className="input" type="number" placeholder="Target (e.g. 12)" value={newGoal.target} onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))} />
                  <input className="input" placeholder="Unit (e.g. books, km)" value={newGoal.unit} onChange={e => setNewGoal(p => ({ ...p, unit: e.target.value }))} />
                </div>
                <input className="input" style={{ marginBottom: 14 }} type="number" placeholder="Starting progress (optional)" value={newGoal.current} onChange={e => setNewGoal(p => ({ ...p, current: e.target.value }))} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={addGoal}>Add Goal</button>
                  <button className="btn-ghost" onClick={() => setShowGoalForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {goals.length === 0 && (
                <div className="card" style={{ padding: "60px 20px", textAlign: "center", gridColumn: "1/-1" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🎯</div>
                  <div style={{ fontWeight: 600, color: "#334155", marginBottom: 6 }}>No goals yet</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Set a measurable goal and track your way there</div>
                </div>
              )}
              {goals.map((goal, i) => {
                const pct = Math.min((goal.current / goal.target) * 100, 100);
                const done = pct >= 100;
                const c = COLORS[i % COLORS.length];
                const r = 36;
                const circ = 2 * Math.PI * r;
                return (
                  <div key={goal.id} className="card shadow" style={{ padding: 22 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{goal.name}</span>
                          {done && <span className="badge" style={{ background: "#dcfce7", color: "#16a34a" }}>✓ Done</span>}
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{goal.current} / {goal.target} {goal.unit}</span>
                      </div>
                      <button className="del" onClick={() => saveGoals(goals.filter(g => g.id !== goal.id))}>✕</button>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                      <svg width="92" height="92" viewBox="0 0 92 92">
                        <circle cx="46" cy="46" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
                        <circle cx="46" cy="46" r={r} fill="none" stroke={c} strokeWidth="9"
                          strokeDasharray={circ}
                          strokeDashoffset={circ * (1 - pct / 100)}
                          strokeLinecap="round"
                          transform="rotate(-90 46 46)"
                          style={{ transition: "stroke-dashoffset 0.5s ease" }}
                        />
                        <text x="46" y="50" textAnchor="middle" fontSize="14" fontWeight="800" fill={c} fontFamily="Inter,sans-serif">{Math.round(pct)}%</text>
                      </svg>
                    </div>
                    <input type="range" min={0} max={goal.target} value={goal.current}
                      onChange={e => updateGoalProgress(goal.id, e.target.value)}
                      style={{ width: "100%", accentColor: c, cursor: "pointer" }} />
                    <div style={{ fontSize: "0.74rem", color: "#94a3b8", textAlign: "center", marginTop: 6 }}>Drag to update progress</div>
                  </div>
                );
              })}
            </div>
            {!showGoalForm && (
              <button className="add-btn" style={{ marginTop: 14 }} onClick={() => setShowGoalForm(true)}>
                <span style={{ fontSize: "1.3rem" }}>+</span> Add a new goal
              </button>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {view === "analytics" && (
          <div className="fu">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Analytics</h2>
              <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: 3 }}>Your performance insights</p>
            </div>

            {habits.length === 0 && goals.length === 0 ? (
              <div className="card" style={{ padding: "80px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: 14 }}>📊</div>
                <div style={{ fontWeight: 600, color: "#334155", marginBottom: 6 }}>No data yet</div>
                <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Add habits and goals to unlock your analytics</div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {/* 30-day line */}
                  <div className="card shadow" style={{ padding: "22px 24px" }}>
                    <div className="slabel">30-Day Activity</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={6} tickFormatter={v => `Day ${v}`} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={v => [v, "Habits done"]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#fff", fontSize: "0.8rem" }} />
                        <Line type="monotone" dataKey="completed" stroke={BLUE} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: BLUE }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Per-habit bars */}
                  <div className="card shadow" style={{ padding: "22px 24px" }}>
                    <div className="slabel">All-Time Check-ins per Habit</div>
                    {habits.length === 0 ? (
                      <div style={{ color: "#cbd5e1", fontSize: "0.85rem", textAlign: "center", paddingTop: 60 }}>No habits</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart layout="vertical"
                          data={habits.slice(0, 7).map(h => ({ name: `${h.emoji} ${h.name.slice(0, 11)}`, total: getTotalCompletions(h.completions) }))}
                          margin={{ top: 4, right: 20, left: 0, bottom: 0 }} barSize={14}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }}  axisLine={false} tickLine={false} allowDecimals={false} tickCount={5}/>
                          <YAxis type="category" dataKey="name"  tick={<CustomTick />} axisLine={false} tickLine={false} width={140} />
                          <Tooltip formatter={v => [v, "Check-ins"]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#fff", fontSize: "0.8rem" }} />
                          <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                            {habits.slice(0, 7).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Goals radial + bars */}
                {goals.length > 0 && (
                  <div className="card shadow" style={{ padding: "22px 24px", marginBottom: 16 }}>
                    <div className="slabel">Goals Progress</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                      <ResponsiveContainer width={200} height={200}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="28%" outerRadius="88%" data={goalsRadial} startAngle={90} endAngle={-270}>
                          <RadialBar dataKey="value" cornerRadius={5} background={{ fill: "#f1f5f9" }} />
                          <Tooltip formatter={v => [`${v}%`, "Progress"]} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#fff", fontSize: "0.8rem" }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                        {goals.map((g, i) => {
                          const pct = Math.min((g.current / g.target) * 100, 100);
                          const c = COLORS[i % COLORS.length];
                          return (
                            <div key={g.id}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: "0.84rem", fontWeight: 500, color: "#334155" }}>{g.name}</span>
                                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: c }}>{Math.round(pct)}%</span>
                              </div>
                              <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 3, transition: "width 0.4s" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Streak leaderboard */}
                {habits.length > 0 && (
                  <div className="card shadow" style={{ padding: "22px 24px" }}>
                    <div className="slabel">Streak Leaderboard</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[...habits].sort((a, b) => getStreak(b.completions) - getStreak(a.completions)).slice(0, 5).map((h, i) => {
                        const streak = getStreak(h.completions);
                        const total = getTotalCompletions(h.completions);
                        const medals = ["🥇","🥈","🥉","4","5"];
                        return (
                          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: i === 0 ? BLUE_LIGHT : "#f8fafc", borderRadius: 10, border: `1px solid ${i === 0 ? "#bfdbfe" : "#f1f5f9"}` }}>
                            <span style={{ fontSize: i < 3 ? "1.1rem" : "0.85rem", fontWeight: 700, color: "#94a3b8", width: 22, textAlign: "center" }}>{medals[i]}</span>
                            <span style={{ fontSize: "1.1rem" }}>{h.emoji}</span>
                            <span style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem" }}>{h.name}</span>
                            <span className="badge" style={{ background: streak > 0 ? "#fff7ed" : "#f8fafc", color: streak > 0 ? "#ea580c" : "#94a3b8" }}>🔥 {streak}d streak</span>
                            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{total} total</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #e2e8f0", padding: "16px 32px", textAlign: "center", background: "#fff" }}>
        <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>HabitFlow · Your data is saved locally across sessions</span>
      </div>
    </div>
  );
}
