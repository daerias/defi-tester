import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Zap, Cpu } from 'lucide-react';
import type { TestEntry } from '../db/db';
import { devices } from '../data/devices';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  entries: TestEntry[];
}

const CompactCard: React.FC<{ entry: TestEntry; onClick: () => void }> = ({ entry, onClick }) => {
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  
  // Look up device images from the device registry
  const deviceInfo = devices.find(d => d.id === entry.deviceId);
  const deviceImg = deviceInfo?.imageUrl;
  const electrodeImg = deviceInfo?.electrodeUrl;

  return (
    <div
      className="bump flex-row align-center gap-sm"
      onClick={onClick}
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        borderLeft: `4px solid ${entry.passed ? 'var(--success-color)' : 'var(--error-color)'}`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateX(6px)';
        e.currentTarget.style.boxShadow = entry.passed
          ? '12px 12px 24px var(--shadow-dark), -10px -10px 20px var(--shadow-light), 0 0 12px var(--success-glow)'
          : '12px 12px 24px var(--shadow-dark), -10px -10px 20px var(--shadow-light), 0 0 8px var(--error-glow)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Device & electrode thumbnails with mirror reflection + multi-color neon glow */}
      <div 
        className={`device-thumb-reflect ${entry.passed ? 'device-thumb-pass' : 'device-thumb-fail'}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flexShrink: 0,
          alignItems: 'center',
        }}
      >
        <div className="device-thumb-img" style={{
          width: '56px',
          height: '40px',
          padding: '3px',
        }}>
          {deviceImg ? (
            <img src={deviceImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <Cpu size={16} color="var(--footer-color)" />
          )}
        </div>
        {electrodeImg && (
          <div className="device-thumb-electrode" style={{
            width: '38px',
            height: '24px',
            padding: '2px',
          }}>
            <img src={electrodeImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        )}
      </div>

      {/* Pass/Fail indicator */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: entry.passed ? 'rgba(0,255,136,0.1)' : 'rgba(255,64,96,0.1)',
        border: `2px solid ${entry.passed ? 'var(--success-color)' : 'var(--error-color)'}`,
        flexShrink: 0,
      }}>
        {entry.passed ? (
          <CheckCircle2 size={20} color="var(--success-color)" />
        ) : (
          <XCircle size={20} color="var(--error-color)" />
        )}
      </div>

      <div className="flex-col gap-xs" style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {entry.deviceLabel}
        </div>
        <div className="flex-row align-center gap-xs" style={{ fontSize: '0.7rem', color: 'var(--footer-color)' }}>
          <Clock size={10} />
          <span>{dateStr} · {timeStr}</span>
          <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '4px', background: 'var(--device-img-bg)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
            {entry.deviationsPct.slice(0, 3).join(' / ')}
            {entry.deviationsPct.length > 3 ? ' ...' : ''}
          </span>
        </div>
      </div>

      <Zap size={14} color={entry.passed ? 'var(--success-color)' : 'var(--error-color)'} />
    </div>
  );
};

const DetailView: React.FC<{ entry: TestEntry; onBack: () => void }> = ({ entry, onBack }) => {
  const date = new Date(entry.timestamp);
  const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex-col gap-md">
      <button
        className="extruded flex-row align-center gap-xs"
        onClick={onBack}
        style={{ alignSelf: 'flex-start', padding: '8px 14px' }}
      >
        ← Zurück
      </button>

      <div className="bump p-md flex-col gap-md scanlines"
        style={{
          borderLeft: `4px solid ${entry.passed ? 'var(--success-color)' : 'var(--error-color)'}`,
        }}
      >
        <div className="flex-row justify-between align-center">
          <div className="flex-col gap-xs">
            <h3 style={{ fontWeight: 900, color: 'var(--text-color)', fontSize: '1.2rem' }}>
              {entry.deviceLabel}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--footer-color)' }}>
              {entry.category === 'aed' ? 'AED' : 'Defibrillator'}
            </span>
          </div>
          <div className="flex-col align-end gap-xs">
            <span style={{
              fontWeight: 900,
              fontSize: '0.9rem',
              color: entry.passed ? 'var(--success-color)' : 'var(--error-color)',
              fontFamily: 'var(--font-mono)',
              textShadow: entry.passed ? '0 0 8px var(--success-glow)' : '0 0 6px var(--error-glow)',
            }}>
              {entry.passed ? 'BESTANDEN' : 'NICHT BESTANDEN'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--footer-color)' }}>
              {dateStr} · {timeStr}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--footer-color)', fontFamily: 'var(--font-mono)' }}>
          Toleranz: {entry.tolerance}
        </div>

        <div className="flex-col gap-sm">
          {entry.measuredValues.map((val, i) => {
            const devJ = entry.deviationsJ[i] || '-';
            const devPct = entry.deviationsPct[i] || '-';

            return (
              <div key={i} className="flex-row align-center gap-sm" style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'var(--device-img-bg)',
                border: '1px solid rgba(128,128,128,0.1)',
              }}>
                <span className="hud-label" style={{ width: '60px', fontSize: '0.6rem' }}>
                  Schock {i + 1}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-color)', flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                  {val}J → {entry.targetValues[i]}J
                </span>
                <span style={{
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--footer-color)',
                }}>
                  {devJ} ({devPct})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TestHistory: React.FC<Props> = ({ entries }) => {
  const [selectedEntry, setSelectedEntry] = useState<TestEntry | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence mode="wait">
      {selectedEntry ? (
        <motion.div 
          key="detail" 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          transition={{ duration: 0.2 }}
        >
          <DetailView
            entry={selectedEntry}
            onBack={() => setSelectedEntry(null)}
          />
        </motion.div>
      ) : entries.length === 0 ? (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="bump p-lg text-center" style={{ padding: '40px', color: 'var(--footer-color)', fontStyle: 'italic' }}>
            Keine Tests gespeichert
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="list" 
          className="flex-col gap-sm" 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          exit={{ opacity: 0 }}
        >
          {entries.map(entry => (
            <motion.div key={entry.id} variants={itemVariants}>
              <CompactCard
                entry={entry}
                onClick={() => setSelectedEntry(entry)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
