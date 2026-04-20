export type BpClass = 'normal' | 'elevated' | 'stage1' | 'stage2';

export function classifyBP(sys: number, dia: number): BpClass {
  if (sys >= 140 || dia >= 90) return 'stage2';
  if (sys >= 130 || dia >= 80) return 'stage1';
  if (sys >= 120) return 'elevated';
  return 'normal';
}

export const BP_CLASS_COLOR: Record<BpClass, string> = {
  normal: 'var(--color-success)',
  elevated: 'var(--color-warning)',
  stage1: '#f97316',
  stage2: 'var(--color-danger)',
};

export const BP_CLASS_LABEL: Record<BpClass, string> = {
  normal: 'Норма',
  elevated: 'Підвищений',
  stage1: 'Ступінь I',
  stage2: 'Ступінь II',
};
