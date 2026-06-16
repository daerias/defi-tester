import { useState, useEffect, useMemo } from 'react';
import type { NormalizedOrientation } from '../hooks/useDeviceOrientation';
import { motion, AnimatePresence, easeOut } from 'motion/react';

interface Props {
  isPassed: boolean;
  hasInput: boolean;
  orientation?: NormalizedOrientation;
}

interface GlowParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export const ResultBubble: React.FC<Props> = ({ isPassed, hasInput, orientation }) => {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<GlowParticle[]>([]);

  useEffect(() => {
    if (hasInput) {
      setShow(true);
      if (isPassed) {
        const newParticles: GlowParticle[] = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          x: 20 + Math.random() * 60,
          y: 50 + Math.random() * 40,
          size: 2 + Math.random() * 5,
          delay: Math.random() * 0.5,
          duration: 1 + Math.random() * 1.5,
        }));
        setParticles(newParticles);
      } else {
        setParticles([]);
      }
    } else {
      setShow(false);
      setParticles([]);
    }
  }, [hasInput, isPassed]);

  const bubbleStyle = useMemo(() => {
    if (!orientation) return {};
    const tiltX = -orientation.tiltX * 5;
    const tiltY = orientation.tiltY * 5;
    return {
      transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      transition: 'transform 0.3s ease-out',
    };
  }, [orientation]);

  const particleContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };
  
  const particleItem = {
    hidden: { opacity: 0, scale: 0 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="mt-md text-center p-sm"
          style={{
            borderRadius: 'var(--border-radius-lg)',
            ...bubbleStyle,
          }}
        >
          <div
            className={`bubble ${isPassed ? 'bubble-pass' : 'bubble-fail'} scanlines`}
            style={{
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: isPassed
                ? 'linear-gradient(145deg, rgba(0,255,136,0.08) 0%, rgba(0,242,255,0.04) 50%, rgba(0,0,0,0) 100%)'
                : 'linear-gradient(145deg, rgba(255,64,96,0.08) 0%, rgba(255,0,0,0.02) 50%, rgba(0,0,0,0) 100%)',
            }}
          >
            {isPassed && particles.length > 0 && (
              <motion.div 
                className="glow-particles" 
                variants={particleContainer} 
                initial="hidden" 
                animate="show"
              >
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    className="glow-particle"
                    variants={particleItem}
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      animationDelay: `${p.delay}s`,
                      animationDuration: `${p.duration}s`,
                      background: Math.random() > 0.5 ? 'var(--success-color)' : 'var(--primary-color)',
                      position: 'absolute',
                      borderRadius: '50%'
                    }}
                  />
                ))}
              </motion.div>
            )}

            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                background: isPassed
                  ? 'rgba(0, 255, 136, 0.1)'
                  : 'rgba(255, 64, 96, 0.1)',
                border: `2px solid ${isPassed ? 'var(--success-color)' : 'var(--error-color)'}`,
                animation: isPassed
                  ? 'bubblePassIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards, pulsePass 2s ease-in-out infinite'
                  : 'bubbleFailShake 0.5s ease-out forwards, pulseFail 1.5s ease-in-out infinite',
              }}
            >
              {isPassed ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--error-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>

            <h2
              style={{
                fontSize: '2rem',
                margin: '4px 0',
                fontWeight: 900,
                color: isPassed ? 'var(--success-color)' : 'var(--error-color)',
                textShadow: isPassed
                  ? '0 0 20px var(--success-glow), 0 0 40px var(--success-glow)'
                  : '0 0 15px var(--error-glow), 0 0 30px var(--error-glow)',
                letterSpacing: '0.08rem',
              }}
            >
              {isPassed ? 'BESTANDEN' : 'NICHT BESTANDEN'}
            </h2>

            <p
              style={{
                marginTop: '6px',
                color: isPassed ? 'rgba(0,255,136,0.7)' : 'rgba(255,64,96,0.7)',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {isPassed
                ? 'Alle Werte innerhalb der Toleranz'
                : 'Messwerte außerhalb der Toleranz'}
            </p>

            <div
              style={{
                marginTop: '14px',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isPassed ? 'var(--success-color)' : 'var(--error-color)',
                background: isPassed
                  ? 'rgba(0, 255, 136, 0.06)'
                  : 'rgba(255, 64, 96, 0.06)',
                border: `1px solid ${isPassed ? 'rgba(0,255,136,0.15)' : 'rgba(255,64,96,0.15)'}`,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05rem',
              }}
            >
              {isPassed ? '✓ TOLERANZ EINGEHALTEN' : '✗ TOLERANZ ÜBERSCHRITTEN'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
