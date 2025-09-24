import React, { useRef } from 'react';
import DiagramApp from '../diagram/index';
import { useFitViewportHeight } from '../diagram/hooks/useFitViewportHeight';

export default function Diagrams() {
  const containerRef = useRef<HTMLDivElement>(null);
  const height = useFitViewportHeight(containerRef);

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
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