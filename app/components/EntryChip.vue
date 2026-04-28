<script setup lang="ts">
import { onClickOutside, onLongPress } from '@vueuse/core'
import type { Activity, Entry } from '~~/server/database/schema'

const props = defineProps<{
  entry: Entry
  activity: Activity | undefined
  activities: Activity[]
  halfPosition?: 'top' | 'bottom'
}>()

const emit = defineEmits<{
  toggle: [entry: Entry]
  remove: [entry: Entry]
  updated: []
}>()

const name = computed(() => props.activity?.name ?? props.entry.name ?? 'Unknown')
const isHalf = computed(() => props.entry.blocks === 0.5)
const swatch = useSwatch(() => props.activity?.color ?? 'slate')

const cardStyle = computed(() => ({
  background: isHalf.value
    ? `repeating-linear-gradient(-45deg, ${swatch.value.surface} 0 8px, ${swatch.value.bg} 8px 16px)`
    : swatch.value.surface,
  color: 'var(--text-primary)',
  border: '1px solid var(--border-strong)',
  borderLeft: `5px solid ${swatch.value.border}`,
  paddingLeft: isHalf.value ? '9px' : '11px'
}))

const rootEl = ref<HTMLElement | null>(null)
const nameEl = ref<HTMLElement | null>(null)
const revealed = ref(false)
const menuOpen = ref(false)
let longPressed = false

onLongPress(nameEl, () => {
  revealed.value = true
  longPressed = true
  setTimeout(() => { longPressed = false }, 400)
}, { delay: 500, distanceThreshold: 10 })

onClickOutside(rootEl, () => {
  if (!menuOpen.value) revealed.value = false
})

function onToggleClick() {
  if (longPressed) return
  if (revealed.value) {
    revealed.value = false
    return
  }
  emit('toggle', props.entry)
}
</script>

<template>
  <div
    ref="rootEl"
    class="group relative flex items-center gap-2 rounded-lg text-[13px] font-medium"
    :class="isHalf ? 'min-h-7 py-[5px] pr-[10px]' : 'min-h-14 py-[14px] pr-3'"
    :style="cardStyle"
  >
    <span class="drag-handle cursor-grab shrink-0 inline-flex items-center text-dimmed">
      <svg
        width="8"
        height="14"
        viewBox="0 0 8 14"
        fill="currentColor"
      >
        <circle
          cx="2"
          cy="2"
          r="1"
        />
        <circle
          cx="6"
          cy="2"
          r="1"
        />
        <circle
          cx="2"
          cy="7"
          r="1"
        />
        <circle
          cx="6"
          cy="7"
          r="1"
        />
        <circle
          cx="2"
          cy="12"
          r="1"
        />
        <circle
          cx="6"
          cy="12"
          r="1"
        />
      </svg>
    </span>
    <button
      ref="nameEl"
      type="button"
      class="flex flex-1 items-center gap-2 text-left cursor-pointer min-w-0"
      :title="isHalf ? 'Switch to full block' : 'Switch to half block'"
      @click="onToggleClick"
    >
      <CountGlyph
        :half="isHalf"
        :half-position="halfPosition ?? 'bottom'"
        :color="swatch.border"
      />
      <span class="truncate">{{ name }}</span>
    </button>
    <EditEntryMenu
      :entry="entry"
      :activities="activities"
      :revealed="revealed"
      @updated="emit('updated')"
      @open-change="menuOpen = $event"
    />
    <button
      type="button"
      :class="[
        revealed ? 'inline-block' : 'hidden group-hover:inline-block',
        'text-muted hover:text-error cursor-pointer shrink-0'
      ]"
      title="Delete"
      @click="emit('remove', entry)"
    >
      <UIcon
        name="i-lucide-x"
        class="size-3.5"
      />
    </button>
  </div>
</template>
