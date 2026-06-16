import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  text: string;
  /** Optional label for the toast, defaults to "Kopiert!" */
  label?: string;
}

export const CopyToast: React.FC<Props> = ({ text, label = 'Kopiert!' }) => {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShow(false), 1500);
    } catch {
      // Fallback — silently fail
    }
  };

  return (
    <span
      onClick={handleCopy}
      style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
    >
      {/* Toast */}
      {show && (
        <span style={{
          position: 'absolute',
          top: '-36px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'var(--primary-color)',
          color: '#0d1117',
          fontSize: '0.7rem',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          whiteSpace: 'nowrap',
          animation: 'toastPop 0.3s ease-out',
          boxShadow: '0 4px 16px var(--primary-glow)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <Check size={12} />
          {label}
        </span>
      )}

      <Copy size={10} style={{ opacity: 0.5, marginRight: '2px' }} />
    </span>
  );
};

// Toast animation keyframes injected by CopyToast
// (defined in index.css via @keyframes toastPop for global use)
