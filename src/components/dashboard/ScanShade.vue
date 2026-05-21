<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  modelValue: number;     // progress: 0 = collapsed, 1 = expanded
  expandedHeight: number; // px
  shadeHeight: number;    // px, computed from modelValue in parent
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
  scan: [];
  settings: [];
}>();

const { t } = useI18n();

// ── Constants ─────────────────────────────────────────────────────────────────
const COLLAPSED_H = 64;
const PULSE_PERIOD_MS = 2000;
const SNAP_MS = 350;
const SNAP_VEL = 0.6; // px/ms threshold

// ── Computed UI ───────────────────────────────────────────────────────────────
const showGiantBtn = computed(() => props.modelValue >= 0.25);
const btnSize = computed(() => Math.min(Math.round(0.55 * props.shadeHeight), 260));
const iconSize = computed(() => Math.round(btnSize.value * 0.26));
const textSize = computed(() => Math.round(btnSize.value * 0.16));

const topStyle = computed(() => ({
  opacity: props.modelValue,
  pointerEvents: props.modelValue < 0.1 ? ('none' as const) : ('auto' as const),
}));

const hintStyle = computed(() => ({
  opacity: props.modelValue,
  pointerEvents: props.modelValue < 0.1 ? ('none' as const) : ('auto' as const),
}));

// ── Pulse animation ───────────────────────────────────────────────────────────
const pSin = ref(0);
const pSin2 = ref(0);
let pulseRaf: number | null = null;
let pulseElapsed = 0;
let lastPulseTs: number | null = null;

const outerStyle = computed(() => ({
  transform: `scale(${1 + pSin.value * 0.05})`,
  opacity: (0.25 + pSin.value * 0.15) * props.modelValue,
}));

const ringStyle = computed(() => ({
  transform: `scale(${1 + pSin2.value * 0.04})`,
  opacity: 0.3 * props.modelValue,
}));

function tickPulse(ts: number) {
  if (lastPulseTs !== null) pulseElapsed += ts - lastPulseTs;
  lastPulseTs = ts;
  const frac = (pulseElapsed % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
  pSin.value = Math.sin(frac * 2 * Math.PI);
  pSin2.value = Math.sin(frac * 2 * Math.PI + 1);
  pulseRaf = requestAnimationFrame(tickPulse);
}

// ── Drag ──────────────────────────────────────────────────────────────────────
const shadeEl = ref<HTMLElement | null>(null);
let dragStartY: number | null = null;
let dragStartProg: number | null = null;
let lastY = 0;
let lastT = 0;
let velocity = 0;
let moved = false;
let snapRaf: number | null = null;

function setProgress(v: number) {
  emit('update:modelValue', Math.max(0, Math.min(1, v)));
}

function onPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('.shade-settings, .scan-btn-giant, .scan-btn-compact')) return;
  if (snapRaf !== null) { cancelAnimationFrame(snapRaf); snapRaf = null; }
  shadeEl.value?.setPointerCapture(e.pointerId);
  dragStartY = e.clientY;
  dragStartProg = props.modelValue;
  lastY = e.clientY;
  lastT = performance.now();
  velocity = 0;
  moved = false;
}

function onPointerMove(e: PointerEvent) {
  if (dragStartY === null || dragStartProg === null) return;
  const dy = e.clientY - dragStartY;
  const now = performance.now();
  const dt = now - lastT;
  if (dt > 0) velocity = (e.clientY - lastY) / dt;
  lastY = e.clientY;
  lastT = now;
  if (Math.abs(dy) > 3) moved = true;
  const range = props.expandedHeight - COLLAPSED_H;
  setProgress(dragStartProg + dy / range);
}

function onPointerUp(_e: PointerEvent) {
  if (dragStartY === null) return;
  dragStartY = null;
  if (!moved) return;
  if (velocity > SNAP_VEL) snapTo(1);
  else if (velocity < -SNAP_VEL) snapTo(0);
  else snapTo(props.modelValue > 0.5 ? 1 : 0);
}

// ── Snap ──────────────────────────────────────────────────────────────────────
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function snapTo(target: number) {
  const start = props.modelValue;
  const diff = target - start;
  if (Math.abs(diff) < 0.001) { setProgress(target); return; }
  const t0 = performance.now();
  function step(ts: number) {
    const t = Math.min((ts - t0) / SNAP_MS, 1);
    setProgress(start + diff * easeOutCubic(t));
    if (t < 1) snapRaf = requestAnimationFrame(step);
    else { snapRaf = null; setProgress(target); }
  }
  snapRaf = requestAnimationFrame(step);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => { pulseRaf = requestAnimationFrame(tickPulse); });
onBeforeUnmount(() => {
  if (pulseRaf !== null) cancelAnimationFrame(pulseRaf);
  if (snapRaf !== null) cancelAnimationFrame(snapRaf);
});
</script>

<template>
  <Teleport to="body">
  <div
    ref="shadeEl"
    class="shade"
    :style="{ height: shadeHeight + 'px' }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- Top row: logo + settings -->
    <div class="shade-top" :style="topStyle">
      <div class="shade-logo">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M2 10 Q5 4 10 10 Q15 16 18 10"
            stroke="white"
            stroke-width="2.5"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
        <span class="logo-text">BP Tracker</span>
      </div>
      <button
        class="shade-settings"
        :aria-label="t('settings.title')"
        @click.stop="$emit('settings')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
            a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
            A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
            l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
            A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
            l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
            a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
            l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
            a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>

    <!-- Center body: button area -->
    <div class="shade-body">
      <!-- Giant rounded-square button + pulse (progress >= 0.25) -->
      <template v-if="showGiantBtn">
        <div class="btn-wrap" :style="{ width: btnSize + 'px', height: btnSize + 'px' }">
          <div class="pulse-outer" :style="outerStyle" aria-hidden="true" />
          <div class="pulse-ring" :style="ringStyle" aria-hidden="true" />
          <button
            class="scan-btn-giant"
            :aria-label="t('localOcr.title')"
            @click.stop="$emit('scan')"
          >
            <svg
              :width="iconSize"
              :height="iconSize"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
            <span class="scan-text" :style="{ fontSize: textSize + 'px' }">SCAN</span>
          </button>
        </div>
      </template>

      <!-- Compact pill (progress < 0.25) -->
      <button
        v-else
        class="scan-btn-compact"
        :aria-label="t('localOcr.title')"
        @click.stop="$emit('scan')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
          stroke-width="2" stroke-linecap="round">
          <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" />
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
        <span class="compact-text">SCAN</span>
      </button>
    </div>

    <!-- Hint text (fades out when collapsed) -->
    <p class="shade-hint" :style="hintStyle">{{ t('dashboard.scanHint') }}</p>

    <!-- Drag handle -->
    <div class="drag-handle" aria-hidden="true" />
  </div>
  </Teleport>
</template>

<style scoped>
/* ── Shade container ──────────────────────────────────────────────────────────── */
.shade {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    180deg,
    rgba(15, 15, 20, 0.72) 0%,
    rgba(15, 15, 20, 0.60) 70%,
    rgba(15, 15, 20, 0.40) 100%
  );
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  will-change: height;
}

/* ── Top row ──────────────────────────────────────────────────────────────────── */
.shade-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 0;
  flex-shrink: 0;
}

.shade-logo {
  display: flex;
  align-items: center;
  gap: 7px;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.shade-settings {
  width: 34px;
  height: 34px;
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.75);
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }
}

/* ── Body (centered button area) ──────────────────────────────────────────────── */
.shade-body {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  & > * { pointer-events: auto; }
}

/* ── Giant button wrapper (for pulse positioning) ─────────────────────────────── */
.btn-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Pulse glow (outer radial) ────────────────────────────────────────────────── */
.pulse-outer {
  position: absolute;
  inset: -18%;
  border-radius: 25%;
  background: radial-gradient(circle, rgba(21, 128, 61, 0.45) 0%, transparent 65%);
  pointer-events: none;
}

/* ── Pulse ring (inner border) ────────────────────────────────────────────────── */
.pulse-ring {
  position: absolute;
  inset: -18%;
  border-radius: 25%;
  border: 1px solid #15803d;
  pointer-events: none;
}

/* ── Giant SCAN button ────────────────────────────────────────────────────────── */
.scan-btn-giant {
  width: 100%;
  height: 100%;
  border-radius: 25%;
  background: radial-gradient(circle at 35% 30%, #15803d, #14532d);
  box-shadow:
    0 12px 36px rgba(21, 128, 61, 0.45),
    inset 0 -8px 20px rgba(0, 0, 0, 0.2),
    inset 0 4px 12px rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: transform 0.1s, box-shadow 0.1s;

  &:active {
    transform: scale(0.97);
  }
}

.scan-text {
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #fff;
  line-height: 1;
}

/* ── Compact pill button ──────────────────────────────────────────────────────── */
.scan-btn-compact {
  width: 200px;
  height: 44px;
  border-radius: 22px;
  background: #15803d;
  box-shadow: 0 6px 20px rgba(21, 128, 61, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  cursor: pointer;
  color: #fff;

  &:active {
    transform: scale(0.97);
  }
}

.compact-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff;
}

/* ── Hint text ────────────────────────────────────────────────────────────────── */
.shade-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
  padding: 0 32px;
  flex-shrink: 0;
  margin-top: auto;
  margin-bottom: 24px;
  max-height: 40px;
  overflow: hidden;
}

/* ── Drag handle ──────────────────────────────────────────────────────────────── */
.drag-handle {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  width: 44px;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.35);
  margin: 0 auto;
}
</style>
