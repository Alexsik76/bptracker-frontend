export interface FieldConfig {
  key: 'sys' | 'dia' | 'pulse';
  labelKey: string;
  subLabelKey: string | null;
  unitKey: string;
  color: string;
  highlightX: number;
  highlightY: number;
  min: number;
  max: number;
}

export const FIELD_CONFIGS: FieldConfig[] = [
  {
    key: 'sys',
    labelKey: 'measurement.systolicLabel',
    subLabelKey: 'measurement.systolicSub',
    unitKey: 'bp.units.mmHg',
    color: '#a39bff',
    highlightX: 46,
    highlightY: 20,
    min: 40, max: 300,
  },
  {
    key: 'dia',
    labelKey: 'measurement.diastolicLabel',
    subLabelKey: 'measurement.diastolicSub',
    unitKey: 'bp.units.mmHg',
    color: '#7dd3fc',
    highlightX: 46,
    highlightY: 45,
    min: 20, max: 200,
  },
  {
    key: 'pulse',
    labelKey: 'measurement.pulse',
    subLabelKey: null,
    unitKey: 'bp.units.bpm',
    color: '#86efac',
    highlightX: 46,
    highlightY: 74,
    min: 30, max: 250,
  },
];
