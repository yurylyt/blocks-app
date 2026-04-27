# Menubar Timer Notification Design

**Date:** 2026-04-27  
**Scope:** macOS menubar companion app (`macos/BlocksMenuBar`)

## Goal

Show a macOS notification banner and play the chime sound when the timer completes — at both half-time and full completion.

## Audio

Convert `chime-1.mp3` to `chime-1.caf` using `afconvert` (ships with macOS):

```sh
afconvert -f caff -d LEI16 macos/BlocksMenuBar/Resources/chime-1.mp3 macos/BlocksMenuBar/Resources/chime-1.caf
```

Add `chime-1.caf` to the Xcode project resources target alongside the existing `.mp3` files. The `.mp3` files stay — they are used by the web app.

Remove the `AVAudioPlayer` path from `Chime.swift`. Sound delivery moves entirely to the `UNUserNotification`, so there is no duplicate playback.

## Notifications

### Permission

In `AppDelegate.applicationDidFinishLaunching`, request notification authorization:

```swift
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
```

If the user denies permission the feature degrades silently — no banner, no chime. No retry or re-prompting logic needed.

### Firing

After a successful `POST /api/timer/complete` in `maybeAutoComplete`, call `Chime.notify(...)` with the result. Two cases:

| Condition | Title | Body |
|---|---|---|
| `result.state != "completed"` (half 1 done) | `"Half-time!"` | `"Time to log what you worked on"` |
| `result.state == "completed"` (full done) | `"Timer complete!"` | Activity name looked up from `AppState.activities`; falls back to `""` if not found |

Both use `UNNotificationSound(named: UNNotificationSoundName("chime-1.caf"))`.

### Dedup guard

The existing `UserDefaults` dedup key (`"chime-played:\(firstEntryId)"` / `"chime-played:second:\(firstEntryId)"`) moves into `Chime.notify`. This prevents double-firing if `maybeAutoComplete` races.

## Changes

| File | Change |
|---|---|
| `Resources/chime-1.caf` | New file (converted from mp3) |
| `BlocksMenuBar.xcodeproj/project.pbxproj` | Add `chime-1.caf` to resources build phase |
| `Sources/Chime.swift` | Replace `AVAudioPlayer` with `UNUserNotificationCenter` post; rename method to `notify` |
| `Sources/AppState.swift` | Update call site: `Chime.notify(...)` instead of `Chime.playOnce(...)` |
| `Sources/BlocksMenuBarApp.swift` | Add notification permission request in `applicationDidFinishLaunching` |

## Out of scope

- Notification actions (e.g. tapping to open the popover)
- Per-chime sound selection (chime-2, chime-3 unused for now)
- Re-prompting for notification permission after denial
