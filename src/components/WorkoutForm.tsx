'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { WorkoutEntry, Movement } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { Repeat, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkoutFormProps {
  movements: Movement[];
  entries: WorkoutEntry[];
  onLog: (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>) => void;
}

export default function WorkoutForm({ movements, entries, onLog }: WorkoutFormProps) {
  const { settings } = useSettings();
  const [movementName, setMovementName] = useState('');
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredMovements = useMemo(() => {
    if (!movementName.trim()) return [];
    const lower = movementName.toLowerCase();
    return movements
      .filter((m) => m.name.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [movementName, movements]);

  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  // Smart defaults: prefill from last set of same movement
  useEffect(() => {
    if (!movementName.trim()) return;
    const lastOfSame = [...entries]
      .reverse()
      .find((e) => e.movementName.toLowerCase() === movementName.toLowerCase());
    if (lastOfSame) {
      if (!reps) setReps(String(lastOfSame.reps));
      if (!weight) setWeight(String(lastOfSame.weight));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movementName]);

  const handleSubmit = () => {
    if (!movementName.trim() || !reps || !weight) return;
    onLog({
      movementName: movementName.trim(),
      reps: Number(reps),
      weight: Number(weight),
      unit: settings.unit,
      notes: notes.trim(),
    });
    setMovementName('');
    setReps('');
    setWeight('');
    setNotes('');
    setShowNotes(false);
    inputRef.current?.focus();
  };

  const handleRepeatLast = () => {
    if (!lastEntry) return;
    onLog({
      movementName: lastEntry.movementName,
      reps: lastEntry.reps,
      weight: lastEntry.weight,
      unit: lastEntry.unit,
      notes: '',
    });
  };

  const selectMovement = (name: string) => {
    setMovementName(name);
    setShowSuggestions(false);
  };

  return (
    <div className="card-depth rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Movement Input */}
      <div className="relative mb-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="Movement name"
          value={movementName}
          onChange={(e) => {
            setMovementName(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="w-full text-lg py-3.5 px-4 rounded-xl border transition-all"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
        {showSuggestions && filteredMovements.length > 0 && (
          <div
            className="absolute z-20 w-full mt-1 rounded-xl shadow-lg border overflow-hidden max-h-64 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
            }}
          >
            {filteredMovements.map((m) => (
              <button
                key={m.id}
                onClick={() => selectMovement(m.name)}
                className="w-full text-left px-4 py-3 transition-colors hover:bg-[var(--bg-tertiary)] active:scale-[0.98]"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="font-medium">{m.name}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>
                  {m.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reps & Weight */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="text-lg py-3.5 px-4 rounded-xl border transition-all"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
        <div className="relative">
          <input
            type="number"
            placeholder={`Weight (${settings.unit})`}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full text-lg py-3.5 px-4 rounded-xl border transition-all"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {settings.unit}
          </span>
        </div>
      </div>

      {/* Notes Toggle */}
      <button
        onClick={() => setShowNotes(!showNotes)}
        className="flex items-center gap-1.5 text-sm mb-3 active:scale-95 transition-all"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <StickyNote size={14} />
        Notes
        {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showNotes && (
        <textarea
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full mb-3 py-2.5 px-4 rounded-xl border text-sm transition-all resize-none"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      )}

      {/* Log Set Button */}
      <button
        onClick={handleSubmit}
        className="w-full py-3.5 rounded-xl font-bold text-lg bg-accent active:scale-[0.97] transition-all"
        style={{
          color: 'var(--text-on-accent)',
          boxShadow: 'var(--btn-shadow)',
        }}
      >
        Log Set
      </button>

      {/* Repeat Last */}
      {lastEntry && (
        <button
          onClick={handleRepeatLast}
          className="w-full mt-2 py-3 rounded-xl font-medium text-sm border flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <Repeat size={16} />
          Repeat {lastEntry.movementName} ({lastEntry.reps}×{lastEntry.weight}{lastEntry.unit})
        </button>
      )}
    </div>
  );
}
