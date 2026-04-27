declare module '#app' {
  interface RuntimeNuxtHooks {
    'blocks:entries-changed': () => void
  }
}

export {}
