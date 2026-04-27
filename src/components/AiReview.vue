<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const sys = ref('---');
const dia = ref('---');
const pulse = ref('---');
let interval: number;

onMounted(() => {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  interval = setInterval(() => {
    sys.value = String(rand(90, 180));
    dia.value = String(rand(55, 115));
    pulse.value = String(rand(55, 100));
  }, 80);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <div class="ai-review">
    <div class="loader-icon">
      <svg
        class="animate-spin"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" opacity="0.1"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
    </div>

    <h2>AI розпізнає дані...</h2>

    <div class="stats">
      <div class="stat">
        <span class="val">{{ sys }}</span>
        <span class="label">СИС</span>
      </div>
      <div class="stat">
        <span class="val">{{ dia }}</span>
        <span class="label">ДІА</span>
      </div>
      <div class="stat">
        <span class="val">{{ pulse }}</span>
        <span class="label">Пульс</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-review {
  text-align: center;
  padding: var(--space-8) 0;

  & h2 {
    font-size: var(--text-base);
    color: var(--color-text-muted);
    margin-bottom: var(--space-8);
  }
}

.loader-icon {
  color: var(--color-primary);
  margin-bottom: var(--space-4);
  display: flex;
  justify-content: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat {
  display: flex;
  flex-direction: column;

  & .val {
    font-size: var(--text-xl);
    font-weight: bold;
    color: var(--color-primary);
    font-variant-numeric: tabular-nums;
  }

  & .label {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }
}
</style>
