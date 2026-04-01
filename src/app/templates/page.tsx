'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Template, Workout } from '@/types';
import {
  getTemplates,
  deleteTemplate,
  updateTemplate,
  createTemplate,
  addEntriesToWorkout,
  getWorkoutByDate,
  createWorkout,
} from '@/lib/firestore';
import { SkeletonList } from '@/components/Skeleton';
import StaggeredList from '@/components/StaggeredList';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  Save,
} from 'lucide-react';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [loadedTemplate, setLoadedTemplate] = useState<string | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [t, w] = await Promise.all([
        getTemplates(user.uid),
        getWorkoutByDate(user.uid, getTodayDate()),
      ]);
      setTemplates(t);
      setTodayWorkout(w);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLoad = async (template: Template) => {
    if (!user) return;
    setLoadingTemplate(template.id!);
    try {
      const entries = template.entries.map((e) => ({
        ...e,
        id: generateId(),
        notes: '',
        createdAt: Date.now(),
      }));

      let workoutId = todayWorkout?.id;
      if (!workoutId) {
        workoutId = await createWorkout(user.uid, {
          date: getTodayDate(),
          entries: [],
          createdAt: Date.now(),
          completed: false,
        });
      }
      await addEntriesToWorkout(user.uid, workoutId, entries);
      setLoadedTemplate(template.id!);
      setTimeout(() => {
        setLoadedTemplate(null);
        router.push('/');
      }, 1200);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setTemplates(templates.filter((t) => t.id !== id));
    await deleteTemplate(user.uid, id);
  };

  const handleReorder = async (id: string, dir: 'up' | 'down') => {
    if (!user) return;
    const idx = templates.findIndex((t) => t.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= templates.length) return;
    const newTemplates = [...templates];
    [newTemplates[idx], newTemplates[swapIdx]] = [newTemplates[swapIdx], newTemplates[idx]];
    newTemplates.forEach((t, i) => (t.order = i));
    setTemplates(newTemplates);
    await Promise.all(
      newTemplates.map((t) => updateTemplate(user.uid, t.id!, { order: t.order }))
    );
  };

  const handleSaveCurrent = async () => {
    if (!user || !todayWorkout || todayWorkout.entries.length === 0) return;
    const entries = todayWorkout.entries.map((e) => ({
      movementName: e.movementName,
      reps: e.reps,
      weight: e.weight,
      unit: e.unit,
    }));
    await createTemplate(user.uid, {
      name: `Workout ${new Date().toLocaleDateString()}`,
      entries,
      createdAt: Date.now(),
      order: templates.length,
    });
    await loadData();
  };

  const canSaveCurrent = useMemo(
    () => todayWorkout && todayWorkout.entries.length > 0,
    [todayWorkout]
  );

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--text-primary)' }}>
          Templates
        </h1>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--text-primary)' }}>
        Templates
      </h1>

      {canSaveCurrent && (
        <button
          onClick={handleSaveCurrent}
          className="w-full mb-4 py-3 rounded-xl font-semibold border flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          style={{
            borderColor: 'var(--accent)',
            color: 'var(--accent)',
            backgroundColor: 'var(--accent-light)',
          }}
        >
          <Save size={18} />
          Save current workout as template
        </button>
      )}

      {templates.length === 0 ? (
        <p className="text-center mt-12" style={{ color: 'var(--text-tertiary)' }}>
          No templates yet. Load a workout template to get started.
        </p>
      ) : (
        <StaggeredList>
          {templates.map((t, idx) => (
            <div
              key={t.id}
              className="card-depth rounded-xl mb-3 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {t.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReorder(t.id!, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg transition-all active:scale-90 disabled:opacity-30"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => handleReorder(t.id!, 'down')}
                      disabled={idx === templates.length - 1}
                      className="p-1.5 rounded-lg transition-all active:scale-90 disabled:opacity-30"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id!)}
                      className="p-1.5 rounded-lg transition-all active:scale-90"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {t.entries.map((e) => e.movementName).join(', ')}
                </p>
                <button
                  onClick={() => handleLoad(t)}
                  disabled={loadingTemplate === t.id || loadedTemplate === t.id}
                  className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                  style={{
                    backgroundColor:
                      loadedTemplate === t.id ? 'var(--success)' : 'var(--accent)',
                    color: loadedTemplate === t.id ? '#fff' : 'var(--text-on-accent)',
                  }}
                >
                  {loadingTemplate === t.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : loadedTemplate === t.id ? (
                    <>
                      <Check size={18} />
                      Loaded!
                    </>
                  ) : (
                    'Load Template'
                  )}
                </button>
              </div>
            </div>
          ))}
        </StaggeredList>
      )}
    </div>
  );
}
