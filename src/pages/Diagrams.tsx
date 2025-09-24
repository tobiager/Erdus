import React, { useEffect, useRef, useState } from 'react';
import DiagramApp from '../diagram/index';

function useFitViewportHeight(ref: React.RefObject<HTMLElement>) {
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const footer = document.querySelector('footer');
        const footerHeight = footer?.offsetHeight || 0;
        const newHeight = window.innerHeight - rect.top - footerHeight;
        setHeight(Math.max(newHeight, 400)); // Minimum height
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [ref]);

  return height;
}

export default function Diagrams() {
  const containerRef = useRef<HTMLDivElement>(null);
  const height = useFitViewportHeight(containerRef);

  return (
    <div className="bg-neutral-950 text-neutral-100">
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: height > 0 ? `${height}px` : '100vh' }}
      >
        <DiagramApp />
      </div>
    </div>
  );
}