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
}

export interface UserSettings {
  geminiUrl?: string;
  exportEmail?: string;
  sheetsTemplateUrl?: string;
}

export interface AuthStatus {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
}
