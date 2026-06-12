<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { Measurement } from '../../types/api';
import { getZone, zoneProgressPct } from '../../composables/useZone';
import { useBpLabels } from '../../composables/useBpLabels';

const props = defineProps<{
  last: Measurement;
  sparkData: number[];
}>();

const { locale, t } = useI18n();
const router = useRouter();

function openScaleInfo() {
  router.push({ path: '/info' });
}
const bpLabels = useBpLabels();

const zone = computed(() => getZone(props.last.sys, props.last.dia));
const progressPct = computed(() => zoneProgressPct(props.last.sys));

const time = computed(() =>
  new Date(props.last.recordedAt).toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  }),
);

const sparkPoints = computed(() => {
  const data = props.sparkData;
  if (data.length < 2) return '';
  const W = 72,
    H = 28;
  const min = Math.min(...data),
    max = Math.max(...data);
  const range = max - min || 1;
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});
</script>

<template>
  <div class="hero-card">
    <div class="hero-top">
      <div class="hero-left">
        <div class="hero-time">{{ $t('dashboard.lastReading', { time }) }}</div>
        <div class="hero-bp">
          <span class="hero-val" :style="{ color: zone.color }">{{ last.sys }}</span>
          <span class="hero-sep">/</span>
          <span class="hero-val" :style="{ color: zone.color }">{{ last.dia }}</span>
        </div>
        <div class="hero-sub">{{ $t('bp.units.mmHg') }} · ♡ {{ last.pulse }} {{ $t('bp.units.bpm') }}</div>
      </div>
      <div class="hero-right">
        <div class="zone-row">
          <div class="zone-badge" :style="{ color: zone.color, background: zone.bg }">
            {{ bpLabels[zone.key] }}
          </div>
          <button
            type="button"
            class="info-btn"
            :aria-label="t('bpScale.infoButtonLabel')"
            @click="openScaleInfo"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>
        <svg v-if="sparkPoints" width="72" height="28" style="display: block">
          <polyline
            :points="sparkPoints"
            fill="none"
            :stroke="zone.color"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.8"
          />
        </svg>
      </div>
    </div>

    <div class="zone-bar-track">
      <div
        class="zone-bar-fill"
        :style="{
          width: progressPct + '%',
          background: `linear-gradient(90deg, var(--zone-optimal), ${zone.color})`,
        }"
      />
    </div>
    <div class="zone-bar-labels">
      <span>{{ $t('bp.classes.normal') }}</span>
      <span :style="{ color: zone.color }">●</span>
      <span>{{ $t('dashboard.danger') }}</span>
    </div>
  </div>
</template>

<style scoped>
.hero-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 16px 18px;
  box-shadow: var(--shadow-card);
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.hero-time {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  font-weight: 500;
}

.hero-bp {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.hero-val {
  font-size: 42px;
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1;
}

@media (max-width: 359px) {
  .hero-val {
    font-size: 36px;
  }
}

.hero-sep {
  font-size: 28px;
  font-weight: 300;
  color: var(--color-text-muted);
  line-height: 1;
}

.hero-sub {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.hero-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.zone-row {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.zone-badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
  border-radius: var(--radius-full);
  transition: color 0.15s, background 0.15s;
}

.info-btn:hover,
.info-btn:focus-visible {
  color: var(--color-text);
  background: var(--color-surface);
}

.info-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.zone-bar-track {
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  overflow: hidden;
}

.zone-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.zone-bar-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 9px;
  color: var(--color-text-muted);
}
</style>
