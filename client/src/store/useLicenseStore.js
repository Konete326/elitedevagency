import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLicenseStore = create(
  persist(
    (set) => ({
      isLocked: false,
      lockReason: '',
      setLocked: (locked, reason) => set({ isLocked: locked, lockReason: reason || '' })
    }),
    {
      name: 'license-storage'
    }
  )
);
