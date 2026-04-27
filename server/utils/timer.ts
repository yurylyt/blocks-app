export const HALF_DURATION_MS = 45 * 60 * 1000
export const HALF_BLOCK_MIN_MS = 20 * 60 * 1000

export function elapsedMs(startedAt: Date): number {
  return Date.now() - startedAt.getTime()
}
