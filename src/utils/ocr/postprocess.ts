export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cls: number;
  conf: number;
  cx: number;
  cy: number;
}

function iou(a: Box, b: Box): number {
  const ix1 = Math.max(a.x1, b.x1);
  const iy1 = Math.max(a.y1, b.y1);
  const ix2 = Math.min(a.x2, b.x2);
  const iy2 = Math.min(a.y2, b.y2);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  if (inter === 0) return 0;
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (areaA + areaB - inter);
}

export function classAgnosticNms(boxes: Box[], iouThreshold: number): Box[] {
  const sorted = [...boxes].sort((a, b) => b.conf - a.conf);
  const kept: Box[] = [];
  for (const box of sorted) {
    if (kept.every((k) => iou(box, k) < iouThreshold)) kept.push(box);
  }
  return kept;
}

// Lloyd's k-means with k=3 on Y centers, port of Python recognize_digits.py
export function kmeansRows(boxes: Box[]): Box[][] {
  if (boxes.length === 0) return [];
  if (boxes.length < 3) return boxes.map((b) => [b]).sort((a, b) => a[0].cy - b[0].cy);

  const ys = boxes.map((b) => b.cy);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  if (yMax === yMin) return [boxes.slice().sort((a, b) => a.cx - b.cx)];

  let centers = [
    yMin + (yMax - yMin) * (1 / 6),
    yMin + (yMax - yMin) * (3 / 6),
    yMin + (yMax - yMin) * (5 / 6),
  ];

  for (let iter = 0; iter < 20; iter++) {
    const clusters: Box[][] = [[], [], []];
    for (const box of boxes) {
      const dists = centers.map((c) => Math.abs(box.cy - c));
      clusters[dists.indexOf(Math.min(...dists))].push(box);
    }
    const next = centers.map((c, i) =>
      clusters[i].length ? clusters[i].reduce((s, b) => s + b.cy, 0) / clusters[i].length : c,
    );
    if (next.every((c, i) => Math.abs(c - centers[i]) < 1e-3)) break;
    centers = next;
  }

  const clusters: Box[][] = [[], [], []];
  for (const box of boxes) {
    const dists = centers.map((c) => Math.abs(box.cy - c));
    clusters[dists.indexOf(Math.min(...dists))].push(box);
  }

  return clusters
    .map((c, i) => ({ c, cy: centers[i] }))
    .sort((a, b) => a.cy - b.cy)
    .map(({ c }) => c.sort((a, b) => a.cx - b.cx))
    .filter((r) => r.length > 0);
}

export function assembleNumber(row: Box[]): number | null {
  const s = row.map((b) => b.cls).join('');
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}
