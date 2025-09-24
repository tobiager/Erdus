import { useEffect, useState } from 'react';

export function useFitViewportHeight(ref: React.RefObject<HTMLElement>) {
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const footer = document.querySelector('footer');
        const footerHeight = footer?.offsetHeight || 0;
        const newHeight = window.innerHeight - rect.top - footerHeight;
        setHeight(Math.max(newHeight, 400)); // Minimum height for usability
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [ref]);

  return height;
}