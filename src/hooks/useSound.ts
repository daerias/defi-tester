import { useRef, useCallback, useEffect } from 'react';

type SoundType = 'click' | 'success' | 'error' | 'open' | 'close' | 'select';

interface SoundEngine {
  ctx: AudioContext;
  masterGain: GainNode;
  ambientOsc: OscillatorNode | null;
  ambientGain: GainNode | null;
  ambientPlaying: boolean;
}

/**
 * Procedural sound synthesis using Web Audio API.
 * No external audio files needed — all sounds generated in real-time.
 * 
 * - click: soft low-passed pop (0.04s)
 * - success: ascending two-tone chime (0.35s)
 * - error: dissonant noise burst (0.2s)
 * - open: subtle upward sweep (0.15s)
 * - close: subtle downward sweep (0.12s)
 * - select: quick confirmation ping (0.08s)
 * - ambient: very quiet sub-bass drone (optional, toggleable)
 */
export function useSound() {
  const engineRef = useRef<SoundEngine | null>(null);
  const enabledRef = useRef<boolean>(true);
  const ambientEnabledRef = useRef<boolean>(true);

  const getEngine = useCallback((): SoundEngine | null => {
    if (!enabledRef.current) return null;
    
    // Check if existing context is still alive; recreate if closed
    if (engineRef.current) {
      if (engineRef.current.ctx.state === 'closed') {
        engineRef.current = null;
      } else {
        return engineRef.current;
      }
    }

    try {
      const AudioContextClass = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.18; // overall volume
      masterGain.connect(ctx.destination);

      engineRef.current = {
        ctx,
        masterGain,
        ambientOsc: null,
        ambientGain: null,
        ambientPlaying: false,
      };
      return engineRef.current;
    } catch {
      return null;
    }
  }, []);

  const resume = useCallback(() => {
    const eng = engineRef.current;
    if (eng && eng.ctx.state === 'suspended') {
      eng.ctx.resume();
    }
  }, []);

  const play = useCallback((type: SoundType) => {
    const eng = getEngine();
    if (!eng) return;
    resume();

    const { ctx, masterGain } = eng;
    const now = ctx.currentTime;

    switch (type) {
      case 'click': {
        // Soft, low-passed pop — like a physical button press
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.04);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'success': {
        // Ascending two-tone chime — celebratory but subtle
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        // First tone: C5 → E5
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523, now);
        osc1.frequency.linearRampToValueAtTime(659, now + 0.12);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.15, now + 0.04);
        gain1.gain.setValueAtTime(0.15, now + 0.12);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        // Second tone: G5 (harmony) — starts slightly delayed
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(784, now + 0.12);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0, now + 0.12);
        gain2.gain.linearRampToValueAtTime(0.12, now + 0.16);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
        break;
      }

      case 'error': {
        // Dissonant noise burst — like a system alert
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.15);
        osc.frequency.linearRampToValueAtTime(60, now + 0.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'open': {
        // Upward sweep — like a drawer opening
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 0.12);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }

      case 'close': {
        // Downward sweep — subtle
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.1);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.13);
        break;
      }

      case 'select': {
        // Quick confirmation ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.04);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
    }
  }, [getEngine, resume]);

  // Ambient sub-bass drone — very quiet, adds presence
  const startAmbient = useCallback(() => {
    const eng = getEngine();
    if (!eng || eng.ambientPlaying) return;
    resume();

    const { ctx, masterGain } = eng;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 55; // Low A — sub-bass, felt more than heard

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 1.5); // fade in slowly
    gain.gain.linearRampToValueAtTime(0.022, now + 4);
    gain.gain.linearRampToValueAtTime(0.028, now + 7);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);

    eng.ambientOsc = osc;
    eng.ambientGain = gain;
    eng.ambientPlaying = true;
  }, [getEngine, resume]);

  const stopAmbient = useCallback(() => {
    const eng = engineRef.current;
    if (!eng || !eng.ambientPlaying) return;

    const { ctx, ambientOsc, ambientGain } = eng;
    const now = ctx.currentTime;

    if (ambientGain) {
      ambientGain.gain.linearRampToValueAtTime(0.001, now + 0.8);
    }
    if (ambientOsc) {
      ambientOsc.stop(now + 0.9);
    }

    eng.ambientOsc = null;
    eng.ambientGain = null;
    eng.ambientPlaying = false;
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (!enabled) stopAmbient();
  }, [stopAmbient]);

  const setAmbientEnabled = useCallback((enabled: boolean) => {
    ambientEnabledRef.current = enabled;
    if (enabled) {
      startAmbient();
    } else {
      stopAmbient();
    }
  }, [startAmbient, stopAmbient]);

  // Auto-start ambient on first user interaction
  useEffect(() => {
    const handle = () => {
      if (ambientEnabledRef.current) {
        startAmbient();
      }
    };
    window.addEventListener('click', handle, { once: true });
    window.addEventListener('keydown', handle, { once: true });
    return () => {
      window.removeEventListener('click', handle);
      window.removeEventListener('keydown', handle);
    };
  }, [startAmbient]);

  // Cleanup
  useEffect(() => {
    return () => {
      const eng = engineRef.current;
      if (eng) {
        eng.ambientPlaying = false;
        try { eng.ambientOsc?.stop(); } catch { /* cleanup — ignore errors */ }
        try { eng.ctx.close(); } catch { /* cleanup — ignore errors */ }
        engineRef.current = null;
      }
    };
  }, []);

  return { play, startAmbient, stopAmbient, setEnabled, setAmbientEnabled };
}
