<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
);
import type { Measurement } from '../types/api';
import { cssVar } from '../utils/theme';
import { useTheme } from '../composables/useTheme';

const props = defineProps<{
  data: Measurement[];
}>();

const { t, locale } = useI18n();
const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;
let mq: MediaQueryList | null = null;
let stopThemeWatch: (() => void) | null = null;

function updateTheme() {
  if (!chart) return;
  const sys = cssVar('--color-chart-sys');
  const dia = cssVar('--color-chart-dia');
  const pulse = cssVar('--color-chart-pulse');
  const grid = cssVar('--color-chart-grid');
  chart.data.datasets[0]!.borderColor = sys;
  chart.data.datasets[0]!.backgroundColor = sys;
  chart.data.datasets[1]!.borderColor = dia;
  chart.data.datasets[1]!.backgroundColor = dia;
  chart.data.datasets[2]!.borderColor = pulse;
  chart.data.datasets[2]!.backgroundColor = pulse;
  if (chart.options.scales?.['y']?.grid) {
    (chart.options.scales['y'].grid as Record<string, unknown>).color = grid;
  }
  chart.update();
}

// Custom plugin: draws horizontal reference lines for BP thresholds
const refLinesPlugin = {
  id: 'bpRefLines',
  afterDraw(ch: any) {
    const ctx = ch.ctx as CanvasRenderingContext2D;
    const yAxis = ch.scales['y'];
    const xAxis = ch.scales['x'];
    if (!yAxis || !xAxis) return;

    const drawLine = (value: number, color: string) => {
      const y = yAxis.getPixelForValue(value);
      if (y < yAxis.top || y > yAxis.bottom) return;
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xAxis.left, y);
      ctx.lineTo(xAxis.right, y);
      ctx.stroke();
      ctx.restore();
    };

    drawLine(140, cssVar('--color-chart-ref-danger'));
    drawLine(120, cssVar('--color-chart-ref-warning'));
  },
};

onMounted(() => {
  if (!chartRef.value) return;

  chart = new Chart(chartRef.value, {
    type: 'line',
    plugins: [refLinesPlugin as any],
    data: {
      datasets: [
        {
          label: t('measurement.sys'),
          data: [],
          borderColor: '',
          backgroundColor: '',
          tension: 0.3,
          yAxisID: 'y',
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: t('measurement.dia'),
          data: [],
          borderColor: '',
          backgroundColor: '',
          tension: 0.3,
          yAxisID: 'y',
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: t('measurement.pulse'),
          data: [],
          borderColor: '',
          backgroundColor: '',
          tension: 0.3,
          yAxisID: 'y1',
          borderDash: [5, 5],
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 20,
            boxHeight: 2,
            padding: 16,
            font: { size: 11 },
            usePointStyle: false,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            maxRotation: 0,
            maxTicksLimit: 10,
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          min: 40,
          max: 200,
          ticks: { font: { size: 10 } },
          grid: {
            color: '',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 40,
          max: 150,
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 10 } },
        },
      },
    },
  });

  updateTheme();
  updateChart();

  mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', updateTheme);

  const { theme } = useTheme();
  stopThemeWatch = watch(theme, () => {
    updateTheme();
  });

  watch(locale, () => {
    if (!chart) return;
    chart.data.datasets[0]!.label = t('measurement.sys');
    chart.data.datasets[1]!.label = t('measurement.dia');
    chart.data.datasets[2]!.label = t('measurement.pulse');
    chart.update();
  });
});

onUnmounted(() => {
  chart?.destroy();
  chart = null;
  mq?.removeEventListener('change', updateTheme);
  mq = null;
  stopThemeWatch?.();
  stopThemeWatch = null;
});

// No deep: true — measurements arrive as a new array reference from the store,
// so a shallow watch on the array reference is sufficient.
watch(() => props.data, updateChart);

function buildLabel(m: Measurement, prev: Measurement | undefined): string | string[] {
  const d = new Date(m.recordedAt);
  const localeStr = locale.value;
  const dayStr = d.toLocaleDateString(localeStr, { day: '2-digit', month: '2-digit' });
  const timeStr = d.toLocaleTimeString(localeStr, { hour: '2-digit', minute: '2-digit' });

  if (!prev) return [dayStr, timeStr];

  const prevDay = new Date(prev.recordedAt).toLocaleDateString(localeStr, {
    day: '2-digit',
    month: '2-digit',
  });
  // Same day: show only time to avoid duplicate date labels
  return prevDay === dayStr ? timeStr : [dayStr, timeStr];
}

function updateChart() {
  if (!chart) return;

  const sorted = [...props.data]
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .slice(-100);

  const labels = sorted.map((m, i) => buildLabel(m, sorted[i - 1]));

  chart.data.labels = labels;
  chart.data.datasets[0]!.data = sorted.map((m) => m.sys);
  chart.data.datasets[1]!.data = sorted.map((m) => m.dia);
  chart.data.datasets[2]!.data = sorted.map((m) => m.pulse);
  chart.update();
}
</script>

<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  height: 260px;
  width: 100%;
}
</style>
