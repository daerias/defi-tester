import { useMemo } from 'react';
import type { NormalizedOrientation } from '../hooks/useDeviceOrientation';

interface Props {
  orientation: NormalizedOrientation;
  /** Whether orientation sensor is active. Falls back to subtle animation if false. */
  isActive: boolean;
}

/**
 * Cinematic screen reflection overlay with multiple depth layers:
 * - Gyro-driven glass reflection (follows device tilt)
 * - Slow-moving ambient light rays
 * - Subtle scanline texture
 * - Top-down atmospheric light bar
 * - Deep corner vignette for cinematic focus
 * 
 * On devices with gyroscope, the primary reflection angle follows device tilt,
 * creating a realistic "glass screen" parallax effect.
 * Falls back to a slowly animated sheen on desktop.
 */
export const ReflectionOverlay: React.FC<Props> = ({ orientation, isActive }) => {
  const primaryReflection = useMemo(() => {
    if (isActive) {
      const angle = 130 + orientation.tiltX * 20 + orientation.tiltY * 20;
      const posX = 50 + orientation.tiltY * 35;
      const posY = 25 + orientation.tiltX * 25;
      const opacity = 0.03 + orientation.intensity * 0.05;

      return {
        background: `
          radial-gradient(
            ellipse at ${posX}% ${posY}%,
            rgba(255, 255, 255, ${opacity + 0.05}) 0%,
            rgba(255, 255, 255, ${opacity * 0.4}) 30%,
            transparent 55%
          ),
          linear-gradient(
            ${angle}deg,
            rgba(255, 255, 255, ${opacity * 0.9}) 0%,
            transparent 12%,
            transparent 88%,
            rgba(255, 255, 255, ${opacity * 0.2}) 100%
          )
        `,
        transition: 'none',
      };
    }

    // Desktop: slowly drifting glass sheen
    return {
      background: `
        radial-gradient(
          ellipse at 55% 15%,
          rgba(255, 255, 255, 0.03) 0%,
          transparent 45%
        ),
        linear-gradient(
          130deg,
          rgba(255, 255, 255, 0.025) 0%,
          transparent 15%,
          transparent 85%,
          rgba(255, 255, 255, 0.008) 100%
        )
      `,
      animation: 'reflectionSheenDrift 12s ease-in-out infinite',
    };
  }, [orientation, isActive]);

  return (
    <>
      <style>{`
        @keyframes reflectionSheenDrift {
          0%, 100% { 
            background-position: 0% 0%, 0% 0%;
          }
          25% { 
            background-position: 15% 5%, 5% 2%;
          }
          50% { 
            background-position: 30% -2%, 10% 5%;
          }
          75% { 
            background-position: 15% -8%, -5% 2%;
          }
        }
        
        @keyframes lightBarSweep {
          0% { transform: translateY(-120px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        @keyframes ambientRayDrift {
          0%, 100% { opacity: 0.015; transform: rotate(-3deg) scaleX(1); }
          25% { opacity: 0.035; transform: rotate(0deg) scaleX(1.2); }
          50% { opacity: 0.02; transform: rotate(3deg) scaleX(1); }
          75% { opacity: 0.04; transform: rotate(1deg) scaleX(1.1); }
        }

        @keyframes cornerVignetteBreathe {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.85; }
        }
      `}</style>

      {/* Primary reflection layer (glass sheen) — main cinematic effect */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9998,
          ...primaryReflection,
        }}
        aria-hidden="true"
      />

      {/* Scanline + vignette combined — 2nd layer, efficient blend */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9997,
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(0, 242, 255, 0.005) 3px,
              rgba(0, 242, 255, 0.005) 6px
            ),
            radial-gradient(
              ellipse at 50% 50%,
              transparent 50%,
              rgba(0, 0, 0, 0.03) 80%,
              rgba(0, 0, 0, 0.07) 100%
            )
          `,
          opacity: 0.5,
          animation: 'cornerVignetteBreathe 10s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
    </>
  );
};
