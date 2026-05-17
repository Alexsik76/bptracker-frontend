import { describe, it, expect } from 'vitest';
import { classAgnosticNms, kmeansRows, assembleNumber } from '../ocr/postprocess';
import type { Box } from '../ocr/postprocess';

function b(x1: number, y1: number, x2: number, y2: number, cls: number, conf: number): Box {
  return { x1, y1, x2, y2, cls, conf, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 };
}

describe('classAgnosticNms', () => {
  it('keeps a single box unchanged', () => {
    const box = b(0, 0, 10, 10, 3, 0.9);
    expect(classAgnosticNms([box], 0.4)).toEqual([box]);
  });

  it('removes lower-confidence duplicate of different class at same coordinates', () => {
    const hi = b(0, 0, 10, 10, 1, 0.9);
    const lo = b(0, 0, 10, 10, 5, 0.6); // IoU = 1.0 → suppressed
    const result = classAgnosticNms([hi, lo], 0.4);
    expect(result).toHaveLength(1);
    expect(result[0].cls).toBe(1);
  });

  it('keeps non-overlapping boxes regardless of class', () => {
    const left = b(0, 0, 10, 10, 2, 0.9);
    const right = b(20, 0, 30, 10, 2, 0.8);
    expect(classAgnosticNms([left, right], 0.4)).toHaveLength(2);
  });
});

describe('kmeansRows', () => {
  function row(cy: number, xs: number[]): Box[] {
    return xs.map((x) => b(x, cy - 5, x + 10, cy + 5, 0, 0.9));
  }

  it('groups well-separated boxes into 3 rows sorted top-to-bottom', () => {
    const boxes = [...row(10, [0, 20, 40]), ...row(60, [0, 20, 40]), ...row(110, [0, 20, 40])];
    const rows = kmeansRows(boxes);
    expect(rows).toHaveLength(3);
    expect(rows[0][0].cy).toBeLessThan(rows[1][0].cy);
    expect(rows[1][0].cy).toBeLessThan(rows[2][0].cy);
  });

  it('sorts boxes within each row left to right', () => {
    const boxes = [...row(10, [40, 10, 25]), ...row(60, [5, 30, 15]), ...row(110, [20, 0, 10])];
    const rows = kmeansRows(boxes);
    for (const r of rows) {
      for (let i = 1; i < r.length; i++) {
        expect(r[i].cx).toBeGreaterThan(r[i - 1].cx);
      }
    }
  });
});

describe('assembleNumber', () => {
  it('joins digit classes into a number left to right', () => {
    const row = [b(0, 0, 5, 5, 1, 0.9), b(10, 0, 15, 5, 2, 0.9), b(20, 0, 25, 5, 5, 0.9)];
    expect(assembleNumber(row)).toBe(125);
  });

  it('returns null for an empty row', () => {
    expect(assembleNumber([])).toBeNull();
  });
});
