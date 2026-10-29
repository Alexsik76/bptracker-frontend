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

    <div class="content-card card">
      <div class="placeholder-icon">
        <svg class="i placeholder-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>
      <h2 class="placeholder-title">Under Development</h2>
      <p class="placeholder-desc">
        Features for "{{ title }}" are currently in development and will be available soon.
      </p>
    </div>
  </div>
</template>

<style scoped>
.placeholder-page {
  display: flex;
  flex-direction: column;
  gap: var(--bpt-sp-5);
  padding-top: var(--bpt-sp-1);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: var(--bpt-fs-title-page);
  line-height: var(--bpt-lh-title-page);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.content-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--bpt-radius-card);
  padding: 64px var(--bpt-sp-6);
  min-height: 380px;
}

.placeholder-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  margin-bottom: var(--bpt-sp-5);
}

.placeholder-icon-svg {
  width: var(--bpt-h-control);
  height: var(--bpt-h-control);
}

.placeholder-title {
  font-size: var(--bpt-fs-title);
  line-height: var(--bpt-lh-title);
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  margin-bottom: var(--bpt-sp-2);
}

.placeholder-desc {
  font-size: var(--bpt-fs-body);
  color: var(--md-sys-color-on-surface-variant);
  max-width: 480px;
  line-height: var(--bpt-lh-body);
}
</style>
