import { ref } from 'vue';
import * as ort from 'onnxruntime-web';
import { type Box, classAgnosticNms, kmeansRows, assembleNumber } from '../utils/ocr/postprocess';
import type { components } from '../types/photo-api';

type OcrMeta = components['schemas']['OcrMeta'];

const MODEL_VERSION = 'int8_v1';

ort.env.wasm.wasmPaths = '/ort-wasm/';
ort.env.wasm.numThreads = 1;

const DISPLAY_MODEL_URL = '/models/display_detector_int8.onnx';
const DIGIT_MODEL_URL = '/models/digit_detector_int8.onnx';

const DISPLAY_INPUT_SIZE = 640;
const DIGIT_INPUT_SIZE = 480;
const DISPLAY_CONF = 0.05;
const DIGIT_CONF = 0.25;
const NMS_IOU = 0.4;
const DISPLAY_ANCHORS = 8400;
const DIGIT_ANCHORS = 4725;

export type OcrStage =
  | 'idle'
  | 'loading'
  | 'detecting-display'
  | 'detecting-digits'
  | 'assembling'
  | 'done'
  | 'error';

export interface OcrResult {
  sys: number;
  dia: number;
  pul: number;
}

export interface DisplayBbox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  imageW: number;
  imageH: number;
}

// Singleton sessions — loaded once, reused across calls
let displaySession: ort.InferenceSession | null = null;
let digitSession: ort.InferenceSession | null = null;

async function loadSessions(): Promise<void> {
  if (displaySession && digitSession) return;
  [displaySession, digitSession] = await Promise.all([
    ort.InferenceSession.create(DISPLAY_MODEL_URL, { executionProviders: ['wasm'] }),
    ort.InferenceSession.create(DIGIT_MODEL_URL, { executionProviders: ['wasm'] }),
  ]);
}

function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

interface LetterboxResult {
  tensor: Float32Array;
  scale: number;
  padX: number;
  padY: number;
  letterboxCanvas: HTMLCanvasElement;
}

function letterboxToTensor(srcCanvas: HTMLCanvasElement, targetSize: number): LetterboxResult {
  const scale = Math.min(targetSize / srcCanvas.width, targetSize / srcCanvas.height);
  const newW = Math.round(srcCanvas.width * scale);
  const newH = Math.round(srcCanvas.height * scale);
  const padX = Math.floor((targetSize - newW) / 2);
  const padY = Math.floor((targetSize - newH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(114,114,114)';
  ctx.fillRect(0, 0, targetSize, targetSize);
  ctx.drawImage(srcCanvas, padX, padY, newW, newH);

  const pixels = ctx.getImageData(0, 0, targetSize, targetSize).data;
  const n = targetSize * targetSize;
  const tensor = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    tensor[i] = pixels[i * 4] / 255;
    tensor[n + i] = pixels[i * 4 + 1] / 255;
    tensor[2 * n + i] = pixels[i * 4 + 2] / 255;
  }

  return { tensor, scale, padX, padY, letterboxCanvas: canvas };
}

function cropCanvas(
  src: HTMLCanvasElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): HTMLCanvasElement {
  const cx1 = Math.max(0, Math.round(x1));
  const cy1 = Math.max(0, Math.round(y1));
  const cx2 = Math.min(src.width, Math.round(x2));
  const cy2 = Math.min(src.height, Math.round(y2));
  const w = cx2 - cx1;
  const h = cy2 - cy1;
  const dst = document.createElement('canvas');
  dst.width = w;
  dst.height = h;
  dst.getContext('2d')!.drawImage(src, cx1, cy1, w, h, 0, 0, w, h);
  return dst;
}

// YOLOv8 ONNX output: (1, 4+numClasses, numAnchors), flattened row-major.
// Each anchor: [cx, cy, w, h, cls0_conf, ..., clsN_conf] in pixel space of the input tensor.
// Returns boxes in original image pixel space (letterbox undone).
function decodeOutput(
  data: Float32Array,
  numClasses: number,
  numAnchors: number,
  confThreshold: number,
  scale: number,
  padX: number,
  padY: number,
): Box[] {
  const invScale = 1 / scale;
  const boxes: Box[] = [];

  for (let i = 0; i < numAnchors; i++) {
    let maxConf = 0;
    let maxCls = 0;
    for (let c = 0; c < numClasses; c++) {
      const conf = data[(4 + c) * numAnchors + i];
      if (conf > maxConf) {
        maxConf = conf;
        maxCls = c;
      }
    }
    if (maxConf < confThreshold) continue;

    const cx_t = data[0 * numAnchors + i];
    const cy_t = data[1 * numAnchors + i];
    const w_t = data[2 * numAnchors + i];
    const h_t = data[3 * numAnchors + i];

    // Undo letterbox: remove padding, then undo scale
    const x1 = (cx_t - w_t / 2 - padX) * invScale;
    const y1 = (cy_t - h_t / 2 - padY) * invScale;
    const x2 = (cx_t + w_t / 2 - padX) * invScale;
    const y2 = (cy_t + h_t / 2 - padY) * invScale;

    boxes.push({ x1, y1, x2, y2, cls: maxCls, conf: maxConf, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 });
  }

  return boxes;
}

export function useLocalOcr() {
  const stage = ref<OcrStage>('idle');
  const originalImageUrl = ref<string | null>(null);
  const displayBbox = ref<DisplayBbox | null>(null);
  const digitBoxes = ref<Box[]>([]);
  const result = ref<OcrResult | null>(null);
  const errorMsg = ref<string | null>(null);
  const ocrMeta = ref<OcrMeta | null>(null);
  let pendingObjectUrl: string | null = null;

  async function run(blob: Blob): Promise<OcrResult | null> {
    stage.value = 'idle';
    result.value = null;
    errorMsg.value = null;
    ocrMeta.value = null;
    originalImageUrl.value = null;
    displayBbox.value = null;
    digitBoxes.value = [];

    try {
      stage.value = 'loading';
      await loadSessions();

      const srcCanvas = await blobToCanvas(blob);
      if (pendingObjectUrl) URL.revokeObjectURL(pendingObjectUrl);
      pendingObjectUrl = URL.createObjectURL(blob);
      originalImageUrl.value = pendingObjectUrl;

      // ── Stage 1: detect display ──────────────────────────────────────
      stage.value = 'detecting-display';
      const t1 = performance.now();
      const { tensor: dTensor, scale: dScale, padX: dPadX, padY: dPadY } = letterboxToTensor(
        srcCanvas,
        DISPLAY_INPUT_SIZE,
      );
      const dInput = new ort.Tensor('float32', dTensor, [1, 3, DISPLAY_INPUT_SIZE, DISPLAY_INPUT_SIZE]);
      const dOut = await displaySession!.run({ [displaySession!.inputNames[0]]: dInput });
      const dData = dOut[displaySession!.outputNames[0]].data as Float32Array;
      const displayMs = Math.round(performance.now() - t1);

      const displayBoxes = decodeOutput(dData, 1, DISPLAY_ANCHORS, DISPLAY_CONF, dScale, dPadX, dPadY);
      if (displayBoxes.length === 0) {
        errorMsg.value = 'display-not-found';
        stage.value = 'error';
        return null;
      }

      const best = displayBoxes.reduce((a, b) => (a.conf > b.conf ? a : b));
      displayBbox.value = {
        x1: best.x1, y1: best.y1, x2: best.x2, y2: best.y2,
        imageW: srcCanvas.width, imageH: srcCanvas.height,
      };
      const bw = best.x2 - best.x1;
      const bh = best.y2 - best.y1;
      const padPx = 0.03;
      const cropCanvas_ = cropCanvas(
        srcCanvas,
        best.x1 - bw * padPx,
        best.y1 - bh * padPx,
        best.x2 + bw * padPx,
        best.y2 + bh * padPx,
      );

      // ── Stage 2: detect digits ───────────────────────────────────────
      stage.value = 'detecting-digits';
      const t2 = performance.now();
      const { tensor: gTensor, scale: gScale, padX: gPadX, padY: gPadY } = letterboxToTensor(
        cropCanvas_,
        DIGIT_INPUT_SIZE,
      );
      const gInput = new ort.Tensor('float32', gTensor, [1, 3, DIGIT_INPUT_SIZE, DIGIT_INPUT_SIZE]);
      const gOut = await digitSession!.run({ [digitSession!.inputNames[0]]: gInput });
      const gData = gOut[digitSession!.outputNames[0]].data as Float32Array;
      const digitsMs = Math.round(performance.now() - t2);

      let boxes = decodeOutput(gData, 10, DIGIT_ANCHORS, DIGIT_CONF, gScale, gPadX, gPadY);
      if (boxes.length === 0) {
        errorMsg.value = 'digits-not-found';
        stage.value = 'error';
        return null;
      }
      boxes = classAgnosticNms(boxes, NMS_IOU);
      digitBoxes.value = boxes;

      const confs = boxes.map((b) => b.conf);
      const minConf = Math.min(...confs);
      const meanConf = confs.reduce((a, b) => a + b, 0) / confs.length;

      // ── Stage 3: assemble ────────────────────────────────────────────
      stage.value = 'assembling';
      const t3 = performance.now();
      const rows = kmeansRows(boxes);
      if (rows.length !== 3) {
        errorMsg.value = 'wrong-row-count';
        stage.value = 'error';
        return null;
      }
      const nums = rows.map(assembleNumber);
      if (nums.some((n) => n === null)) {
        errorMsg.value = 'assemble-failed';
        stage.value = 'error';
        return null;
      }

      const postMs = Math.round(performance.now() - t3);

      const ocResult: OcrResult = { sys: nums[0]!, dia: nums[1]!, pul: nums[2]! };
      result.value = ocResult;
      ocrMeta.value = {
        engine: 'local',
        model_version: MODEL_VERSION,
        inference_ms: { display: displayMs, digits: digitsMs, postprocess: postMs },
        confidence: { min: parseFloat(minConf.toFixed(4)), mean: parseFloat(meanConf.toFixed(4)) },
        fallback_reason: null,
        user_agent: navigator.userAgent,
        hw_concurrency: navigator.hardwareConcurrency ?? null,
      };
      stage.value = 'done';
      return ocResult;
    } catch (e) {
      console.error('[useLocalOcr]', e);
      errorMsg.value = 'unknown';
      stage.value = 'error';
      return null;
    }
  }

  function reset() {
    stage.value = 'idle';
    result.value = null;
    errorMsg.value = null;
    ocrMeta.value = null;
    if (pendingObjectUrl) { URL.revokeObjectURL(pendingObjectUrl); pendingObjectUrl = null; }
    originalImageUrl.value = null;
    displayBbox.value = null;
    digitBoxes.value = [];
  }

  return { stage, originalImageUrl, displayBbox, digitBoxes, result, errorMsg, ocrMeta, run, reset };
}
