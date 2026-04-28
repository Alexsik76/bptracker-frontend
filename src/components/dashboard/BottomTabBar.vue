<script setup lang="ts">
const props = defineProps<{
  modelValue: number;
  zoneColor: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
  history: [];
  profile: [];
}>();

const tabs = [
  { label: 'Дашборд', index: 0 },
  { label: 'Історія', index: 1 },
  { label: 'Ліки', index: 2 },
  { label: 'Профіль', index: 3 },
];

function select(index: number) {
  if (index === 1) {
    emit('history');
  } else if (index === 3) {
    emit('profile');
  } else {
    emit('update:modelValue', index);
  }
}
</script>

<template>
  <nav class="tab-bar">
    <button
      v-for="tab in tabs"
      :key="tab.index"
      class="tab-btn"
      :style="{ color: modelValue === tab.index ? props.zoneColor : undefined }"
      @click="select(tab.index)"
    >
      <!-- Дашборд -->
      <svg v-if="tab.index === 0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <!-- Історія -->
      <svg v-else-if="tab.index === 1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      <!-- Ліки -->
      <svg v-else-if="tab.index === 2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3" />
        <circle cx="18" cy="18" r="4" />
        <path d="M15.5 18H21" />
      </svg>
      <!-- Профіль -->
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  padding: 10px 0 6px;
  background: var(--color-surface-solid);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  min-width: 44px;
  min-height: 44px;
  justify-content: center;
  transition: color 0.15s;
}

.tab-label {
  font-size: 9px;
  font-weight: 500;
  font-family: var(--font-sans);
}
</style>
