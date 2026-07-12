import { create } from 'zustand';

export const useModalStore = create((set) => ({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: null,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'danger', // 'info' | 'warning' | 'danger'
  
  openModal: ({ title, message, onConfirm, confirmText, cancelText, type }) => set({
    isOpen: true,
    title,
    message,
    onConfirm,
    confirmText: confirmText || 'Confirm',
    cancelText: cancelText || 'Cancel',
    type: type || 'danger'
  }),
  
  closeModal: () => set({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger'
  })
}));
