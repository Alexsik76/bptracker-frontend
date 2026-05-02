<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useApi } from '../composables/useApi';
import { useToast } from '../composables/useToast';
import { preprocessImage } from '../utils/image';
import CameraCapture from '../components/CameraCapture.vue';
import AiReview from '../components/AiReview.vue';
import MeasurementForm from '../components/MeasurementForm.vue';

const router = useRouter();
const route = useRoute();
const measurements = useMeasurementStore();
const api = useApi();
const toast = useToast();

const step = ref<'select' | 'camera' | 'review' | 'manual'>('select');
const recognizedData = ref({ sys: 120, dia: 80, pulse: 70 });
const isAnalyzing = ref(false);

const lastAnalysis = ref<{
  photoBlob: Blob;
  geminiSys: number;
  geminiDia: number;
  geminiPulse: number;
} | null>(null);

async function handleCapture(file: File) {
  isAnalyzing.value = true;
  step.value = 'review';
  try {
    const processedBlob = await preprocessImage(file);
    const result = await api.analyzeImage(processedBlob as File); // cast to File for API method signature compatibility
    
    recognizedData.value = { sys: result.sys, dia: result.dia, pulse: result.pulse };
    lastAnalysis.value = {
      photoBlob: processedBlob,
      geminiSys: result.sys,
      geminiDia: result.dia,
      geminiPulse: result.pulse
    };
  } catch (err) {
    console.error('[MeasurementPage] Analysis failed:', err);
    toast.error(err instanceof Error ? err.message : 'AI не вдалося розпізнати фото');
    step.value = 'manual';
  } finally {
    isAnalyzing.value = false;
  }
}

async function handleSave(data: { sys: number; dia: number; pulse: number }) {
  try {
    if (lastAnalysis.value) {
      await measurements.addWithPhoto(
        data,
        lastAnalysis.value.photoBlob,
        {
          sys: lastAnalysis.value.geminiSys,
          dia: lastAnalysis.value.geminiDia,
          pulse: lastAnalysis.value.geminiPulse
        }
      );
    } else {
      await measurements.add(data);
    }
    
    toast.success('Замір успішно збережено!');
    router.push({ name: 'dashboard' });
  } catch (err) {
    console.error('[MeasurementPage] Save failed:', err);
    toast.error('Помилка при збереженні');
  }
}

function handleCancel() {
  step.value = 'select';
  lastAnalysis.value = null;
}

onMounted(async () => {
  if (route.query.shared === '1') {
    try {
      const cache = await caches.open('share-target-v1');
      const response = await cache.match('shared-image');
      if (response) {
        const blob = await response.blob();
        const file = new File([blob], 'shared.jpg', { type: blob.type || 'image/jpeg' });
        await handleCapture(file);
        // Clean up cache
        await cache.delete('shared-image');
      }
    } catch (err) {
      console.error('[MeasurementPage] Failed to handle shared image:', err);
    }
  }
});
</script>

<template>
  <div class="measurement-page">
    <header class="header">
      <button class="back-btn" @click="router.back()">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <h1>Новий замір</h1>
    </header>

    <main class="content">
      <div v-if="step === 'select'" class="selection-grid">
        <button class="choice-btn primary" @click="step = 'camera'">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
            ></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          <span>Сканувати тонометр</span>
          <small>AI розпізнавання</small>
        </button>

        <button class="choice-btn secondary" @click="step = 'manual'">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Ввести вручну</span>
        </button>
      </div>

      <CameraCapture v-if="step === 'camera'" @capture="handleCapture" @cancel="handleCancel" />

      <div v-if="step === 'review' || step === 'manual'" class="form-container">
        <AiReview v-if="isAnalyzing" />
        <MeasurementForm
          v-else
          :initial-data="step === 'review' ? recognizedData : undefined"
          @submit="handleSave"
          @cancel="handleCancel"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.header {
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  & h1 {
    font-size: var(--text-base);
    font-weight: bold;
  }
}

.back-btn {
  color: var(--color-text-muted);
}

.content {
  padding: var(--space-6);
  max-width: 600px;
  margin: 0 auto;
}

.selection-grid {
  display: grid;
  gap: var(--space-4);
}

.choice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  border: 2px solid var(--color-border);
  transition: all 0.2s;

  & span {
    font-weight: bold;
    font-size: var(--text-lg);
  }

  & small {
    color: var(--color-text-muted);
  }

  &.primary {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background-color: color-mix(in srgb, var(--color-primary), transparent 95%);

    &:hover {
      background-color: color-mix(in srgb, var(--color-primary), transparent 90%);
    }
  }

  &.secondary {
    &:hover {
      border-color: var(--color-text-muted);
      background-color: var(--color-bg);
    }
  }
}

.form-container {
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}
</style>
