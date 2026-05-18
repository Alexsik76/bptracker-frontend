<script setup lang="ts">
import { ref, computed, reactive, watch, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMeasurementStore } from '../stores/measurements';
import { useSettingsStore } from '../stores/settings';
import { useApi } from '../composables/useApi';
import { useToast } from '../composables/useToast';
import { usePendingPhoto } from '../composables/usePendingPhoto';
import { useLocalOcr } from '../composables/useLocalOcr';
import { useOfflineQueue } from '../composables/useOfflineQueue';
import { preprocessImage } from '../utils/image';
import CameraCapture from '../components/CameraCapture.vue';

const router = useRouter();
const { t } = useI18n();
const measurements = useMeasurementStore();
const settingsStore = useSettingsStore();
const api = useApi();
const toast = useToast();
const pendingPhoto = usePendingPhoto();
const ocr = useLocalOcr();
const offline = useOfflineQueue();

type Step = 'camera' | 'processing' | 'review' | 'error';
const step = ref<Step>('camera');
const capturedBlob = ref<Blob | null>(null);

// ── Processing labels ────────────────────────────────────────────────────────

const stageLabel = computed(() => {
  switch (ocr.stage.value) {
    case 'loading': return t('localOcr.stageLoading');
    case 'detecting-display': return t('localOcr.stageDisplay');
    case 'detecting-digits': return t('localOcr.stageDigits');
    case 'assembling': return t('localOcr.stageAssembling');
    default: return t('common.wait');
  }
});

const errorLabel = computed(() => {
  switch (ocr.errorMsg.value) {
    case 'display-not-found': return t('localOcr.errorDisplay');
    case 'digits-not-found': return t('localOcr.errorDigits');
    case 'wrong-row-count': return t('localOcr.errorRows');
    default: return t('localOcr.errorGeneral');
  }
});

// ── Flow handlers ────────────────────────────────────────────────────────────

async function handleCapture(file: File) {
  const processedBlob = await preprocessImage(file);
  capturedBlob.value = processedBlob;
  step.value = 'processing';
  const result = await ocr.run(processedBlob);
  if (result) {
    step.value = 'review';
  } else {
    step.value = 'error';
  }
}

async function handleConfirm(data: { sys: number; dia: number; pulse: number }) {
  const sendPhotos = settingsStore.settings.sendPhotos !== false;

  if (!navigator.onLine) {
    if (sendPhotos && capturedBlob.value && ocr.result.value) {
      const ocrR = ocr.result.value;
      const corrected = data.sys !== ocrR.sys || data.dia !== ocrR.dia || data.pulse !== ocrR.pul;
      await offline.enqueuePhoto({
        sys: data.sys,
        dia: data.dia,
        pulse: data.pulse,
        photoBlob: capturedBlob.value,
        aiSys: ocrR.sys,
        aiDia: ocrR.dia,
        aiPul: ocrR.pul,
        corrected,
        ocrMeta: ocr.ocrMeta.value ?? undefined,
      });
    } else {
      await offline.enqueue({ sys: data.sys, dia: data.dia, pulse: data.pulse });
    }
    toast.info(t('measurement.savedOffline'));
    router.push({ name: 'dashboard' });
    return;
  }

  try {
    const saved = await measurements.add(data);
    if (sendPhotos && saved && capturedBlob.value && ocr.result.value) {
      const ocrR = ocr.result.value;
      const corrected = data.sys !== ocrR.sys || data.dia !== ocrR.dia || data.pulse !== ocrR.pul;
      api.uploadMeasurementPhoto(
        saved.id,
        capturedBlob.value,
        { sys: data.sys, dia: data.dia, pul: data.pulse, recordedAt: saved.recordedAt },
        { sys: ocrR.sys, dia: ocrR.dia, pul: ocrR.pul },
        corrected ? 'user_confirmed' : 'local_ocr',
        ocr.ocrMeta.value,
      ).catch(() => {});
    }
    toast.success(t('measurement.saveSuccess'));
    router.push({ name: 'dashboard' });
  } catch {
    toast.error(t('measurement.saveError'));
  }
}

function handleFallback() {
  if (capturedBlob.value) pendingPhoto.set(capturedBlob.value);
  router.push({ name: 'measurement-new' });
}

function retryCamera() {
  ocr.reset();
  capturedBlob.value = null;
  step.value = 'camera';
  beamActive.value = false;
  canHighlight.value = false;
  showZoomBadge.value = false;
  focusedField.value = null;
}

// ── Review: inline form ──────────────────────────────────────────────────────

type FieldKey = 'sys' | 'dia' | 'pulse';

interface FieldConfig {
  key: FieldKey;
  labelKey: string;
  subLabelKey: string | null;
  unitKey: string;
  color: string;
  highlightX: number;
  highlightY: number;
  min: number;
  max: number;
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    key: 'sys',
    labelKey: 'measurement.systolicLabel',
    subLabelKey: 'measurement.systolicSub',
    unitKey: 'bp.units.mmHg',
    color: '#a39bff',
    highlightX: 46,
    highlightY: 20,
    min: 40, max: 300,
  },
  {
    key: 'dia',
    labelKey: 'measurement.diastolicLabel',
    subLabelKey: 'measurement.diastolicSub',
    unitKey: 'bp.units.mmHg',
    color: '#7dd3fc',
    highlightX: 46,
    highlightY: 45,
    min: 20, max: 200,
  },
  {
    key: 'pulse',
    labelKey: 'measurement.pulse',
    subLabelKey: null,
    unitKey: 'bp.units.bpm',
    color: '#86efac',
    highlightX: 46,
    highlightY: 74,
    min: 30, max: 250,
  },
];

const reviewForm = reactive<Record<FieldKey, number>>({ sys: 120, dia: 80, pulse: 70 });

watch(
  () => ocr.result.value,
  (result) => {
    if (result) {
      reviewForm.sys = result.sys;
      reviewForm.dia = result.dia;
      reviewForm.pulse = result.pul;
    }
  },
  { immediate: true },
);

const focusedField = ref<FieldKey | null>(null);

function submitReview() {
  if (reviewForm.sys < 40 || reviewForm.sys > 300) return;
  if (reviewForm.dia < 20 || reviewForm.dia > 200) return;
  if (reviewForm.pulse < 30 || reviewForm.pulse > 250) return;
  handleConfirm({ sys: reviewForm.sys, dia: reviewForm.dia, pulse: reviewForm.pulse });
}

// ── Beam animation ───────────────────────────────────────────────────────────

const BEAM_DURATION = 900;
const BEAM_MOVE = 0.7;

const beamActive = ref(false);
const beamY = ref(0);
const beamOpacity = ref(1);
const canHighlight = ref(false);
const showZoomBadge = ref(false);

let beamRaf: number | null = null;
let beamStart: number | null = null;

function easeInOut(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function startBeam() {
  if (beamRaf !== null) cancelAnimationFrame(beamRaf);
  beamStart = null;
  beamActive.value = true;
  beamY.value = 0;
  beamOpacity.value = 1;
  canHighlight.value = false;
  showZoomBadge.value = false;

  function tick(ts: number) {
    if (beamStart === null) beamStart = ts;
    const T = Math.min((ts - beamStart) / BEAM_DURATION, 1);
    if (T <= BEAM_MOVE) {
      beamY.value = easeInOut(T / BEAM_MOVE) * 100;
      beamOpacity.value = 1;
    } else {
      beamY.value = 100;
      beamOpacity.value = Math.max(0, 1 - (T - BEAM_MOVE) / (1 - BEAM_MOVE));
    }
    if (T < 1) {
      beamRaf = requestAnimationFrame(tick);
    } else {
      beamActive.value = false;
      canHighlight.value = true;
      showZoomBadge.value = true;
      beamRaf = null;
    }
  }
  beamRaf = requestAnimationFrame(tick);
}

onBeforeUnmount(() => {
  if (beamRaf !== null) cancelAnimationFrame(beamRaf);
});

watch(
  () => step.value,
  async (newVal) => {
    if (newVal === 'review') {
      await nextTick();
      startBeam();
    }
  },
);

// ── Tap-to-zoom ──────────────────────────────────────────────────────────────

const zoomOpen = ref(false);
function openZoom() { zoomOpen.value = true; }
function closeZoom() { zoomOpen.value = false; }
</script>

<template>
  <div :class="['page', { 'page--review': step === 'review' }]">

    <!-- Camera -->
    <CameraCapture
      v-if="step === 'camera'"
      @capture="handleCapture"
      @cancel="router.back()"
    />

    <!-- Processing -->
    <template v-else-if="step === 'processing'">
      <header class="header">
        <h1>{{ $t('localOcr.title') }}</h1>
      </header>
      <div class="content">
        <div class="stage-card">
          <div class="spinner"></div>
          <p class="stage-label">{{ stageLabel }}</p>
        </div>
      </div>
    </template>

    <!-- Review (dark scan-result screen) -->
    <template v-else-if="step === 'review'">
      <header class="rev-header">
        <button class="rev-back" @click="retryCamera" :aria-label="$t('common.back')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 class="rev-title">{{ $t('localOcr.resultTitle') }}</h1>
      </header>

      <div class="rev-scroll">

        <!-- Photo block -->
        <div class="photo-wrap" @click="openZoom">
          <img
            v-if="ocr.originalImageUrl.value"
            :src="ocr.originalImageUrl.value"
            class="photo-img"
            alt=""
          />

          <!-- Beam overlay -->
          <div
            v-if="beamActive"
            class="beam-root"
            :style="{ opacity: beamOpacity }"
            aria-hidden="true"
          >
            <div class="beam-glow" :style="{ top: beamY + '%' }" />
            <div class="beam-line" :style="{ top: beamY + '%' }" />
          </div>

          <!-- Field highlights (shown after beam, on field focus) -->
          <template v-if="canHighlight">
            <div
              v-for="f in FIELD_CONFIGS"
              :key="f.key"
              class="field-highlight"
              :style="{
                left: f.highlightX + '%',
                top: f.highlightY + '%',
                borderColor: f.color,
                boxShadow: `0 0 24px ${f.color}44, inset 0 0 12px ${f.color}22`,
                opacity: focusedField === f.key ? 1 : 0,
              }"
              aria-hidden="true"
            />
          </template>

          <!-- Zoom badge (appears after beam) -->
          <div v-if="showZoomBadge" class="zoom-badge" aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            {{ $t('localOcr.tapToZoom') }}
          </div>
        </div>

        <!-- Inline measurement form -->
        <form class="rev-fields" @submit.prevent="submitReview">
          <div v-for="f in FIELD_CONFIGS" :key="f.key" class="rev-field">
            <div class="field-label-row">
              <span class="field-dot" :style="{ background: f.color }" />
              <span class="field-label-text">{{ $t(f.labelKey) }}</span>
              <span v-if="f.subLabelKey" class="field-sublabel">{{ $t(f.subLabelKey) }}</span>
            </div>
            <div
              class="field-input-wrap"
              :style="focusedField === f.key
                ? { borderColor: f.color, boxShadow: `0 0 0 3px ${f.color}22` }
                : {}"
            >
              <input
                v-model.number="reviewForm[f.key]"
                type="number"
                :min="f.min"
                :max="f.max"
                class="field-val-input"
                inputmode="numeric"
                @focus="focusedField = f.key"
                @blur="focusedField = null"
              />
              <span class="field-unit">{{ $t(f.unitKey) }}</span>
            </div>
          </div>

          <div class="rev-actions">
            <button type="button" class="rev-btn rev-btn--cancel" @click="retryCamera">
              {{ $t('common.cancel') }}
            </button>
            <button type="submit" class="rev-btn rev-btn--save">
              {{ $t('common.save') }}
            </button>
          </div>
        </form>

        <button class="fallback-link" @click="handleFallback">
          {{ $t('localOcr.fallbackBtn') }}
        </button>
      </div>
    </template>

    <!-- Error -->
    <template v-else-if="step === 'error'">
      <header class="header">
        <button class="back-btn" @click="retryCamera">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1>{{ $t('localOcr.title') }}</h1>
      </header>
      <div class="content">
        <div class="error-card">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.5" opacity="0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p class="error-msg">{{ errorLabel }}</p>
          <div class="error-actions">
            <button class="btn primary" @click="retryCamera">{{ $t('localOcr.retryBtn') }}</button>
            <button class="btn secondary" @click="handleFallback">{{ $t('localOcr.fallbackBtn') }}</button>
          </div>
        </div>
      </div>
    </template>

  </div>

  <!-- Fullscreen zoom overlay -->
  <Teleport to="body">
    <div v-if="zoomOpen" class="zoom-overlay" @click="closeZoom">
      <img
        :src="ocr.originalImageUrl.value ?? undefined"
        class="zoom-img"
        alt=""
      />
      <p class="zoom-hint">{{ $t('localOcr.tapToClose') }}</p>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Base ──────────────────────────────────────────────────────────────────── */
.page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--color-bg);
}

.page--review {
  background: #0d0d12;
  color: #ffffff;
}

/* ── Processing / Error: shared header ────────────────────────────────────── */
.header {
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;

  & h1 {
    font-size: var(--text-base);
    font-weight: bold;
  }
}

.back-btn {
  color: var(--color-text-muted);
}

.content {
  flex: 1;
  padding: var(--space-6);
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ── Processing: spinner ──────────────────────────────────────────────────── */
.stage-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stage-label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

/* ── Error card ───────────────────────────────────────────────────────────── */
.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  text-align: center;
}

.error-msg {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
}

.btn {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: bold;
  font-size: var(--text-base);
  width: 100%;

  &.primary {
    background: var(--color-primary);
    color: #fff;
  }

  &.secondary {
    background: var(--color-bg);
    color: var(--color-text);
  }
}

/* ── Review: header ───────────────────────────────────────────────────────── */
.rev-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px 10px;
  background: #0d0d12;
}

.rev-back {
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

.rev-title {
  font-size: 19px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  margin: 0;
}

/* ── Review: scroll area ──────────────────────────────────────────────────── */
.rev-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ── Photo block ──────────────────────────────────────────────────────────── */
.photo-wrap {
  position: relative;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  background: #000;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  cursor: pointer;
  flex-shrink: 0;
}

.photo-img {
  display: block;
  width: 100%;
  height: auto;
}

/* ── Beam ─────────────────────────────────────────────────────────────────── */
.beam-root {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.beam-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1.5px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, #a39bff, transparent);
  box-shadow: 0 0 12px #a39bff;
}

.beam-glow {
  position: absolute;
  left: 0;
  right: 0;
  height: 60px;
  transform: translateY(-50%);
  background: linear-gradient(180deg, transparent 0%, rgba(163, 155, 255, 0.2) 50%, transparent 100%);
}

/* ── Field highlight ──────────────────────────────────────────────────────── */
.field-highlight {
  position: absolute;
  width: 90px;
  height: 50px;
  transform: translate(-50%, -50%);
  border: 1.5px solid transparent;
  border-radius: 8px;
  pointer-events: none;
  transition: opacity 0.25s ease-out;
}

/* ── Zoom badge ───────────────────────────────────────────────────────────── */
.zoom-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  pointer-events: none;
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── Review fields ────────────────────────────────────────────────────────── */
.rev-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rev-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-dot {
  width: 7px;
  height: 7px;
  border-radius: 4px;
  opacity: 0.85;
  flex-shrink: 0;
}

.field-label-text {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
}

.field-sublabel {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.35);
}

.field-input-wrap {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 14px 18px;
  background: #15151c;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-val-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
  min-width: 0;

  /* Hide browser spin buttons */
  appearance: textfield;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

.field-unit {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  margin-left: 8px;
  flex-shrink: 0;
}

/* ── Review action buttons ────────────────────────────────────────────────── */
.rev-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.rev-btn {
  padding: 15px 20px;
  border-radius: 14px;
  font-size: 15px;
  cursor: pointer;
}

.rev-btn--cancel {
  flex: 1;
  background: #15151c;
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #fff;
  font-weight: 600;
}

.rev-btn--save {
  flex: 1.4;
  background: #a39bff;
  color: #1a1530;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(163, 155, 255, 0.25);
}

/* ── Fallback link ────────────────────────────────────────────────────────── */
.fallback-link {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.35);
  text-align: center;
}

/* ── Fullscreen zoom overlay ──────────────────────────────────────────────── */
.zoom-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  animation: fade-in 0.2s ease-out;
}

.zoom-img {
  max-width: 92%;
  max-height: 75%;
  object-fit: contain;
  border-radius: 12px;
  transform: scale(1.4);
}

.zoom-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  pointer-events: none;
}
</style>
