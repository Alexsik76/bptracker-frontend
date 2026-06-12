<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: number; // 0 = Dashboard, 1 = Schedule
  hasMissedIntakes: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
  scan: [];
}>();

const { t } = useI18n();
</script>

<template>
  <nav class="tab-bar">
    <!-- LEFT: Dashboard Tab -->
    <button
      class="tab-btn"
      :class="{ active: modelValue === 0 }"
      @click="emit('update:modelValue', 0)"
    >
      <svg class="tab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <rect x="3.5" y="3.5" width="7" height="7" rx="2"></rect>
        <rect x="13.5" y="3.5" width="7" height="7" rx="2"></rect>
        <rect x="3.5" y="13.5" width="7" height="7" rx="2"></rect>
        <rect x="13.5" y="13.5" width="7" height="7" rx="2"></rect>
      </svg>
      <span class="tab-label">{{ t('dashboard.tabs.dashboard') }}</span>
    </button>

    <!-- CENTER: Scan Button (protruding, raised) -->
    <div class="scan-btn-wrapper">
      <button class="scan-btn" :aria-label="t('localOcr.title')" @click="emit('scan')">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round">
          <path d="M4 9 V6 a2 2 0 0 1 2 -2 H9"></path>
          <path d="M19 4 H22 a2 2 0 0 1 2 2 V9"></path>
          <path d="M24 19 V22 a2 2 0 0 1 -2 2 H19"></path>
          <path d="M9 24 H6 a2 2 0 0 1 -2 -2 V19"></path>
          <line x1="8" y1="14" x2="20" y2="14"></line>
        </svg>
      </button>
    </div>

    <!-- RIGHT: Schedule Tab -->
    <button
      class="tab-btn"
      :class="{ active: modelValue === 1 }"
      @click="emit('update:modelValue', 1)"
    >
      <div class="icon-badge-wrapper">
        <svg class="tab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <rect x="3.5" y="5" width="17" height="15.5" rx="3"></rect>
          <line x1="8" y1="3" x2="8" y2="7"></line>
          <line x1="16" y1="3" x2="16" y2="7"></line>
          <line x1="3.5" y1="10" x2="20.5" y2="10"></line>
        </svg>
        <div v-if="hasMissedIntakes" class="badge-dot" />
      </div>
      <span class="tab-label">{{ t('dashboard.tabs.schedule') }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-bar {
  display: flex;
  align-items: stretch;
  height: 84px;
  background: #101318;
  border-top: 1px solid #1f242c;
  flex-shrink: 0;
  position: relative;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #707887; /* tab-inactive */
  min-width: 44px;
  min-height: 44px;
  padding-bottom: 6px;
  transition: color 0.15s;

  &.active {
    color: #f0821e; /* active accent-orange */
  }
}

.tab-label {
  font-size: 11px;
  font-weight: 600;
}

.scan-btn-wrapper {
  flex: 1;
  position: relative;
}

.scan-btn {
  position: absolute;
  left: 50%;
  top: -28px;
  transform: translateX(-50%);
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: linear-gradient(160deg, #25b256, #168a40);
  border: 4px solid #0a0c0f; /* creates cutout look with bg-app */
  box-shadow: 0 8px 24px rgba(30, 158, 76, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s;

  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}

.icon-badge-wrapper {
  position: relative;
  display: inline-flex;
}

.badge-dot {
  position: absolute;
  top: -3px;
  right: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e5484d; /* accent-red */
  border: 2px solid #101318; /* tabbar-bg */
}
</style>
