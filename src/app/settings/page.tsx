'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState, useCallback, useEffect } from 'react';
import { getWorkouts } from '@/lib/firestore';
import { Workout } from '@/types';
import { LogOut, Download, Sun, Moon, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const loadWorkouts = useCallback(async () => {
    if (!user) return;
    try {
      const w = await getWorkouts(user.uid);
      setWorkouts(w);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const exportCsv = () => {
    const header = 'Date,Movement,Weight,Unit,Reps,Notes';
    const rows = workouts.flatMap((w) =>
      w.entries.map((e) => {
        const notes = e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '';
        return `${w.date},${e.movementName},${e.weight},${e.unit},${e.reps},${notes}`;
      })
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const themeOptions = [
    { value: 'system' as const, label: 'System', icon: Monitor },
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
  ];

  const unitOptions = [
    { value: 'kg' as const, label: 'Kilograms (kg)' },
    { value: 'lbs' as const, label: 'Pounds (lbs)' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 mt-2" style={{ color: 'var(--text-primary)' }}>
        Settings
      </h1>

      {/* Profile */}
      <div
        className="card-depth rounded-xl p-4 mb-4"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Profile
        </h2>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          {user?.email}
        </p>
        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>

      {/* Appearance */}
      <div
        className="card-depth rounded-xl p-4 mb-4"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl font-medium text-sm active:scale-[0.97] transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-primary)',
                  color: isActive ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--btn-shadow)' : 'none',
                }}
              >
                <Icon size={20} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weight Unit */}
      <div
        className="card-depth rounded-xl p-4 mb-4"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Weight Unit
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {unitOptions.map((opt) => {
            const isActive = settings.unit === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => updateSettings({ unit: opt.value })}
                className="py-3 rounded-xl font-medium text-sm active:scale-[0.97] transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-primary)',
                  color: isActive ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--btn-shadow)' : 'none',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Export */}
      <div
        className="card-depth rounded-xl p-4 mb-4"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Data
        </h2>
        <button
          onClick={exportCsv}
          className="w-full py-2.5 rounded-xl font-semibold border flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <Download size={18} />
          Export All Data as CSV
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-xs mt-8 pb-4" style={{ color: 'var(--text-tertiary)' }}>
        Gym Logger • Built with Next.js & Firebase
      </p>
    </div>
  );
}
