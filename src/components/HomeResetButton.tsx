import { Home, RotateCcw } from 'lucide-react';
import { useState, useCallback } from 'react';

interface HomeResetButtonProps {
  onHome: () => void;
  onReset: () => void;
  showReset: boolean;
}

export function HomeResetButton({ onHome, onReset, showReset }: HomeResetButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  return (
    <>
      {/* Home button - returns to main panel */}
      <button
        className="floating-home"
        onClick={(e) => {
          addRipple(e);
          onHome();
        }}
        title="Zurück zur Startseite"
        aria-label="Zurück zur Startseite"
      >
        <div className="fab-icon-container">
          <Home size={14} color="#fff" />
        </div>
        <span>Home</span>
        {ripples.map(r => (
          <span
            key={r.id}
            className="ripple"
            style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
          />
        ))}
      </button>

      {/* Reset button - clears device selection */}
      {showReset && (
        <button
          className="floating-reset"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          title="Gerät zurücksetzen"
          aria-label="Gerät zurücksetzen"
        >
          <RotateCcw size={18} color="var(--error-color)" />
        </button>
      )}
    </>
  );
}
