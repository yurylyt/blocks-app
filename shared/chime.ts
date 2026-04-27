export const CHIME_SOUNDS = ['chime-1', 'chime-2', 'chime-3'] as const
export type ChimeSound = typeof CHIME_SOUNDS[number]

export function isChimeSound(value: unknown): value is ChimeSound {
  return typeof value === 'string' && (CHIME_SOUNDS as readonly string[]).includes(value)
}
