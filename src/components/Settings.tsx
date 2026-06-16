import { useState, useCallback, useRef } from 'react';
import { useDeviceSync } from '../hooks/useDeviceSync';
import { SupportRequestPanel } from './SupportRequest';
import type { SupportRequest } from '../hooks/useSupportRequests';
import { RefreshCw, Database, Trash2, Info, Cpu } from 'lucide-react';

export const SettingsPanel: React.FC<{
  historyCount: number;
  onClearHistory: () => void;
  supportRequests: SupportRequest[];
  onAddSupportRequest: (deviceName: string, note: string) => void;
  onRemoveSupportRequest: (id: string) => void;
  onClearSupportRequests: () => void;
  onExportSupportRequests: () => void;
}> = ({ historyCount, onClearHistory, supportRequests, onAddSupportRequest, onRemoveSupportRequest, onClearSupportRequests, onExportSupportRequests }) => {
  const sync = useDeviceSync();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const aboutCardRef = useRef<HTMLDivElement>(null);

  const handleClearHistory = useCallback(() => {
    setShowConfirmClear(false);
    onClearHistory();
  }, [onClearHistory]);

  const lastUpdateStr = sync.lastUpdate
    ? new Date(sync.lastUpdate).toLocaleString('de-DE')
    : 'Nie';

  return (
    <div className='flex-col gap-md'>
      {/* Device List Section */}
      <div className='bump p-md flex-col gap-sm'>
        <div className='flex-row align-center gap-xs'>
          <Database size={16} color='var(--primary-color)' />
          <h3 style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '0.9rem' }}>
            Geräteliste
          </h3>
        </div>

        <div className='flex-col gap-xs'>
          <label className='hud-label' style={{ fontSize: '0.6rem' }}>
            Remote-URL (Markdown)
          </label>
          <input
            type='text'
            className='dent'
            placeholder='https://raw.githubusercontent.com/...'
            value={sync.updateUrl}
            onChange={e => sync.setUpdateUrl(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '10px 14px' }}
          />
        </div>

        <div className='flex-row justify-between align-center'>
          <span style={{ fontSize: '0.75rem', color: 'var(--footer-color)' }}>
            Auto-Update beim Start
          </span>
          <button
            className='extruded'
            onClick={() => sync.setAutoUpdate(!sync.autoUpdate)}
            style={{
              padding: '6px 16px',
              fontSize: '0.7rem',
              background: sync.autoUpdate ? 'var(--primary-color)' : undefined,
              color: sync.autoUpdate ? '#0d1117' : undefined,
              border: sync.autoUpdate ? 'none' : undefined,
            }}
          >
            {sync.autoUpdate ? 'AN' : 'AUS'}
          </button>
        </div>

        <div className='flex-row justify-between align-center'>
          <span style={{ fontSize: '0.7rem', color: 'var(--footer-color)' }}>
            Letztes Update: {lastUpdateStr}
          </span>
          <button
            className='extruded flex-row align-center gap-xs'
            onClick={() => sync.fetchDevices()}
            disabled={sync.loading}
            style={{ padding: '6px 12px', fontSize: '0.7rem', opacity: sync.loading ? 0.5 : 1 }}
          >
            <RefreshCw size={12} style={{ animation: sync.loading ? 'spin 1s linear infinite' : 'none' }} />
            {sync.loading ? 'Lädt...' : 'Jetzt aktualisieren'}
          </button>
        </div>

        {sync.error && (
          <div style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(255,64,96,0.1)',
            border: '1px solid rgba(255,64,96,0.2)',
            color: 'var(--error-color)',
            fontSize: '0.7rem',
          }}>
            Fehler: {sync.error}
          </div>
        )}

        <div style={{ fontSize: '0.65rem', color: 'var(--footer-color)', fontFamily: 'var(--font-mono)' }}>
          {sync.devices.length} Geräte geladen
        </div>
      </div>

      {/* History Section */}
      <div className='bump p-md flex-col gap-sm'>
        <div className='flex-row align-center gap-xs'>
          <Database size={16} color='var(--primary-color)' />
          <h3 style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '0.9rem' }}>
            Verlauf
          </h3>
        </div>

        <div className='flex-row justify-between align-center'>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-color)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {historyCount} Einträge
          </span>
          <button
            className='extruded flex-row align-center gap-xs'
            onClick={() => setShowConfirmClear(true)}
            style={{ padding: '6px 12px', fontSize: '0.7rem', color: 'var(--error-color)' }}
          >
            <Trash2 size={12} />
            Alle löschen
          </button>
        </div>

        {showConfirmClear && (
          <div className='flex-col gap-sm' style={{
            padding: '12px',
            borderRadius: '12px',
            background: 'rgba(255,64,96,0.05)',
            border: '1px solid rgba(255,64,96,0.2)',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-color)', textAlign: 'center' }}>
              Alle {historyCount} Einträge unwiderruflich löschen?
            </span>
            <div className='flex-row gap-sm justify-center'>
              <button className='extruded' onClick={() => setShowConfirmClear(false)}
                style={{ padding: '6px 16px', fontSize: '0.7rem' }}>
                Abbrechen
              </button>
              <button className='extruded' onClick={handleClearHistory}
                style={{ padding: '6px 16px', fontSize: '0.7rem', color: 'var(--error-color)', border: '1px solid var(--error-color)' }}>
                Ja, löschen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Support Requests Section */}
      <div className='bump p-md'>
        <SupportRequestPanel
          requests={supportRequests}
          onAdd={onAddSupportRequest}
          onRemove={onRemoveSupportRequest}
          onClearAll={onClearSupportRequests}
          onExport={onExportSupportRequests}
        />
      </div>

      {/* About Section */}
      <div 
        ref={aboutCardRef}
        className='bump p-md flex-col gap-xs about-card'
        onMouseMove={(e) => {
          if (!aboutCardRef.current) return;
          const rect = aboutCardRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
          aboutCardRef.current.style.setProperty('--tilt-x', `${y * 4}deg`);
          aboutCardRef.current.style.setProperty('--tilt-y', `${x * 4}deg`);
          aboutCardRef.current.style.setProperty('--mx', `${(e.clientX - rect.left) / rect.width * 100}%`);
          aboutCardRef.current.style.setProperty('--my', `${(e.clientY - rect.top) / rect.height * 100}%`);
        }}
        onMouseLeave={() => {
          if (!aboutCardRef.current) return;
          aboutCardRef.current.style.setProperty('--tilt-x', '0deg');
          aboutCardRef.current.style.setProperty('--tilt-y', '0deg');
        }}
      >
        <div className='flex-row align-center gap-xs'>
          <Info size={16} color='var(--primary-color)' />
          <h3 style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '0.9rem' }}>
            Über
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--footer-color)' }}>
          STK Defi Tester v2.0.0
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--footer-color)', fontStyle: 'italic' }}>
          Toleranzprüfung nach IEC 60601-2-4
        </span>
        <div style={{
          marginTop: '8px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(128,128,128,0.08)',
          fontSize: '0.55rem',
          color: 'var(--footer-color)',
          opacity: 0.25,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Cpu size={9} style={{ opacity: 0.5 }} />
          <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.02rem' }}>
            @daerias
          </span>
        </div>
      </div>

    </div>
  );
};