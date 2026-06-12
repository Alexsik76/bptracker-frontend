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
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="#9aa2b0" stroke-width="1.8" stroke-linecap="round">
      <circle cx="11" cy="11" r="3.4"></circle>
      <line x1="11" y1="2.2" x2="11" y2="5.2"></line>
      <line x1="11" y1="16.8" x2="11" y2="19.8"></line>
      <line x1="2.2" y1="11" x2="5.2" y2="11"></line>
      <line x1="16.8" y1="11" x2="19.8" y2="11"></line>
      <line x1="4.8" y1="4.8" x2="6.9" y2="6.9"></line>
      <line x1="15.1" y1="15.1" x2="17.2" y2="17.2"></line>
      <line x1="17.2" y1="4.8" x2="15.1" y2="6.9"></line>
      <line x1="6.9" y1="15.1" x2="4.8" y2="17.2"></line>
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
