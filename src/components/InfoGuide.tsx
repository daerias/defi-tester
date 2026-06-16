import { useMemo } from 'react';
import { Search, Zap, Target, CheckCircle, Copy, ClipboardCheck } from 'lucide-react';

/**
 * InfoGuide — Visual step-by-step tutorial for colleagues.
 * Explains the full DeFi-Tester workflow in 4 easy steps.
 */
export const InfoGuide: React.FC = () => {
  const steps = useMemo(() => [
    {
      step: 1,
      icon: Search,
      title: 'Gerät finden',
      subtitle: 'Suchfeld oder Assistent',
      diagram: () => (
        <svg width="280" height="140" viewBox="0 0 280 140" style={{ maxWidth: '100%' }}>
          {/* Search input (neumorphic dent) */}
          <rect x="30" y="15" width="220" height="42" rx="18" fill="var(--bg-color)" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          <rect x="30" y="15" width="220" height="42" rx="18" fill="none" stroke="var(--shadow-dark)" strokeWidth="1" opacity="0.3"/>
          {/* Search icon */}
          <circle cx="60" cy="36" r="7" fill="none" stroke="var(--primary-color)" strokeWidth="2"/>
          <line x1="65" y1="41" x2="70" y2="46" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round"/>
          {/* Placeholder text */}
          <text x="78" y="41" fill="var(--footer-color)" fontSize="10" fontFamily="sans-serif" fontWeight="600">Modell suchen...</text>
          
          {/* Arrow down to dropdown */}
          <line x1="140" y1="62" x2="140" y2="78" stroke="var(--primary-color)" strokeWidth="1.5" markerEnd="url(#arrowInfo)"/>
          <defs>
            <marker id="arrowInfo" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="var(--primary-color)"/>
            </marker>
          </defs>
          
          {/* Dropdown showing device items */}
          <rect x="30" y="80" width="220" height="48" rx="12" fill="var(--bg-elevated)" stroke="rgba(255,255,255,0.03)" strokeWidth="1" opacity="0.8"/>
          {/* Device row 1 */}
          <rect x="42" y="90" width="28" height="22" rx="6" fill="var(--device-img-bg)"/>
          <text x="82" y="105" fill="var(--text-color)" fontSize="9" fontFamily="sans-serif" fontWeight="700">Zoll X Series</text>
          {/* Device row 2 */}
          <rect x="42" y="118" width="28" height="22" rx="6" fill="var(--device-img-bg)"/>
          <text x="82" y="133" fill="var(--text-color)" fontSize="9" fontFamily="sans-serif" fontWeight="700">Physio LP15</text>
          
          {/* Manufacturer chips row */}
          <text x="30" y="15" fill="var(--primary-color)" fontSize="7" fontFamily="sans-serif" fontWeight="900" textAnchor="end">Alternative:</text>
          {/* Chip examples along the right */}
          <rect x="258" y="20" width="12" height="34" rx="4" fill="var(--chip-bg)" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          <text x="264" y="41" fill="var(--chip-color)" fontSize="5" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">ZOLL</text>
        </svg>
      ),
      details: [
        'Tippe den Modellnamen ins Suchfeld — die App findet das Gerät sofort',
        'Oder klicke auf einen Hersteller-Chip (z.B. ZOLL, Physio)',
        'Alternativ: „Assistent" — führt dich in 3 Klicks zum Gerät',
      ],
      tip: '💡 Der Assistent ist ideal, wenn du nicht weißt, wie das Modell genau heißt.',
    },
    {
      step: 2,
      icon: Target,
      title: 'Messwerte eingeben',
      subtitle: 'Joule-Werte pro Schock',
      diagram: () => (
        <svg width="280" height="130" viewBox="0 0 280 130" style={{ maxWidth: '100%' }}>
          {/* Shock card 1 */}
          <rect x="15" y="5" width="250" height="54" rx="14" fill="var(--bg-elevated)" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>              <text x="28" y="22" fill="var(--footer-color)" fontSize="7" fontFamily="sans-serif" fontWeight="700">SCHOCK 1</text>
          <text x="28" y="36" fill="var(--text-color)" fontSize="8" fontFamily="sans-serif">Soll: <tspan fill="var(--primary-color)" fontWeight="700">200J</tspan></text>
          {/* Input field */}
          <rect x="170" y="18" width="82" height="28" rx="8" fill="var(--bg-color)" stroke="rgba(0,255,136,0.3)" strokeWidth="1"/>
          <text x="211" y="36" fill="var(--success-color)" fontSize="11" fontFamily="monospace" fontWeight="700" textAnchor="middle">203.5</text>
          {/* Deviation */}
          <text x="170" y="54" fill="var(--success-color)" fontSize="7" fontFamily="monospace" fontWeight="700">+1.8% (+3.5J)</text>
          
          {/* Arrow between cards */}
          <line x1="140" y1="64" x2="140" y2="74" stroke="var(--footer-color)" strokeWidth="1"/>
          
          {/* Shock card 2 */}
          <rect x="15" y="76" width="250" height="46" rx="14" fill="var(--bg-elevated)" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          <text x="28" y="92" fill="var(--footer-color)" fontSize="7" fontFamily="sans-serif" fontWeight="700">SCHOCK 2</text>
          <text x="28" y="106" fill="var(--text-color)" fontSize="8" fontFamily="sans-serif">Soll: <tspan fill="var(--primary-color)" fontWeight="700">360J</tspan></text>
          {/* Input field - empty */}
          <rect x="170" y="86" width="82" height="28" rx="8" fill="var(--bg-color)" stroke="rgba(128,128,128,0.15)" strokeWidth="1"/>
          <text x="211" y="104" fill="var(--footer-color)" fontSize="9" fontFamily="sans-serif" fontWeight="500" textAnchor="middle">Messwert</text>
        </svg>
      ),
      details: [
        'Gib für jeden Schock den gemessenen Joule-Wert ein',
        'Die App berechnet automatisch die Abweichung in % und Joule',
        'Prozent-Abweichung direkt antippen → wird in Zwischenablage kopiert',
        'Grüner Rand = bestanden, roter Rand = nicht bestanden',
      ],
      tip: '💡 Du kannst Komma oder Punkt verwenden — z.B. 203,5 oder 203.5',
    },
    {
      step: 3,
      icon: CheckCircle,
      title: 'Ergebnis prüfen',
      subtitle: 'PASS oder FAIL',
      diagram: () => (
        <svg width="280" height="110" viewBox="0 0 280 110" style={{ maxWidth: '100%' }}>
          {/* Result bubble */}
          <rect x="30" y="5" width="220" height="100" rx="24" fill="rgba(0,255,136,0.06)" stroke="rgba(0,255,136,0.25)" strokeWidth="1.5"/>
          {/* Check circle */}
          <circle cx="140" cy="30" r="18" fill="rgba(0,255,136,0.12)" stroke="var(--success-color)" strokeWidth="2.5"/>
          <polyline points="130,30 137,37 150,23" fill="none" stroke="var(--success-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          {/* PASS text */}
          <text x="140" y="72" fill="var(--success-color)" fontSize="18" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" letterSpacing="2">BESTANDEN</text>
          <text x="140" y="92" fill="rgba(0,255,136,0.6)" fontSize="8" fontFamily="sans-serif" fontWeight="600" textAnchor="middle">✓ TOLERANZ EINGEHALTEN</text>
          
          {/* Side note: FAIL version */}
          <text x="270" y="55" fill="var(--error-color)" fontSize="7" fontFamily="sans-serif" fontWeight="900" textAnchor="end">FAIL:</text>
          <rect x="262" y="62" width="16" height="16" rx="8" fill="rgba(255,64,96,0.1)" stroke="var(--error-color)" strokeWidth="1.5"/>
          <line x1="267" y1="67" x2="273" y2="73" stroke="var(--error-color)" strokeWidth="2"/>
          <line x1="273" y1="67" x2="267" y2="73" stroke="var(--error-color)" strokeWidth="2"/>
        </svg>
      ),
      details: [
        'Sobald alle Felder ausgefüllt sind, erscheint das Ergebnis',
        'BESTANDEN: Alle Werte innerhalb der IEC-Toleranz (z.B. ±15%)',
        'NICHT BESTANDEN: Mindestens ein Wert außerhalb der Toleranz',
        'Jeder Schock zeigt einzeln seinen Status (grün/rot)',
      ],
      tip: '💡 Die Toleranz wird pro Gerät angezeigt — sichtbar als Pill unter dem Gerätenamen.',
    },
    {
      step: 4,
      icon: ClipboardCheck,
      title: 'Werte kopieren & speichern',
      subtitle: 'Für PDF oder Protokoll',
      diagram: () => (
        <svg width="280" height="110" viewBox="0 0 280 110" style={{ maxWidth: '100%' }}>
          {/* Copy interaction visualization */}
          <rect x="40" y="10" width="200" height="40" rx="12" fill="var(--bg-elevated)" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          
          {/* Deviation value - clickable */}
          <text x="80" y="28" fill="var(--footer-color)" fontSize="7" fontFamily="sans-serif" fontWeight="700">Abweichung:</text>
          <rect x="140" y="14" width="60" height="20" rx="6" fill="var(--primary-color)" opacity="0.1" stroke="var(--primary-color)" strokeWidth="1"/>
          <text x="170" y="28" fill="var(--primary-color)" fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">+1.8%</text>
          {/* Cursor click indicator */}
          <circle cx="155" cy="24" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3"/>
          
          {/* Toast notification */}
          <rect x="30" y="62" width="220" height="30" rx="15" fill="var(--primary-color)" opacity="0.9"/>
          <text x="140" y="81" fill="#0d1117" fontSize="9" fontFamily="monospace" fontWeight="800" textAnchor="middle">✓ Kopiert: +1.8%</text>
          
          {/* Arrow from value to toast */}
          <line x1="155" y1="40" x2="145" y2="58" stroke="var(--primary-color)" strokeWidth="1" opacity="0.4"/>
        </svg>
      ),
      details: [
        'Klicke auf eine Abweichung (% oder J) → wird kopiert',
        'Direkt in dein PDF oder Prüfprotokoll einfügen (Ctrl+V)',
        'Alle Tests werden automatisch im „Verlauf" gespeichert',
        'Verlauf zeigt alle bisherigen Tests mit Zeitstempel',
      ],
      tip: '💡 Kein manuelles Rechnen mehr — die App macht alles automatisch!',
    },
  ], []);

  return (
    <div className="flex-col gap-md">
      {/* Hero intro */}
      <div className="bump p-md flex-col gap-sm" style={{ textAlign: 'center' }}>
        <div className="flex-row align-center justify-center gap-xs">
          <Zap size={22} color="var(--primary-color)" style={{ filter: 'drop-shadow(0 0 10px var(--primary-glow))' }} />
          <h2 style={{ fontWeight: 900, color: 'var(--text-color)', fontSize: '1.1rem' }}>So funktioniert's</h2>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--footer-color)', lineHeight: 1.6, maxWidth: '360px', margin: '0 auto' }}>
          Der <strong style={{ color: 'var(--primary-color)' }}>DeFi-Tester</strong> prüft, ob dein Defibrillator
          die richtige Schockenergie abgibt — in <strong>4 einfachen Schritten</strong>.
        </p>
      </div>

      {/* Step cards */}
      {steps.map((s, idx) => {
        const Icon = s.icon;
        return (
          <div key={s.step} className="bump p-md flex-col gap-sm info-step-card">
            {/* Step header */}
            <div className="flex-row align-center gap-sm">
              <div className="info-step-number">
                <span>{s.step}</span>
              </div>
              <div className="flex-col" style={{ gap: '1px' }}>
                <div className="flex-row align-center gap-xs">
                  <Icon size={14} color="var(--primary-color)" />
                  <h3 style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '0.9rem', margin: 0 }}>
                    {s.title}
                  </h3>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--footer-color)', textTransform: 'uppercase', letterSpacing: '0.06rem', fontWeight: 700 }}>
                  {s.subtitle}
                </span>
              </div>
            </div>

            {/* Animated step connector line (between steps) */}
            {idx < steps.length - 1 && (
              <div className="info-step-connector" />
            )}

            {/* SVG Diagram */}
            <div className="info-diagram-container">
              <s.diagram />
            </div>

            {/* Detail bullets */}
            <div className="flex-col gap-xs" style={{ paddingLeft: '4px' }}>
              {s.details.map((d, i) => (
                <div key={i} className="flex-row gap-xs" style={{ alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--primary-color)', fontSize: '0.7rem', lineHeight: 1.5, flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-color)', lineHeight: 1.5, opacity: 0.85 }}>
                    {d}
                  </span>
                </div>
              ))}
            </div>

            {/* Pro tip */}
            <div className="info-tip">
              {s.tip}
            </div>
          </div>
        );
      })}

      {/* Footer encouragement */}
      <div className="bump p-md flex-col align-center gap-xs" style={{ textAlign: 'center' }}>
        <Copy size={20} color="var(--primary-color)" style={{ filter: 'drop-shadow(0 0 6px var(--primary-glow))' }} />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-color)', fontWeight: 700 }}>
          Fertig! 🎉
        </p>
        <p style={{ fontSize: '0.68rem', color: 'var(--footer-color)', lineHeight: 1.5 }}>
          Jetzt kannst du jedes Gerät in Sekunden testen.<br />
          Kein Taschenrechner, keine Zettel — einfach App auf, Werte rein, fertig.
        </p>
      </div>
    </div>
  );
};
