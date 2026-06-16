import React, { useState, useMemo } from 'react';
import { devices } from '../data/devices';
import type { Defibrillator } from '../data/devices';
import { Heart, Zap, Factory, ChevronRight, ChevronLeft, Check, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onSelect: (device: Defibrillator) => void;
  onClose: () => void;
}

type Category = 'aed' | 'defibrillator';

const categoryMeta: Record<Category, { label: string; icon: typeof Heart; color: string; desc: string }> = {
  aed: {
    label: 'AED',
    icon: Heart,
    color: 'var(--success-color)',
    desc: 'Automatisierter externer Defibrillator\n3 Schocks',
  },
  defibrillator: {
    label: 'Defibrillator',
    icon: Zap,
    color: 'var(--primary-color)',
    desc: 'Manueller Defibrillator\n6 Schocks',
  },
};

const ChargeSparks: React.FC = () => {
  const sparks = useMemo(() =>
    Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      top: `${20 + Math.random() * 60}%`,
      left: `${20 + Math.random() * 60}%`,
      sx: `${(Math.random() - 0.5) * 40}px`,
      sy: `${(Math.random() - 0.5) * 40}px`,
      delay: `${Math.random() * 1.2}s`,
      size: `${2 + Math.random() * 2}px`,
    }))
  , []);

  return (
    <>
      {sparks.map(s => (
        <div
          key={s.id}
          className="charge-spark"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--sx': s.sx,
            '--sy': s.sy,
            animationDelay: s.delay,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
};

export const DeviceAssistant: React.FC<Props> = ({ onSelect, onClose }) => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);

  const updateStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const manufacturers = useMemo(() => {
    let filtered = devices;
    if (selectedCategory) {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }
    return Array.from(new Set(filtered.map(d => d.manufacturer))).sort();
  }, [selectedCategory]);

  const models = useMemo(() => {
    let filtered = devices;
    if (selectedCategory) {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }
    if (selectedManufacturer) {
      filtered = filtered.filter(d => d.manufacturer === selectedManufacturer);
    }
    return filtered.sort((a, b) => a.model.localeCompare(b.model));
  }, [selectedCategory, selectedManufacturer]);

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedManufacturer(null);
    updateStep(2);
  };

  const handleManufacturerSelect = (mfr: string) => {
    setSelectedManufacturer(mfr);
    updateStep(3);
  };

  const goBack = () => {
    if (step === 3) {
      setSelectedManufacturer(null);
      updateStep(2);
    } else if (step === 2) {
      setSelectedCategory(null);
      updateStep(1);
    }
  };

  const swipeVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0,
      transition: { duration: 0.3 }
    })
  };

  return (
    <div className="bump w-full flex-col gap-md" style={{ padding: '20px', overflow: 'hidden' }}>
      <div className="flex-row justify-center gap-sm" style={{ marginBottom: '4px' }}>
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={s === step ? 'step-dot-active' : ''}
            style={{
              width: s === step ? '32px' : '10px',
              height: '10px',
              borderRadius: '5px',
              background: s === step
                ? 'var(--primary-color)'
                : s < step
                  ? 'var(--success-color)'
                  : 'var(--chip-color)',
              boxShadow: s === step
                ? '0 0 10px var(--primary-glow)'
                : s < step
                  ? '0 0 6px var(--success-glow)'
                  : 'none',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        ))}
      </div>

      <div className="text-center" style={{ fontSize: '0.7rem', color: 'var(--footer-color)', textTransform: 'uppercase', letterSpacing: '0.1rem', fontWeight: 700 }}>
        Schritt {step}/3
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-col gap-md"
          >
            <h3 style={{ textAlign: 'center', color: 'var(--text-color)', fontSize: '1rem', fontWeight: 700 }}>
              Gerätetyp wählen
            </h3>
            <div className="flex-row gap-md justify-center w-full">
              {(Object.entries(categoryMeta) as [Category, typeof categoryMeta['aed']][]).map(([key, meta]) => {
                const Icon = meta.icon;
                const isAed = key === 'aed';
                return (
                  <button
                    key={key}
                    className={`bump ${isAed ? 'assistant-btn-aed' : 'assistant-btn-defi'}`}
                    onClick={() => handleCategorySelect(key)}
                    style={{
                      flex: 1,
                      maxWidth: '200px',
                      padding: '28px 16px',
                      cursor: 'pointer',
                      border: `2px solid ${meta.color}22`,
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = meta.color;
                      e.currentTarget.style.boxShadow = `12px 12px 24px var(--shadow-dark), -10px -10px 20px var(--shadow-light), 0 0 28px ${meta.color}44`;
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = `${meta.color}22`;
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.transform = '';
                    }}
                  >
                    {!isAed && <ChargeSparks />}
                    <span className="assistant-icon" style={{ display: 'inline-block', position: 'relative', zIndex: 1 }}>
                      <Icon size={48} color={meta.color} />
                    </span>
                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-color)', position: 'relative', zIndex: 1 }}>{meta.label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--footer-color)', whiteSpace: 'pre-line', textAlign: 'center', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
                      {meta.desc}
                    </span>
                    <ChevronRight size={16} color={meta.color} style={{ position: 'relative', zIndex: 1 }} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-col gap-md"
          >
            <div className="flex-row align-center justify-between">
              <button
                className="extruded"
                onClick={goBack}
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                <ChevronLeft size={14} /> Zurück
              </button>
              <div className="flex-row align-center gap-xs">
                {selectedCategory && (
                  <>
                    {React.createElement(categoryMeta[selectedCategory].icon, {
                      size: 18,
                      color: categoryMeta[selectedCategory].color,
                    })}
                    <span style={{ fontWeight: 700, color: 'var(--text-color)', fontSize: '0.9rem' }}>
                      {categoryMeta[selectedCategory].label}
                    </span>
                  </>
                )}
              </div>
              <div style={{ width: '60px' }} />
            </div>
            <h3 style={{ textAlign: 'center', color: 'var(--text-color)', fontSize: '1rem', fontWeight: 700 }}>
              Hersteller wählen
            </h3>
            <div className="flex-col gap-sm">
              {manufacturers.map((mfr) => (
                <button
                  key={mfr}
                  className="bump flex-row align-center gap-sm assistant-list-btn"
                  onClick={() => handleManufacturerSelect(mfr)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                    width: '100%',
                  }}
                >
                  <Factory size={20} color="var(--primary-color)" />
                  <span style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '1rem', flex: 1, textAlign: 'left' }}>
                    {mfr}
                  </span>
                  <ChevronRight size={18} color="var(--chip-color)" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            custom={direction}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-col gap-md"
          >
            <div className="flex-row align-center justify-between">
              <button
                className="extruded"
                onClick={goBack}
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                <ChevronLeft size={14} /> Zurück
              </button>
              <div className="flex-row align-center gap-xs">
                <Cpu size={16} color="var(--primary-color)" style={{ filter: 'drop-shadow(0 0 4px var(--primary-glow))' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-color)', fontSize: '0.85rem' }}>
                  {selectedManufacturer}
                </span>
              </div>
              <div style={{ width: '60px' }} />
            </div>
            <h3 style={{ textAlign: 'center', color: 'var(--text-color)', fontSize: '1rem', fontWeight: 700 }}>
              Modell wählen
            </h3>
            <div className="flex-col gap-sm">
              {models.map((dev) => (
                <button
                  key={dev.id}
                  className="bump flex-row align-center gap-sm assistant-list-btn assistant-model-btn"
                  onClick={() => onSelect(dev)}
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    border: '1px solid transparent',
                    width: '100%',
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: 'var(--device-img-bg)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 2px 2px 5px var(--shadow-dark)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <img
                      src={dev.imageUrl || '/aed.png'}
                      alt={dev.model}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }}
                    />
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '1rem', flex: 1, textAlign: 'left' }}>
                    {dev.model}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    color: 'var(--footer-color)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05rem',
                  }}>
                    {dev.standardShocks.length} Schocks
                  </span>
                  <Check size={18} color="var(--success-color)" style={{ opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className="extruded"
        onClick={onClose}
        style={{
          marginTop: '8px',
          width: '100%',
          justifyContent: 'center',
          padding: '10px',
          fontSize: '0.8rem',
        }}
      >
        Abbrechen
      </button>
    </div>
  );
};
