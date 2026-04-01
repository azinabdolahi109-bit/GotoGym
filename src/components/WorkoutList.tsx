'use client';

import { useState } from 'react';
import { WorkoutEntry } from '@/types';
import { Copy, Trash2, Pencil } from 'lucide-react';

interface WorkoutListProps {
  entries: WorkoutEntry[];
  onUpdateEntry: (id: string, updates: Partial<WorkoutEntry>) => void;
  onDeleteEntry: (id: string) => void;
  onDuplicateEntry: (entry: WorkoutEntry) => void;
  onDeleteMovement?: (movementName: string) => void;
  unit: 'kg' | 'lbs';
}

export default function WorkoutList({
  entries,
  onUpdateEntry,
  onDeleteEntry,
  onDuplicateEntry,
  onDeleteMovement,
  unit,
}: WorkoutListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<'reps' | 'weight' | null>(null);
  const [editValue, setEditValue] = useState('');

  // Group by movement name
  const grouped = entries.reduce<Record<string, WorkoutEntry[]>>((acc, e) => {
    if (!acc[e.movementName]) acc[e.movementName] = [];
    acc[e.movementName].push(e);
    return acc;
  }, {});

  const startEdit = (entry: WorkoutEntry, field: 'reps' | 'weight') => {
    setEditingId(entry.id);
    setEditField(field);
    setEditValue(String(field === 'reps' ? entry.reps : entry.weight));
  };

  const saveEdit = (id: string) => {
    if (editField && editValue) {
      onUpdateEntry(id, { [editField]: Number(editValue) });
    }
    setEditingId(null);
    setEditField(null);
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([movementName, sets]) => (
        <div
          key={movementName}
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Movement Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {movementName}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: 'var(--accent-light)',
                  color: 'var(--accent)',
                }}
              >
                {sets.length} {sets.length === 1 ? 'set' : 'sets'}
              </span>
            </div>
            {onDeleteMovement && (
              <button
                onClick={() => onDeleteMovement(movementName)}
                className="p-1.5 rounded-lg transition-all active:scale-90 hover:bg-[var(--bg-primary)]"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Sets */}
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {sets.map((entry, idx) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-4 py-2.5 group"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    {editingId === entry.id && editField === 'reps' ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(entry.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(entry.id)}
                        className="w-14 text-center py-0.5 rounded border text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                          color: 'var(--text-primary)',
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(entry, 'reps')}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {entry.reps}
                      </button>
                    )}
                    <span style={{ color: 'var(--text-tertiary)' }}>×</span>
                    {editingId === entry.id && editField === 'weight' ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(entry.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(entry.id)}
                        className="w-16 text-center py-0.5 rounded border text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--accent)',
                          color: 'var(--text-primary)',
                        }}
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(entry, 'weight')}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {entry.weight}
                      </button>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {unit}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(entry, 'reps')}
                    className="p-1.5 rounded-lg transition-all active:scale-90 hover:bg-[var(--bg-tertiary)]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDuplicateEntry(entry)}
                    className="p-1.5 rounded-lg transition-all active:scale-90 hover:bg-[var(--bg-tertiary)]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1.5 rounded-lg transition-all active:scale-90 hover:bg-[var(--bg-tertiary)]"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
