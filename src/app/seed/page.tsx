'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { seedMovements, seedTemplates } from '@/lib/firestore';

export default function SeedPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('');

  const handleSeedMovements = async () => {
    if (!user) return;
    setStatus('Seeding movements...');
    try {
      await seedMovements(user.uid);
      setStatus('Movements seeded successfully.');
    } catch (e: unknown) {
      setStatus(`Error seeding movements: ${(e as Error).message}`);
    }
  };

  const handleSeedTemplates = async () => {
    if (!user) return;
    setStatus('Seeding templates...');
    try {
      await seedTemplates(user.uid);
      setStatus('Templates seeded successfully.');
    } catch (e: unknown) {
      setStatus(`Error seeding templates: ${(e as Error).message}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Database Seed Utility</h1>
      <div className="space-y-4">
        <button
          onClick={handleSeedMovements}
          className="bg-accent text-white px-4 py-2 rounded font-semibold"
        >
          Seed Default Movements
        </button>
        <button
          onClick={handleSeedTemplates}
          className="bg-accent text-white px-4 py-2 rounded font-semibold block"
        >
          Seed Initial Templates
        </button>
      </div>
      {status && <p className="mt-4 text-sm text-text-secondary">{status}</p>}
    </div>
  );
}
