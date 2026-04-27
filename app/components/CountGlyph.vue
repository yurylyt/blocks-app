<script setup lang="ts">
const props = withDefaults(defineProps<{
  half?: boolean
  color: string
  halfPosition?: 'top' | 'bottom'
  size?: number
}>(), {
  half: false,
  halfPosition: 'bottom',
  size: 12
})

const inner = computed(() => props.size - 2)
const halfHeight = computed(() => inner.value / 2)
const halfY = computed(() => props.halfPosition === 'top' ? 1 : props.size / 2)
</script>

<template>
  <span class="inline-flex shrink-0 items-center">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
    >
      <rect
        x="1"
        y="1"
        :width="inner"
        :height="inner"
        rx="2.5"
        fill="none"
        :stroke="color"
        stroke-width="1.3"
      />
      <rect
        v-if="half"
        x="1"
        :y="halfY"
        :width="inner"
        :height="halfHeight"
        :fill="color"
      />
      <rect
        v-else
        x="1"
        y="1"
        :width="inner"
        :height="inner"
        rx="2.5"
        :fill="color"
      />
    </svg>
  </span>
</template>
