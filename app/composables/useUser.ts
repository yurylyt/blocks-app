import type { ChimeSound } from '~~/shared/chime'

export function useUser() {
  const { user, fetch } = useUserSession()

  async function setChime(value: ChimeSound) {
    await $fetch('/api/me', { method: 'PATCH', body: { chimeSound: value } })
    await fetch()
  }

  return { user, setChime }
}
