export type RepeatType = "daily" | "weekdays" | "weekends" | "custom";

export type AppTarget = {
  id: string;
  name: string;
  packageName: string;
};

export type Schedule = {
  id: string;
  name: string;
  unlockTime: string;
  durationMinutes: number;
  repeatType: RepeatType;
  repeatDays: number[];
  timezone: string;
  enabled: boolean;
  apps: AppTarget[];
};

export type ScheduleState = "RESTRICTED" | "AVAILABLE";

export type ScheduleEvaluation = {
  state: ScheduleState;
  nextUnlock: Date | null;
  accessEndsAt: Date | null;
  countdownTarget: Date | null;
};
