"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { evaluateSchedule, formatDuration, getSupportedTimezones } from "@/lib/schedule-engine";
import type { AppTarget, RepeatType, Schedule } from "@/lib/types";
import { webAppProvider } from "@/lib/platform/web-app-provider";

const supabase = createClient();
const timezones = getSupportedTimezones();

type ScheduleRow = {
  id: string;
  name: string;
  unlock_time: string;
  duration_minutes: number;
  repeat_type: RepeatType;
  repeat_days: number[];
  timezone: string;
  enabled: boolean;
  schedule_apps: { app_targets: AppTarget }[];
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function mapSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    name: row.name,
    unlockTime: row.unlock_time.slice(0, 5),
    durationMinutes: row.duration_minutes,
    repeatType: row.repeat_type,
    repeatDays: row.repeat_days ?? [],
    timezone: row.timezone,
    enabled: row.enabled,
    apps: row.schedule_apps.map((entry) => entry.app_targets),
  };
}

function repeatLabel(schedule: Schedule) {
  if (schedule.repeatType === "daily") return "Every day";
  if (schedule.repeatType === "weekdays") return "Weekdays";
  if (schedule.repeatType === "weekends") return "Weekends";
  return schedule.repeatDays.map((day) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day - 1]).join(", ");
}

export default function Dashboard() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [appName, setAppName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [form, setForm] = useState({ name: "Social Media", unlockTime: "19:00", durationMinutes: 30, repeatType: "daily" as RepeatType, repeatDays: [1, 2, 3, 4, 5, 6, 7], timezone: "Asia/Kolkata", enabled: true });

  const selected = useMemo(() => schedules.find((schedule) => schedule.id === selectedId) ?? schedules[0] ?? null, [schedules, selectedId]);
  const evaluation = selected ? evaluateSchedule(selected, now) : null;
  const remaining = evaluation?.countdownTarget ? Math.max(0, Math.floor((evaluation.countdownTarget.getTime() - now.getTime()) / 1000)) : 0;

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setForm((current) => ({ ...current, timezone: timezones.includes(timezone) ? timezone : "UTC" }));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessionEmail(data.session?.user.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => setSessionEmail(currentSession?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  async function loadSchedules() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data, error } = await supabase
      .from("schedules")
      .select("id,name,unlock_time,duration_minutes,repeat_type,repeat_days,timezone,enabled,schedule_apps(app_targets(id,name,packageName:package_name))")
      .order("created_at", { ascending: true });
    if (error) {
      setMessage(error.message);
      return;
    }
    const mapped = (data as unknown as ScheduleRow[]).map(mapSchedule);
    setSchedules(mapped);
    setSelectedId((current) => current && mapped.some((item) => item.id === current) ? current : mapped[0]?.id ?? null);
  }

  useEffect(() => {
    if (sessionEmail) void loadSchedules();
    else setSchedules([]);
  }, [sessionEmail]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const result = authMode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else setMessage(authMode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Welcome back.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMessage("");
  }

  function editSchedule(schedule: Schedule) {
    setSelectedId(schedule.id);
    setForm({ name: schedule.name, unlockTime: schedule.unlockTime, durationMinutes: schedule.durationMinutes, repeatType: schedule.repeatType, repeatDays: schedule.repeatDays, timezone: schedule.timezone, enabled: schedule.enabled });
  }

  function newSchedule() {
    setSelectedId(null);
    setForm({ name: "New schedule", unlockTime: "19:00", durationMinutes: 30, repeatType: "daily", repeatDays: [1, 2, 3, 4, 5, 6, 7], timezone: "Asia/Kolkata", enabled: true });
  }

  async function saveSchedule(event: FormEvent) {
    event.preventDefault();
    if (!sessionEmail || form.durationMinutes < 1 || form.durationMinutes > 1440) return;
    setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const payload = { user_id: auth.user.id, name: form.name.trim() || "Untitled schedule", unlock_time: form.unlockTime, duration_minutes: form.durationMinutes, repeat_type: form.repeatType, repeat_days: form.repeatDays, timezone: form.timezone, enabled: form.enabled };
    let scheduleId = selectedId;
    const result = selectedId
      ? await supabase.from("schedules").update(payload).eq("id", selectedId).select("id").single()
      : await supabase.from("schedules").insert(payload).select("id").single();
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    scheduleId = result.data.id;
    await supabase.from("schedule_apps").delete().eq("schedule_id", scheduleId);
    if (selected?.apps.length) {
      const appRows = selected.apps.map((app) => ({ user_id: auth.user.id, name: app.name, package_name: app.packageName }));
      const { data: savedApps, error: appError } = await supabase.from("app_targets").upsert(appRows, { onConflict: "user_id,package_name" }).select("id,name,package_name");
      if (appError) {
        setMessage(appError.message);
        return;
      }
      const relations = (savedApps ?? []).map((app) => ({ schedule_id: scheduleId, app_target_id: app.id }));
      if (relations.length) await supabase.from("schedule_apps").insert(relations);
    }
    await loadSchedules();
    setSelectedId(scheduleId);
    setMessage("Schedule saved.");
  }

  async function deleteSchedule() {
    if (!selectedId || !confirm("Delete this schedule?")) return;
    const { error } = await supabase.from("schedules").delete().eq("id", selectedId);
    if (error) setMessage(error.message);
    else {
      setMessage("Schedule deleted.");
      await loadSchedules();
    }
  }

  function addApp(event: FormEvent) {
    event.preventDefault();
    const name = appName.trim();
    const pkg = packageName.trim();
    if (!name || !pkg || !selected) {
      if (!selected) setMessage("Save a schedule first, then add apps to it.");
      return;
    }
    if (selected.apps.some((app) => app.packageName === pkg)) return;
    setSchedules((current) => current.map((item) => item.id === selected.id ? { ...item, apps: [...item.apps, { id: crypto.randomUUID(), name, packageName: pkg }] } : item));
    setAppName("");
    setPackageName("");
  }

  function removeApp(id: string) {
    if (!selected) return;
    setSchedules((current) => current.map((item) => item.id === selected.id ? { ...item, apps: item.apps.filter((app) => app.id !== id) } : item));
  }

  if (!sessionEmail) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <span className="brand-mark">A</span>
          <p className="eyebrow">Scheduled access</p>
          <h1>Use your apps when they’re meant to be available.</h1>
          <p className="muted">Alpha turns access into a schedule. The clock is the control—not a PIN.</p>
          <form onSubmit={authenticate} className="stack">
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>
            <button className="primary" type="submit">{authMode === "signin" ? "Sign in" : "Create account"}</button>
          </form>
          <button className="text-button" onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}>{authMode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button>
          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><span className="brand-mark small">A</span><span className="brand-name">Alpha</span></div>
        <div className="account"><span>{sessionEmail}</span><button className="ghost" onClick={signOut}>Sign out</button></div>
      </header>
      <div className="content-grid">
        <section className={`hero-card ${evaluation?.state === "AVAILABLE" ? "available" : "restricted"}`}>
          <div className="hero-top"><span className="status-pill"><span className="status-dot" /> {evaluation?.state === "AVAILABLE" ? "AVAILABLE" : "RESTRICTED"}</span>{selected && <span>{selected.apps.length} app{selected.apps.length === 1 ? "" : "s"}</span>}</div>
          <div className="hero-copy">
            <p className="eyebrow">{selected?.name ?? "Your access schedule"}</p>
            <h1>{evaluation?.state === "AVAILABLE" ? "Apps are available" : "Your apps are restricted"}</h1>
            <p className="hero-timer">{evaluation ? formatDuration(remaining) : "--:--:--"}</p>
            <p className="timer-label">{evaluation?.state === "AVAILABLE" ? "access remaining" : "until next access window"}</p>
          </div>
          {selected && <div className="hero-meta"><div><span>Next unlock</span><strong>{evaluation?.nextUnlock ? evaluation.nextUnlock.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}</strong></div><div><span>Duration</span><strong>{selected.durationMinutes} min</strong></div><div><span>Repeat</span><strong>{repeatLabel(selected)}</strong></div></div>}
        </section>

        <aside className="panel schedule-list">
          <div className="panel-heading"><div><p className="eyebrow">Schedules</p><h2>Your routines</h2></div><button className="icon-button" onClick={newSchedule} aria-label="New schedule">+</button></div>
          {schedules.length === 0 ? <div className="empty"><strong>No schedules yet.</strong><span>Create your first access window.</span></div> : schedules.map((schedule) => <button className={`schedule-row ${schedule.id === selected?.id ? "selected" : ""}`} key={schedule.id} onClick={() => editSchedule(schedule)}><span className="schedule-icon">{schedule.enabled ? "◷" : "○"}</span><span><strong>{schedule.name}</strong><small>{schedule.unlockTime} · {schedule.durationMinutes} min</small></span></button>)}
        </aside>

        <section className="panel editor">
          <div className="panel-heading"><div><p className="eyebrow">Schedule</p><h2>{selected ? "Edit access window" : "Create access window"}</h2></div>{selected && <button className="danger-button" onClick={deleteSchedule}>Delete</button>}</div>
          <form onSubmit={saveSchedule} className="form-grid">
            <label className="wide">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Social Media" required /></label>
            <label>Unlock time<input type="time" value={form.unlockTime} onChange={(event) => setForm({ ...form, unlockTime: event.target.value })} required /></label>
            <label>Duration (minutes)<input type="number" min="1" max="1440" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} required /></label>
            <label>Repeat<select value={form.repeatType} onChange={(event) => setForm({ ...form, repeatType: event.target.value as RepeatType })}><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="weekends">Weekends</option><option value="custom">Specific days</option></select></label>
            <label>Time zone<select value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })}>{timezones.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
            {form.repeatType === "custom" && <div className="wide day-picker">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => <label className="day" key={day}><input type="checkbox" checked={form.repeatDays.includes(index + 1)} onChange={() => setForm({ ...form, repeatDays: form.repeatDays.includes(index + 1) ? form.repeatDays.filter((item) => item !== index + 1) : [...form.repeatDays, index + 1].sort() })} />{day}</label>)}</div>}
            <label className="toggle wide"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><span>Schedule enabled</span></label>
            <button className="primary wide" type="submit">Save schedule</button>
          </form>
        </section>

        <section className="panel apps-panel">
          <div className="panel-heading"><div><p className="eyebrow">Applications</p><h2>{selected ? "Controlled apps" : "Choose a schedule first"}</h2></div><span className="platform-note">{webAppProvider.canDiscoverInstalledApps ? "Native" : "Browser mode"}</span></div>
          <div className="notice"><strong>Native capability boundary</strong><span>A browser cannot discover or block other installed Android/iOS apps. These targets are stored as the platform-neutral app records that a future native provider will enforce.</span></div>
          {selected && <div className="app-list">{selected.apps.map((app) => <div className="app-row" key={app.id}><span className="app-avatar">{initials(app.name)}</span><span><strong>{app.name}</strong><small>{app.packageName}</small></span><button className="ghost" onClick={() => removeApp(app.id)}>Remove</button></div>)}</div>}
          {selected && <form onSubmit={addApp} className="add-app-form"><input value={appName} onChange={(event) => setAppName(event.target.value)} placeholder="App name" /><input value={packageName} onChange={(event) => setPackageName(event.target.value)} placeholder="Android package / identifier" /><button className="secondary" type="submit">Add target</button></form>}
        </section>
      </div>
      {message && <div className="toast" role="status">{message}</div>}
    </main>
  );
}
