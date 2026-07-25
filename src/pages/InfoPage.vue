<script setup lang="ts">
import { useRouter } from 'vue-router';
import BpScaleInfo from '../components/settings/BpScaleInfo.vue';

const router = useRouter();
</script>

<template>
  <div class="info-page">
    <header class="back-header">
      <button class="back-btn" :aria-label="$t('common.back')" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#e8eaee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.5 4 L6 10 L12.5 16"></path>
        </svg>
      </button>
      <h1 class="page-title">{{ $t('info.title') }}</h1>
    </header>

    <main class="content">
      <section class="card">
        <BpScaleInfo />
      </section>
    </main>
  </div>
</template>

<style scoped>
.info-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: var(--color-bg);
}

.back-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 8px;
  flex-shrink: 0;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #15181d;
  border: 1px solid #21262d;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #e8eaee;
  padding: 0;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
}

.page-title {
  font-size: 20px;
  font-weight: 800;
  color: #f2f4f7;
  margin: 0;
}

.content {
  padding: var(--space-6);
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  flex: 1;
  overflow-y: auto;
}

.card {
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}
</style>
