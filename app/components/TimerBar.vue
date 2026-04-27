<script setup lang="ts">
import type { Activity } from '~~/server/database/schema'

const { timer, config, mode, elapsedMs, remainingMs, start, stop, secondHalf } = useTimer()
const { data: activities } = useActivities()
const toast = useToast()

const open = ref(false)
const busy = ref(false)
const dropdownMode = ref<'list' | 'custom'>('list')
const customName = ref('')

watch(open, (v) => {
  if (!v) {
    dropdownMode.value = 'list'
    customName.value = ''
  } else {
    dropdownMode.value = 'list'
  }
})

const activeActivities = computed(() => activities.value.filter(a => !a.archivedAt))

const activitiesById = computed(() => {
  const m = new Map<number, Activity>()
  for (const a of activities.value) m.set(a.id, a)
  return m
})

const currentActivity = computed(() => {
  const t = timer.value
  return t ? activitiesById.value.get(t.activityId) ?? null : null
})

const swatch = useSwatch(() => currentActivity.value?.color ?? 'slate')

const remainingLabel = computed(() => {
  const ms = remainingMs.value
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progress = computed(() => {
  const total = config.value.halfDurationMs
  if (!total) return 0
  return Math.min(1, Math.max(0, elapsedMs.value / total))
})

const RING_R = 7
const RING_CIRC = 2 * Math.PI * RING_R

const pillStyle = computed(() => ({
  background: swatch.value.bg,
  color: swatch.value.text,
  border: `1px solid ${swatch.value.border}`
}))

const stopBtnStyle = computed(() => ({
  background: swatch.value.border,
  color: 'var(--bg-app)'
}))

const startBtnStyle = {
  background: 'var(--bg-brand-tint)',
  color: 'var(--text-brand)',
  border: '1px solid var(--border-brand-tint)'
}

async function handleStart(a: Activity) {
  if (busy.value) return
  busy.value = true
  try {
    await start({ activityId: a.id })
    open.value = false
  } catch (e) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: 'Failed to start', description: msg, color: 'error' })
  } finally {
    busy.value = false
  }
}

async function handleStartCustom() {
  const name = customName.value.trim()
  if (!name || busy.value) return
  busy.value = true
  try {
    await start({ name })
    open.value = false
  } catch (e) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: 'Failed to start', description: msg, color: 'error' })
  } finally {
    busy.value = false
  }
}

async function handleStop() {
  if (busy.value) return
  busy.value = true
  try {
    await stop()
  } catch (e) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: 'Failed to stop', description: msg, color: 'error' })
  } finally {
    busy.value = false
  }
}

async function handleSecondHalf() {
  if (busy.value) return
  busy.value = true
  try {
    await secondHalf()
  } catch (e) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    toast.add({ title: 'Failed', description: msg, color: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex items-center">
    <UPopover
      v-if="mode === 'idle'"
      v-model:open="open"
      :content="{ align: 'center', sideOffset: 4 }"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
        :style="startBtnStyle"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M3 2 L10 6 L3 10 Z" />
        </svg>
        <span>Start</span>
      </button>

      <template #content>
        <div class="w-56 p-1">
          <template v-if="dropdownMode === 'list'">
            <ul>
              <li
                v-for="a in activeActivities"
                :key="a.id"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated cursor-pointer disabled:opacity-50"
                  :disabled="busy"
                  @click="handleStart(a)"
                >
                  <ActivitySwatch
                    :color="a.color"
                    :size="10"
                  />
                  <span class="truncate">{{ a.name }}</span>
                </button>
              </li>
              <li
                v-if="activeActivities.length === 0"
                class="px-2 py-3 text-center text-xs text-muted"
              >
                No activities yet.
              </li>
            </ul>
            <div class="my-1 border-t border-default" />
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-elevated cursor-pointer"
              @click="dropdownMode = 'custom'"
            >
              <UIcon
                name="i-lucide-plus"
                class="size-3.5 text-primary"
              />
              <span>Custom…</span>
            </button>
          </template>

          <template v-else>
            <form
              class="flex items-center gap-1 p-1"
              @submit.prevent="handleStartCustom"
            >
              <UInput
                v-model="customName"
                placeholder="One-off block"
                :disabled="busy"
                autofocus
                size="sm"
                class="flex-1"
              />
              <UButton
                type="submit"
                icon="i-lucide-check"
                size="sm"
                :disabled="!customName.trim() || busy"
                :loading="busy"
              />
              <UButton
                type="button"
                icon="i-lucide-x"
                size="sm"
                color="neutral"
                variant="ghost"
                @click="dropdownMode = 'list'"
              />
            </form>
          </template>
        </div>
      </template>
    </UPopover>

    <div
      v-else-if="mode === 'running'"
      class="inline-flex items-center gap-2 rounded-full pl-3 pr-[5px] py-1 text-[13px] font-medium"
      :style="pillStyle"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        class="-rotate-90 shrink-0"
      >
        <circle
          cx="8"
          cy="8"
          :r="RING_R"
          fill="none"
          stroke="var(--ring-track)"
          stroke-width="1.6"
        />
        <circle
          cx="8"
          cy="8"
          :r="RING_R"
          fill="none"
          :stroke="swatch.border"
          stroke-width="1.6"
          stroke-linecap="round"
          :stroke-dasharray="RING_CIRC"
          :stroke-dashoffset="RING_CIRC * (1 - progress)"
        />
      </svg>
      <span class="truncate max-w-24 sm:max-w-32">{{ currentActivity?.name ?? '…' }}</span>
      <span class="tabular-nums opacity-85">{{ remainingLabel }}</span>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-full size-[22px] cursor-pointer disabled:opacity-50 ml-0.5"
        :style="stopBtnStyle"
        :disabled="busy"
        title="Stop & save"
        aria-label="Stop"
        @click="handleStop"
      >
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          fill="currentColor"
        >
          <rect
            x="1"
            y="1"
            width="7"
            height="7"
            rx="1"
          />
        </svg>
      </button>
    </div>

    <div
      v-else-if="mode === 'awaiting-choice'"
      class="inline-flex items-center gap-2 rounded-full pl-3 pr-1 py-1 text-[13px] font-medium"
      :style="pillStyle"
    >
      <ActivitySwatch
        :color="currentActivity?.color ?? 'slate'"
        :size="10"
      />
      <span class="truncate max-w-24 sm:max-w-28">{{ currentActivity?.name ?? '…' }}</span>
      <UButton
        size="xs"
        color="primary"
        variant="soft"
        :loading="busy"
        :disabled="busy"
        @click="handleSecondHalf"
      >
        Second half
      </UButton>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        :loading="busy"
        :disabled="busy"
        @click="handleStop"
      >
        New activity
      </UButton>
    </div>
  </div>
</template>
