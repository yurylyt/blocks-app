import { resolveSwatch, type Swatch } from '~~/shared/palette'

export interface ResolvedSwatch {
  swatch: Swatch
  dark: boolean
  dot: string
  bg: string
  surface: string
  border: string
  text: string
}

export function pickSwatch(color: string | null | undefined, dark: boolean): ResolvedSwatch {
  const swatch = resolveSwatch(color)
  return {
    swatch,
    dark,
    dot: dark ? swatch.dotDark : swatch.dot,
    bg: dark ? swatch.bgDark : swatch.bg,
    surface: dark ? swatch.surfaceDark : swatch.surface,
    border: dark ? swatch.borderDark : swatch.border,
    text: dark ? swatch.textDark : swatch.text
  }
}

export function useSwatch(color: MaybeRefOrGetter<string | null | undefined>) {
  const mode = useColorMode()
  return computed<ResolvedSwatch>(() => pickSwatch(toValue(color), mode.value === 'dark'))
}

export function useIsDark() {
  const mode = useColorMode()
  return computed(() => mode.value === 'dark')
}
