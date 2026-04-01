import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  getDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Movement,
  Workout,
  WorkoutEntry,
  Template,
  UserSettings,
  DEFAULT_SETTINGS,
} from '@/types';

// --- Movements ---

export async function getMovements(userId: string): Promise<Movement[]> {
  const ref = collection(db, 'users', userId, 'movements');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Movement));
}

export async function addMovement(userId: string, movement: Omit<Movement, 'id'>): Promise<string> {
  const ref = doc(collection(db, 'users', userId, 'movements'));
  await setDoc(ref, movement);
  return ref.id;
}

export async function updateMovement(userId: string, id: string, data: Partial<Movement>) {
  const ref = doc(db, 'users', userId, 'movements', id);
  await updateDoc(ref, data);
}

export async function deleteMovement(userId: string, id: string) {
  await deleteDoc(doc(db, 'users', userId, 'movements', id));
}

// --- Workouts ---

export async function getWorkouts(userId: string): Promise<Workout[]> {
  const ref = collection(db, 'users', userId, 'workouts');
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Workout))
    .filter((w) => w.entries && w.entries.length > 0);
}

export async function getWorkoutByDate(userId: string, date: string): Promise<Workout | null> {
  const workouts = await getWorkouts(userId);
  return workouts.find((w) => w.date === date) ?? null;
}

export async function createWorkout(userId: string, workout: Omit<Workout, 'id'>): Promise<string> {
  const ref = doc(collection(db, 'users', userId, 'workouts'));
  await setDoc(ref, workout);
  return ref.id;
}

export async function addEntriesToWorkout(
  userId: string,
  workoutId: string,
  newEntries: WorkoutEntry[]
) {
  const ref = doc(db, 'users', userId, 'workouts', workoutId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const existing = (snap.data() as Workout).entries || [];
  await updateDoc(ref, { entries: [...existing, ...newEntries] });
}

export async function addEntryToWorkout(
  userId: string,
  workoutId: string,
  entry: WorkoutEntry
) {
  await addEntriesToWorkout(userId, workoutId, [entry]);
}

export async function updateWorkoutEntries(
  userId: string,
  workoutId: string,
  entries: WorkoutEntry[]
) {
  const ref = doc(db, 'users', userId, 'workouts', workoutId);
  if (entries.length === 0) {
    await deleteDoc(ref);
  } else {
    await updateDoc(ref, { entries });
  }
}

export async function completeWorkout(userId: string, workoutId: string) {
  const ref = doc(db, 'users', userId, 'workouts', workoutId);
  await updateDoc(ref, { completed: true });
}

export async function deleteWorkout(userId: string, workoutId: string) {
  await deleteDoc(doc(db, 'users', userId, 'workouts', workoutId));
}

// --- Templates ---

export async function getTemplates(userId: string): Promise<Template[]> {
  const ref = collection(db, 'users', userId, 'templates');
  const q = query(ref, orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
}

export async function createTemplate(userId: string, template: Omit<Template, 'id'>): Promise<string> {
  const ref = doc(collection(db, 'users', userId, 'templates'));
  await setDoc(ref, template);
  return ref.id;
}

export async function updateTemplate(userId: string, id: string, data: Partial<Template>) {
  const ref = doc(db, 'users', userId, 'templates', id);
  await updateDoc(ref, data);
}

export async function deleteTemplate(userId: string, id: string) {
  await deleteDoc(doc(db, 'users', userId, 'templates', id));
}

// --- Settings ---

export async function getSettings(userId: string): Promise<UserSettings> {
  const ref = doc(db, 'users', userId, 'settings', 'current');
  const snap = await getDoc(ref);
  if (!snap.exists()) return DEFAULT_SETTINGS;
  return snap.data() as UserSettings;
}

export async function updateSettings(userId: string, settings: Partial<UserSettings>) {
  const ref = doc(db, 'users', userId, 'settings', 'current');
  await setDoc(ref, settings, { merge: true });
}

// --- Seed Default Data ---

export const DEFAULT_MOVEMENTS: Omit<Movement, 'id'>[] = [
  // Legs
  { name: 'Squat', category: 'Legs', isCustom: false },
  { name: 'Front Squat', category: 'Legs', isCustom: false },
  { name: 'Hack Squat', category: 'Legs', isCustom: false },
  { name: 'Leg Press', category: 'Legs', isCustom: false },
  { name: 'Romanian Deadlift', category: 'Legs', isCustom: false },
  { name: 'Walking Lunge', category: 'Legs', isCustom: false },
  { name: 'Bulgarian Split Squat', category: 'Legs', isCustom: false },
  { name: 'Leg Extension', category: 'Legs', isCustom: false },
  { name: 'Leg Curl', category: 'Legs', isCustom: false },
  { name: 'Hip Thrust', category: 'Legs', isCustom: false },
  { name: 'Calf Raise', category: 'Legs', isCustom: false },
  { name: 'Goblet Squat', category: 'Legs', isCustom: false },
  // Back
  { name: 'Deadlift', category: 'Back', isCustom: false },
  { name: 'Barbell Row', category: 'Back', isCustom: false },
  { name: 'Dumbbell Row', category: 'Back', isCustom: false },
  { name: 'Seated Cable Row', category: 'Back', isCustom: false },
  { name: 'T-Bar Row', category: 'Back', isCustom: false },
  { name: 'Pull-Up', category: 'Back', isCustom: false },
  { name: 'Chin-Up', category: 'Back', isCustom: false },
  { name: 'Lat Pulldown', category: 'Back', isCustom: false },
  { name: 'Face Pull', category: 'Back', isCustom: false },
  { name: 'Shrug', category: 'Back', isCustom: false },
  // Chest
  { name: 'Bench Press', category: 'Chest', isCustom: false },
  { name: 'Incline Bench Press', category: 'Chest', isCustom: false },
  { name: 'Dumbbell Bench Press', category: 'Chest', isCustom: false },
  { name: 'Incline Dumbbell Press', category: 'Chest', isCustom: false },
  { name: 'Cable Fly', category: 'Chest', isCustom: false },
  { name: 'Dumbbell Fly', category: 'Chest', isCustom: false },
  { name: 'Chest Dip', category: 'Chest', isCustom: false },
  { name: 'Push-Up', category: 'Chest', isCustom: false },
  { name: 'Machine Chest Press', category: 'Chest', isCustom: false },
  // Shoulders
  { name: 'Overhead Press', category: 'Shoulders', isCustom: false },
  { name: 'Dumbbell Shoulder Press', category: 'Shoulders', isCustom: false },
  { name: 'Arnold Press', category: 'Shoulders', isCustom: false },
  { name: 'Lateral Raise', category: 'Shoulders', isCustom: false },
  { name: 'Front Raise', category: 'Shoulders', isCustom: false },
  { name: 'Reverse Fly', category: 'Shoulders', isCustom: false },
  { name: 'Upright Row', category: 'Shoulders', isCustom: false },
  // Arms
  { name: 'Barbell Curl', category: 'Arms', isCustom: false },
  { name: 'Dumbbell Curl', category: 'Arms', isCustom: false },
  { name: 'Hammer Curl', category: 'Arms', isCustom: false },
  { name: 'Preacher Curl', category: 'Arms', isCustom: false },
  { name: 'Cable Curl', category: 'Arms', isCustom: false },
  { name: 'Tricep Pushdown', category: 'Arms', isCustom: false },
  { name: 'Overhead Tricep Extension', category: 'Arms', isCustom: false },
  { name: 'Skull Crusher', category: 'Arms', isCustom: false },
  { name: 'Close-Grip Bench Press', category: 'Arms', isCustom: false },
  { name: 'Tricep Dip', category: 'Arms', isCustom: false },
  // Core
  { name: 'Plank', category: 'Core', isCustom: false },
  { name: 'Hanging Leg Raise', category: 'Core', isCustom: false },
  { name: 'Cable Crunch', category: 'Core', isCustom: false },
  { name: 'Ab Wheel Rollout', category: 'Core', isCustom: false },
  { name: 'Dead Bug', category: 'Core', isCustom: false },
  { name: 'Russian Twist', category: 'Core', isCustom: false },
  { name: 'Decline Sit-Up', category: 'Core', isCustom: false },
  // Cardio
  { name: 'Running', category: 'Cardio', isCustom: false },
  { name: 'Rowing Machine', category: 'Cardio', isCustom: false },
  { name: 'Stationary Bike', category: 'Cardio', isCustom: false },
  { name: 'Jump Rope', category: 'Cardio', isCustom: false },
  { name: 'Stair Climber', category: 'Cardio', isCustom: false },
];

export const DEFAULT_TEMPLATES: Omit<Template, 'id'>[] = [
  {
    name: 'Majestic Push Day',
    entries: [
      { movementName: 'Bench Press', reps: 8, weight: 60, unit: 'kg' },
      { movementName: 'Incline Dumbbell Press', reps: 10, weight: 22, unit: 'kg' },
      { movementName: 'Overhead Press', reps: 8, weight: 40, unit: 'kg' },
      { movementName: 'Lateral Raise', reps: 12, weight: 10, unit: 'kg' },
      { movementName: 'Tricep Pushdown', reps: 12, weight: 25, unit: 'kg' },
      { movementName: 'Cable Fly', reps: 12, weight: 15, unit: 'kg' },
    ],
    createdAt: Date.now(),
    order: 0,
  },
  {
    name: 'Majestic Pull Day',
    entries: [
      { movementName: 'Deadlift', reps: 5, weight: 100, unit: 'kg' },
      { movementName: 'Barbell Row', reps: 8, weight: 60, unit: 'kg' },
      { movementName: 'Lat Pulldown', reps: 10, weight: 55, unit: 'kg' },
      { movementName: 'Face Pull', reps: 15, weight: 20, unit: 'kg' },
      { movementName: 'Barbell Curl', reps: 10, weight: 25, unit: 'kg' },
      { movementName: 'Hammer Curl', reps: 10, weight: 14, unit: 'kg' },
    ],
    createdAt: Date.now(),
    order: 1,
  },
  {
    name: 'Majestic Leg Day',
    entries: [
      { movementName: 'Squat', reps: 5, weight: 80, unit: 'kg' },
      { movementName: 'Romanian Deadlift', reps: 8, weight: 70, unit: 'kg' },
      { movementName: 'Leg Press', reps: 10, weight: 140, unit: 'kg' },
      { movementName: 'Leg Curl', reps: 12, weight: 40, unit: 'kg' },
      { movementName: 'Calf Raise', reps: 15, weight: 60, unit: 'kg' },
      { movementName: 'Hip Thrust', reps: 10, weight: 80, unit: 'kg' },
    ],
    createdAt: Date.now(),
    order: 2,
  },
];

export async function seedMovements(userId: string) {
  const existing = await getMovements(userId);
  if (existing.length > 0) return;
  const batch = writeBatch(db);
  for (const m of DEFAULT_MOVEMENTS) {
    const ref = doc(collection(db, 'users', userId, 'movements'));
    batch.set(ref, m);
  }
  await batch.commit();
}

export async function seedTemplates(userId: string) {
  const existing = await getTemplates(userId);
  if (existing.length > 0) return;
  const batch = writeBatch(db);
  for (const t of DEFAULT_TEMPLATES) {
    const ref = doc(collection(db, 'users', userId, 'templates'));
    batch.set(ref, t);
  }
  await batch.commit();
}
