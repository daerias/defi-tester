import { Sun, Moon } from 'lucide-react';
import { useSound } from '../hooks/useSound';

interface Props {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<Props> = ({ theme, onToggle }) => {
  const { play } = useSound();

  const handleToggle = () => {
    play('click');
    onToggle();
  };

  return (
    <button
      onClick={handleToggle}
      className="theme-toggle"
      aria-label={theme === 'dark' ? 'Zum Light-Modus wechseln' : 'Zum Dark-Modus wechseln'}
      title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
          transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(0.8)',
          opacity: 1,
        }}
      >
        {theme === 'dark' ? (
          <Moon
            size={22}
            color="var(--primary-color)"
            style={{
              filter: 'drop-shadow(0 0 8px var(--primary-glow))',
            }}
          />
        ) : (
          <Sun
            size={22}
            color="var(--primary-color)"
            style={{
              filter: 'drop-shadow(0 0 12px var(--primary-glow))',
            }}
          />
        )}
      </div>
    </button>
  );
};
