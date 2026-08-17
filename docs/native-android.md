# Native Android implementation boundary

## Why the web app cannot enforce the lock

The browser has no general API that lets a Next.js page enumerate arbitrary installed applications or stop another Android application from launching. Alpha deliberately keeps that limitation explicit instead of showing a web-only "lock screen" and calling it app blocking.

## Recommended split

```text
Supabase
  ├─ auth.users
  ├─ schedules
  └─ app_targets
        ↑
        │ sync
        │
Next.js dashboard ───── Android client
                            │
                            ├─ installed-app discovery
                            ├─ schedule synchronization
                            ├─ local ScheduleEngine
                            └─ OS-supported restriction/access-control layer
```

The Android app should share the same conceptual schedule model. It should calculate state locally from the persisted schedule, current device time, and stored time zone so enforcement does not depend on the browser being open.

## Provider contract

The web code defines `AppProvider` with three responsibilities:

1. Discover platform applications when the platform permits it.
2. Report whether actual app restriction is supported.
3. Apply a restricted/available state to selected package identifiers.

`WebAppProvider` intentionally returns no installed applications and reports restriction as unsupported.

An Android implementation should live outside the browser bundle and implement this contract through a native bridge/service. Keep Android-specific permissions, lifecycle handling, and OS APIs out of the shared scheduling engine.

## Android requirements to investigate during native implementation

- Installed-app/package discovery allowed by the target Android version and Play policy.
- A supported mechanism for enforcing usage/access restrictions for the chosen product distribution model.
- Foreground/background lifecycle behavior and device reboot recovery.
- Exact-alarm/background execution constraints if notifications or local transitions require them.
- Time-zone and daylight-saving changes using Android's `java.time` APIs.
- Offline schedule evaluation and reconciliation after network restoration.
- User-visible permission/setup flows; never hide privileged access behind the web UI.

The exact OS mechanism must be selected against the Android version and distribution channel at implementation time. This repository intentionally does not claim that a generic web API can perform those operations.
