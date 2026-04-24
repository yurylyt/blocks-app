<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({ title: 'Blocks', description: 'Track your academic blocks' })

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
    <UHeader :ui="{ container: 'w-full' }">
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
          <UIcon name="i-lucide-blocks" class="size-5 text-primary" />
          Blocks
        </NuxtLink>
      </template>

      <template #right>
        <template v-if="loggedIn">
          <div class="hidden sm:flex items-center gap-1">
            <UButton to="/" variant="ghost" color="neutral" size="sm">Week</UButton>
            <UButton to="/stats" variant="ghost" color="neutral" size="sm">Stats</UButton>
            <UButton to="/activities" variant="ghost" color="neutral" size="sm">Activities</UButton>
          </div>
          <UDropdownMenu
            :items="[
              [{ label: user?.email, type: 'label' }],
              [{ label: 'Log out', icon: 'i-lucide-log-out', onSelect: logout }]
            ]"
          >
            <UAvatar
              :src="user?.avatarUrl ?? undefined"
              :alt="user?.name"
              size="sm"
              class="cursor-pointer"
            />
          </UDropdownMenu>
        </template>
        <UColorModeButton />
      </template>

      <template #body>
        <div v-if="loggedIn" class="flex flex-col gap-1 p-4">
          <UButton to="/" variant="ghost" color="neutral" block>Week</UButton>
          <UButton to="/stats" variant="ghost" color="neutral" block>Stats</UButton>
          <UButton to="/activities" variant="ghost" color="neutral" block>Activities</UButton>
        </div>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
