import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { evaluateTolerance } from '../data/devices';
import type { Defibrillator } from '../data/devices';
import { RotateCcw, ExternalLink, Zap, Target, Activity, Factory } from 'lucide-react';
import { useParallax } from '../hooks/useParallax';
import type { NormalizedOrientation } from '../hooks/useDeviceOrientation';

interface Props {
  device: Defibrillator;
  onResultChange: (result: boolean | null) => void;
  onSaveTest?: (device: Defibrillator, measuredValues: number[], passed: boolean) => void;
  orientation?: NormalizedOrientation;
}

export const TestInputs: React.FC<Props> = ({ device, onResultChange, onSaveTest, orientation }) => {
  const [values, setValues] = useState<string[]>(() => device.standardShocks.map(() => ''));
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const hasSavedRef = useRef(false);

  // Pinch-to-zoom state (refs to avoid re-renders during gestures)
  const zoomImgRef = useRef<HTMLDivElement>(null);
  const zoomLevelRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef<{ dist: number; zoom: number; panX: number; panY: number; cx: number; cy: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const didDragRef = useRef(false);
  const lastTapRef = useRef(0);

  const getPinchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const applyZoomTransform = () => {
    if (!zoomImgRef.current) return;
    const img = zoomImgRef.current.querySelector('img');
    if (!img) return;
    img.style.transition = 'none';
    img.style.transform = `scale(${zoomLevelRef.current}) translate(${panRef.current.x}px, ${panRef.current.y}px)`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchStartRef.current = {
        dist: getPinchDist(e.touches),
        zoom: zoomLevelRef.current,
        panX: panRef.current.x,
        panY: panRef.current.y,
        cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        cy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current) {
      e.preventDefault();
      const ps = pinchStartRef.current;
      const newDist = getPinchDist(e.touches);
      const scale = newDist / ps.dist;
      zoomLevelRef.current = Math.min(5, Math.max(0.5, ps.zoom * scale));

      // Pan with two-finger centroid movement
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      panRef.current = {
        x: ps.panX + (cx - ps.cx),
        y: ps.panY + (cy - ps.cy),
      };

      applyZoomTransform();
    } else if (e.touches.length === 1 && zoomLevelRef.current > 1.05) {
      // Single-finger pan when zoomed in
      if (dragStartRef.current) {
        const dx = e.touches[0].clientX - dragStartRef.current.x;
        const dy = e.touches[0].clientY - dragStartRef.current.y;
        // Only mark as drag if moved more than 5px (ignore micro-movements)
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          didDragRef.current = true;
        }
        panRef.current = {
          x: dragStartRef.current.panX + dx,
          y: dragStartRef.current.panY + dy,
        };
        applyZoomTransform();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartRef.current = null;
      // Seamless pinch→pan transition: capture remaining finger as drag start
      if (e.touches.length === 1 && zoomLevelRef.current > 1.05) {
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        };
      } else {
        dragStartRef.current = null;
      }
    }
    if (e.touches.length === 0) {
      dragStartRef.current = null;
    }
  };

  const handleTouchStartSingle = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevelRef.current > 1.05) {
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    // Suppress close if user just did a drag-to-pan gesture
    if (didDragRef.current) {
      didDragRef.current = false;
      lastTapRef.current = now;
      return;
    }
    if (now - lastTapRef.current < 300) {
      // Double tap: toggle between 1x and 2.5x zoom
      if (zoomLevelRef.current > 1.1) {
        zoomLevelRef.current = 1;
        panRef.current = { x: 0, y: 0 };
      } else {
        zoomLevelRef.current = 2.5;
      }
      applyZoomTransform();
    } else {
      // Single tap: close modal
      setZoomedImage(null);
    }
    lastTapRef.current = now;
  };

  // Reset zoom when modal closes
  const closeZoom = () => {
    zoomLevelRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    didDragRef.current = false;
    setZoomedImage(null);
  };

  // Derive results directly in render — no extra render cycle needed
  const results: (boolean | null)[] = values.map((valStr, i) => {
    if (valStr.trim() === '') return null;
    const num = parseFloat(valStr.replace(',', '.'));
    if (isNaN(num)) return false;
    return evaluateTolerance(num, device.standardShocks[i].targetEnergy, device.tolerance);
  });

  const allPassed = results.every(r => r === true);
  const allFilled = values.every(v => v.trim() !== '');
  
  // Notify parent immediately on result change
  useEffect(() => {
    const result = allFilled ? allPassed : null;
    onResultChange(result);
  }, [allFilled, allPassed, onResultChange]);

  // Pending save ref — flushed on unmount to prevent data loss
  const pendingSaveRef = useRef<(() => void) | null>(null);

  // Flush pending save on unmount (prevents data loss when navigating away)
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        pendingSaveRef.current();
        pendingSaveRef.current = null;
      }
    };
  }, []);

  // Auto-save with debounce: wait 800ms after last keystroke before saving
  // This prevents saving partial values while the user is still typing
  useEffect(() => {
    if (!allFilled || !onSaveTest || hasSavedRef.current) return;

    const timer = setTimeout(() => {
      // Re-check hasSavedRef in case another effect already saved
      if (hasSavedRef.current) return;
      const measured = values.map(v => parseFloat(v.replace(',', '.'))).filter(v => !isNaN(v));
      if (measured.length === values.length) {
        hasSavedRef.current = true;
        onSaveTest(device, measured, allPassed);
        pendingSaveRef.current = null;
      }
    }, 800);

    // Keep the save callback alive for unmount flush
    pendingSaveRef.current = () => {
      if (hasSavedRef.current) return;
      const measured = values.map(v => parseFloat(v.replace(',', '.'))).filter(v => !isNaN(v));
      if (measured.length === values.length) {
        hasSavedRef.current = true;
        onSaveTest(device, measured, allPassed);
      }
    };

    return () => {
      clearTimeout(timer);
      // DON'T clear pendingSaveRef — we want it available for unmount cleanup
    };
  }, [allFilled, values, device, onSaveTest, allPassed]);

  const {
    ref: cardRef,
    getTiltStyle,
    handleMouseMove,
    handleEnter,
    handleLeave,
  } = useParallax({ maxTilt: 5 });

  const resetValues = useCallback(() => {
    const count = device.standardShocks.length;
    setValues(Array(count).fill(''));
    hasSavedRef.current = false;
    onResultChange(null);
  }, [device.standardShocks.length, onResultChange]);

  useEffect(() => {
    hasSavedRef.current = false;
    resetValues();
  }, [device.id, resetValues]);

  const handleChange = (index: number, val: string) => {
    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);
  };

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedText(null), 1500);
  };

  const getToleranceText = () => {
    const t = device.tolerance;
    let text = `± ${t.type === 'percentage' ? `${t.value}%` : `${t.value}J`}`;
    if (t.greater_of) {
      text += ` (min. ± ${t.greater_of.value}J)`;
    }
    return text;
  };

  const deviceLabel = device.model.toLowerCase().startsWith(device.manufacturer.toLowerCase()) 
    ? device.model 
    : `${device.manufacturer} ${device.model}`;

  // Combine mouse-based tilt with gyro-based tilt
  const headerStyle = useMemo(() => {
    const mouseTilt = getTiltStyle(1);
    if (orientation) {
      const gyroTransform = `perspective(800px) rotateX(${-orientation.tiltX * 4}deg) rotateY(${orientation.tiltY * 4}deg)`;
      return {
        ...mouseTilt,
        transform: mouseTilt.transform ? `${mouseTilt.transform} ${gyroTransform}` : gyroTransform,
      };
    }
    return mouseTilt;
  }, [getTiltStyle, orientation]);

  return (
    <div className="flex-col gap-sm mt-sm w-full relative">
      
      {/* Copy Toast — rendered via portal to avoid containment issues */}
      {copiedText && createPortal(
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 24px',
          borderRadius: '24px',
          background: 'var(--primary-color)',
          color: '#0d1117',
          fontSize: '0.8rem',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          zIndex: 99999,
          boxShadow: '0 8px 32px var(--primary-glow)',
          animation: 'toastPop 0.3s ease-out',
        }}>
          ✓ Kopiert: {copiedText}
        </div>,
        document.body
      )}
      
      {/* Zoom Modal — pinch-to-zoom on mobile, tap image to close, double-tap to zoom */}
      {zoomedImage && createPortal(
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 99999, 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            touchAction: 'none',
          }}
          onClick={closeZoom}
        >
          {/* Pinch-zoom container — touch events handled here */}
          <div
            ref={zoomImgRef}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              touchAction: 'none',
            }}
            onTouchStart={(e) => { handleTouchStart(e); handleTouchStartSingle(e); }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={zoomedImage} 
              alt="Zoomed" 
              onClick={handleImageClick}
              draggable={false}
              style={{ 
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                transformOrigin: 'center center',
                willChange: 'transform',
                userSelect: 'none' as const,
                WebkitTouchCallout: 'none' as const,
              }}
            />
          </div>
          <div 
            onClick={closeZoom}
            style={{ position: 'absolute', top: '20px', right: '30px', color: 'white', fontSize: '2.5rem', fontWeight: '300', cursor: 'pointer', lineHeight: 1, zIndex: 1 }}
          >×</div>
          {/* Hint for mobile users */}
          <div style={{
            position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 500,
            pointerEvents: 'none', transition: 'opacity 0.5s',
          }}>
            Doppeltippen zum Zoomen · Zwei Finger zum Zoomen
          </div>
        </div>,
        document.body
      )}

      {/* Header Card with tilt effect */}
      <div 
        ref={cardRef}
        className="bump p-md flex-col align-center scanlines"
        style={{ 
          marginBottom: '10px', 
          cursor: 'default',
          ...headerStyle,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div className="flex-row justify-between w-full align-center mb-sm">
          <div style={{ width: '32px' }}></div>
          <h2 className="shimmer-text" style={{ 
            margin: 0, 
            fontSize: '1.4rem', 
            textAlign: 'center',
            flex: 1,
            fontWeight: 900,
          }}>
            {deviceLabel}
          </h2>
          <button 
            className="extruded" 
            onClick={resetValues}
            title="Werte zurücksetzen"
            style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px' }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Meta-Pill-Row: Hersteller | Toleranz | IEC */}
        <div className="flex-row justify-center gap-xs w-full mb-md" style={{ flexWrap: 'wrap' }}>
          <span className="meta-pill meta-pill-mfr">
            <Factory size={9} style={{ marginRight: '2px' }} />
            {device.manufacturer}
          </span>
          <span className="meta-pill meta-pill-tolerance">
            <Target size={9} style={{ marginRight: '2px' }} />
            {getToleranceText()}
          </span>
          {device.iecReference && (
            <span className="meta-pill meta-pill-iec">
              📋 {device.iecReference}
            </span>
          )}
        </div>

        {/* Device Images */}
        <div className="flex-row justify-center gap-md w-full mb-md" style={{ flexWrap: 'wrap' }}>
          <div className="flex-col align-center gap-xs">
            <span className="hud-label"><Zap size={10} style={{ marginRight: '3px', display: 'inline' }} />Gerät</span>
            <img 
              src={device.imageUrl || "/aed.png"} 
              alt="Device" 
              className="device-img-fancy"
              style={{ width: '160px', height: '160px', objectFit: 'contain', cursor: 'zoom-in', padding: '12px' }} 
              onClick={() => setZoomedImage(device.imageUrl || "/aed.png")}
            />
          </div>
          {device.electrodeUrl && (
            <div className="flex-col align-center gap-xs">
              <span className="hud-label"><Activity size={10} style={{ marginRight: '3px', display: 'inline' }} />Elektrode</span>
              <img 
                src={device.electrodeUrl} 
                alt="Electrode" 
                className="device-img-fancy"
                style={{ width: '160px', height: '160px', objectFit: 'contain', cursor: 'zoom-in', padding: '12px' }} 
                onClick={() => setZoomedImage(device.electrodeUrl!)}
              />
            </div>
          )}
        </div>
        
        {/* Manual Links */}
        <div className="flex-row justify-center gap-sm mb-sm w-full">
          <a 
            href={device.userManualUrl || "#"} 
            target={device.userManualUrl ? "_blank" : "_self"} 
            rel="noopener noreferrer" 
            className="extruded" 
            style={{ 
              padding: '8px 10px', fontSize: '0.75rem', flex: 1, 
              opacity: device.userManualUrl ? 1 : 0.3, 
              pointerEvents: device.userManualUrl ? 'auto' : 'none',
              color: '#a1c4fd'
            }}
          >
            <ExternalLink size={14} /> User Manual
          </a>
          <a 
            href={device.serviceManualUrl || "#"} 
            target={device.serviceManualUrl ? "_blank" : "_self"} 
            rel="noopener noreferrer" 
            className="extruded" 
            style={{ 
              padding: '8px 10px', fontSize: '0.75rem', flex: 1, 
              opacity: device.serviceManualUrl ? 1 : 0.3, 
              pointerEvents: device.serviceManualUrl ? 'auto' : 'none',
              color: '#ffb347'
            }}
          >
            <ExternalLink size={14} /> Service Manual
          </a>
        </div>

      </div>

      {device.standardShocks.map((shock, index) => {
        const result = results[index];
        const valStr = values[index];
        const measured = parseFloat(valStr.replace(',', '.'));
        let deviationJ = '-';
        let deviationPct = '-';

        if (!isNaN(measured) && valStr.trim() !== '') {
          const jDiff = measured - shock.targetEnergy;
          const pctDiff = (jDiff / shock.targetEnergy) * 100;
          deviationJ = `${jDiff > 0 ? '+' : ''}${jDiff.toFixed(1)}J`;
          deviationPct = `${pctDiff > 0 ? '+' : ''}${pctDiff.toFixed(1)}%`;
        }

        let statusColor = 'var(--text-color)';
        let statusBorder = 'transparent';
        if (result === true) {
          statusColor = 'var(--success-color)';
          statusBorder = 'rgba(0,255,136,0.3)';
        }
        if (result === false) {
          statusColor = 'var(--error-color)';
          statusBorder = 'rgba(255,64,96,0.3)';
        }

        return (
          <div 
            key={index} 
            className="bump flex-col gap-xs shock-card" 
            style={{ 
              padding: '10px 12px', 
              cursor: 'default',
              ...(result === true ? { border: '1px solid rgba(0,255,136,0.15)', boxShadow: '12px 12px 24px rgba(0,0,0,0.4), -10px -10px 20px rgba(255,255,255,0.02), 0 0 15px rgba(0,255,136,0.08)' } : {}),
              ...(result === false ? { border: '1px solid rgba(255,64,96,0.15)', boxShadow: '12px 12px 24px rgba(0,0,0,0.4), -10px -10px 20px rgba(255,255,255,0.02), 0 0 10px rgba(255,64,96,0.06)' } : {}),
              transition: 'all 0.3s ease',
            }}
          >
            <div className="flex-row justify-between align-center">
              <div className="flex-col gap-xs">
                <span className="hud-label shock-label">
                  <Target size={9} style={{ marginRight: '2px', display: 'inline' }} />
                  {shock.label}
                </span>
                <span className="shock-target">
                  Soll: <span className="shock-target-value">{shock.targetEnergy}J</span>
                </span>
              </div>
              <div className="flex-col align-end gap-xs">
                <span 
                  className="copyable shock-deviation-pct"
                  onClick={() => deviationPct !== '-' && copyToClipboard(deviationPct)}
                  style={{ 
                    color: statusColor, 
                    fontFamily: 'var(--font-mono)',
                    textShadow: result === true ? '0 0 10px var(--success-glow)' : result === false ? '0 0 8px var(--error-glow)' : 'none',
                    cursor: deviationPct !== '-' ? 'pointer' : 'default',
                  }}
                >
                  {deviationPct}
                </span>
                <span 
                  className="copyable shock-deviation-j"
                  onClick={() => deviationJ !== '-' && copyToClipboard(deviationJ)}
                  style={{ 
                    color: '#a1c4fd', 
                    fontFamily: 'var(--font-mono)',
                    cursor: deviationJ !== '-' ? 'pointer' : 'default',
                  }}
                >
                  {deviationJ}
                </span>
              </div>
            </div>
            
            <div className="flex-row align-center" style={{ position: 'relative' }}>
              <input 
                type="text" 
                inputMode="decimal"
                className="dent shock-input" 
                placeholder="Messwert (J)" 
                value={values[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                style={{ 
                  width: '100%', 
                  color: statusColor, 
                  textAlign: 'left',
                  border: `1px solid ${statusBorder}`,
                }}
              />
              <div 
                className={`status-indicator ${result === true ? 'status-success pulse-pass' : result === false ? 'status-error pulse-fail' : 'status-pending'}`}
                style={{ position: 'absolute', right: '10px', width: '10px', height: '10px' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

