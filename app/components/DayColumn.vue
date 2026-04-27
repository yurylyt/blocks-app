<script setup lang="ts">
import { useSortable, moveArrayElement } from '@vueuse/integrations/useSortable'
import type { UseSortableOptions } from '@vueuse/integrations/useSortable'
import type { Activity, Entry } from '~~/server/database/schema'

const props = defineProps<{
  date: string
  label: string
  dom: number
  isToday?: boolean
  entries: Entry[]
  activities: Activity[]
  activitiesById: Map<number, Activity>
}>()

const emit = defineEmits<{
  created: []
  toggle: [entry: Entry]
  remove: [entry: Entry]
  reorder: [entries: Entry[]]
  updated: []
}>()

const sortedEntries = ref<Entry[]>([...props.entries])
watch(() => props.entries, (val) => { sortedEntries.value = [...val] })

const listEl = ref<HTMLElement | null>(null)
const sortableOptions = {
  handle: '.drag-handle',
  animation: 150,
  onUpdate: (e: { oldIndex?: number, newIndex?: number }) => {
    if (e.oldIndex == null || e.newIndex == null) return
    moveArrayElement(sortedEntries, e.oldIndex, e.newIndex)
    nextTick(() => emit('reorder', [...sortedEntries.value]))
  }
} as UseSortableOptions

useSortable(listEl, sortedEntries, sortableOptions)

const total = computed(() =>
  props.entries.reduce((sum, e) => sum + e.blocks, 0)
)

const totalLabel = computed(() => {
  const t = total.value
  if (t === 0) return '0'
  return Number.isInteger(t) ? String(t) : t.toFixed(1)
})

// Walk back one step: if the immediate predecessor is also half, this one
// goes 'bottom' so the two visually combine; otherwise 'top'.
function halfPositionAt(idx: number): 'top' | 'bottom' {
  const prev = sortedEntries.value[idx - 1]
  if (!prev) return 'top'
  return prev.blocks === 0.5 ? 'bottom' : 'top'
}

const columnStyle = computed(() => props.isToday
  ? { background: 'var(--bg-today)', borderColor: 'var(--border-today)' }
  : { background: 'var(--bg-surface)', borderColor: 'var(--border-card)' }
)

const headerColor = computed(() =>
  props.isToday ? 'var(--text-today)' : 'var(--text-muted)'
)

const badgeStyle = computed(() => {
  if (total.value === 0) {
    return { background: 'var(--bg-chip-empty)', color: 'var(--text-faint)' }
  }
  if (props.isToday) {
    return { background: 'var(--bg-today-badge)', color: 'var(--text-today)' }
  }
  return { background: 'var(--border-card)', color: 'var(--text-strong)' }
})
</script>

<template>
  <div
    class="flex flex-col rounded-[10px] border p-2 gap-1.5 min-h-[360px]"
    :style="columnStyle"
  >
    <div
      class="flex items-center justify-between px-2 pt-1.5 pb-2 text-[11px] font-semibold tracking-[0.04em] uppercase"
      :style="{ color: headerColor }"
    >
      <span>{{ label }} {{ dom }}</span>
      <span
        class="inline-flex items-center justify-center rounded-full px-2 py-px text-[11px] font-semibold tabular-nums min-w-5"
        :style="badgeStyle"
      >
        {{ totalLabel }}
      </span>
    </div>

    <div
      ref="listEl"
      class="flex flex-col gap-1.5"
    >
      <EntryChip
        v-for="(e, i) in sortedEntries"
        :key="e.id"
        :entry="e"
        :activity="e.activityId != null ? activitiesById.get(e.activityId) : undefined"
        :activities="activities"
        :half-position="e.blocks === 0.5 ? halfPositionAt(i) : 'bottom'"
        @toggle="emit('toggle', $event)"
        @remove="emit('remove', $event)"
        @updated="emit('updated')"
      />
    </div>
    <AddEntryMenu
      :date="date"
      :activities="activities"
      class="mt-auto"
      @created="emit('created')"
    />
  </div>
</template>
