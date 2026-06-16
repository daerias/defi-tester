import { useState, useEffect, useRef, useCallback } from 'react';

export interface ParallaxOffset {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

interface UseParallaxOptions {
  /** Maximum rotation in degrees for the 3D tilt effect */
  maxTilt?: number;
  /** Whether to invert the tilt direction */
  invert?: boolean;
  /** Factor to multiply the parallax offset by */
  factor?: number;
}

/**
 * Hook that provides mouse/touch-based parallax offsets.
 * Falls back gracefully when no pointer is available.
 * Returns a ref to attach to the container and the current offset.
 */
export function useParallax(options: UseParallaxOptions = {}) {
  const { maxTilt = 8, invert = false, factor = 1 } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number>(0);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!ref.current) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = ((clientX - centerX) / (rect.width / 2)) * factor;
        const y = ((clientY - centerY) / (rect.height / 2)) * factor;

        setOffset({
          x: clamp(x, -1, 1),
          y: clamp(y, -1, 1),
        });
      });
    },
    [factor]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handleMove]
  );

  const handleEnter = useCallback(() => setIsHovering(true), []);
  const handleLeave = useCallback(() => {
    setIsHovering(false);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /** Calculate CSS transform for 3D tilt */
  const getTiltStyle = useCallback(
    (depth: number = 1): React.CSSProperties => {
      const factorSign = invert ? -1 : 1;
      const tiltX = offset.y * maxTilt * depth * factorSign;
      const tiltY = offset.x * maxTilt * depth * factorSign;

      return {
        transform: isHovering
          ? `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovering
          ? 'transform 0.1s ease-out'
          : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
      };
    },
    [offset, maxTilt, invert, isHovering]
  );

  /** Calculate CSS transform for a parallax layer at a given depth */
  const getLayerStyle = useCallback(
    (depth: number = 1): React.CSSProperties => {
      const factorSign = invert ? -1 : 1;
      const translateX = offset.x * 12 * depth * factorSign;
      const translateY = offset.y * 12 * depth * factorSign;

      return {
        transform: `translate3d(${translateX}px, ${translateY}px, ${depth * 20}px)`,
        transition: 'transform 0.2s ease-out',
      };
    },
    [offset, invert]
  );

  return {
    ref,
    offset,
    isHovering,
    handleMouseMove,
    handleTouchMove,
    handleEnter,
    handleLeave,
    getTiltStyle,
    getLayerStyle,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
