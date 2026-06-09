export interface User {
  id: string;
  email: string;
}

export interface Measurement {
  id: string;
  recordedAt: string;
  sys: number;
  dia: number;
  pulse: number;
}

export interface CreateMeasurementDto {
  sys: number;
  dia: number;
  pulse: number;
  recordedAt?: string;
}

export interface UserSettings {
  geminiUrl?: string;
  exportEmail?: string;
  sheetsTemplateUrl?: string;
  sendPhotos?: boolean;
}

export interface AuthStatus {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
}

export interface MedicationEntry {
  Medicine: string;
  Amount: string;
  Condition: string;
}

export interface TreatmentSchema {
  id: string;
  doctor: string | null;
  prescribedOn: string | null;
  createdAt: string;
  isActive: boolean;
  scheduleDocument: Record<string, MedicationEntry[]> | null;
}

export interface SchemaScheduleDto {
  Morning?: MedicationEntry[];
  Day?: MedicationEntry[];
  Evening?: MedicationEntry[];
}

export interface CreateSchemaDto {
  doctor: string;
  prescribedOn?: string;
  schedule: SchemaScheduleDto;
  setActive: boolean;
}

export interface UpdateSchemaDto {
  doctor: string;
  prescribedOn?: string;
  schedule: SchemaScheduleDto;
}
