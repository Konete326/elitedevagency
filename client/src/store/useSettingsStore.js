import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      selectedPrinter: null,
      setSelectedPrinter: (printer) => set({ selectedPrinter: printer }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
