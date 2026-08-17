import { describe, expect, it } from "vitest";
import { evaluateSchedule, formatDuration } from "@/lib/schedule-engine";
import type { Schedule } from "@/lib/types";

const base: Schedule = {
  id: "test",
  name: "Social",
  unlockTime: "19:00",
  durationMinutes: 30,
  repeatType: "daily",
  repeatDays: [1, 2, 3, 4, 5, 6, 7],
  timezone: "Asia/Kolkata",
  enabled: true,
  apps: [{ id: "app", name: "Instagram", packageName: "com.instagram.android" }],
};

const at = (iso: string) => new Date(iso);

describe("schedule engine", () => {
  it.each([
    ["18:59", "RESTRICTED"],
    ["19:00", "AVAILABLE"],
    ["19:15", "AVAILABLE"],
    ["19:29", "AVAILABLE"],
    ["19:30", "RESTRICTED"],
  ])("evaluates %s correctly", (time, expected) => {
    const result = evaluateSchedule(base, at(`2026-08-17T${time}:00+05:30`));
    expect(result.state).toBe(expected);
  });

  it("handles an access window crossing midnight", () => {
    const schedule = { ...base, unlockTime: "23:30", durationMinutes: 90 };
    expect(evaluateSchedule(schedule, at("2026-08-17T23:29:00+05:30")).state).toBe("RESTRICTED");
    expect(evaluateSchedule(schedule, at("2026-08-17T23:30:00+05:30")).state).toBe("AVAILABLE");
    expect(evaluateSchedule(schedule, at("2026-08-18T00:15:00+05:30")).state).toBe("AVAILABLE");
    expect(evaluateSchedule(schedule, at("2026-08-18T01:00:00+05:30")).state).toBe("RESTRICTED");
  });

  it("supports repeat rules", () => {
    const weekdays = { ...base, repeatType: "weekdays" as const };
    const sunday = evaluateSchedule(weekdays, at("2026-08-16T19:15:00+05:30"));
    const monday = evaluateSchedule(weekdays, at("2026-08-17T19:15:00+05:30"));
    expect(sunday.state).toBe("RESTRICTED");
    expect(monday.state).toBe("AVAILABLE");
  });

  it("derives the next unlock instead of depending on a running timer", () => {
    const result = evaluateSchedule(base, at("2026-08-17T20:00:00+05:30"));
    expect(result.state).toBe("RESTRICTED");
    expect(result.nextUnlock?.toISOString()).toBe("2026-08-18T13:30:00.000Z");
  });

  it("rejects disabled or invalid schedules", () => {
    expect(evaluateSchedule({ ...base, enabled: false }, at("2026-08-17T19:15:00+05:30")).state).toBe("RESTRICTED");
    expect(evaluateSchedule({ ...base, durationMinutes: 0 }, at("2026-08-17T19:15:00+05:30")).state).toBe("RESTRICTED");
    expect(evaluateSchedule({ ...base, apps: [] }, at("2026-08-17T19:15:00+05:30")).state).toBe("RESTRICTED");
  });

  it("formats countdowns consistently", () => {
    expect(formatDuration(2 * 3600 + 14 * 60 + 38)).toBe("02:14:38");
    expect(formatDuration(18 * 60 + 42)).toBe("18:42");
  });
});
