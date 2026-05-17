<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMeasurementStore } from '../stores/measurements';
import { useToast } from '../composables/useToast';
import { usePendingPhoto } from '../composables/usePendingPhoto';
import { useLocalOcr } from '../composables/useLocalOcr';
import CameraCapture from '../components/CameraCapture.vue';
import MeasurementForm from '../components/MeasurementForm.vue';

const router = useRouter();
const { t } = useI18n();
const measurements = useMeasurementStore();
const toast = useToast();
const pendingPhoto = usePendingPhoto();
const ocr = useLocalOcr();

type Step = 'camera' | 'processing' | 'review' | 'error';
const step = ref<Step>('camera');
const capturedBlob = ref<Blob | null>(null);

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

const formInitial = computed(() =>
  ocr.result.value
    ? { sys: ocr.result.value.sys, dia: ocr.result.value.dia, pulse: ocr.result.value.pul }
    : undefined,
);

async function handleCapture(file: File) {
  capturedBlob.value = file;
  step.value = 'processing';

  const result = await ocr.run(file);
  if (result) {
    step.value = 'review';
  } else {
    step.value = 'error';
  }
}

async function handleConfirm(data: { sys: number; dia: number; pulse: number }) {
  try {
    await measurements.add(data);
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
}
</script>

<template>
  <div class="page">
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
          <div v-if="ocr.displayCropUrl.value" class="crop-preview">
            <img :src="ocr.displayCropUrl.value" alt="display crop" />
          </div>
        </div>
      </div>
    </template>

    <!-- Review -->
    <template v-else-if="step === 'review'">
      <header class="header">
        <button class="back-btn" @click="retryCamera">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1>{{ $t('localOcr.resultTitle') }}</h1>
      </header>
      <div class="content">
        <div v-if="ocr.displayCropUrl.value" class="crop-preview">
          <img :src="ocr.displayCropUrl.value" alt="display crop" />
        </div>
        <div class="form-card">
          <MeasurementForm
            :initial-data="formInitial"
            @submit="handleConfirm"
            @cancel="retryCamera"
          />
        </div>
        <button class="fallback-btn" @click="handleFallback">
          {{ $t('localOcr.fallbackBtn') }}
        </button>
      </div>
    </template>

    <!-- Error -->
    <template v-else-if="step === 'error'">
      <header class="header">
        <button class="back-btn" @click="retryCamera">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1>{{ $t('localOcr.title') }}</h1>
      </header>
      <div class="content">
        <div class="error-card">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--color-bg);
}

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

.crop-preview {
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #000;

  & img {
    width: 100%;
    display: block;
    object-fit: contain;
    max-height: 200px;
  }
}

.form-card {
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.fallback-btn {
  width: 100%;
  padding: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-decoration: underline;
  text-align: center;
}

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
</style>
