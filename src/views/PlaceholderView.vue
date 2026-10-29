<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="placeholder-page">
    <div class="page-header">
      <h1 class="page-title">{{ title }}</h1>
    </div>

    <div class="content-card">
      <div class="placeholder-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      </div>
      <h2 class="placeholder-title">Розділ у розробці</h2>
      <p class="placeholder-desc">
        Функціонал для розділу «{{ title }}» наразі створюється. Незабаром тут з'явиться панель керування відповідними даними.
      </p>
    </div>
  </div>
</template>

<style scoped>
.placeholder-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.content-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-card);
  padding: 64px var(--space-24);
  min-height: 380px;
}

.placeholder-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary-bg-chip);
  color: var(--primary);
  margin-bottom: var(--space-20);
}

.placeholder-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-8);
}

.placeholder-desc {
  font-size: 14px;
  color: var(--text-muted);
  max-width: 480px;
  line-height: 1.5;
}
</style>
