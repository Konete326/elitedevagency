import { useModalStore } from '../../store/useModalStore';
import { AlertCircle, ShieldAlert, Info } from 'lucide-react';

export const ModalManager = () => {
  const { isOpen, title, message, onConfirm, confirmText, cancelText, type, closeModal } = useModalStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-605 dark:text-amber-500" />;
      case 'danger':
        return <ShieldAlert className="h-5 w-5 text-red-655 dark:text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-650 dark:text-blue-400" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-950/30';
      case 'danger':
        return 'bg-red-100 dark:bg-red-950/30';
      default:
        return 'bg-blue-100 dark:bg-blue-950/30';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in font-semibold">
      <div className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-xl p-5 shadow-xl max-w-sm w-full space-y-4 animate-scale-in text-slate-800 dark:text-slate-100">
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-foreground dark:text-white">
              {title}
            </h3>
            <p className="text-[11px] text-muted-foreground font-semibold">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-zinc-700">
          <button
            onClick={closeModal}
            className="px-3 py-1.5 text-[10px] font-bold border border-border dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-zinc-250 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-3 py-1.5 text-white font-bold text-[10px] rounded-lg transition-colors shadow-sm cursor-pointer ${
              type === 'danger'
                ? 'bg-red-600 hover:bg-red-750'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalManager;
