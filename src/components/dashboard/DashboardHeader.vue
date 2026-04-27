<script setup lang="ts">
defineProps<{
  zoneColor: string;
}>();

defineEmits<{
  add: [];
  settings: [];
}>();
</script>

<template>
  <header class="header">
    <div class="logo">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M2 10 Q5 4 10 10 Q15 16 18 10"
          :stroke="zoneColor"
          stroke-width="2.5"
          stroke-linecap="round"
          fill="none"
        />
      </svg>
      <span class="logo-text">BP Tracker</span>
    </div>

    <div class="actions">
      <button class="icon-btn" aria-label="Налаштування" @click="$emit('settings')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <button
        class="add-btn"
        :style="{ background: zoneColor }"
        @click="$emit('add')"
      >
        + Додати
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 8px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.13);
  }
}

@media (prefers-color-scheme: light) {
  .icon-btn {
    background: rgba(0, 0, 0, 0.07);

    &:hover {
      background: rgba(0, 0, 0, 0.12);
    }
  }
}

.add-btn {
  border-radius: var(--radius-full);
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
  &:active {
    opacity: 0.7;
  }
}
</style>
