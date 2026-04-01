'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { WorkoutEntry, Movement, Workout } from '@/types';
import {
  getMovements,
  getWorkoutByDate,
  createWorkout,
  updateWorkoutEntries,
  completeWorkout,
} from '@/lib/firestore';
import WorkoutForm from '@/components/WorkoutForm';
import WorkoutList from '@/components/WorkoutList';
import { SkeletonList } from '@/components/Skeleton';
import { CheckCircle, Undo2 } from 'lucide-react';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export default function HomePage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoToast, setUndoToast] = useState<{
    message: string;
    restore: () => void;
  } | null>(null);
  const [finishState, setFinishState] = useState<'idle' | 'confirm'>('idle');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [mvts, w] = await Promise.all([
        getMovements(user.uid),
        getWorkoutByDate(user.uid, getTodayDate()),
      ]);
      setMovements(mvts);
      setWorkout(w);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const entries = workout?.entries ?? [];

  const handleLog = async (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newEntry: WorkoutEntry = {
      ...entry,
      id: generateId(),
      createdAt: Date.now(),
    };

    if (workout?.id) {
      // Optimistic update
      const updatedEntries = [...entries, newEntry];
      setWorkout({ ...workout, entries: updatedEntries });
      await updateWorkoutEntries(user.uid, workout.id, updatedEntries);
    } else {
      // Create new workout
      const newWorkout: Omit<Workout, 'id'> = {
        date: getTodayDate(),
        entries: [newEntry],
        createdAt: Date.now(),
        completed: false,
      };
      const id = await createWorkout(user.uid, newWorkout);
      setWorkout({ ...newWorkout, id });
    }
  };

  const handleUpdateEntry = async (id: string, updates: Partial<WorkoutEntry>) => {
    if (!user || !workout?.id) return;
    const updatedEntries = entries.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setWorkout({ ...workout, entries: updatedEntries });
    await updateWorkoutEntries(user.uid, workout.id, updatedEntries);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user || !workout?.id) return;
    const updatedEntries = entries.filter((e) => e.id !== id);
    setWorkout({ ...workout, entries: updatedEntries });
    await updateWorkoutEntries(user.uid, workout.id, updatedEntries);
  };

  const handleDuplicateEntry = async (entry: WorkoutEntry) => {
    const newEntry: WorkoutEntry = {
      ...entry,
      id: generateId(),
      createdAt: Date.now(),
    };
    if (!user || !workout?.id) return;
    const updatedEntries = [...entries, newEntry];
    setWorkout({ ...workout, entries: updatedEntries });
    await updateWorkoutEntries(user.uid, workout.id, updatedEntries);
  };

  const handleDeleteMovement = (movementName: string) => {
    if (!user || !workout?.id) return;
    const removed = entries.filter((e) => e.movementName === movementName);
    const remaining = entries.filter((e) => e.movementName !== movementName);
    setWorkout({ ...workout, entries: remaining });
    updateWorkoutEntries(user.uid, workout.id, remaining);

    setUndoToast({
      message: `Deleted ${movementName}`,
      restore: () => {
        // Restore to original list
        const restored = [...remaining];
        removed.forEach((r) => {
          const origIdx = entries.indexOf(r);
          restored.splice(origIdx, 0, r);
        });
        setWorkout({ ...workout, entries: restored });
        updateWorkoutEntries(user.uid, workout.id!, restored);
      },
    });
    setTimeout(() => setUndoToast(null), 5000);
  };

  const handleFinishWorkout = async () => {
    if (finishState === 'idle') {
      setFinishState('confirm');
      setTimeout(() => setFinishState('idle'), 3000);
      return;
    }
    if (!user || !workout?.id) return;
    await completeWorkout(user.uid, workout.id);
    const totalVolume = entries.reduce((sum, e) => sum + e.weight * e.reps, 0);
    setSuccessToast(`🎉 ${entries.length} sets · ${totalVolume} ${settings.unit} total volume`);
    setWorkout(null);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const totalSets = entries.length;
  const totalVolume = entries.reduce((sum, e) => sum + e.weight * e.reps, 0);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1
          className="text-2xl font-bold mb-4 mt-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Today&apos;s Workout
        </h1>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1
        className="text-2xl font-bold mb-4 mt-2"
        style={{ color: 'var(--text-primary)' }}
      >
        Today&apos;s Workout
      </h1>

      <WorkoutForm movements={movements} entries={entries} onLog={handleLog} />

      {entries.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Logged Sets
            </h2>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {totalSets} sets · {totalVolume} {settings.unit} total
            </span>
          </div>

          <WorkoutList
            entries={entries}
            onUpdateEntry={handleUpdateEntry}
            onDeleteEntry={handleDeleteEntry}
            onDuplicateEntry={handleDuplicateEntry}
            onDeleteMovement={handleDeleteMovement}
            unit={settings.unit}
          />

          <button
            onClick={handleFinishWorkout}
            className="w-full mt-6 py-3.5 rounded-xl font-bold text-lg active:scale-[0.97] transition-all"
            style={{
              backgroundColor: finishState === 'confirm' ? 'var(--warning)' : 'var(--success)',
              color: '#fff',
            }}
          >
            {finishState === 'confirm' ? 'Tap again to confirm' : 'Finish Workout'}
          </button>
        </>
      )}

      {/* Undo Toast */}
      {undoToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-up z-50"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            border: '1px solid',
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>{undoToast.message}</span>
          <button
            onClick={() => {
              undoToast.restore();
              setUndoToast(null);
            }}
            className="flex items-center gap-1 font-semibold active:scale-95"
            style={{ color: 'var(--accent)' }}
          >
            <Undo2 size={16} />
            Undo
          </button>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-up z-50"
          style={{
            backgroundColor: 'var(--success)',
            color: '#fff',
          }}
        >
          <CheckCircle size={20} />
          <span className="font-medium">{successToast}</span>
        </div>
      )}
    </div>
  );
}
