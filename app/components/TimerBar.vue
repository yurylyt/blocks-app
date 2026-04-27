<script setup lang="ts">
import type { Activity } from '~~/server/database/schema'

const { timer, mode, remainingMs, start, stop, secondHalf } = useTimer()
const { data: activities } = useActivities()
const toast = useToast()

const open = ref(false)
const busy = ref(false)

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

const remainingLabel = computed(() => {
  const ms = remainingMs.value
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

async function handleStart(a: Activity) {
  if (busy.value) return
  busy.value = true
  try {
    await start(a.id)
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
      <UButton
        icon="i-lucide-play"
        size="sm"
        color="primary"
        variant="soft"
      >
        Start
      </UButton>

      <template #content>
        <div class="w-56 p-1">
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
                <span
                  class="size-2.5 rounded-full shrink-0"
                  :style="{ background: a.color }"
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
        </div>
      </template>
    </UPopover>

    <div
      v-else-if="mode === 'running'"
      class="flex items-center gap-2 rounded-full border border-default bg-elevated/40 pl-2 pr-1 py-1"
    >
      <span
        class="size-2.5 rounded-full shrink-0"
        :style="{ background: currentActivity?.color ?? '#64748b' }"
      />
      <span class="text-sm truncate max-w-20 sm:max-w-32">{{ currentActivity?.name ?? '…' }}</span>
      <span class="text-sm font-mono tabular-nums text-muted">{{ remainingLabel }}</span>
      <UButton
        icon="i-lucide-square"
        size="xs"
        color="neutral"
        variant="ghost"
        :loading="busy"
        :disabled="busy"
        aria-label="Stop"
        @click="handleStop"
      />
    </div>

    <div
      v-else-if="mode === 'awaiting-choice'"
      class="flex items-center gap-2 rounded-full border border-default bg-elevated/40 pl-2 pr-1 py-1"
    >
      <span
        class="size-2.5 rounded-full shrink-0"
        :style="{ background: currentActivity?.color ?? '#64748b' }"
      />
      <span class="text-sm truncate max-w-20 sm:max-w-28">{{ currentActivity?.name ?? '…' }}</span>
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
