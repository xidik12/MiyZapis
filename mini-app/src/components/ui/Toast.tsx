import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { RootState } from '@/store';
import { removeToast } from '@/store/slices/uiSlice';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000 }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(id));
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, dispatch]);

  const handleClose = () => {
    dispatch(removeToast(id));
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-accent-green" />;
      case 'error':
        return <XCircle size={20} className="text-accent-red" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-accent-yellow" />;
      case 'info':
        return <Info size={20} className="text-accent-secondary" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-accent-green/10 border-accent-green/20 text-text-primary';
      case 'error':
        return 'bg-accent-red/10 border-accent-red/20 text-text-primary';
      case 'warning':
        return 'bg-accent-yellow/10 border-accent-yellow/20 text-text-primary';
      case 'info':
        return 'bg-accent-secondary/10 border-accent-secondary/20 text-text-primary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`relative w-full max-w-sm mx-auto p-4 rounded-2xl border shadow-card backdrop-blur-lg ${getColorClasses()}`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{title}</h4>
          {message && (
            <p className="text-sm text-text-secondary mt-1">{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={16} className="text-text-muted" />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useSelector((state: RootState) => state.ui.toasts);

  return (
    <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none">
      <div className="space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast
                id={toast.id}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                duration={toast.duration}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
