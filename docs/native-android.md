# Native Android implementation boundary

## What Android can and cannot guarantee

The browser cannot discover arbitrary installed apps or prevent other apps from launching. The native Android story is also more constrained than simply calling a public "lock app" API.

Android's `UsageStatsManager` can observe usage/events when the user grants Usage Access (`PACKAGE_USAGE_STATS`), but it is an observation mechanism, not a general package-suspension API. See the Android API reference for `UsageStatsManager` and `UsageEvents`.

Android's `DevicePolicyManager.setPackagesSuspended()` can actually suspend packages so they cannot start activities, but Android documents that this operation is available to a device owner, profile owner, or an authorized delegate. It is therefore appropriate for managed-device/profile-owner deployments, not a generic consumer web app.

Installed-app discovery is also policy-sensitive on Google Play. `QUERY_ALL_PACKAGES` is restricted and may only be used for eligible core functionality; targeted package visibility should be preferred when it is sufficient.

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
                            └─ OS-supported enforcement
```

The Android app should share the same conceptual schedule model. It should calculate state locally from the persisted schedule, current device time, and stored time zone so enforcement does not depend on the browser being open.

## Provider contract

The web code defines `AppProvider` with three responsibilities:

1. Discover platform applications when the platform permits it.
2. Report whether actual app restriction is supported.
3. Apply a restricted/available state to selected package identifiers.

`WebAppProvider` intentionally returns no installed applications and reports restriction as unsupported.

An Android implementation should live outside the browser bundle and implement this contract through a native service. Keep Android-specific permissions, lifecycle handling, and OS APIs out of the shared scheduling engine.

## Practical Android paths

### Managed-device / profile-owner product

If Alpha is deployed as a managed-device wellbeing/control product, investigate `DevicePolicyManager.setPackagesSuspended()` as the enforcement primitive. This can genuinely prevent selected packages from starting while they are suspended, subject to the platform's device/profile-owner requirements and exceptions.

### Consumer Play-distributed product

Do not assume a normal Play-distributed app can obtain equivalent arbitrary package suspension. Usage Access can provide foreground/usage observations, but it does not itself stop another app from launching. Accessibility is not a general-purpose workaround; Google Play restricts declaring accessibility as an accessibility tool to apps designed to help people with disabilities or overcome disability-related challenges.

For a consumer product, the native architecture and distribution model therefore need to be selected together. A launcher/OEM/device-management approach may change what is enforceable, but it must be evaluated against the target Android version and Play policy before implementation.

## Native requirements to investigate before coding

- Target Android API level and supported device range.
- Whether the product is consumer, managed-device, profile-owner, OEM, or launcher based.
- The minimum package visibility needed; avoid `QUERY_ALL_PACKAGES` unless the core use case is eligible and the Play declaration is accepted.
- Device/profile-owner provisioning if true package suspension is required.
- Reboot and process-death recovery.
- Time-zone and daylight-saving changes using Android `java.time` APIs.
- Offline schedule evaluation and reconciliation after network restoration.
- User-visible permission/setup flows; never hide privileged access behind the web UI.

## Official references

- Android `UsageStatsManager`: https://developer.android.com/reference/android/app/usage/UsageStatsManager
- Android `UsageEvents`: https://developer.android.com/reference/android/app/usage/UsageEvents
- Android `DevicePolicyManager`: https://developer.android.com/reference/android/app/admin/DevicePolicyManager
- Google Play `QUERY_ALL_PACKAGES` policy: https://support.google.com/googleplay/android-developer/answer/10158779

This repository intentionally stops at the web control plane and provider boundary until those native product constraints are chosen. That is preferable to shipping a UI that claims to lock apps while only displaying a browser screen.
