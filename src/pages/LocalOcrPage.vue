<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue';
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
import { FIELD_CONFIGS } from '../utils/ocrFields';
import CameraCapture from '../components/CameraCapture.vue';
import OcrPhotoPreview from '../components/OcrPhotoPreview.vue';
import OcrReviewForm from '../components/OcrReviewForm.vue';

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
const focusedField = ref<string | null>(null);

// ── Processing labels ─────────────────────────────────────────────────────────

const stageLabels: Record<string, string> = {
  'loading': 'localOcr.stageLoading',
  'detecting-display': 'localOcr.stageDisplay',
  'detecting-digits': 'localOcr.stageDigits',
  'assembling': 'localOcr.stageAssembling',
};

const errorLabels: Record<string, string> = {
  'display-not-found': 'localOcr.errorDisplay',
  'digits-not-found': 'localOcr.errorDigits',
  'wrong-row-count': 'localOcr.errorRows',
};

// ── Flow handlers ─────────────────────────────────────────────────────────────

async function handleCapture(file: File) {
  const processedBlob = await preprocessImage(file);
  capturedBlob.value = processedBlob;
  step.value = 'processing';
  const result = await ocr.run(processedBlob);
  step.value = result ? 'review' : 'error';
}

async function handleConfirm(data: { sys: number; dia: number; pulse: number }) {
  const sendPhotos = settingsStore.settings.sendPhotos !== false;

  if (!navigator.onLine) {
    if (sendPhotos && capturedBlob.value && ocr.result.value) {
      const ocrR = ocr.result.value;
      const corrected = data.sys !== ocrR.sys || data.dia !== ocrR.dia || data.pulse !== ocrR.pul;
      await offline.enqueuePhoto({
        sys: data.sys, dia: data.dia, pulse: data.pulse,
        photoBlob: capturedBlob.value,
        aiSys: ocrR.sys, aiDia: ocrR.dia, aiPul: ocrR.pul,
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
        saved.id, capturedBlob.value,
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
  focusedField.value = null;
  beamActive.value = false;
  canHighlight.value = false;
  showZoomBadge.value = false;
}

// ── Beam animation ────────────────────────────────────────────────────────────

const BEAM_DURATION = 900;
const BEAM_MOVE = 0.7;

const beamActive = ref(false);
const beamY = ref(0);
const beamOpacity = ref(1);
const canHighlight = ref(false);
const showZoomBadge = ref(false);

let beamRaf: number | null = null;
let beamStart: number | null = null;

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
    const ease = (x: number) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    if (T <= BEAM_MOVE) {
      beamY.value = ease(T / BEAM_MOVE) * 100;
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

watch(
  () => step.value,
  async (val) => { if (val === 'review') { await nextTick(); startBeam(); } },
);

onBeforeUnmount(() => { if (beamRaf !== null) cancelAnimationFrame(beamRaf); });
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
          <div class="spinner" />
          <p class="stage-label">{{ $t(stageLabels[ocr.stage.value] ?? 'common.wait') }}</p>
        </div>
      </div>
    </template>

    <!-- Review -->
    <template v-else-if="step === 'review'">
      <header class="rev-header">
        <button class="rev-back" :aria-label="$t('common.back')" @click="retryCamera">
          <svg
width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 class="rev-title">{{ $t('localOcr.resultTitle') }}</h1>
      </header>

      <div class="rev-scroll">
        <OcrPhotoPreview
          :image-url="ocr.originalImageUrl.value"
          :beam-active="beamActive"
          :beam-y="beamY"
          :beam-opacity="beamOpacity"
          :can-highlight="canHighlight"
          :show-zoom-badge="showZoomBadge"
          :focused-field="focusedField"
          :field-configs="FIELD_CONFIGS"
        />
        <OcrReviewForm
          :initial-sys="ocr.result.value?.sys ?? 120"
          :initial-dia="ocr.result.value?.dia ?? 80"
          :initial-pulse="ocr.result.value?.pul ?? 70"
          :field-configs="FIELD_CONFIGS"
          @submit="handleConfirm"
          @cancel="retryCamera"
          @fallback="handleFallback"
          @focus-change="focusedField = $event"
        />
      </div>
    </template>

    <!-- Error -->
    <template v-else-if="step === 'error'">
      <header class="header">
        <button class="back-btn" @click="retryCamera">
          <svg
width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1>{{ $t('localOcr.title') }}</h1>
      </header>
      <div class="content">
        <div class="error-card">
          <svg
width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.5" opacity="0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p class="error-msg">{{ $t(errorLabels[ocr.errorMsg.value ?? ''] ?? 'localOcr.errorGeneral') }}</p>
          <div class="error-actions">
            <button class="btn primary" @click="retryCamera">{{ $t('localOcr.retryBtn') }}</button>
            <button class="btn secondary" @click="handleFallback">{{ $t('localOcr.fallbackBtn') }}</button>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped>
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

/* ── Processing / Error ────────────────────────────────────────────────────── */
.header {
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  & h1 { font-size: var(--text-base); font-weight: bold; }
}
.back-btn { color: var(--color-text-muted); }
.content { flex: 1; padding: var(--space-6); max-width: 600px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-4); }
.stage-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-8); background: var(--color-surface); border-radius: var(--radius-xl); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.stage-label { font-size: var(--text-sm); color: var(--color-text-muted); }
.error-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-8); background: var(--color-surface); border-radius: var(--radius-xl); text-align: center; }
.error-msg { font-size: var(--text-sm); color: var(--color-text-muted); }
.error-actions { display: flex; flex-direction: column; gap: var(--space-3); width: 100%; }
.btn { padding: var(--space-4); border-radius: var(--radius-lg); font-weight: bold; font-size: var(--text-base); width: 100%;
  &.primary { background: var(--color-primary); color: #fff; }
  &.secondary { background: var(--color-bg); color: var(--color-text); }
}

/* ── Review ────────────────────────────────────────────────────────────────── */
.rev-header { flex-shrink: 0; display: flex; align-items: center; gap: 14px; padding: 14px 18px 10px; background: #0d0d12; }
.rev-back { color: rgba(255, 255, 255, 0.7); flex-shrink: 0; }
.rev-title { font-size: 19px; font-weight: 600; color: #fff; white-space: nowrap; margin: 0; }
.rev-scroll { flex: 1; overflow-y: auto; padding: 4px 18px 16px; display: flex; flex-direction: column; gap: 14px; }
</style>
