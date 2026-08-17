# Alpha Android

This module is the native Android client for Alpha's scheduled-access control plane.

## Current scope

- Local schedule model and deterministic evaluation.
- Android app/package discovery using the package manager.
- Capability detection for device-owner/profile-owner package suspension.
- A restriction engine that never claims enforcement when the OS does not permit it.
- A boot receiver and foreground-service boundary for the next enforcement phase.

## Build

Open the `android/` directory in Android Studio with JDK 17 and Android SDK 36 installed. The project uses Android Gradle Plugin 9.2 and AGP's built-in Kotlin support.

## Enforcement note

Consumer Android devices do not expose a universal public API for arbitrary app blocking. Alpha therefore reports enforcement as unsupported unless the app is provisioned as a device owner/profile owner (or an authorized delegate) and Android permits package suspension. This is intentional; the app must not present a UI that falsely claims to have blocked another application.

Google Play submissions for new apps and updates require target API 36 from August 31, 2026, so this project targets Android 16 / API 36.
