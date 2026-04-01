'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Workout, WorkoutEntry } from '@/types';
import { getWorkouts, updateWorkoutEntries, deleteWorkout } from '@/lib/firestore';
import WorkoutList from '@/components/WorkoutList';
import StaggeredList from '@/components/StaggeredList';
import { SkeletonList } from '@/components/Skeleton';
import { ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Week of ${fmt(start)} — ${fmt(end)}`;
}

function getRelativeLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{
    type: 'workout' | 'movement';
    workoutId: string;
    movementName?: string;
  } | null>(null);

  const loadWorkouts = useCallback(async () => {
    if (!user) return;
    try {
      const w = await getWorkouts(user.uid);
      setWorkouts(w);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleUpdateEntry = async (workoutId: string, entryId: string, updates: Partial<WorkoutEntry>) => {
    if (!user) return;
    const w = workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const updatedEntries = w.entries.map((e) => (e.id === entryId ? { ...e, ...updates } : e));
    setWorkouts(workouts.map((w) => (w.id === workoutId ? { ...w, entries: updatedEntries } : w)));
    await updateWorkoutEntries(user.uid, workoutId, updatedEntries);
  };

  const handleDeleteEntry = async (workoutId: string, entryId: string) => {
    if (!user) return;
    const w = workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const updatedEntries = w.entries.filter((e) => e.id !== entryId);
    if (updatedEntries.length === 0) {
      setWorkouts(workouts.filter((w) => w.id !== workoutId));
      await deleteWorkout(user.uid, workoutId);
    } else {
      setWorkouts(workouts.map((w) => (w.id === workoutId ? { ...w, entries: updatedEntries } : w)));
      await updateWorkoutEntries(user.uid, workoutId, updatedEntries);
    }
  };

  const handleDuplicateEntry = async (workoutId: string, entry: WorkoutEntry) => {
    if (!user) return;
    const w = workouts.find((w) => w.id === workoutId);
    if (!w) return;
    const newEntry: WorkoutEntry = { ...entry, id: Math.random().toString(36).substring(2) + Date.now().toString(36), createdAt: Date.now() };
    const updatedEntries = [...w.entries, newEntry];
    setWorkouts(workouts.map((w) => (w.id === workoutId ? { ...w, entries: updatedEntries } : w)));
    await updateWorkoutEntries(user.uid, workoutId, updatedEntries);
  };

  const confirmDeleteMovement = async () => {
    if (!user || !modal || modal.type !== 'movement' || !modal.movementName) return;
    const w = workouts.find((w) => w.id === modal.workoutId);
    if (!w) return;
    const updatedEntries = w.entries.filter((e) => e.movementName !== modal.movementName);
    if (updatedEntries.length === 0) {
      setWorkouts(workouts.filter((w) => w.id !== modal.workoutId));
      await deleteWorkout(user.uid, modal.workoutId);
    } else {
      setWorkouts(workouts.map((w) => (w.id === modal.workoutId ? { ...w, entries: updatedEntries } : w)));
      await updateWorkoutEntries(user.uid, modal.workoutId, updatedEntries);
    }
    setModal(null);
  };

  const confirmDeleteWorkout = async () => {
    if (!user || !modal || modal.type !== 'workout') return;
    setWorkouts(workouts.filter((w) => w.id !== modal.workoutId));
    await deleteWorkout(user.uid, modal.workoutId);
    setModal(null);
  };

  // Group by week
  const grouped = workouts.reduce<Record<string, Workout[]>>((acc, w) => {
    const week = getWeekStart(w.date);
    if (!acc[week]) acc[week] = [];
    acc[week].push(w);
    return acc;
  }, {});

  const sortedWeeks = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--text-primary)' }}>History</h1>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--text-primary)' }}>History</h1>

      {workouts.length === 0 ? (
        <p className="text-center mt-12" style={{ color: 'var(--text-tertiary)' }}>
          No workouts yet. Start logging!
        </p>
      ) : (
        sortedWeeks.map((week) => (
          <div key={week} className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--accent)' }}>
              {formatWeekRange(week)}
            </h2>
            <StaggeredList>
              {grouped[week].map((w) => {
                const isExpanded = expanded.has(w.id!);
                const movementNames = [...new Set(w.entries.map((e) => e.movementName))];
                return (
                  <div
                    key={w.id}
                    className="card-depth rounded-xl mb-3 overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <button
                      onClick={() => toggleExpanded(w.id!)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left active:scale-[0.99] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {getRelativeLabel(w.date)}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                          >
                            {w.entries.length} sets
                          </span>
                        </div>
                        <p className="text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {movementNames.slice(0, 3).join(', ')}
                          {movementNames.length > 3 && ` +${movementNames.length - 3}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ type: 'workout', workoutId: w.id! });
                          }}
                          className="p-1.5 rounded-lg transition-all active:scale-90 hover:bg-[var(--bg-tertiary)]"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                        {isExpanded ? (
                          <ChevronUp size={20} style={{ color: 'var(--text-tertiary)' }} />
                        ) : (
                          <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <WorkoutList
                          entries={w.entries}
                          onUpdateEntry={(id, updates) => handleUpdateEntry(w.id!, id, updates)}
                          onDeleteEntry={(id) => handleDeleteEntry(w.id!, id)}
                          onDuplicateEntry={(entry) => handleDuplicateEntry(w.id!, entry)}
                          onDeleteMovement={(name) =>
                            setModal({ type: 'movement', workoutId: w.id!, movementName: name })
                          }
                          unit={settings.unit}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </StaggeredList>
          </div>
        ))
      )}

      {/* Confirmation Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setModal(null)}
          onKeyDown={(e) => e.key === 'Escape' && setModal(null)}
          role="dialog"
          tabIndex={-1}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-modal-in"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Confirm Delete
              </h3>
              <button onClick={() => setModal(null)} className="p-1 active:scale-90">
                <X size={20} style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </div>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              {modal.type === 'workout'
                ? 'Delete this entire workout? This cannot be undone.'
                : `Delete all sets for "${modal.movementName}"? This cannot be undone.`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModal(null)}
                className="py-3 rounded-xl font-semibold border active:scale-[0.97] transition-all"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={modal.type === 'workout' ? confirmDeleteWorkout : confirmDeleteMovement}
                className="py-3 rounded-xl font-semibold active:scale-[0.97] transition-all"
                style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
