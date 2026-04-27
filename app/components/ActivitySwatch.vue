<script setup lang="ts">
const props = withDefaults(defineProps<{
  color: string | null | undefined
  size?: number
}>(), { size: 10 })

const swatch = useSwatch(() => props.color)
</script>

<template>
  <span
    class="inline-block rounded-full shrink-0"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      background: swatch.dot
    }"
  />
</template>
