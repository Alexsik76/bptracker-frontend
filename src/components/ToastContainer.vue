<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, dismiss } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="toast-wrap" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast" tag="div" class="toast-list">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['toast', t.type]"
          role="status"
        >
          <span class="toast-msg">{{ t.message }}</span>
          <button class="toast-close" @click="dismiss(t.id)" aria-label="Закрити">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-wrap {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 1000;
  pointer-events: none;

  @media (max-width: 480px) {
    right: var(--space-4);
    left: var(--space-4);
  }
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-end;

  @media (max-width: 480px) {
    align-items: stretch;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  font-size: var(--text-sm);
  font-weight: 500;
  pointer-events: all;
  min-width: 220px;
  max-width: 360px;

  &.success {
    background: var(--color-success);
    color: white;
  }

  &.error {
    background: var(--color-danger);
    color: white;
  }

  &.info {
    background: var(--color-primary);
    color: white;
  }
}

.toast-msg { flex: 1; }

.toast-close {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  font-size: var(--text-base);
  line-height: 1;
  padding: 0;
  flex-shrink: 0;

  &:hover { opacity: 1; }
}

.toast-enter-active,
.toast-leave-active { transition: all 0.25s ease; }

.toast-enter-from { opacity: 0; transform: translateY(12px); }
.toast-leave-to   { opacity: 0; transform: translateX(20px); }
</style>
