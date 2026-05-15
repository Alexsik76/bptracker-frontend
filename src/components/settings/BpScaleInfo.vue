<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { BP_CLASS_COLOR, BP_CLASS_BG, BP_CLASS_RANGE } from '../../utils/bp';
import type { BpClass } from '../../utils/bp';
import { useBpLabels } from '../../composables/useBpLabels';

const { t } = useI18n();
const labels = useBpLabels();
const order: BpClass[] = ['optimal', 'normal', 'stage1', 'stage2'];
</script>

<template>
  <section id="bp-scale-info" class="bp-scale-info">
    <h3 class="section-title">{{ t('bpScale.title') }}</h3>

    <p class="intro">{{ t('bpScale.intro') }}</p>

    <div class="scale-table" role="table" :aria-label="t('bpScale.title')">
      <div class="scale-row scale-head" role="row">
        <span role="columnheader">{{ t('bpScale.columns.level') }}</span>
        <span role="columnheader">{{ t('bpScale.columns.sys') }}</span>
        <span role="columnheader">{{ t('bpScale.columns.dia') }}</span>
      </div>
      <div v-for="key in order" :key="key" class="scale-row" role="row">
        <span
          class="zone-badge"
          :style="{ color: BP_CLASS_COLOR[key], background: BP_CLASS_BG[key] }"
          role="cell"
        >
          {{ labels[key] }}
        </span>
        <span class="range" role="cell">{{ BP_CLASS_RANGE[key].sys }}</span>
        <span class="range" role="cell">{{ BP_CLASS_RANGE[key].dia }}</span>
      </div>
    </div>

    <h4 class="subsection-title">{{ t('bpScale.tieBreakTitle') }}</h4>
    <i18n-t keypath="bpScale.tieBreak" tag="p" class="tie-break">
      <template #example>
        <strong>{{ t('bpScale.tieBreakExample') }}</strong>
      </template>
      <template #result>
        <strong>{{ t('bpScale.tieBreakResult') }}</strong>
      </template>
    </i18n-t>

    <p class="disclaimer">{{ t('bpScale.disclaimer') }}</p>
  </section>
</template>

<style scoped>
.bp-scale-info {
  scroll-margin-top: 80px;
}

.section-title {
  font-size: var(--text-lg);
  margin: 0 0 var(--space-5);
}

.subsection-title {
  font-size: var(--text-base);
  font-weight: 600;
  margin: var(--space-7) 0 var(--space-3);
}

.intro,
.tie-break,
.disclaimer {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0 0 var(--space-5);
}

.disclaimer {
  font-style: italic;
  color: var(--color-text-dim);
  margin-bottom: 0;
}

.scale-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.scale-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
}

.scale-row:not(.scale-head) {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.scale-head {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0;
}

.zone-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-align: center;
}

.range {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

@media (max-width: 480px) {
  .scale-row {
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .range {
    font-size: var(--text-xs);
  }
}
</style>
