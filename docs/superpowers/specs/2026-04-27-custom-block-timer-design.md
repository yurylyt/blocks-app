# Custom block timer

Allow starting the Pomodoro-style timer with a freeform "custom" name (no activity), mirroring the existing "Custom…" option in `AddEntryMenu.vue` for one-off entries. Applies to both the web app and the macOS menubar app.

## Motivation

Today, every running timer must reference an `activityId` (the column is `notNull` in `running_timers`). Logging entries already supports a freeform `name` path for one-off blocks that don't merit a permanent activity — the timer should match that capability so users can time an ad-hoc block without first creating an activity.

## Data model

`running_timers` table changes (new migration generated via `pnpm db:generate`):

- `activity_id` becomes nullable (drop `notNull`); `ON DELETE cascade` is preserved.
- New `name text` column (nullable).
- New CHECK constraint: `(activity_id IS NULL) <> (name IS NULL)` — exactly one must be set.

No data backfill required; any in-flight rows already have `activity_id` set.

The `entries` table is unchanged: it already supports the "either `activityId` or `name`" pattern, and downstream consumers (`stats.get.ts`, `EntryChip`, etc.) already handle freeform-named entries.

## Server API

### `POST /api/timer/start` (`server/api/timer/start.post.ts`)

Body: `{ activityId?: number, name?: string, startedDate: string }`.

Validation:

- Exactly one of `activityId` or `name` must be present.
- `activityId`: finite number resolving to a non-archived activity for the requesting user (existing behavior).
- `name`: non-empty trimmed string.
- 400 `Invalid request` if both are missing or both are provided.

Insert into `runningTimers` populating whichever field was provided; the other column stays `NULL`.

### `POST /api/timer/complete` (`server/api/timer/complete.post.ts`)

When inserting the entry on first-half completion, propagate both timer columns directly:

```ts
await db.insert(schema.entries).values({
  userId,
  activityId: row.activityId,
  name: row.name,
  date: row.startedDate,
  blocks: 0.5,
  position
}).returning(...)
```

(Today this hardcodes `name: null`.)

### `POST /api/timer/stop` (`server/api/timer/stop.post.ts`)

Same change as above for the early-stop entry insert path (when `firstEntryId == null && elapsed >= HALF_BLOCK_MIN_MS`).

### `GET /api/timer` (`server/api/timer/index.get.ts`)

Response gains `name: string | null` alongside `activityId: number | null` inside the `timer` object.

### `POST /api/timer/second-half`

No change.

## Web frontend

### `app/composables/useTimer.ts`

- `TimerState` and `ApiTimer` gain `name: string | null`; `activityId` becomes `number | null`.
- `start()` signature: `start(arg: { activityId: number } | { name: string })`. Posted to `/api/timer/start` as-is alongside `startedDate: today()`.

### `app/components/TimerBar.vue`

Idle dropdown mirrors `AddEntryMenu.vue`:

- Existing list of active activities (unchanged).
- Divider.
- "Custom…" row. Click toggles the popover into an inline form (text input + submit + cancel), exactly mirroring `AddEntryMenu`'s `mode === 'custom'` template.
- Submit: trim, require non-empty, call `start({ name })`, close popover.

Running and awaiting-choice states need to handle null `activityId`:

- Replace `currentActivity?.name ?? '…'` etc. with a unified `currentLabel = computed(() => currentActivity.value?.name ?? timer.value?.name ?? '…')`.
- Color falls back to `'slate'` via `useSwatch`, which already handles unknown colors. No new color logic needed.
- The "New activity" button copy in awaiting-choice stays as-is — it just stops the timer and reopens the picker on next start.

## macOS menubar

### `macos/BlocksMenuBar/Sources/Models.swift`

- `ApiTimer.activityId: Int` → `activityId: Int?`
- Add `name: String?` to `ApiTimer`.

### `macos/BlocksMenuBar/Sources/AppState.swift`

- `currentActivity` already returns `nil` cleanly when `activityId` is `nil`.
- New `currentLabel: String { currentActivity?.name ?? timer?.name ?? "…" }`.
- `StartBody` becomes `{ activityId: Int?, name: String?, startedDate: String }` with conditional encoding so only the populated field is sent over the wire.
- New `startCustomTimer(name: String) async` parallel to `startTimer(activityId: Int)`.
- `maybeAutoComplete()`: chime label uses `currentLabel` (so custom timer names appear in the notification).

### `macos/BlocksMenuBar/Sources/PopoverContent.swift`

- `idleView`: after the activities list (and the "No activities yet" branch), append a divider and a "Custom…" row that toggles into an inline `TextField` + submit button. Submit calls `state.startCustomTimer(name:)`.
- `runningView` and `finishedView`: replace `state.currentActivity?.name ?? "…"` / `"Running…"` / `"Block complete"` fallbacks with `state.currentLabel`. The color expression today is `Color(hex: state.currentActivity?.color ?? "#10b981")` — leave that emerald fallback as the custom-timer color (matches the existing fallback path for unknown activities).

## Out of scope

- Autocomplete from past freeform names (matches `AddEntryMenu` — also no autocomplete).
- Custom timer durations or colors.
- Editing the name mid-timer.
- Promoting a custom timer's name into a real activity.
