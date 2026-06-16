import { useCallback, useRef } from 'react';

type HapticPattern = 'tap' | 'success' | 'error' | 'heavy' | 'light' | 'selection';

/**
 * Wraps navigator.vibrate() for tactile feedback on mobile devices.
 * Patterns follow Material Design haptic guidelines:
 * 
 * - tap: 10ms (standard button press)
 * - success: [20, 50, 30] (two quick pulses, positive)
 * - error: [60, 40, 100] (longer pulses, alert)
 * - heavy: [15, 10, 15, 10, 15] (staccato, attention)
 * - light: 5ms (barely perceptible)
 * - selection: 8ms (list/item selection)
 */
// Constant — never changes during component lifecycle
const hasVibrationAPI = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export function useHaptics() {
  const enabledRef = useRef<boolean>(true);

  const vibrate = useCallback((pattern: HapticPattern) => {
    if (!enabledRef.current || !hasVibrationAPI) return;

    const patterns: Record<HapticPattern, number | number[]> = {
      tap: 10,
      success: [20, 50, 30],
      error: [60, 40, 100],
      heavy: [15, 10, 15, 10, 15],
      light: 5,
      selection: 8,
    };

    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // Silently fail — vibration is optional
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { vibrate, setEnabled, isSupported: hasVibrationAPI };
}
