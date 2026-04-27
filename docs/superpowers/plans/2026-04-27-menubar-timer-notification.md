# Menubar Timer Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a macOS notification banner and play the chime sound (via that banner) when the Blocks menubar timer reaches half-time and full completion.

**Architecture:** Convert `chime-1.mp3` to `chime-1.caf` (required format for UNNotificationSound), register it as an Xcode resource, replace the existing `AVAudioPlayer` path in `Chime.swift` with `UNUserNotificationCenter` delivery, request notification permission on launch, and update the single call site in `AppState`.

**Tech Stack:** Swift, UserNotifications framework, `afconvert` CLI (ships with macOS)

---

## File Map

| File | Action |
|---|---|
| `macos/BlocksMenuBar/Resources/chime-1.caf` | Create (converted audio) |
| `macos/BlocksMenuBar/BlocksMenuBar.xcodeproj/project.pbxproj` | Modify — add caf to resources |
| `macos/BlocksMenuBar/Sources/Chime.swift` | Modify — replace AVAudioPlayer with UNNotification |
| `macos/BlocksMenuBar/Sources/BlocksMenuBarApp.swift` | Modify — request notification permission on launch |
| `macos/BlocksMenuBar/Sources/AppState.swift` | Modify — update call site |

---

### Task 1: Convert chime-1.mp3 to chime-1.caf

UNNotificationSound only accepts `.caf`, `.aiff`, or `.wav`. Convert the existing mp3 once.

**Files:**
- Create: `macos/BlocksMenuBar/Resources/chime-1.caf`

- [ ] **Step 1: Run conversion**

```bash
cd /Users/yury/projects/blocks/macos/BlocksMenuBar/Resources
afconvert -f caff -d LEI16 chime-1.mp3 chime-1.caf
```

Expected: no output, `chime-1.caf` appears in the directory.

- [ ] **Step 2: Verify the file was created**

```bash
ls -lh /Users/yury/projects/blocks/macos/BlocksMenuBar/Resources/chime-1.caf
```

Expected: file exists, size roughly similar to the mp3 (or slightly larger).

---

### Task 2: Add chime-1.caf to the Xcode project

`project.pbxproj` needs three edits: a new `PBXFileReference` entry, a new `PBXBuildFile` entry, and entries in the Resources group and build phase. UUIDs in pbxproj are 24-character uppercase hex strings — generate two fresh ones:

```bash
FILE_REF=$(uuidgen | tr -d '-' | head -c 24 | tr '[:lower:]' '[:upper:]')
BUILD_FILE=$(uuidgen | tr -d '-' | head -c 24 | tr '[:lower:]' '[:upper:]')
echo "FileRef UUID:  $FILE_REF"
echo "BuildFile UUID: $BUILD_FILE"
```

Record these two values — you'll substitute them in the edits below (shown here as `<FILE_REF_UUID>` and `<BUILD_FILE_UUID>`).

**Files:**
- Modify: `macos/BlocksMenuBar/BlocksMenuBar.xcodeproj/project.pbxproj`

- [ ] **Step 1: Add PBXFileReference entry**

In `project.pbxproj`, inside `/* Begin PBXFileReference section */`, add this line after the `chime-3.mp3` line (line ~30):

```
		<FILE_REF_UUID> /* chime-1.caf */ = {isa = PBXFileReference; lastKnownFileType = file; path = "chime-1.caf"; sourceTree = "<group>"; };
```

(Replace `<FILE_REF_UUID>` with the value you generated above.)

- [ ] **Step 2: Add PBXBuildFile entry**

Inside `/* Begin PBXBuildFile section */`, add this line after the `chime-3.mp3 in Resources` line (line ~16):

```
		<BUILD_FILE_UUID> /* chime-1.caf in Resources */ = {isa = PBXBuildFile; fileRef = <FILE_REF_UUID> /* chime-1.caf */; };
```

- [ ] **Step 3: Add to Resources group children**

Find the `PBXGroup` for `Resources` (around line 51–58). Add the caf file inside `children`:

```
				<FILE_REF_UUID> /* chime-1.caf */,
```

Place it after `chime-3.mp3`.

- [ ] **Step 4: Add to PBXResourcesBuildPhase**

Find `/* Begin PBXResourcesBuildPhase section */` (around line 140). Inside `files = (`, add:

```
				<BUILD_FILE_UUID> /* chime-1.caf in Resources */,
```

Place it after the `chime-3.mp3 in Resources` line.

- [ ] **Step 5: Verify the project opens without errors**

Open Xcode or run a build check:

```bash
cd /Users/yury/projects/blocks/macos/BlocksMenuBar
xcodebuild -project BlocksMenuBar.xcodeproj -scheme BlocksMenuBar -configuration Release build 2>&1 | tail -5
```

Expected: `** BUILD SUCCEEDED **`

---

### Task 3: Rewrite Chime.swift

Replace `AVAudioPlayer` with `UNUserNotificationCenter`. The dedup guard (UserDefaults key) stays; the notification identifier doubles as the dedup key, so firing the same notification ID twice is a no-op.

**Files:**
- Modify: `macos/BlocksMenuBar/Sources/Chime.swift`

- [ ] **Step 1: Replace the entire file**

```swift
import Foundation
import UserNotifications

@MainActor
enum Chime {
    static func notify(firstEntryId: Int, completed: Bool, activityName: String?) {
        let key = completed ? "chime-played:second:\(firstEntryId)" : "chime-played:\(firstEntryId)"
        guard !UserDefaults.standard.bool(forKey: key) else { return }
        UserDefaults.standard.set(true, forKey: key)

        let content = UNMutableNotificationContent()
        if completed {
            content.title = "Timer complete!"
            content.body = activityName ?? ""
        } else {
            content.title = "Half-time!"
            content.body = "Time to log what you worked on"
        }
        content.sound = UNNotificationSound(named: UNNotificationSoundName("chime-1.caf"))

        let request = UNNotificationRequest(identifier: key, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}
```

- [ ] **Step 2: Build to verify it compiles**

```bash
cd /Users/yury/projects/blocks/macos/BlocksMenuBar
xcodebuild -project BlocksMenuBar.xcodeproj -scheme BlocksMenuBar -configuration Release build 2>&1 | tail -5
```

Expected: `** BUILD SUCCEEDED **`

---

### Task 4: Request notification permission on launch

**Files:**
- Modify: `macos/BlocksMenuBar/Sources/BlocksMenuBarApp.swift`

- [ ] **Step 1: Replace the entire file**

```swift
import SwiftUI
import AppKit
import UserNotifications

@main
struct BlocksMenuBarApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var delegate

    var body: some Scene {
        MenuBarExtra {
            PopoverContent()
                .environment(delegate.state)
                .onAppear {
                    delegate.state.popoverOpen = true
                    Task { await delegate.state.refreshAll() }
                }
                .onDisappear {
                    delegate.state.popoverOpen = false
                }
        } label: {
            MenuBarLabel().environment(delegate.state)
        }
        .menuBarExtraStyle(.window)
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    let state = AppState()

    func applicationDidFinishLaunching(_ notification: Notification) {
        state.bootstrap()
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            state.handleAuthCallback(url)
        }
    }
}
```

- [ ] **Step 2: Build to verify it compiles**

```bash
cd /Users/yury/projects/blocks/macos/BlocksMenuBar
xcodebuild -project BlocksMenuBar.xcodeproj -scheme BlocksMenuBar -configuration Release build 2>&1 | tail -5
```

Expected: `** BUILD SUCCEEDED **`

---

### Task 5: Update call site in AppState.swift

`maybeAutoComplete` currently calls `Chime.playOnce(firstEntryId:second:)`. Update it to call `Chime.notify(firstEntryId:completed:activityName:)`.

**Files:**
- Modify: `macos/BlocksMenuBar/Sources/AppState.swift`

- [ ] **Step 1: Replace the notification call inside `maybeAutoComplete`**

Find this block (around line 219–221):

```swift
            if let firstId = result.firstEntryId {
                Chime.playOnce(firstEntryId: firstId, second: result.state == "completed")
            }
```

Replace with:

```swift
            if let firstId = result.firstEntryId {
                let name = activities.first { $0.id == timer?.activityId }?.name
                Chime.notify(firstEntryId: firstId, completed: result.state == "completed", activityName: name)
            }
```

- [ ] **Step 2: Final build**

```bash
cd /Users/yury/projects/blocks/macos/BlocksMenuBar
xcodebuild -project BlocksMenuBar.xcodeproj -scheme BlocksMenuBar -configuration Release build 2>&1 | tail -5
```

Expected: `** BUILD SUCCEEDED **`

---

### Task 6: Manual smoke test and commit

- [ ] **Step 1: Install and run the app**

Copy the built app to Applications and launch it (or run directly from the build folder):

```bash
open /Users/yury/projects/blocks/macos/BlocksMenuBar/build/Build/Products/Release/BlocksMenuBar.app
```

- [ ] **Step 2: Grant notification permission**

On first launch a system dialog appears: "Blocks would like to send you notifications." Click **Allow**.

If it doesn't appear, open System Settings → Notifications → Blocks and enable notifications manually.

- [ ] **Step 3: Trigger a short timer**

In the web app (`http://localhost:3000`), temporarily reduce `halfDurationMs` or wait for a real timer half to complete. Verify:
- A notification banner appears with the correct title ("Half-time!" or "Timer complete!")
- The chime sound plays from the notification
- No duplicate sounds or notifications

- [ ] **Step 4: Commit**

```bash
cd /Users/yury/projects/blocks
git add \
  macos/BlocksMenuBar/Resources/chime-1.caf \
  macos/BlocksMenuBar/BlocksMenuBar.xcodeproj/project.pbxproj \
  macos/BlocksMenuBar/Sources/Chime.swift \
  macos/BlocksMenuBar/Sources/BlocksMenuBarApp.swift \
  macos/BlocksMenuBar/Sources/AppState.swift
git commit -m "Show macOS notification with chime when timer completes"
```
