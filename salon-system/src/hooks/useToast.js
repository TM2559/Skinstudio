import { useState, useCallback, useRef } from 'react';

let toastId = 0;

export default function useToast(autoDismissMs = 4000) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'info') => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (autoDismissMs > 0) {
        timersRef.current[id] = setTimeout(() => dismiss(id), autoDismissMs);
      }
      return id;
    },
    [autoDismissMs, dismiss]
  );

  const success = useCallback((msg) => show(msg, 'success'), [show]);
  const error = useCallback((msg) => show(msg, 'error'), [show]);
  const info = useCallback((msg) => show(msg, 'info'), [show]);

  return { toasts, show, success, error, info, dismiss };
}
