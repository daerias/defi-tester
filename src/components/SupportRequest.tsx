import { useState } from 'react';
import { MessageSquare, Plus, Trash2, Download, Send, Clock } from 'lucide-react';
import type { SupportRequest } from '../hooks/useSupportRequests';

export const SupportRequestPanel: React.FC<{
  requests: SupportRequest[];
  onAdd: (deviceName: string, note: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onExport: () => void;
}> = ({ requests, onAdd, onRemove, onClearAll, onExport }) => {
  const [deviceName, setDeviceName] = useState('');
  const [note, setNote] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!deviceName.trim()) return;
    onAdd(deviceName, note);
    setDeviceName('');
    setNote('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const canSubmit = deviceName.trim().length > 0;

  return (
    <div className="flex-col gap-sm">
      {/* Header with toggle and export */}
      <div className="flex-row justify-between align-center">
        <div className="flex-row align-center gap-xs">
          <MessageSquare size={16} color="var(--primary-color)" />
          <h3 style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '0.9rem' }}>
            Support-Anfragen
          </h3>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--footer-color)',
            fontFamily: 'var(--font-mono)',
            background: 'var(--bg-color)',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            {requests.length}
          </span>
        </div>
        <div className="flex-row gap-xs">
          <button
            className="extruded"
            onClick={() => setShowForm(v => !v)}
            title="Neue Anfrage"
            style={{
              padding: '6px 12px',
              fontSize: '0.7rem',
              color: showForm ? 'var(--bg-color)' : 'var(--primary-color)',
              background: showForm ? 'var(--primary-color)' : undefined,
              border: showForm ? 'none' : undefined,
            }}
          >
            <Plus size={12} />
            {showForm ? 'Schließen' : 'Neu'}
          </button>
          {requests.length > 0 && (
            <button
              className="extruded"
              onClick={onExport}
              title="Als Markdown exportieren"
              style={{ padding: '6px 12px', fontSize: '0.7rem' }}
            >
              <Download size={12} />
              MD
            </button>
          )}
        </div>
      </div>

      {/* Submission feedback */}
      {submitted && (
        <div style={{
          padding: '8px 14px',
          borderRadius: '10px',
          background: 'rgba(0,255,136,0.08)',
          border: '1px solid rgba(0,255,136,0.2)',
          color: 'var(--success-color)',
          fontSize: '0.75rem',
          fontWeight: 700,
          textAlign: 'center',
        }}>
          ✓ Anfrage gespeichert — als Markdown exportierbar
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="dent support-form" style={{ padding: '14px' }}>
          <div className="flex-col gap-sm">
            <div className="flex-col gap-xs">
              <label className="hud-label" style={{ fontSize: '0.6rem' }}>
                Gerätename *
              </label>
              <input
                type="text"
                className="dent"
                placeholder="z.B. Corpuls 3, Philips HeartStart FRx..."
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
                style={{ fontSize: '0.85rem', padding: '10px 14px' }}
                autoFocus
              />
            </div>
            <div className="flex-col gap-xs">
              <label className="hud-label" style={{ fontSize: '0.6rem' }}>
                Notiz <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
              </label>
              <textarea
                className="dent"
                placeholder="Hersteller-URL, Schockenergien, Besonderheiten..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                style={{
                  fontSize: '0.8rem',
                  padding: '10px 14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  color: 'var(--input-color)',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  borderRadius: 'var(--border-radius-md)',
                }}
              />
            </div>
            <button
              className="extruded"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '10px',
                fontSize: '0.8rem',
                fontWeight: 800,
                color: canSubmit ? 'var(--bg-color)' : 'var(--footer-color)',
                background: canSubmit ? 'var(--primary-color)' : undefined,
                border: canSubmit ? 'none' : undefined,
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={14} style={{ marginRight: 6 }} />
              Anfrage senden
            </button>
          </div>
        </div>
      )}

      {/* Request list */}
      {requests.length > 0 && (
        <div className="flex-col gap-xs" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {requests.map((req, i) => (
            <div
              key={req.id}
              className="support-request-item"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'var(--bg-color)',
                border: '1px solid rgba(255,255,255,0.03)',
                animation: `animateIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards`,
                animationDelay: `${i * 0.04}s`,
                opacity: 0,
              }}
            >
              <div style={{
                flexShrink: 0,
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
              }}>
                <MessageSquare size={12} color="#fff" />
              </div>
              <div className="flex-col gap-xs" style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-row justify-between align-center">
                  <span style={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: 'var(--text-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {req.deviceName}
                  </span>
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--footer-color)',
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}>
                    {new Date(req.timestamp).toLocaleDateString('de-DE')}
                  </span>
                </div>
                {req.note && (
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--footer-color)',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}>
                    {req.note}
                  </span>
                )}
              </div>
              <button
                onClick={() => onRemove(req.id)}
                title="Entfernen"
                style={{
                  flexShrink: 0,
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--footer-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = 'var(--error-color)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '0.5';
                  e.currentTarget.style.color = 'var(--footer-color)';
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear all */}
      {requests.length > 1 && (
        <div className="flex-row justify-end">
          {!showConfirmClear ? (
            <button
              className="extruded"
              onClick={() => setShowConfirmClear(true)}
              style={{ padding: '4px 10px', fontSize: '0.6rem', color: 'var(--footer-color)' }}
            >
              <Trash2 size={10} style={{ marginRight: 4 }} />
              Alle löschen
            </button>
          ) : (
            <div className="flex-row gap-xs align-center">
              <span style={{ fontSize: '0.65rem', color: 'var(--footer-color)' }}>Sicher?</span>
              <button
                className="extruded"
                onClick={() => setShowConfirmClear(false)}
                style={{ padding: '4px 10px', fontSize: '0.6rem' }}
              >
                Nein
              </button>
              <button
                className="extruded"
                onClick={() => { onClearAll(); setShowConfirmClear(false); }}
                style={{ padding: '4px 10px', fontSize: '0.6rem', color: 'var(--error-color)' }}
              >
                Ja
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {requests.length === 0 && !showForm && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: 'var(--footer-color)',
          fontSize: '0.7rem',
          opacity: 0.7,
        }}>
          <Clock size={20} style={{ marginBottom: '6px', opacity: 0.4 }} />
          <div>Noch keine Support-Anfragen.</div>
          <div style={{ marginTop: '2px' }}>„Neu" klicken, um einen fehlenden Defi anzufragen.</div>
        </div>
      )}
    </div>
  );
};
