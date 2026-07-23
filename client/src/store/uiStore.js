import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set, get) => ({
  toasts: [],
  toast: (message, type = 'success') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },

  // Custom confirm modal (window.confirm is forbidden)
  confirmState: null,
  confirm: (title, message) =>
    new Promise((resolve) => {
      set({ confirmState: { title, message, resolve } });
    }),
  resolveConfirm: (answer) => {
    const state = get().confirmState;
    if (state) state.resolve(answer);
    set({ confirmState: null });
  },
}));
