<script setup lang="ts">
withDefaults(defineProps<{
  size?: number
}>(), { size: 22 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
    class="text-[oklch(0.6_0.18_155)] dark:text-[oklch(0.78_0.15_155)]"
  >
    <rect
      x="2"
      y="3"
      width="16"
      height="6"
      rx="1.5"
      fill="currentColor"
    />
    <rect
      x="2"
      y="11"
      width="16"
      height="6"
      rx="1.5"
      stroke="currentColor"
      stroke-width="1.6"
    />
    <rect
      x="2"
      y="11"
      width="8"
      height="6"
      rx="1.5"
      fill="currentColor"
    />
  </svg>
</template>
