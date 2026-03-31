import { useState, useEffect } from "react";

// ─── Storage (localStorage) ───────────────────────────────────────────────────
const STORE = {
  get(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

// ─── Utilities ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22 }) => {
  const paths = {
    dumbbell: "M6.5 6.5h11M6.5 17.5h11M4 10h2v4H4zM18 10h2v4h-2zM6 8h2v8H6zM16 8h2v8h-2z",
    plus: "M12 5v14M5 12h14",
    trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    check: "M20 6L9 17l-5-5",
    x: "M18 6L6 18M6 6l12 12",
    history: "M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
    chart: "M18 20V10M12 20V4M6 20v-6",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #13131a;
    --surface2: #1c1c26;
    --border: #2a2a38;
    --accent: #7c6aff;
    --accent2: #a78bfa;
    --green: #34d399;
    --red: #f87171;
    --yellow: #fbbf24;
    --text: #f0f0f5;
    --text2: #9090aa;
    --text3: #5a5a72;
    --radius: 14px;
    --radius-sm: 8px;
    --transition: 0.18s ease;
  }

  html, body, #root {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }

  .app {
    max-width: 440px;
    margin: 0 auto;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding-bottom: 80px;
  }

  label { font-size: 12px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  input, select {
    background: var(--bg);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    width: 100%;
    outline: none;
    transition: border-color var(--transition);
    -webkit-appearance: none;
  }
  input:focus, select:focus { border-color: var(--accent); }
  input::placeholder { color: var(--text3); }
  select option { background: var(--surface); }

  .btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px 20px; border-radius: var(--radius-sm);
    font-size: 15px; font-weight: 600; cursor: pointer; border: none;
    transition: all var(--transition); width: 100%;
    font-family: 'DM Sans', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:active { opacity: 0.85; transform: scale(0.98); }
  .btn-ghost { background: var(--surface2); color: var(--text2); }
  .btn-ghost:active { background: var(--border); }
  .btn-danger { background: rgba(248,113,113,0.12); color: var(--red); }
  .btn-danger:active { background: rgba(248,113,113,0.22); }
  .btn-sm { padding: 8px 14px; font-size: 13px; border-radius: var(--radius-sm); width: auto; }
  .btn-icon { width: 36px; height: 36px; padding: 0; border-radius: var(--radius-sm); flex-shrink: 0; }

  .header {
    padding: 52px 20px 14px;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0;
    background: var(--bg); z-index: 10;
    display: flex; align-items: center; gap: 10px;
  }
  .header-icon {
    width: 32px; height: 32px; border-radius: 9px;
    background: var(--accent); display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: 0 0 16px rgba(124,106,255,0.35);
  }
  .header-title { font-size: 18px; font-weight: 700; }

  .bottom-nav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 440px;
    background: var(--surface); border-top: 1px solid var(--border);
    display: flex; z-index: 20;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .nav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 10px 4px 14px; gap: 4px;
    cursor: pointer; border: none; background: transparent;
    color: var(--text3); font-size: 11px; font-weight: 500;
    font-family: 'DM Sans', sans-serif; transition: color var(--transition);
    -webkit-tap-highlight-color: transparent;
  }
  .nav-item.active { color: var(--accent); }

  .page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 14px; }

  .exercise-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .exercise-name { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-actions { display: flex; gap: 8px; flex-shrink: 0; }
  .inline-edit { display: flex; gap: 8px; flex: 1; }
  .inline-edit input { flex: 1; }

  .log-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; }
  .log-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .log-exercise { font-size: 15px; font-weight: 600; }
  .log-date { font-size: 11px; color: var(--text3); text-align: right; line-height: 1.5; }
  .log-stats { display: flex; gap: 8px; flex-wrap: wrap; }
  .log-badge { background: var(--surface2); border-radius: 6px; padding: 5px 10px; font-size: 13px; font-weight: 500; font-family: 'DM Mono', monospace; }
  .log-badge.green { color: var(--green); }

  .stat-row { display: flex; gap: 10px; }
  .stat-chip { flex: 1; background: var(--surface2); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; gap: 4px; }
  .stat-chip .label { font-size: 11px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-chip .val { font-size: 22px; font-weight: 700; font-family: 'DM Mono', monospace; }
  .stat-chip .unit { font-size: 12px; color: var(--text2); font-weight: 400; }
  .val.green { color: var(--green); }
  .val.yellow { color: var(--yellow); }

  .progress-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .progress-card-header { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 15px; font-weight: 600; }
  .progress-card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
  .timeline { display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto; }
  .timeline::-webkit-scrollbar { width: 3px; }
  .timeline::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .timeline-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
  .timeline-date { color: var(--text2); }
  .timeline-val { font-family: 'DM Mono', monospace; font-weight: 500; }
  .pr-badge { color: var(--yellow); font-size: 10px; font-weight: 700; background: rgba(251,191,36,0.12); padding: 2px 6px; border-radius: 4px; margin-left: 6px; }

  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); }
  .divider { height: 1px; background: var(--border); }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .scroll-list { display: flex; flex-direction: column; gap: 10px; }
  .empty { text-align: center; padding: 48px 24px; color: var(--text3); display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .empty p { font-size: 14px; line-height: 1.6; }

  .toast {
    position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
    background: var(--green); color: #0a0a0f;
    padding: 12px 20px; border-radius: var(--radius-sm);
    font-size: 14px; font-weight: 600; z-index: 999;
    box-shadow: 0 4px 24px rgba(52,211,153,0.3);
    animation: slideDown 0.22s ease; white-space: nowrap;
  }
  .toast.error { background: var(--red); color: white; }
  @keyframes slideDown { from { opacity:0; transform: translateX(-50%) translateY(-10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 50; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s ease; }
  .modal { background: var(--surface); border-radius: 20px 20px 0 0; padding: 24px 20px 40px; width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 14px; animation: slideUp 0.22s ease; padding-bottom: calc(40px + env(safe-area-inset-bottom)); }
  .modal-title { font-size: 17px; font-weight: 700; }
  .modal-sub { font-size: 14px; color: var(--text2); }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { transform: translateY(30px); opacity:0; } to { transform: translateY(0); opacity:1; } }
`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }, []);
  return <div className={`toast${type === "error" ? " error" : ""}`}>{msg}</div>;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("exercises");
  const [exercises, setExercises] = useState(() => STORE.get("exercises") || []);
  const [logs, setLogs] = useState(() => STORE.get("logs") || []);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = "ok") => setToast({ msg, type });

  const saveExercises = (list) => { setExercises(list); STORE.set("exercises", list); };
  const saveLogs = (list) => { setLogs(list); STORE.set("logs", list); };

  const addExercise = (name) => { saveExercises([...exercises, { id: uid(), name, createdAt: now() }]); notify("Exercício adicionado!"); };
  const editExercise = (id, name) => { saveExercises(exercises.map(e => e.id === id ? { ...e, name } : e)); notify("Nome atualizado!"); };
  const deleteExercise = (id) => { saveExercises(exercises.filter(e => e.id !== id)); notify("Exercício removido"); };
  const addLog = (entry) => { saveLogs([{ id: uid(), ...entry, createdAt: now() }, ...logs]); notify("Treino registrado! 🔥"); };
  const deleteLog = (id) => { saveLogs(logs.filter(l => l.id !== id)); notify("Registro removido"); };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="header-icon"><Icon name="dumbbell" size={18} /></div>
          <span className="header-title">
            {tab === "exercises" && "Exercícios"}
            {tab === "log" && "Registrar Treino"}
            {tab === "history" && "Histórico"}
            {tab === "progress" && "Evolução"}
          </span>
        </div>

        {tab === "exercises" && <ExercisesPage exercises={exercises} onAdd={addExercise} onEdit={editExercise} onDelete={deleteExercise} />}
        {tab === "log" && <LogPage exercises={exercises} onAdd={addLog} />}
        {tab === "history" && <HistoryPage logs={logs} exercises={exercises} onDelete={deleteLog} />}
        {tab === "progress" && <ProgressPage logs={logs} exercises={exercises} />}

        <nav className="bottom-nav">
          {[
            { key: "exercises", icon: "dumbbell", label: "Exercícios" },
            { key: "log", icon: "plus", label: "Registrar" },
            { key: "history", icon: "history", label: "Histórico" },
            { key: "progress", icon: "chart", label: "Evolução" },
          ].map(n => (
            <button key={n.key} className={`nav-item${tab === n.key ? " active" : ""}`} onClick={() => setTab(n.key)}>
              <Icon name={n.icon} size={20} />
              {n.label}
            </button>
          ))}
        </nav>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}

// ─── Exercises Page ───────────────────────────────────────────────────────────
function ExercisesPage({ exercises, onAdd, onEdit, onDelete }) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [confirm, setConfirm] = useState(null);

  const handleAdd = () => { if (!newName.trim()) return; onAdd(newName.trim()); setNewName(""); };
  const handleEdit = (id) => { if (!editName.trim()) return; onEdit(id, editName.trim()); setEditId(null); };

  return (
    <div className="page">
      <div className="card">
        <div className="field"><label>Novo exercício</label></div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="ex: Supino reto, Agachamento..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
          <button className="btn btn-primary btn-icon" onClick={handleAdd} style={{ width: 48, flexShrink: 0 }}><Icon name="plus" size={20} /></button>
        </div>
      </div>

      <p className="section-title">{exercises.length} exercício{exercises.length !== 1 ? "s" : ""}</p>

      {exercises.length === 0 ? (
        <div className="empty"><Icon name="dumbbell" size={40} /><p>Nenhum exercício ainda.<br />Adicione o primeiro acima!</p></div>
      ) : (
        <div className="scroll-list">
          {exercises.map(ex => (
            <div key={ex.id} className="exercise-item">
              {editId === ex.id ? (
                <div className="inline-edit">
                  <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEdit(ex.id)} autoFocus />
                  <button className="btn btn-primary btn-icon btn-sm" onClick={() => handleEdit(ex.id)}><Icon name="check" size={16} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditId(null)}><Icon name="x" size={16} /></button>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="exercise-name">{ex.name}</div></div>
                  <div className="card-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditId(ex.id); setEditName(ex.name); }}><Icon name="edit" size={15} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirm(ex.id)}><Icon name="trash" size={15} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title">Excluir exercício?</p>
            <p className="modal-sub">Essa ação não pode ser desfeita.</p>
            <button className="btn btn-danger" onClick={() => { onDelete(confirm); setConfirm(null); }}><Icon name="trash" size={16} /> Excluir</button>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Log Page ─────────────────────────────────────────────────────────────────
function LogPage({ exercises, onAdd }) {
  const [exId, setExId] = useState("");
  const [load, setLoad] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!exId || !load) return;
    onAdd({ exerciseId: exId, load: parseFloat(load), sets: parseInt(sets), reps: parseInt(reps), note });
    setDone(true);
    setTimeout(() => setDone(false), 1800);
    setLoad(""); setNote("");
  };

  if (exercises.length === 0) return (
    <div className="page">
      <div className="empty"><Icon name="dumbbell" size={40} /><p>Cadastre exercícios primeiro<br />na aba "Exercícios".</p></div>
    </div>
  );

  return (
    <div className="page">
      <div className="card">
        <div className="field">
          <label>Exercício</label>
          <select value={exId} onChange={e => setExId(e.target.value)}>
            <option value="">— Selecione —</option>
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Carga (kg)</label>
          <input type="number" placeholder="ex: 60" value={load} onChange={e => setLoad(e.target.value)} inputMode="decimal" />
        </div>
        <div className="grid2">
          <div className="field">
            <label>Séries</label>
            <input type="number" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} inputMode="numeric" />
          </div>
          <div className="field">
            <label>Repetições</label>
            <input type="number" placeholder="12" value={reps} onChange={e => setReps(e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <div className="field">
          <label>Observação (opcional)</label>
          <input placeholder="ex: boa forma, cansado..." value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <button
          className="btn btn-primary"
          onClick={submit}
          disabled={!exId || !load}
          style={done ? { background: "var(--green)", color: "#0a0a0f" } : (!exId || !load) ? { opacity: 0.45 } : {}}
        >
          {done ? <><Icon name="check" size={16} /> Registrado!</> : <><Icon name="save" size={16} /> Salvar treino</>}
        </button>
      </div>
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────────────────────
function HistoryPage({ logs, exercises, onDelete }) {
  const [confirm, setConfirm] = useState(null);
  const exMap = Object.fromEntries(exercises.map(e => [e.id, e.name]));

  return (
    <div className="page">
      <p className="section-title">{logs.length} registro{logs.length !== 1 ? "s" : ""}</p>
      {logs.length === 0 ? (
        <div className="empty"><Icon name="history" size={40} /><p>Nenhum treino registrado ainda.<br />Use a aba "Registrar" para começar!</p></div>
      ) : (
        <div className="scroll-list">
          {logs.map(log => (
            <div key={log.id} className="log-item">
              <div className="log-header">
                <div className="log-exercise">{exMap[log.exerciseId] || "Exercício removido"}</div>
                <div className="log-date">{fmtDate(log.createdAt)}<br />{fmtTime(log.createdAt)}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="log-stats">
                  <span className="log-badge green">{log.load} kg</span>
                  <span className="log-badge">{log.sets} séries</span>
                  <span className="log-badge">{log.reps} reps</span>
                </div>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirm(log.id)}><Icon name="trash" size={14} /></button>
              </div>
              {log.note && <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>📝 {log.note}</p>}
            </div>
          ))}
        </div>
      )}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title">Excluir registro?</p>
            <button className="btn btn-danger" onClick={() => { onDelete(confirm); setConfirm(null); }}>Excluir</button>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Progress Page ────────────────────────────────────────────────────────────
function ProgressPage({ logs, exercises }) {
  const exMap = Object.fromEntries(exercises.map(e => [e.id, e.name]));
  const byEx = {};
  logs.forEach(l => { if (!byEx[l.exerciseId]) byEx[l.exerciseId] = []; byEx[l.exerciseId].push(l); });
  const exIds = Object.keys(byEx);

  if (exIds.length === 0) return (
    <div className="page">
      <div className="empty"><Icon name="chart" size={40} /><p>Registre treinos para ver<br />sua evolução aqui!</p></div>
    </div>
  );

  return (
    <div className="page">
      {exIds.map(id => {
        const entries = [...byEx[id]].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const last = entries[entries.length - 1];
        const best = entries.reduce((a, b) => b.load > a.load ? b : a, entries[0]);
        const prev = entries.length >= 2 ? entries[entries.length - 2] : null;
        const delta = prev ? +(last.load - prev.load).toFixed(1) : 0;

        return (
          <div key={id} className="progress-card">
            <div className="progress-card-header">{exMap[id] || "Exercício removido"}</div>
            <div className="progress-card-body">
              <div className="stat-row">
                <div className="stat-chip">
                  <span className="label">Última carga</span>
                  <span className="val green">{last.load}<span className="unit"> kg</span></span>
                  {delta !== 0 && <span style={{ fontSize: 11, color: delta > 0 ? "var(--green)" : "var(--red)" }}>{delta > 0 ? "+" : ""}{delta} kg vs anterior</span>}
                </div>
                <div className="stat-chip">
                  <span className="label">Melhor carga</span>
                  <span className="val yellow">{best.load}<span className="unit"> kg</span></span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{fmtDate(best.createdAt)}</span>
                </div>
              </div>
              {entries.length > 1 && (
                <>
                  <div className="divider" />
                  <p className="section-title">Histórico</p>
                  <div className="timeline">
                    {[...entries].reverse().map(e => (
                      <div key={e.id} className="timeline-row">
                        <span className="timeline-date">{fmtDate(e.createdAt)}</span>
                        <span className="timeline-val">
                          {e.load} kg · {e.sets}×{e.reps}
                          {e.id === best.id && <span className="pr-badge">PR</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
