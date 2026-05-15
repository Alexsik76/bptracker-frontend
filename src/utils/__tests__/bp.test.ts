import { describe, it, expect } from 'vitest';
import { classifyBP, NORMAL_CLASSES, BP_CLASS_RANGE } from '../bp';

describe('classifyBP — ESC 4-level scale', () => {
  describe('optimal: sys < 120 AND dia < 80', () => {
    it('119/79 → optimal', () => expect(classifyBP(119, 79)).toBe('optimal'));
    it('90/60  → optimal', () => expect(classifyBP(90, 60)).toBe('optimal'));
    it('0/0    → optimal', () => expect(classifyBP(0, 0)).toBe('optimal'));
  });

  describe('normal: sys 120–139 OR dia 80–89', () => {
    it('120/79 → normal (sys at lower boundary)', () => expect(classifyBP(120, 79)).toBe('normal'));
    it('119/80 → normal (dia at lower boundary)', () => expect(classifyBP(119, 80)).toBe('normal'));
    it('139/89 → normal (both at upper boundary)', () => expect(classifyBP(139, 89)).toBe('normal'));
    it('130/85 → normal', () => expect(classifyBP(130, 85)).toBe('normal'));
    it('135/75 → normal (only sys qualifies)', () => expect(classifyBP(135, 75)).toBe('normal'));
  });

  describe('stage1: sys 140–159 OR dia 90–99', () => {
    it('140/79 → stage1 (sys at lower boundary)', () => expect(classifyBP(140, 79)).toBe('stage1'));
    it('119/90 → stage1 (dia at lower boundary)', () => expect(classifyBP(119, 90)).toBe('stage1'));
    it('159/99 → stage1 (both at upper boundary)', () => expect(classifyBP(159, 99)).toBe('stage1'));
    it('150/95 → stage1', () => expect(classifyBP(150, 95)).toBe('stage1'));
  });

  describe('stage2: sys ≥ 160 OR dia ≥ 100', () => {
    it('160/79  → stage2 (sys at lower boundary)', () => expect(classifyBP(160, 79)).toBe('stage2'));
    it('119/100 → stage2 (dia at lower boundary)', () => expect(classifyBP(119, 100)).toBe('stage2'));
    it('180/110 → stage2', () => expect(classifyBP(180, 110)).toBe('stage2'));
  });

  describe('tie-break: higher level always wins', () => {
    it('180/85 → stage2 (sys dominates over normal dia)', () =>
      expect(classifyBP(180, 85)).toBe('stage2'));
    it('135/100 → stage2 (dia dominates over normal sys)', () =>
      expect(classifyBP(135, 100)).toBe('stage2'));
    it('160/90 → stage2 (sys at stage2 beats dia at stage1)', () =>
      expect(classifyBP(160, 90)).toBe('stage2'));
    it('140/79 → stage1 (sys at stage1, dia optimal)', () =>
      expect(classifyBP(140, 79)).toBe('stage1'));
    it('119/90 → stage1 (dia at stage1, sys optimal)', () =>
      expect(classifyBP(119, 90)).toBe('stage1'));
    it('135/90 → stage1 (dia at stage1 beats sys at normal)', () =>
      expect(classifyBP(135, 90)).toBe('stage1'));
  });
});

describe('NORMAL_CLASSES', () => {
  it('contains optimal', () => expect(NORMAL_CLASSES.has('optimal')).toBe(true));
  it('contains normal',  () => expect(NORMAL_CLASSES.has('normal')).toBe(true));
  it('excludes stage1',  () => expect(NORMAL_CLASSES.has('stage1')).toBe(false));
  it('excludes stage2',  () => expect(NORMAL_CLASSES.has('stage2')).toBe(false));

  it('matches classifier output for in-range measurements', () => {
    const inRange = [
      [119, 79], [90, 60], [120, 79], [119, 80], [130, 85],
    ] as [number, number][];
    for (const [sys, dia] of inRange) {
      expect(NORMAL_CLASSES.has(classifyBP(sys, dia))).toBe(true);
    }
  });

  it('matches classifier output for out-of-range measurements', () => {
    const outOfRange = [
      [140, 79], [119, 90], [150, 95], [160, 80], [180, 110],
    ] as [number, number][];
    for (const [sys, dia] of outOfRange) {
      expect(NORMAL_CLASSES.has(classifyBP(sys, dia))).toBe(false);
    }
  });
});

describe('BP_CLASS_RANGE', () => {
  it('contains entries for all BpClass keys', () => {
    const keys = Object.keys(BP_CLASS_RANGE).sort();
    expect(keys).toEqual(['normal', 'optimal', 'stage1', 'stage2']);
  });

  it('every entry has non-empty sys and dia strings', () => {
    for (const range of Object.values(BP_CLASS_RANGE)) {
      expect(range.sys.length).toBeGreaterThan(0);
      expect(range.dia.length).toBeGreaterThan(0);
    }
  });
});
