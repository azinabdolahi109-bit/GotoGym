// --- Data Types ---

export interface Movement {
  id?: string;
  name: string;
  category: MovementCategory;
  isCustom: boolean;
}

export type MovementCategory =
  | 'Legs'
  | 'Back'
  | 'Chest'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Cardio'
  | 'Other';

export const MOVEMENT_CATEGORIES: MovementCategory[] = [
  'Legs',
  'Back',
  'Chest',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
  'Other',
];

export interface WorkoutEntry {
  id: string;
  movementName: string;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
  notes: string;
  createdAt: number;
}

export interface Workout {
  id?: string;
  date: string; // YYYY-MM-DD
  entries: WorkoutEntry[];
  createdAt: number;
  completed: boolean;
}

export interface TemplateEntry {
  movementName: string;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
}

export interface Template {
  id?: string;
  name: string;
  entries: TemplateEntry[];
  createdAt: number;
  order: number;
}

export interface UserSettings {
  unit: 'kg' | 'lbs';
  theme: 'system' | 'light' | 'dark';
}

export const DEFAULT_SETTINGS: UserSettings = {
  unit: 'kg',
  theme: 'system',
};
