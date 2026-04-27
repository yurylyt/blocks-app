// 12-swatch activity palette built in OKLCH.
// `dot`: chip / picker / stats fill. `border`: left-bar + glyph color.
// `bg`: tinted card background base. `text`: foreground on `bg`.

export type SwatchId
  = | 'slate' | 'red' | 'orange' | 'amber'
    | 'lime' | 'emerald' | 'teal' | 'sky'
    | 'blue' | 'indigo' | 'violet' | 'pink'

export interface Swatch {
  id: SwatchId
  name: string
  hue: number
  neutral: boolean
  dot: string
  dotDark: string
  bg: string
  bgDark: string
  // Card surface (light/dark) — fainter than `bg`, for the leftbar-tint variant.
  surface: string
  surfaceDark: string
  border: string
  borderDark: string
  text: string
  textDark: string
}

const SPEC: Array<{ id: SwatchId, name: string, hue: number, neutral?: boolean }> = [
  { id: 'slate', name: 'Slate', hue: 250, neutral: true },
  { id: 'red', name: 'Red', hue: 25 },
  { id: 'orange', name: 'Orange', hue: 55 },
  { id: 'amber', name: 'Amber', hue: 85 },
  { id: 'lime', name: 'Lime', hue: 125 },
  { id: 'emerald', name: 'Emerald', hue: 155 },
  { id: 'teal', name: 'Teal', hue: 190 },
  { id: 'sky', name: 'Sky', hue: 230 },
  { id: 'blue', name: 'Blue', hue: 260 },
  { id: 'indigo', name: 'Indigo', hue: 285 },
  { id: 'violet', name: 'Violet', hue: 310 },
  { id: 'pink', name: 'Pink', hue: 350 }
]

function build(s: { id: SwatchId, name: string, hue: number, neutral?: boolean }): Swatch {
  const neutral = !!s.neutral
  const c = neutral ? 0.015 : 0.09
  const cTint = neutral ? 0.008 : 0.045
  const cBorder = neutral ? 0.02 : 0.12
  return {
    id: s.id,
    name: s.name,
    hue: s.hue,
    neutral,
    dot: `oklch(0.72 ${c} ${s.hue})`,
    dotDark: `oklch(0.78 ${c} ${s.hue})`,
    bg: `oklch(0.955 ${cTint} ${s.hue})`,
    bgDark: `oklch(0.32 ${cTint * 1.6} ${s.hue})`,
    // Even fainter background for the chosen `leftbar-tint` block card.
    // Light: lift `bg` slightly + de-saturate. Dark: drop lightness + de-saturate `bgDark`.
    surface: `oklch(0.98 ${cTint * 0.55} ${s.hue})`,
    surfaceDark: `oklch(0.27 ${cTint * 0.8} ${s.hue})`,
    border: `oklch(0.65 ${cBorder} ${s.hue})`,
    borderDark: `oklch(0.7 ${cBorder * 0.9} ${s.hue})`,
    text: neutral ? 'oklch(0.32 0.02 250)' : `oklch(0.32 0.05 ${s.hue})`,
    textDark: neutral ? 'oklch(0.92 0.01 250)' : `oklch(0.92 0.04 ${s.hue})`
  }
}

export const PALETTE: Swatch[] = SPEC.map(build)

export const PALETTE_BY_ID: Record<SwatchId, Swatch> = Object.fromEntries(
  PALETTE.map(p => [p.id, p])
) as Record<SwatchId, Swatch>

export const SWATCH_IDS: SwatchId[] = PALETTE.map(p => p.id)

// Map legacy hex colors (from initial seed and old palette) to swatch ids so
// existing data renders sensibly without a forced data migration.
const HEX_TO_SWATCH: Record<string, SwatchId> = {
  // Initial seed.ts defaults
  '6366f1': 'indigo',
  '0ea5e9': 'sky',
  '22c55e': 'emerald',
  'f59e0b': 'amber',
  'ef4444': 'red',
  // Old activities.vue PALETTE (without the 78 alpha)
  '8b5cf6': 'violet',
  'a855f7': 'violet',
  'ec4899': 'pink',
  'f43f5e': 'pink',
  'f97316': 'orange',
  'eab308': 'amber',
  '84cc16': 'lime',
  '10b981': 'emerald',
  '14b8a6': 'teal',
  '06b6d4': 'teal',
  '3b82f6': 'blue',
  '64748b': 'slate',
  '78716c': 'slate'
}

export function isSwatchId(value: string | null | undefined): value is SwatchId {
  return !!value && (value in PALETTE_BY_ID)
}

/**
 * Resolve any stored color value to a palette swatch.
 * - palette ids → exact swatch
 * - 6/8-char hex (with or without leading #) → mapped to nearest known swatch
 * - anything else → slate fallback
 */
export function resolveSwatch(color: string | null | undefined): Swatch {
  if (!color) return PALETTE_BY_ID.slate
  if (isSwatchId(color)) return PALETTE_BY_ID[color]
  const hex = color.replace(/^#/, '').slice(0, 6).toLowerCase()
  if (HEX_TO_SWATCH[hex]) return PALETTE_BY_ID[HEX_TO_SWATCH[hex]]
  return PALETTE_BY_ID.slate
}
