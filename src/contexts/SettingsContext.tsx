'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '@/types';
import { getSettings, updateSettings as updateSettingsFirestore } from '@/lib/firestore';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (s: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!user) return;
    getSettings(user.uid).then(setSettings).catch(console.error);
  }, [user]);

  const updateSettings = async (s: Partial<UserSettings>) => {
    const next = { ...settings, ...s };
    setSettings(next);
    if (user) {
      await updateSettingsFirestore(user.uid, s);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
