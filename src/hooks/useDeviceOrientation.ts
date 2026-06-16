import { useState, useEffect, useCallback, useRef } from 'react';

export interface OrientationData {
  beta: number;
  gamma: number;
  alpha: number;
  supported: boolean;
  active: boolean;
}

export interface NormalizedOrientation {
  tiltX: number;
  tiltY: number;
  intensity: number;
}

const MAX_BETA = 45;
const MAX_GAMMA = 30;
const SMOOTHING = 0.12;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * useDeviceOrientation — performance-optimized.
 * 
 * CRITICAL FIX: Previously updated React state 60x/second via rAF, forcing
 * the entire App to re-render every frame. Now stores smoothed values in refs
 * and updates React state throttled to ~15fps (every 4th frame).
 * Orientation data is applied to CSS custom properties on documentElement
 * for zero-cost GPU composited tilt effects, bypassing React entirely.
 */
export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<OrientationData>({
    beta: 0, gamma: 0, alpha: 0,
    supported: false, active: false,
  });

  // Smoothed values stored in refs — no React re-renders on every frame
  const smoothedRef = useRef({ beta: 0, gamma: 0, alpha: 0 });
  const frameCountRef = useRef(0);

  const requestPermission = useCallback(async () => {
    try {
      const orient = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof orient.requestPermission === 'function') {
        const permission = await orient.requestPermission();
        if (permission !== 'granted') {
          setOrientation(prev => ({ ...prev, supported: false }));
          return false;
        }
      }
      return true;
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    const hasOrientation = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    if (!hasOrientation) {
      setOrientation(prev => ({ ...prev, supported: false }));
      return;
    }

    let animationFrame: number;
    let target = { beta: 0, gamma: 0, alpha: 0 };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      target = {
        beta: event.beta ?? 0,
        gamma: event.gamma ?? 0,
        alpha: event.alpha ?? 0,
      };
    };

    const THROTTLE_FRAMES = 4; // Update React state every 4th frame (~15fps)

    const animate = () => {
      // Smooth values in ref
      const s = smoothedRef.current;
      s.beta = s.beta + (target.beta - s.beta) * SMOOTHING;
      s.gamma = s.gamma + (target.gamma - s.gamma) * SMOOTHING;
      s.alpha = s.alpha + (target.alpha - s.alpha) * SMOOTHING;

      // Write CSS custom properties directly to DOM — zero React cost
      const nx = clamp(s.beta / MAX_BETA, -1, 1);
      const ny = clamp(s.gamma / MAX_GAMMA, -1, 1);
      document.documentElement.style.setProperty('--orient-tilt-x', String(nx));
      document.documentElement.style.setProperty('--orient-tilt-y', String(ny));
      document.documentElement.style.setProperty('--orient-intensity', String(
        Math.min(Math.sqrt(nx * nx + ny * ny), 1)
      ));

      frameCountRef.current++;
      // Throttle React state to ~15fps
      if (frameCountRef.current % THROTTLE_FRAMES === 0) {
        setOrientation(prev => ({
          ...prev,
          beta: s.beta,
          gamma: s.gamma,
          alpha: s.alpha,
        }));
      }

      animationFrame = requestAnimationFrame(animate);
    };

    const needsPermission = typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => {} }).requestPermission === 'function';

    if (needsPermission) {
      setOrientation(prev => ({ ...prev, supported: false }));
      (window as unknown as { _orientationPermissionResolver?: () => void })._orientationPermissionResolver = () => {
        requestPermission().then(granted => {
          if (granted) {
            setOrientation(prev => ({ ...prev, supported: true }));
            window.addEventListener('deviceorientation', handleOrientation);
            animationFrame = requestAnimationFrame(animate);
            setTimeout(() => setOrientation(prev => ({ ...prev, active: true })), 500);
          }
        });
      };
    } else {
      requestPermission().then((granted: boolean) => {
        if (!granted) return;
        setOrientation(prev => ({ ...prev, supported: true }));
        window.addEventListener('deviceorientation', handleOrientation);
        animationFrame = requestAnimationFrame(animate);
        setTimeout(() => setOrientation(prev => ({ ...prev, active: true })), 500);
      });
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      cancelAnimationFrame(animationFrame);
    };
  }, [requestPermission]);

  const normalized: NormalizedOrientation = {
    tiltX: clamp(orientation.beta / MAX_BETA, -1, 1),
    tiltY: clamp(orientation.gamma / MAX_GAMMA, -1, 1),
    intensity: Math.min(
      Math.sqrt(
        (orientation.beta / MAX_BETA) ** 2 + (orientation.gamma / MAX_GAMMA) ** 2
      ),
      1
    ),
  };

  return { orientation, normalized };
}
