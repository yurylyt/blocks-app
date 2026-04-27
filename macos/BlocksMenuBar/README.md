# BlocksMenuBar

A personal macOS menubar companion for [Blocks](../../). Talks to https://blocks.smerekatech.com via the existing session cookie (no API token, no schema changes — just forwards the sealed `nuxt-session` cookie that the web app already uses).

## Build

Requires Xcode 15+ (macOS 14 deployment target) and [xcodegen](https://github.com/yonaskolb/XcodeGen):

```sh
brew install xcodegen
cd macos/BlocksMenuBar
xcodegen generate
open BlocksMenuBar.xcodeproj
```

Then in Xcode: hit **Run** (⌘R). The menubar item appears immediately; no Dock icon (`LSUIElement`).

The `.xcodeproj` is generated from `project.yml` and is gitignored — regenerate after editing the spec.

## Install

In Xcode: **Product → Archive** → **Distribute App → Copy App** → drag the resulting `BlocksMenuBar.app` to `/Applications`.

To run at login: **System Settings → General → Login Items → Add** → pick `BlocksMenuBar.app`.

## How auth works

1. Click "Sign in with Google" in the popover.
2. Browser opens `https://blocks.smerekatech.com/auth/menubar-start`. That route sets a short-lived `menubar_auth=1` cookie and redirects through the normal Google OAuth flow.
3. The Google callback (`server/routes/auth/google.get.ts`) sees the marker cookie, reads the session cookie value it just minted, and redirects the browser to `blocks-menubar://auth/callback?session=<value>`.
4. macOS routes that URL back to this app via `application(_:open:)`. The session value goes into Keychain (service `com.smerekatech.blocks.menubar`, account `nuxt-session`).
5. Every API request sends `Cookie: nuxt-session=<value>` — same as a browser.

Sessions expire on the server's `nuxt-auth-utils` `maxAge` (default 7 days). On 401 the app drops the Keychain entry and prompts to re-sign-in.

## Files

```
project.yml                 xcodegen spec
Sources/
  BlocksMenuBarApp.swift   @main, MenuBarExtra, AppDelegate (URL scheme handler)
  AppState.swift           @Observable: state, polling, completion logic
  BlocksAPI.swift          URLSession wrapper, cookie injection, JSON
  Auth.swift               Keychain + Google OAuth handoff
  Models.swift             Codable structs matching the Nuxt API
  Config.swift             Hardcoded prod URL / scheme / Keychain keys
  Chime.swift              Plays chime-1.mp3 once per timer completion
  MenuBarLabel.swift       The menubar item (countdown / icon)
  PopoverContent.swift     The popover UI
Resources/
  chime-1.mp3, chime-2.mp3, chime-3.mp3   (copied from public/)
```

## Reset URL scheme registration

If `blocks-menubar://` opens the wrong build during development:

```sh
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain user
```
