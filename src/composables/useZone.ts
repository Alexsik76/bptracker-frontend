import { classifyBP, BP_CLASS_COLOR, BP_CLASS_BG } from '../utils/bp';
import type { BpClass } from '../utils/bp';

export type Zone = {
  key: BpClass;
  color: string;
  bg: string;
};

function makeZone(key: BpClass): Zone {
  return {
    key,
    color: BP_CLASS_COLOR[key],
    bg:    BP_CLASS_BG[key],
  };
}

export const DEFAULT_ZONE: Zone = makeZone('optimal');

export function getZone(sys: number, dia: number): Zone {
  return makeZone(classifyBP(sys, dia));
}

export function zoneProgressPct(sys: number): number {
  return Math.round(
    Math.max(0, Math.min(100, ((Math.max(90, sys) - 90) / 90) * 100)),
  );
}
