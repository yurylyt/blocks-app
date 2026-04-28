# Mobile Nav & Header Redesign

**Date:** 2026-04-28

## Overview

Three focused changes to the mobile app's Home screen and navigation:

1. Show the current day's total blocks as a number in the header
2. Move the Start action to a FAB
3. Replace the ⋯ menu with a Profile tab containing sign out

---

## 1. Header — Blocks Count

**What changes:** Remove the Start button and ⋯ button from the header. Add a blocks-sum display on the right side of the header.

**Display format:** Plain number only — e.g. `3.5` or `2`. No label. Muted color (`tokens.textSecondary`). Hidden (renders nothing) when the sum is 0 or entries are still loading.

**Data:** Add `useEntries({ from: center, to: center })` in `home.tsx`. Compute `sum = entries.reduce((acc, e) => acc + e.blocks, 0)`. React Query caches the result so no extra network request is made (HomeDayPage fetches the same query for the visible day).

**New header layout:**
```
[ < ]   [ Today ]   [ > ]   [ 3.5 ]
```

The count slot replaces the space previously occupied by the Start + ⋯ buttons.

---

## 2. FAB — Start Button

**What changes:** The Start button is removed from the header and re-added as a circular floating action button.

**Appearance:**
- Size: 56×56
- Background: `BRAND.accent`
- Icon: `Play` (Lucide) or "Start" text — keep text to match existing style
- Shadow: iOS shadow style (`shadowColor`, `shadowOffset`, `shadowRadius`, `shadowOpacity`); Android `elevation: 6`

**Position:** `position: absolute`, `bottom: 16 + safeAreaInsets.bottom`, `right: 16`. Rendered inside the `SafeAreaView` root after the PagerView, so it floats above the list content.

**Visibility:** Hidden (`display: none` or conditional render) when a timer is active — same rule as the old header Start button. This covers both the running and awaiting-choice states.

---

## 3. Profile Tab

**What changes:** Add a third tab `profile` to `app/(tabs)/`. Remove the `openMenu` function and all `ActionSheetIOS` / `Alert` sign-out logic from `home.tsx`.

**Tab entry:** Icon `User` (Lucide), label "Profile".

**Profile screen (`app/(tabs)/profile.tsx`):**
- `SafeAreaView` with `edges={['top']}`
- A single "Sign out" button, styled destructively (red text or red background)
- Pressing it calls `signOut()` directly — no confirmation sheet needed

**Tab bar order:** Home · Stats · Profile

---

## Files Touched

| File | Change |
|------|--------|
| `mobile/app/(tabs)/home.tsx` | Remove Start btn + ⋯ btn + `openMenu`; add `useEntries` for count; add FAB |
| `mobile/app/(tabs)/_layout.tsx` | Add Profile tab screen |
| `mobile/app/(tabs)/profile.tsx` | New file — Profile screen with sign out |
