<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMeasurementStore } from '../stores/measurements';
import { useApi } from '../composables/useApi';
import CameraCapture from '../components/CameraCapture.vue';
import AiReview from '../components/AiReview.vue';
import MeasurementForm from '../components/MeasurementForm.vue';

const router = useRouter();
const measurements = useMeasurementStore();
const api = useApi();

const step = ref<'select' | 'camera' | 'review' | 'manual'>('select');
const recognizedData = ref({ sys: 120, dia: 80, pulse: 70 });
const isAnalyzing = ref(false);

async function handleCapture(file: File) {
  isAnalyzing.value = true;
  step.value = 'review';
  try {
    const result = await api.analyzeImage(file);
    recognizedData.value = { sys: result.sys, dia: result.dia, pulse: result.pulse };
  } catch (err) {
    console.error('AI Analysis failed', err);
    // fallback to manual but stay in review to let user fix
  } finally {
    isAnalyzing.value = false;
  }
}

async function handleSave(data: { sys: number; dia: number; pulse: number }) {
  try {
    await measurements.add(data);
    router.push({ name: 'dashboard' });
  } catch (err) {
    alert('Помилка при збереженні');
  }
}
</script>

<template>
  <div class="measurement-page">
    <header class="header">
      <button @click="router.back()" class="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <h1>Новий замір</h1>
    </header>

    <main class="content">
      <div v-if="step === 'select'" class="selection-grid">
        <button @click="step = 'camera'" class="choice-btn primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          <span>Сканувати тонометр</span>
          <small>AI розпізнавання</small>
        </button>
        
        <button @click="step = 'manual'" class="choice-btn secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Ввести вручну</span>
        </button>
      </div>

      <CameraCapture 
        v-if="step === 'camera'" 
        @capture="handleCapture"
        @cancel="step = 'select'"
      />

      <div v-if="step === 'review' || step === 'manual'" class="form-container">
        <AiReview v-if="isAnalyzing" />
        <MeasurementForm 
          v-else
          :initial-data="step === 'review' ? recognizedData : undefined" 
          @submit="handleSave"
          @cancel="step = 'select'"
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
