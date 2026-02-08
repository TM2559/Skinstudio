import React, { useState, useEffect, useRef } from 'react';

/**
 * Renders children only when the wrapper is in (or near) the viewport.
 * Use for heavy content (e.g. images, sliders) below the fold to speed up initial load.
 */
export default function LazySection({ children, rootMargin = '200px', className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin, threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : <div className="min-h-[280px] md:min-h-[400px] animate-pulse bg-stone-100 rounded-xl" aria-hidden />}
    </div>
  );
}
