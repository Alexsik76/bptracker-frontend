<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useScrollDirection } from '../../composables/useScrollDirection';

const router = useRouter();
const { isVisible } = useScrollDirection();
</script>

<template>
  <button
    class="corner-gear"
    :class="{ 'corner-gear--hidden': !isVisible }"
    aria-label="Налаштування"
    @click="router.push({ name: 'settings' })"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa2b0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  </button>
</template>

<style scoped>
.corner-gear {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 999;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(21, 24, 29, 0.82);
  border: 1px solid #262b33;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  padding: 0;
}

.corner-gear--hidden {
  transform: translateY(-20px) scale(0.9);
  opacity: 0;
  pointer-events: none;
}
</style>
