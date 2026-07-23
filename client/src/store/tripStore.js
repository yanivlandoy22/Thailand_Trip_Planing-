import { create } from 'zustand';
import { api } from '../api/client';

export const useTripStore = create((set, get) => ({
  bookings: [],
  checklist: [],
  participants: [],
  expenses: [],
  settings: {},
  loading: false,
  loaded: false,
  error: null,

  load: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true, error: null });
    try {
      const data = await api.getTrip();
      set({ ...data, loading: false, loaded: true });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  reload: () => get().load(true),

  // optimistic helpers for group tools
  setChecklist: (checklist) => set({ checklist }),
  setParticipants: (participants) => set({ participants }),
  setExpenses: (expenses) => set({ expenses }),
  setBookings: (bookings) => set({ bookings }),
  setSettings: (settings) => set({ settings }),
}));
