'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Movement, MovementCategory, MOVEMENT_CATEGORIES } from '@/types';
import {
  getMovements,
  addMovement,
  updateMovement,
  deleteMovement,
} from '@/lib/firestore';
import { SkeletonList } from '@/components/Skeleton';
import { Trash2, Pencil, Plus, Search, Check, X } from 'lucide-react';

export default function MovementsPage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'All' | MovementCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<MovementCategory>('Other');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<MovementCategory>('Other');

  const loadMovements = useCallback(async () => {
    if (!user) return;
    try {
      const m = await getMovements(user.uid);
      setMovements(m.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const filtered = useMemo(() => {
    let result = movements;
    if (activeCategory !== 'All') {
      result = result.filter((m) => m.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    return result;
  }, [movements, activeCategory, searchQuery]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Movement[]>>((acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    }, {});
  }, [filtered]);

  const handleAdd = async () => {
    if (!user || !newName.trim()) return;
    const id = await addMovement(user.uid, {
      name: newName.trim(),
      category: newCategory,
      isCustom: true,
    });
    setMovements([...movements, { id, name: newName.trim(), category: newCategory, isCustom: true }]);
    setNewName('');
  };

  const startEdit = (m: Movement) => {
    setEditingId(m.id!);
    setEditName(m.name);
    setEditCategory(m.category);
  };

  const saveEdit = async () => {
    if (!user || !editingId || !editName.trim()) return;
    await updateMovement(user.uid, editingId, { name: editName.trim(), category: editCategory });
    setMovements(
      movements.map((m) =>
        m.id === editingId ? { ...m, name: editName.trim(), category: editCategory } : m
      )
    );
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setMovements(movements.filter((m) => m.id !== id));
    await deleteMovement(user.uid, id);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--text-primary)' }}>
          Movements
        </h1>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-4 mt-2" style={{ color: 'var(--text-primary)' }}>
        Movements
      </h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          placeholder="Search movements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-3 pl-10 pr-4 rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 no-scrollbar">
        {['All', ...MOVEMENT_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as 'All' | MovementCategory)}
            className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 active:scale-95 transition-all"
            style={{
              backgroundColor: activeCategory === cat ? 'var(--accent)' : 'var(--bg-secondary)',
              color: activeCategory === cat ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              border: `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border-color)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Movement */}
      <div
        className="card-depth rounded-xl p-4 mb-6"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Add Custom Movement
        </h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Movement name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 py-2.5 px-3 rounded-xl border text-sm"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as MovementCategory)}
            className="py-2.5 px-3 rounded-xl border text-sm"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {MOVEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--text-on-accent)',
          }}
        >
          <Plus size={18} />
          Add Movement
        </button>
      </div>

      {/* Movement List */}
      {Object.entries(grouped).map(([category, movs]) => (
        <div key={category} className="mb-6">
          <h3
            className="text-sm font-bold uppercase tracking-wider mb-2"
            style={{ color: 'var(--accent)' }}
          >
            {category}
          </h3>
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            {movs.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {editingId === m.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 py-1 px-2 rounded border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--accent)',
                        color: 'var(--text-primary)',
                      }}
                      autoFocus
                    />
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as MovementCategory)}
                      className="py-1 px-2 rounded border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--accent)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {MOVEMENT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button onClick={saveEdit} className="p-1 active:scale-90" style={{ color: 'var(--success)' }}>
                      <Check size={18} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 active:scale-90" style={{ color: 'var(--text-tertiary)' }}>
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(m)}
                        className="p-1.5 rounded-lg transition-all active:scale-90"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id!)}
                        className="p-1.5 rounded-lg transition-all active:scale-90"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
