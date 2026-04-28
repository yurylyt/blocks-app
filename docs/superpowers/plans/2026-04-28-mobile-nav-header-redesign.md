# Mobile Nav & Header Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the header Start/⋯ buttons with a blocks-count display and FAB, and add a Profile tab with sign out.

**Architecture:** Three self-contained changes to the Home screen and tab navigator — header cleanup, FAB addition, and a new Profile screen. No new abstractions needed; all changes are in the mobile workspace under `mobile/app/(tabs)/`.

**Tech Stack:** Expo Router (file-based tabs), React Native, `react-native-safe-area-context`, `@tanstack/react-query` (via `useEntries`), `lucide-react-native` icons.

> **Note:** There is no test runner configured in this project. Each task includes manual verification steps instead of automated tests.

---

### Task 1: Add blocks-count display to header and remove Start / ⋯ buttons

**Files:**
- Modify: `mobile/app/(tabs)/home.tsx`

- [ ] **Step 1: Open `mobile/app/(tabs)/home.tsx` and update imports**

Remove `ActionSheetIOS`, `Alert`, and `Platform` from the React Native import (no longer needed). Remove the `signOut` import. Add `useSafeAreaInsets` for FAB use in Task 2 (import it now to avoid a second touch of the imports). Add `useEntries`.

Replace the top-of-file imports block with:

```tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView, {
  type PageScrollStateChangedNativeEvent,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import type { Activity, Entry } from '~/api/types';
import { AwaitingChoiceBar } from '~/components/AwaitingChoiceBar';
import { HomeDayPage } from '~/components/HomeDayPage';
import { RunningBar } from '~/components/RunningBar';
import { RunningBarSheet } from '~/components/RunningBarSheet';
import { useActivities } from '~/hooks/useActivities';
import { useEntries } from '~/hooks/useEntries';
import { useTimer } from '~/hooks/useTimer';
import { useStartSecondHalf, useStopTimer } from '~/hooks/useTimerMutations';
import { useToday } from '~/hooks/useToday';
import { addDays } from '~/lib/dateRange';
import { useTheme } from '~/theme/ThemeProvider';
import { BRAND } from '~/theme/tokens';
```

- [ ] **Step 2: Add the blocks-sum query inside `HomeScreen`**

After the existing `const timer = ...` / `const config = ...` / `const runningActivity = ...` block (around line 67–71), add:

```tsx
const centerRange = useMemo(() => ({ from: center, to: center }), [center]);
const centerEntriesQ = useEntries(centerRange);
const blocksSum = (centerEntriesQ.data ?? []).reduce((acc, e) => acc + e.blocks, 0);
```

Also call `useSafeAreaInsets` at the top of `HomeScreen` (needed for Task 2):

```tsx
const insets = useSafeAreaInsets();
```

- [ ] **Step 3: Delete the `openMenu` function**

Remove the entire `openMenu` function block (currently lines 125–139 in home.tsx):

```tsx
function openMenu() {
  // ... delete this entire function
}
```

- [ ] **Step 4: Update the header JSX**

Replace the header `<View>` content. The new header has: left chevron, title (pressable to jump to today), right chevron, and a blocks-count slot on the far right.

```tsx
<View style={styles.header}>
  <Pressable
    onPress={goBack}
    hitSlop={10}
    style={({ pressed }) => [styles.chev, { opacity: pressed ? 0.5 : 1 }]}
  >
    <ChevronLeft size={28} color={tokens.text} strokeWidth={2} />
  </Pressable>

  <Pressable
    onPress={() => {
      if (!isAtToday) {
        setCenter(today);
        requestAnimationFrame(() => pagerRef.current?.setPageWithoutAnimation(1));
      }
    }}
    style={styles.titleWrap}
    disabled={isAtToday}
    hitSlop={6}
  >
    <Text style={[styles.title, { color: tokens.text }]} numberOfLines={1}>
      {title}
    </Text>
  </Pressable>

  <Pressable
    onPress={goForward}
    hitSlop={10}
    disabled={isAtToday}
    style={({ pressed }) => [
      styles.chev,
      { opacity: isAtToday ? 0.25 : pressed ? 0.5 : 1 },
    ]}
  >
    <ChevronRight size={28} color={tokens.text} strokeWidth={2} />
  </Pressable>

  <View style={styles.countSlot}>
    {blocksSum > 0 && (
      <Text style={[styles.blockCount, { color: tokens.textSecondary }]}>
        {blocksSum % 1 === 0 ? blocksSum : blocksSum.toFixed(1)}
      </Text>
    )}
  </View>
</View>
```

- [ ] **Step 5: Update the StyleSheet**

Remove `startBtn`, `startBtnText`, `menuBtn`, `menuDots` style entries. Add `countSlot` and `blockCount`:

```tsx
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 4,
  },
  chev: { padding: 4 },
  titleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: 0.2 },
  countSlot: { width: 44, alignItems: 'flex-end', paddingRight: 4 },
  blockCount: { fontSize: 17, fontWeight: '600' },
  pager: { flex: 1 },
  page: { flex: 1 },
});
```

- [ ] **Step 6: Manually verify**

Run the app (`pnpm start` in `mobile/`). Open the Home tab:
- Header shows date title with left/right chevrons only
- No Start button, no ⋯ button in header
- After adding an entry, a number appears on the right (e.g. `1` or `0.5`)
- Number is absent when no entries exist for that day
- Navigating to a different day updates the count

- [ ] **Step 7: Commit**

```bash
git add mobile/app/(tabs)/home.tsx
git commit -m "feat(mobile): show day blocks sum in header, remove Start/menu buttons"
```

---

### Task 2: Add FAB for Start action

**Files:**
- Modify: `mobile/app/(tabs)/home.tsx`

- [ ] **Step 1: Add the FAB JSX**

The FAB sits inside the `SafeAreaView` root, rendered after the PagerView and before the RunningBar/AwaitingChoiceBar blocks. Add it in that position:

```tsx
{!timer && (
  <Pressable
    onPress={() => router.push({ pathname: '/pickers/picker', params: { mode: 'start' } })}
    style={({ pressed }) => [
      styles.fab,
      { bottom: 16 + insets.bottom, opacity: pressed ? 0.85 : 1 },
    ]}
  >
    <Text style={styles.fabText}>Start</Text>
  </Pressable>
)}
```

- [ ] **Step 2: Add FAB styles to the StyleSheet**

Inside the `StyleSheet.create({...})` block, add:

```tsx
fab: {
  position: 'absolute',
  right: 16,
  width: 72,
  height: 40,
  borderRadius: 20,
  backgroundColor: BRAND.accent,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 6,
},
fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
```

- [ ] **Step 3: Manually verify**

- FAB appears bottom-right when no timer is running
- FAB is hidden when a timer is running (running bar visible) or in awaiting-choice state
- Tapping FAB opens the activity picker in start mode
- FAB clears the safe-area bottom on devices with a home indicator (iPhone X+)

- [ ] **Step 4: Commit**

```bash
git add mobile/app/(tabs)/home.tsx
git commit -m "feat(mobile): add Start FAB"
```

---

### Task 3: Add Profile tab with sign out

**Files:**
- Create: `mobile/app/(tabs)/profile.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create `mobile/app/(tabs)/profile.tsx`**

```tsx
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from '~/api/auth';
import { useTheme } from '~/theme/ThemeProvider';

export default function ProfileScreen() {
  const { tokens } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tokens.bg }]} edges={['top']}>
      <Pressable
        onPress={() => void signOut()}
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={styles.btnText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Register the Profile tab in `_layout.tsx`**

Add `User` to the lucide import, then add the screen. Full updated file:

```tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { House, BarChart3, User } from 'lucide-react-native';
import { useTheme } from '~/theme/ThemeProvider';

export default function TabsLayout() {
  const { tokens } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.accent,
        tabBarInactiveTintColor: tokens.textTertiary,
        tabBarStyle:
          Platform.OS === 'ios'
            ? { borderTopWidth: 0.5, borderTopColor: tokens.separator }
            : { backgroundColor: tokens.surface, height: 80 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Manually verify**

- Tab bar shows three tabs: Home · Stats · Profile
- Profile tab shows a centred red "Sign out" button
- Tapping "Sign out" logs the user out and returns to the login screen

- [ ] **Step 4: Commit**

```bash
git add mobile/app/(tabs)/profile.tsx mobile/app/(tabs)/_layout.tsx
git commit -m "feat(mobile): add Profile tab with sign out"
```
