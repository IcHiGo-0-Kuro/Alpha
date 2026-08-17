import { Temporal } from "@js-temporal/polyfill";
import type { Schedule, ScheduleEvaluation } from "@/lib/types";

function parseTime(value: string): Temporal.PlainTime {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  return Temporal.PlainTime.from({ hour, minute });
}

function repeatMatches(schedule: Schedule, dayOfWeek: number): boolean {
  switch (schedule.repeatType) {
    case "daily": return true;
    case "weekdays": return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "weekends": return dayOfWeek >= 6;
    case "custom": return schedule.repeatDays.includes(dayOfWeek);
  }
}

function occurrenceAt(date: Temporal.PlainDate, schedule: Schedule): { start: Temporal.Instant; end: Temporal.Instant } {
  const time = parseTime(schedule.unlockTime);
  const local = Temporal.PlainDateTime.from({ year: date.year, month: date.month, day: date.day, hour: time.hour, minute: time.minute });
  const start = local.toZonedDateTime(schedule.timezone).toInstant();
  return { start, end: start.add({ minutes: schedule.durationMinutes }) };
}

export function getSupportedTimezones(): string[] {
  return ["UTC", "Asia/Kolkata", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Tokyo", "Australia/Sydney"];
}

export function evaluateSchedule(schedule: Schedule, now = new Date()): ScheduleEvaluation {
  if (!schedule.enabled || schedule.durationMinutes <= 0 || schedule.durationMinutes > 1440 || schedule.apps.length === 0) {
    return { state: "RESTRICTED", nextUnlock: null, accessEndsAt: null, countdownTarget: null };
  }

  const current = Temporal.Instant.fromEpochMilliseconds(now.getTime()).toZonedDateTimeISO(schedule.timezone);
  const currentInstant = Temporal.Instant.fromEpochMilliseconds(now.getTime());
  const candidates: { start: Temporal.Instant; end: Temporal.Instant }[] = [];

  for (let offset = -1; offset <= 8; offset += 1) {
    const date = current.toPlainDate().add({ days: offset });
    if (repeatMatches(schedule, date.dayOfWeek)) candidates.push(occurrenceAt(date, schedule));
  }

  const active = candidates.find(({ start, end }) => Temporal.Instant.compare(currentInstant, start) >= 0 && Temporal.Instant.compare(currentInstant, end) < 0);
  if (active) {
    const end = new Date(active.end.epochMilliseconds);
    return { state: "AVAILABLE", nextUnlock: new Date(active.start.epochMilliseconds), accessEndsAt: end, countdownTarget: end };
  }

  const next = candidates.find(({ start }) => Temporal.Instant.compare(start, currentInstant) > 0);
  return { state: "RESTRICTED", nextUnlock: next ? new Date(next.start.epochMilliseconds) : null, accessEndsAt: null, countdownTarget: next ? new Date(next.start.epochMilliseconds) : null };
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return hours > 0 ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}` : `${minutes.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
}
