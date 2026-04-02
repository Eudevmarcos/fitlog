import { useState, useEffect } from "react";

const STORE = {
  get(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const isoDay = (iso) => iso.slice(0, 10);

const AVATAR_COLORS = ["#7c6aff","#34d399","#f87171","#fbbf24","#60a5fa","#f472b6","#a78bfa","#fb923c"];
const avatarColor = (name) => AVATAR_COLORS[(name.charCodeAt(0)||0) % AVATAR_COLORS.length];
const avatarInitial = (name) => name.trim().charAt(0).toUpperCase();

const GROUPS = [
  { id:"peito",   label:"Peito",   emoji:"💪" },
  { id:"costas",  label:"Costas",  emoji:"🔙" },
  { id:"pernas",  label:"Pernas",  emoji:"🦵" },
  { id:"ombros",  label:"Ombros",  emoji:"🏋" },
  { id:"biceps",  label:"Biceps",  emoji:"💪" },
  { id:"triceps", label:"Triceps", emoji:"💪" },
  { id:"abdomen", label:"Abdomen", emoji:"🎯" },
  { id:"gluteos", label:"Gluteos", emoji:"🍑" },
  { id:"cardio",  label:"Cardio",  emoji:"❤" },
  { id:"outro",   label:"Outro",   emoji:"⚡" },
];
const groupLabel = (id) => GROUPS.find(g => g.id === id)?.label || id;
const groupEmoji = (id) => GROUPS.find(g => g.id === id)?.emoji || "⚡";

const WEEKDAY_ORDER = [1,2,3,4,5,6,0];
const WEEKDAY_LABELS = {
  0:"Domingo", 1:"Segunda-Feira", 2:"Terca-Feira",
  3:"Quarta-Feira", 4:"Quinta-Feira", 5:"Sexta-Feira", 6:"Sabado"
};

const LEVELS = [
  { lvl:1, name:"Novato",        emoji:"🥚", xpNeeded:0,    color:"#9090aa" },
  { lvl:2, name:"Iniciante",     emoji:"🐣", xpNeeded:50,   color:"#60a5fa" },
  { lvl:3, name:"Guerreiro",     emoji:"⚔",  xpNeeded:150,  color:"#34d399" },
  { lvl:4, name:"Atleta",        emoji:"🏃", xpNeeded:300,  color:"#a78bfa" },
  { lvl:5, name:"Campeao",       emoji:"🏆", xpNeeded:500,  color:"#fbbf24" },
  { lvl:6, name:"Lenda",         emoji:"🔥", xpNeeded:800,  color:"#f97316" },
  { lvl:7, name:"Mestre",        emoji:"💎", xpNeeded:1200, color:"#e879f9" },
  { lvl:8, name:"Imortal",       emoji:"💀", xpNeeded:1800, color:"#f87171" },
  { lvl:9, name:"Deus do Ferro", emoji:"👑", xpNeeded:2500, color:"#fbbf24" },
];

function calcXP(logs) {
  let xp = 0;
  const prSet = new Set();
  const bestLoad = {};
  const sorted = [...logs].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  sorted.forEach(l => {
    xp += 10;
    xp += (l.sets || 1) * 5;
    const effectiveLoad = l.mode === "tempo"
      ? 0
      : l.mode === "unilateral"
        ? Math.max(l.loadR || 0, l.loadL || 0)
        : (l.load || 0);
    if (bestLoad[l.exerciseId] === undefined) {
      bestLoad[l.exerciseId] = effectiveLoad;
    } else if (effectiveLoad > bestLoad[l.exerciseId]) {
      xp += 30;
      prSet.add(l.exerciseId);
      bestLoad[l.exerciseId] = effectiveLoad;
    }
  });
  const uniqueDays = new Set(logs.map(l => isoDay(l.createdAt)));
  xp += uniqueDays.size * 5;
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1] || null;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpNeeded) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }
  const xpInLevel = xp - currentLevel.xpNeeded;
  const xpToNext = nextLevel ? nextLevel.xpNeeded - currentLevel.xpNeeded : 1;
  const progress = nextLevel ? Math.min(100, Math.round((xpInLevel / xpToNext) * 100)) : 100;
  return { xp, currentLevel, nextLevel, progress, xpInLevel, xpToNext, uniqueDays: uniqueDays.size, prs: prSet.size };
}

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
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f; --surface: #13131a; --surface2: #1c1c26; --border: #2a2a38;
    --accent: #7c6aff; --accent2: #a78bfa; --green: #34d399; --red: #f87171;
    --yellow: #fbbf24; --text: #f0f0f5; --text2: #9090aa; --text3: #5a5a72;
    --radius: 14px; --radius-sm: 8px; --transition: 0.18s ease;
  }
  html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
  .app { max-width: 440px; margin: 0 auto; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; padding-bottom: 80px; }
  .profiles-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 60px 24px 40px; gap: 32px; }
  .profiles-logo { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .profiles-logo-icon { width: 64px; height: 64px; border-radius: 18px; background: var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px rgba(124,106,255,0.4); }
  .profiles-logo-name { font-size: 32px; font-weight: 800; letter-spacing: -1.5px; background: linear-gradient(90deg, #fff 0%, var(--accent2) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .profiles-logo-tag { font-size: 13px; color: var(--text2); }
  .profiles-list { width: 100%; display: flex; flex-direction: column; gap: 10px; }
  .profile-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 14px 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: border-color var(--transition); flex: 1; }
  .profile-card:active { border-color: var(--accent); }
  .profile-avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #0a0a0f; flex-shrink: 0; }
  .profile-info { flex: 1; }
  .profile-name { font-size: 16px; font-weight: 600; }
  .profile-meta { font-size: 12px; color: var(--text2); margin-top: 2px; }
  .new-profile-form { width: 100%; display: flex; flex-direction: column; gap: 10px; }
  label { font-size: 12px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  input, select { background: var(--bg); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 16px; width: 100%; outline: none; transition: border-color var(--transition); -webkit-appearance: none; }
  input:focus, select:focus { border-color: var(--accent); }
  input::placeholder { color: var(--text3); }
  select option { background: var(--surface); }
  .btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 20px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; cursor: pointer; border: none; transition: all var(--transition); width: 100%; font-family: 'DM Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:active { opacity: 0.85; transform: scale(0.98); }
  .btn-ghost { background: var(--surface2); color: var(--text2); }
  .btn-ghost:active { background: var(--border); }
  .btn-danger { background: rgba(248,113,113,0.12); color: var(--red); }
  .btn-danger:active { background: rgba(248,113,113,0.22); }
  .btn-green { background: rgba(52,211,153,0.15); color: var(--green); }
  .btn-sm { padding: 8px 14px; font-size: 13px; border-radius: var(--radius-sm); width: auto; }
  .btn-icon { width: 36px; height: 36px; padding: 0; border-radius: var(--radius-sm); flex-shrink: 0; }
  .header { padding: 52px 20px 14px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); z-index: 10; display: flex; align-items: center; gap: 10px; }
  .header-icon { width: 32px; height: 32px; border-radius: 9px; background: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 16px rgba(124,106,255,0.35); }
  .header-title { font-size: 18px; font-weight: 700; flex: 1; }
  .header-avatar { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: #0a0a0f; flex-shrink: 0; cursor: pointer; }
  .logo-wrap { display: flex; align-items: center; gap: 10px; flex: 1; }
  .logo-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(124,106,255,0.45); flex-shrink: 0; }
  .logo-text { display: flex; flex-direction: column; line-height: 1; }
  .logo-name { font-size: 22px; font-weight: 800; letter-spacing: -1px; background: linear-gradient(90deg, #fff 0%, var(--accent2) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .logo-tagline { font-size: 11px; color: var(--text3); font-weight: 500; margin-top: 2px; }
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 440px; background: var(--surface); border-top: 1px solid var(--border); display: flex; z-index: 20; padding-bottom: env(safe-area-inset-bottom); }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 4px 14px; gap: 4px; cursor: pointer; border: none; background: transparent; color: var(--text3); font-size: 11px; font-weight: 500; font-family: 'DM Sans', sans-serif; transition: color var(--transition); -webkit-tap-highlight-color: transparent; }
  .nav-item.active { color: var(--accent); }
  .page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .group-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
  .group-tabs::-webkit-scrollbar { display: none; }
  .group-tab { flex-shrink: 0; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--border); background: transparent; color: var(--text2); font-family: 'DM Sans', sans-serif; transition: all var(--transition); white-space: nowrap; }
  .group-tab.active { background: var(--accent); border-color: var(--accent); color: white; }
  .group-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--surface2); border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 600; color: var(--text2); }
  .exercise-item { background: var(--bg); border-radius: var(--radius-sm); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .exercise-item:not(:last-child) { border-bottom: 1px solid var(--border); }
  .exercise-name { font-size: 15px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
  .card-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .inline-edit { display: flex; gap: 8px; flex: 1; }
  .inline-edit input { flex: 1; }
  .group-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .group-section-header { width: 100%; display: flex; align-items: center; gap: 10px; padding: 15px 16px; background: transparent; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
  .group-section-header:active { background: var(--surface2); }
  .group-section-emoji { font-size: 18px; flex-shrink: 0; }
  .group-section-name { font-size: 15px; font-weight: 600; color: var(--text); flex: 1; text-align: left; }
  .group-section-count { font-size: 11px; color: var(--text3); font-weight: 600; background: var(--surface2); padding: 2px 8px; border-radius: 10px; }
  .group-section-body { display: flex; flex-direction: column; border-top: 1px solid var(--border); }
  .add-inline { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--border); background: var(--surface); }
  .add-inline input { flex: 1; font-size: 14px; padding: 9px 12px; }
  .group-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .group-section-header { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-bottom: 1px solid var(--border); background: var(--surface2); }
  .group-section-emoji { font-size: 18px; }
  .group-section-name { font-size: 14px; font-weight: 700; color: var(--text); flex: 1; }
  .group-section-count { font-size: 11px; color: var(--text3); font-weight: 600; background: var(--border); padding: 2px 8px; border-radius: 10px; }
  .group-section-body { display: flex; flex-direction: column; }
  .log-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; }
  .log-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .log-exercise { font-size: 15px; font-weight: 600; }
  .log-date { font-size: 11px; color: var(--text3); text-align: right; line-height: 1.5; }
  .log-stats { display: flex; gap: 8px; flex-wrap: wrap; }
  .log-badge { background: var(--surface2); border-radius: 6px; padding: 5px 10px; font-size: 13px; font-weight: 500; font-family: 'DM Mono', monospace; }
  .log-badge.green { color: var(--green); }
  .weekday-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .weekday-header { width: 100%; display: flex; align-items: center; gap: 12px; padding: 16px; background: transparent; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; -webkit-tap-highlight-color: transparent; }
  .weekday-header:active { background: var(--surface2); }
  .weekday-emoji { font-size: 22px; flex-shrink: 0; }
  .weekday-info { flex: 1; text-align: left; display: flex; flex-direction: column; gap: 3px; }
  .weekday-name { font-size: 16px; font-weight: 700; color: var(--text); }
  .weekday-count { font-size: 12px; color: var(--text2); }
  .weekday-body { border-top: 1px solid var(--border); padding: 12px; display: flex; flex-direction: column; gap: 12px; }
  .weekday-date-group { display: flex; flex-direction: column; gap: 8px; }
  .weekday-date-label { font-size: 12px; font-weight: 700; color: var(--accent2); padding: 4px 0; }
  .stat-row { display: flex; gap: 10px; }
  .stat-chip { flex: 1; background: var(--surface2); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; gap: 4px; }
  .stat-chip .label { font-size: 11px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-chip .val { font-size: 22px; font-weight: 700; font-family: 'DM Mono', monospace; }
  .stat-chip .unit { font-size: 12px; color: var(--text2); font-weight: 400; }
  .val.green { color: var(--green); }
  .val.yellow { color: var(--yellow); }
  .progress-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .progress-card-header { padding: 14px 16px; border-bottom: 1px solid var(--border); font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
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
  .toast { position: fixed; top: 60px; left: 50%; transform: translateX(-50%); background: var(--green); color: #0a0a0f; padding: 12px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; z-index: 999; box-shadow: 0 4px 24px rgba(52,211,153,0.3); animation: slideDown 0.22s ease; white-space: nowrap; }
  .toast.error { background: var(--red); color: white; }
  @keyframes slideDown { from { opacity:0; transform: translateX(-50%) translateY(-10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 50; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s ease; }
  .modal { background: var(--surface); border-radius: 20px 20px 0 0; padding: 24px 20px 40px; width: 100%; max-width: 440px; display: flex; flex-direction: column; gap: 14px; animation: slideUp 0.22s ease; padding-bottom: calc(40px + env(safe-area-inset-bottom)); }
  .modal-title { font-size: 17px; font-weight: 700; }
  .modal-sub { font-size: 14px; color: var(--text2); }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { transform: translateY(30px); opacity:0; } to { transform: translateY(0); opacity:1; } }
  .toggle-row { display: flex; background: var(--surface2); border-radius: var(--radius-sm); padding: 3px; gap: 3px; }
  .toggle-btn { flex: 1; padding: 9px; text-align: center; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: transparent; color: var(--text2); font-family: 'DM Sans', sans-serif; transition: all var(--transition); }
  .toggle-btn.active { background: var(--accent); color: white; }
  .date-filter { display: flex; gap: 8px; align-items: center; }
  .date-filter input[type=date] { flex: 1; font-size: 14px; padding: 10px 12px; }
  .date-filter input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
  .rpg-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .rpg-header { display: flex; align-items: center; gap: 16px; }
  .rpg-avatar { width: 72px; height: 72px; border-radius: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rpg-identity { display: flex; flex-direction: column; gap: 2px; }
  .rpg-level-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
  .rpg-class { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
  .rpg-xp-label { font-size: 12px; color: var(--text2); font-family: 'DM Mono', monospace; }
  .rpg-bar-section { display: flex; flex-direction: column; gap: 6px; }
  .rpg-bar-labels { display: flex; justify-content: space-between; align-items: center; }
  .rpg-bar-bg { height: 12px; background: var(--surface2); border-radius: 99px; overflow: hidden; }
  .rpg-bar-fill { height: 100%; border-radius: 99px; transition: width 1s ease; }
  .rpg-stats { display: flex; align-items: center; background: var(--surface2); border-radius: var(--radius-sm); padding: 12px; }
  .rpg-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .rpg-stat-val { font-size: 22px; font-weight: 700; font-family: 'DM Mono', monospace; color: var(--text); }
  .rpg-stat-label { font-size: 11px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
  .rpg-stat-divider { width: 1px; height: 36px; background: var(--border); }
  .rpg-next { background: var(--surface2); border-radius: var(--radius-sm); padding: 10px 12px; }
  .rpg-howto { display: flex; flex-direction: column; gap: 5px; background: var(--surface2); border-radius: var(--radius-sm); padding: 12px; }
  .rpg-howto-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text3); margin-bottom: 4px; }
  .rpg-howto span { font-size: 13px; color: var(--text2); }
`;

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }, []);
  return <div className={"toast" + (type === "error" ? " error" : "")}>{msg}</div>;
}

function ProfilesScreen({ onSelect }) {
  const [profiles, setProfiles] = useState(() => STORE.get("profiles") || []);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const createProfile = () => {
    const name = newName.trim();
    if (!name) return;
    if (profiles.find(p => p.name.toLowerCase() === name.toLowerCase())) { alert("Ja existe um perfil com esse nome!"); return; }
    const p = { id: uid(), name, createdAt: now() };
    const updated = [...profiles, p];
    setProfiles(updated);
    STORE.set("profiles", updated);
    setNewName(""); setShowForm(false);
    onSelect(p);
  };

  const deleteProfile = (id) => {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated); STORE.set("profiles", updated);
    localStorage.removeItem("exercises_" + id);
    localStorage.removeItem("logs_" + id);
    setConfirmDel(null);
  };

  return (
    <>
      <style>{css}</style>
      <div className="profiles-screen">
        <div className="profiles-logo">
          <div className="profiles-logo-icon"><Icon name="dumbbell" size={32} /></div>
          <span className="profiles-logo-name">FitLog</span>
          <span className="profiles-logo-tag">Quem vai treinar hoje? 💪</span>
        </div>
        <div className="profiles-list">
          {profiles.length === 0 && !showForm && (
            <div className="empty" style={{ padding: "24px 0" }}>
              <Icon name="users" size={36} />
              <p>Nenhum perfil ainda.<br />Crie o primeiro abaixo!</p>
            </div>
          )}
          {profiles.map(p => {
            const exCount = (STORE.get("exercises_" + p.id) || []).length;
            const logCount = (STORE.get("logs_" + p.id) || []).length;
            return (
              <div key={p.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="profile-card" onClick={() => onSelect(p)}>
                  <div className="profile-avatar" style={{ background: avatarColor(p.name) }}>{avatarInitial(p.name)}</div>
                  <div className="profile-info">
                    <div className="profile-name">{p.name}</div>
                    <div className="profile-meta">{exCount} exercicio(s) · {logCount} registro(s)</div>
                  </div>
                </div>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirmDel(p.id)}><Icon name="trash" size={15} /></button>
              </div>
            );
          })}
        </div>
        {showForm ? (
          <div className="new-profile-form">
            <input placeholder="Digite seu nome..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createProfile()} autoFocus />
            <button className="btn btn-primary" onClick={createProfile}><Icon name="check" size={16} /> Criar perfil</button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setNewName(""); }}>Cancelar</button>
          </div>
        ) : (
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowForm(true)}><Icon name="plus" size={18} /> Novo perfil</button>
        )}
      </div>
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title">Excluir perfil?</p>
            <p className="modal-sub">Todos os dados serao apagados. Isso nao pode ser desfeito.</p>
            <button className="btn btn-danger" onClick={() => deleteProfile(confirmDel)}><Icon name="trash" size={16} /> Excluir</button>
            <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [profile, setProfile] = useState(() => STORE.get("currentProfile") || null);
  const [tab, setTab] = useState("exercises");
  const [exercises, setExercises] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (profile) {
      setExercises(STORE.get("exercises_" + profile.id) || []);
      setLogs(STORE.get("logs_" + profile.id) || []);
    }
  }, [profile]);

  const selectProfile = (p) => { STORE.set("currentProfile", p); setProfile(p); setTab("exercises"); };
  const logout = () => { STORE.set("currentProfile", null); setProfile(null); setExercises([]); setLogs([]); };
  const notify = (msg, type = "ok") => setToast({ msg, type });

  const saveExercises = (list) => { setExercises(list); STORE.set("exercises_" + profile.id, list); };
  const saveLogs = (list) => { setLogs(list); STORE.set("logs_" + profile.id, list); };

  const addExercise = (name, group) => { saveExercises([...exercises, { id: uid(), name, group, createdAt: now() }]); notify("Exercicio adicionado!"); };
  const editExercise = (id, name, group) => { saveExercises(exercises.map(e => e.id === id ? { ...e, name, group } : e)); notify("Atualizado!"); };
  const deleteExercise = (id) => { saveExercises(exercises.filter(e => e.id !== id)); notify("Exercicio removido"); };
  const addLog = (entry) => { saveLogs([{ id: uid(), ...entry, createdAt: now() }, ...logs]); notify("Treino registrado! 🔥"); };
  const deleteLog = (id) => { saveLogs(logs.filter(l => l.id !== id)); notify("Registro removido"); };

  if (!profile) return <ProfilesScreen onSelect={selectProfile} />;

  const titles = { exercises: "Exercicios", log: "Registrar Treino", history: "Historico", progress: "Evolucao" };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          {tab === "exercises" ? (
            <div className="logo-wrap">
              <div className="logo-icon"><Icon name="dumbbell" size={20} /></div>
              <div className="logo-text">
                <span className="logo-name">FitLog</span>
                <span className="logo-tagline">Ola, {profile.name}! 💪</span>
              </div>
            </div>
          ) : (
            <>
              <div className="header-icon"><Icon name="dumbbell" size={18} /></div>
              <span className="header-title">{titles[tab]}</span>
            </>
          )}
          <div className="header-avatar" style={{ background: avatarColor(profile.name) }} onClick={logout} title="Trocar perfil">
            {avatarInitial(profile.name)}
          </div>
        </div>

        {tab === "exercises" && <ExercisesPage exercises={exercises} onAdd={addExercise} onEdit={editExercise} onDelete={deleteExercise} />}
        {tab === "log" && <LogPage exercises={exercises} onAdd={addLog} />}
        {tab === "history" && <HistoryPage logs={logs} exercises={exercises} onDelete={deleteLog} profile={profile} />}
        {tab === "progress" && <ProgressPage logs={logs} exercises={exercises} />}

        <nav className="bottom-nav">
          {[
            { key:"exercises", icon:"dumbbell", label:"Exercicios" },
            { key:"log",       icon:"plus",     label:"Registrar" },
            { key:"history",   icon:"history",  label:"Historico" },
            { key:"progress",  icon:"chart",    label:"Evolucao"  },
          ].map(n => (
            <button key={n.key} className={"nav-item" + (tab === n.key ? " active" : "")} onClick={() => setTab(n.key)}>
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

function ExercisesPage({ exercises, onAdd, onEdit, onDelete }) {
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("peito");
  const [showAdd, setShowAdd] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("peito");
  const [confirm, setConfirm] = useState(null);

  const toggleGroup = (id) => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newGroup);
    setNewName("");
    setShowAdd(false);
    setOpenGroups(prev => ({ ...prev, [newGroup]: true }));
  };
  const handleEdit = (id) => {
    if (!editName.trim()) return;
    onEdit(id, editName.trim(), editGroup);
    setEditId(null);
  };
  const startEdit = (ex) => { setEditId(ex.id); setEditName(ex.name); setEditGroup(ex.group || "outro"); };

  const groupedExercises = GROUPS.map(g => ({
    ...g,
    items: exercises.filter(e => e.group === g.id),
  })).filter(g => g.items.length > 0);

  return (
    <div className="page">

      {!showAdd ? (
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Icon name="plus" size={18} /> Adicionar exercicio
        </button>
      ) : (
        <div className="card">
          <div className="field"><label>Novo exercicio</label></div>
          <div className="field">
            <select value={newGroup} onChange={e => setNewGroup(e.target.value)}>
              {GROUPS.map(g => <option key={g.id} value={g.id}>{g.emoji} {g.label}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input placeholder="ex: Supino reto, Agachamento..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} autoFocus />
            <button className="btn btn-primary btn-icon" onClick={handleAdd} style={{ width:48, flexShrink:0 }}><Icon name="check" size={18} /></button>
          </div>
          <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setNewName(""); }}>Cancelar</button>
        </div>
      )}

      {exercises.length === 0 ? (
        <div className="empty"><Icon name="dumbbell" size={40} /><p>Nenhum exercicio ainda.<br />Toque em Adicionar para comecar!</p></div>
      ) : (
        <div className="scroll-list">
          {groupedExercises.map(group => {
            const isOpen = !!openGroups[group.id];
            return (
              <div key={group.id} className="group-section">
                <button className="group-section-header" onClick={() => toggleGroup(group.id)}>
                  <span className="group-section-emoji">{group.emoji}</span>
                  <span className="group-section-name">{group.label}</span>
                  <span className="group-section-count">{group.items.length}</span>
                  <span style={{
                    color: "var(--text3)", fontSize: 20,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    display: "inline-block", lineHeight: 1,
                  }}>⌄</span>
                </button>

                {isOpen && (
                  <div className="group-section-body">
                    {group.items.map((ex, idx) => (
                      <div key={ex.id} className="exercise-item" style={idx > 0 ? { borderTop:"1px solid var(--border)" } : {}}>
                        {editId === ex.id ? (
                          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8, padding:"4px 0" }}>
                            <select value={editGroup} onChange={e => setEditGroup(e.target.value)}>
                              {GROUPS.map(g => <option key={g.id} value={g.id}>{g.emoji} {g.label}</option>)}
                            </select>
                            <div className="inline-edit">
                              <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEdit(ex.id)} autoFocus />
                              <button className="btn btn-primary btn-icon btn-sm" onClick={() => handleEdit(ex.id)}><Icon name="check" size={16} /></button>
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditId(null)}><Icon name="x" size={16} /></button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="exercise-name" style={{ flex:1, minWidth:0 }}>{ex.name}</div>
                            <div className="card-actions">
                              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => startEdit(ex)}><Icon name="edit" size={15} /></button>
                              <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirm(ex.id)}><Icon name="trash" size={15} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title">Excluir exercicio?</p>
            <p className="modal-sub">Essa acao nao pode ser desfeita.</p>
            <button className="btn btn-danger" onClick={() => { onDelete(confirm); setConfirm(null); }}><Icon name="trash" size={16} /> Excluir</button>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogPage({ exercises, onAdd }) {
  const [filterGroup, setFilterGroup] = useState("todos");
  const [exId, setExId] = useState("");
  const [mode, setMode] = useState("bilateral"); // bilateral | unilateral | tempo
  const [load, setLoad] = useState("");
  const [loadR, setLoadR] = useState("");
  const [loadL, setLoadL] = useState("");
  const [minutes, setMinutes] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const filtered = filterGroup === "todos" ? exercises : exercises.filter(e => e.group === filterGroup);
  const usedGroups = ["todos", ...GROUPS.map(g => g.id).filter(id => exercises.some(e => e.group === id))];

  const canSubmit = exId && (
    mode === "bilateral" ? load :
    mode === "unilateral" ? (loadR || loadL) :
    minutes
  );

  const clearFields = () => { setLoad(""); setLoadR(""); setLoadL(""); setMinutes(""); setNote(""); setExId(""); };

  const submit = () => {
    if (!canSubmit) return;
    if (mode === "bilateral") {
      onAdd({ exerciseId: exId, mode: "bilateral", load: parseFloat(load), sets: parseInt(sets), reps: parseInt(reps), note });
    } else if (mode === "unilateral") {
      onAdd({ exerciseId: exId, mode: "unilateral", load: null, loadR: loadR ? parseFloat(loadR) : null, loadL: loadL ? parseFloat(loadL) : null, sets: parseInt(sets), reps: parseInt(reps), note });
    } else {
      onAdd({ exerciseId: exId, mode: "tempo", load: null, minutes: parseFloat(minutes), note });
    }
    setDone(true); setTimeout(() => setDone(false), 1800);
    clearFields();
  };

  if (exercises.length === 0) return (
    <div className="page">
      <div className="empty"><Icon name="dumbbell" size={40} /><p>Cadastre exercicios primeiro<br />na aba Exercicios.</p></div>
    </div>
  );

  return (
    <div className="page">
      <div className="group-tabs">
        {usedGroups.map(id => (
          <button key={id} className={"group-tab" + (filterGroup === id ? " active" : "")} onClick={() => { setFilterGroup(id); setExId(""); }}>
            {id === "todos" ? "Todos" : groupEmoji(id) + " " + groupLabel(id)}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="field">
          <label>Exercicio</label>
          <select value={exId} onChange={e => setExId(e.target.value)}>
            <option value="">Selecione</option>
            {filtered.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>

        {/* toggle de modo */}
        <div className="toggle-row">
          <button className={"toggle-btn" + (mode === "bilateral"  ? " active" : "")} onClick={() => setMode("bilateral")}>Bilateral</button>
          <button className={"toggle-btn" + (mode === "unilateral" ? " active" : "")} onClick={() => setMode("unilateral")}>Unilateral</button>
          <button className={"toggle-btn" + (mode === "tempo"      ? " active" : "")} onClick={() => setMode("tempo")}>Tempo</button>
        </div>

        {/* campos conforme modo */}
        {mode === "bilateral" && (
          <div className="field">
            <label>Carga (kg)</label>
            <input type="number" placeholder="ex: 60" value={load} onChange={e => setLoad(e.target.value)} inputMode="decimal" />
          </div>
        )}

        {mode === "unilateral" && (
          <div className="grid2">
            <div className="field">
              <label>Lado Direito (kg)</label>
              <input type="number" placeholder="ex: 14" value={loadR} onChange={e => setLoadR(e.target.value)} inputMode="decimal" />
            </div>
            <div className="field">
              <label>Lado Esquerdo (kg)</label>
              <input type="number" placeholder="ex: 12" value={loadL} onChange={e => setLoadL(e.target.value)} inputMode="decimal" />
            </div>
          </div>
        )}

        {mode === "tempo" && (
          <div className="field">
            <label>Duracao (minutos)</label>
            <input type="number" placeholder="ex: 30" value={minutes} onChange={e => setMinutes(e.target.value)} inputMode="decimal" />
          </div>
        )}

        {/* series e reps — so para bilateral e unilateral */}
        {mode !== "tempo" && (
          <div className="grid2">
            <div className="field">
              <label>Series</label>
              <input type="number" placeholder="3" value={sets} onChange={e => setSets(e.target.value)} inputMode="numeric" />
            </div>
            <div className="field">
              <label>Repeticoes</label>
              <input type="number" placeholder="12" value={reps} onChange={e => setReps(e.target.value)} inputMode="numeric" />
            </div>
          </div>
        )}

        <div className="field">
          <label>Observacao (opcional)</label>
          <input placeholder="ex: corrida leve, cansado..." value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <button
          className="btn btn-primary"
          onClick={submit}
          disabled={!canSubmit}
          style={done ? { background:"var(--green)", color:"#0a0a0f" } : (!canSubmit) ? { opacity:0.45 } : {}}
        >
          {done ? <><Icon name="check" size={16} /> Registrado!</> : <><Icon name="save" size={16} /> Salvar treino</>}
        </button>
      </div>
    </div>
  );
}

function HistoryPage({ logs, exercises, onDelete, profile }) {
  const [confirm, setConfirm] = useState(null);
  const [openDay, setOpenDay] = useState(null);
  const exMap = Object.fromEntries(exercises.map(e => [e.id, { name: e.name, group: e.group }]));

  const byWeekday = {};
  WEEKDAY_ORDER.forEach(d => { byWeekday[d] = []; });
  logs.forEach(l => {
    const d = new Date(l.createdAt).getDay();
    byWeekday[d].push(l);
  });
  WEEKDAY_ORDER.forEach(d => {
    byWeekday[d].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  });

  const exportCSV = () => {
    const rows = [["Dia da Semana","Data","Hora","Exercicio","Grupo","Carga (kg)","Series","Repeticoes","Observacao"]];
    logs.forEach(l => {
      const ex = exMap[l.exerciseId];
      const d = new Date(l.createdAt).getDay();
      rows.push([WEEKDAY_LABELS[d], fmtDate(l.createdAt), fmtTime(l.createdAt), ex?.name || "Removido", ex?.group ? groupLabel(ex.group) : "", l.load, l.sets, l.reps, l.note || ""]);
    });
    const csv = rows.map(r => r.map(c => '"' + c + '"').join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "fitlog_" + profile.name + ".csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (logs.length === 0) return (
    <div className="page">
      <div className="empty"><Icon name="history" size={40} /><p>Nenhum treino registrado ainda.<br />Use a aba Registrar para comecar!</p></div>
    </div>
  );

  return (
    <div className="page">
      <p className="section-title">{logs.length} registro(s) no total</p>
      <button className="btn btn-green" onClick={exportCSV}><Icon name="download" size={16} /> Exportar planilha (.csv)</button>
      {WEEKDAY_ORDER.map(d => {
        const dayLogs = byWeekday[d];
        if (dayLogs.length === 0) return null;
        const isOpen = openDay === d;
        const byDate = {};
        dayLogs.forEach(l => { const date = isoDay(l.createdAt); if (!byDate[date]) byDate[date] = []; byDate[date].push(l); });
        const dates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));
        const weekdayEmojis = { 0:"☀", 1:"💪", 2:"🔥", 3:"⚡", 4:"💪", 5:"🔥", 6:"😴" };
        return (
          <div key={d} className="weekday-block">
            <button className="weekday-header" onClick={() => setOpenDay(isOpen ? null : d)}>
              <span className="weekday-emoji">{weekdayEmojis[d]}</span>
              <div className="weekday-info">
                <span className="weekday-name">{WEEKDAY_LABELS[d]}</span>
                <span className="weekday-count">{dayLogs.length} registro(s) · {dates.length} dia(s)</span>
              </div>
              <span style={{ color:"var(--text3)", fontSize:20, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 0.2s ease", display:"inline-block" }}>›</span>
            </button>
            {isOpen && (
              <div className="weekday-body">
                {dates.map(date => (
                  <div key={date} className="weekday-date-group">
                    <p className="weekday-date-label">📅 {fmtDate(date + "T12:00:00")}</p>
                    {byDate[date].map(log => {
                      const ex = exMap[log.exerciseId];
                      return (
                        <div key={log.id} className="log-item">
                          <div className="log-header">
                            <div>
                              <div className="log-exercise">{ex?.name || "Exercicio removido"}</div>
                              {ex?.group && <span className="group-badge" style={{ marginTop:4 }}>{groupEmoji(ex.group)} {groupLabel(ex.group)}</span>}
                            </div>
                            <div className="log-date">{fmtTime(log.createdAt)}</div>
                          </div>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div className="log-stats">
                              {log.mode === "tempo"
                                ? <span className="log-badge green">⏱ {log.minutes} min</span>
                                : log.mode === "unilateral"
                                  ? <>
                                      {log.loadR != null && <span className="log-badge green">D: {log.loadR} kg</span>}
                                      {log.loadL != null && <span className="log-badge green">E: {log.loadL} kg</span>}
                                    </>
                                  : <span className="log-badge green">{log.load} kg</span>
                              }
                              {log.mode !== "tempo" && <span className="log-badge">{log.sets} series</span>}
                              {log.mode !== "tempo" && <span className="log-badge">{log.reps} reps</span>}
                            </div>
                            <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirm(log.id)}><Icon name="trash" size={14} /></button>
                          </div>
                          {log.note && <p style={{ fontSize:12, color:"var(--text2)", marginTop:8 }}>📝 {log.note}</p>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
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

function ProgressPage({ logs, exercises }) {
  const [filterGroup, setFilterGroup] = useState("todos");
  const exMap = Object.fromEntries(exercises.map(e => [e.id, e]));
  const rpg = calcXP(logs);
  const { xp, currentLevel, nextLevel, progress, xpInLevel, xpToNext, prs } = rpg;

  const byEx = {};
  logs.forEach(l => { if (!byEx[l.exerciseId]) byEx[l.exerciseId] = []; byEx[l.exerciseId].push(l); });
  const usedGroups = ["todos", ...GROUPS.map(g => g.id).filter(id => Object.keys(byEx).some(exId => exMap[exId]?.group === id))];
  const exIds = Object.keys(byEx).filter(id => filterGroup === "todos" || exMap[id]?.group === filterGroup);

  return (
    <div className="page">
      <div className="rpg-card" style={{ borderColor: currentLevel.color + "55" }}>
        <div className="rpg-header">
          <div className="rpg-avatar" style={{ background: currentLevel.color + "22", border: "2px solid " + currentLevel.color }}>
            <span style={{ fontSize:32 }}>{currentLevel.emoji}</span>
          </div>
          <div className="rpg-identity">
            <div className="rpg-level-label" style={{ color: currentLevel.color }}>Nivel {currentLevel.lvl}</div>
            <div className="rpg-class">{currentLevel.name}</div>
            <div className="rpg-xp-label">{xp} XP total</div>
          </div>
        </div>

        <div className="rpg-bar-section">
          <div className="rpg-bar-labels">
            <span style={{ fontSize:12, color:"var(--text2)", fontWeight:600 }}>
              {nextLevel ? xpInLevel + " / " + xpToNext + " XP para Nivel " + nextLevel.lvl : "Nivel maximo atingido! 👑"}
            </span>
            <span style={{ fontSize:12, color: currentLevel.color, fontWeight:700 }}>{progress}%</span>
          </div>
          <div className="rpg-bar-bg">
            <div className="rpg-bar-fill" style={{ width: progress + "%", background: "linear-gradient(90deg, " + currentLevel.color + ", " + (nextLevel ? nextLevel.color : currentLevel.color) + ")" }} />
          </div>
        </div>

        <div className="rpg-stats">
          <div className="rpg-stat">
            <span className="rpg-stat-val">{logs.length}</span>
            <span className="rpg-stat-label">Treinos</span>
          </div>
          <div className="rpg-stat-divider" />
          <div className="rpg-stat">
            <span className="rpg-stat-val">{rpg.uniqueDays}</span>
            <span className="rpg-stat-label">Dias ativos</span>
          </div>
          <div className="rpg-stat-divider" />
          <div className="rpg-stat">
            <span className="rpg-stat-val">{prs}</span>
            <span className="rpg-stat-label">Recordes</span>
          </div>
        </div>

        {nextLevel && (
          <div className="rpg-next">
            <span style={{ fontSize:12, color:"var(--text3)" }}>
              Proximo: {nextLevel.emoji} <strong style={{ color:"var(--text2)" }}>{nextLevel.name}</strong> — faltam {xpToNext - xpInLevel} XP
            </span>
          </div>
        )}

        <div className="rpg-howto">
          <p className="rpg-howto-title">Como ganhar XP</p>
          <span>🏋 +10 XP por treino registrado</span>
          <span>📋 +5 XP por serie feita</span>
          <span>🏆 +30 XP ao bater recorde de carga</span>
          <span>📅 +5 XP por cada dia unico treinado</span>
        </div>
      </div>

      {exIds.length > 0 && (
        <>
          <p className="section-title" style={{ marginTop:4 }}>Evolucao por exercicio</p>
          <div className="group-tabs">
            {usedGroups.map(id => (
              <button key={id} className={"group-tab" + (filterGroup === id ? " active" : "")} onClick={() => setFilterGroup(id)}>
                {id === "todos" ? "Todos" : groupEmoji(id) + " " + groupLabel(id)}
              </button>
            ))}
          </div>
          {exIds.map(id => {
            const ex = exMap[id];
            const entries = [...byEx[id]].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
            const last = entries[entries.length - 1];
            const best = entries.reduce((a,b) => b.load > a.load ? b : a, entries[0]);
            const prev = entries.length >= 2 ? entries[entries.length - 2] : null;
            const delta = prev ? +(last.load - prev.load).toFixed(1) : 0;
            return (
              <div key={id} className="progress-card">
                <div className="progress-card-header">
                  <span>{ex?.name || "Exercicio removido"}</span>
                  {ex?.group && <span className="group-badge">{groupEmoji(ex.group)} {groupLabel(ex.group)}</span>}
                </div>
                <div className="progress-card-body">
                  <div className="stat-row">
                    <div className="stat-chip">
                      <span className="label">Ultima carga</span>
                      {last.unilateral
                        ? <><span className="val green" style={{fontSize:16}}>{last.loadR != null ? "D:"+last.loadR : "—"} / {last.loadL != null ? "E:"+last.loadL : "—"}<span className="unit"> kg</span></span></>
                        : <span className="val green">{last.load}<span className="unit"> kg</span></span>
                      }
                      {delta !== 0 && <span style={{ fontSize:11, color: delta > 0 ? "var(--green)" : "var(--red)" }}>{delta > 0 ? "+" : ""}{delta} kg vs anterior</span>}
                    </div>
                    <div className="stat-chip">
                      <span className="label">Melhor carga</span>
                      {best.unilateral
                        ? <span className="val yellow" style={{fontSize:16}}>{best.loadR != null ? "D:"+best.loadR : "—"} / {best.loadL != null ? "E:"+best.loadL : "—"}<span className="unit"> kg</span></span>
                        : <span className="val yellow">{best.load}<span className="unit"> kg</span></span>
                      }
                      <span style={{ fontSize:11, color:"var(--text3)" }}>{fmtDate(best.createdAt)}</span>
                    </div>
                  </div>
                  {entries.length > 1 && (
                    <>
                      <div className="divider" />
                      <p className="section-title">Historico</p>
                      <div className="timeline">
                        {[...entries].reverse().map(e => (
                          <div key={e.id} className="timeline-row">
                            <span className="timeline-date">{fmtDate(e.createdAt)}</span>
                            <span className="timeline-val">
                              {e.mode === "tempo"
                              ? "⏱ " + e.minutes + " min"
                              : e.mode === "unilateral"
                                ? (e.loadR != null ? "D:"+e.loadR : "") + (e.loadR != null && e.loadL != null ? " / " : "") + (e.loadL != null ? "E:"+e.loadL : "") + " kg · " + e.sets + "x" + e.reps
                                : e.load + " kg · " + e.sets + "x" + e.reps
                            }
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
        </>
      )}

      {logs.length === 0 && (
        <div className="empty"><Icon name="chart" size={40} /><p>Registre treinos para ver<br />sua evolucao aqui!</p></div>
      )}
    </div>
  );
}
