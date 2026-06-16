import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { devices } from '../data/devices';
import type { Defibrillator } from '../data/devices';
import { Search, ChevronDown, X, Factory, Cpu } from 'lucide-react';
import { useParallax } from '../hooks/useParallax';
import type { NormalizedOrientation } from '../hooks/useDeviceOrientation';
import { motion, easeOut } from 'motion/react';

interface Props {
  onSelect: (device: Defibrillator | null) => void;
  orientation?: NormalizedOrientation;
}

const DustParticles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      dx: `${(Math.random() - 0.5) * 30}px`,
      dy: `${(Math.random() - 0.5) * 30}px`,
      duration: `${3 + Math.random() * 4}s`,
      delay: `${Math.random() * 2}s`,
      size: `${0.5 + Math.random() * 1.5}px`
    }));
  }, []);

  return (
    <div className="dust-container">
      {particles.map(p => (
        <div 
          key={p.id} 
          className="dust-particle"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            '--dx': p.dx,
            '--dy': p.dy,
            animationDuration: p.duration,
            animationDelay: p.delay
          } as any}
        />
      ))}
    </div>
  );
};

const MagneticChip = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string, 
  isActive: boolean, 
  onClick: () => void 
}) => {
  const chipRef = useRef<HTMLDivElement>(null);
  const [isSnapping, setIsSnapping] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chipRef.current || isActive) return;
    
    const rect = chipRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    
    // Only update DOM directly — no setState, no re-renders
    chipRef.current.style.transform = `translate3d(${dx * 0.4}px, ${dy * 0.4}px, 0) rotateX(${-dy * 0.2}deg) rotateY(${dx * 0.2}deg)`;
    chipRef.current.style.zIndex = '100';
  };

  const handleMouseLeave = () => {
    if (!chipRef.current) return;
    setIsSnapping(true);
    chipRef.current.style.transform = 'translate3d(0px, 0px, 0) rotateX(0deg) rotateY(0deg)';
    chipRef.current.style.zIndex = '1';
    
    setTimeout(() => setIsSnapping(false), 600);
  };

  return (
    <div 
      ref={chipRef}
      className={`manufacturer-chip ${isActive ? 'active' : ''} ${isSnapping ? 'snapping' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {isActive && <DustParticles />}
      <span style={{ position: 'relative', zIndex: 2 }}>{label}</span>
    </div>
  );
};

export const DeviceSearch: React.FC<Props> = ({ onSelect, orientation }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const chipAreaRef = useRef<HTMLDivElement>(null);
  const inputAnchorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useParallax({ maxTilt: 6, factor: 1 });

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    if (!chipAreaRef.current) return;
    const rect = chipAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    chipAreaRef.current.style.setProperty('--mx', `${x}px`);
    chipAreaRef.current.style.setProperty('--my', `${y}px`);
  };

  const manufacturers = useMemo(() => 
    Array.from(new Set(devices.map(d => d.manufacturer))).sort()
  , []);

  const groupedDevices = useMemo(() => {
    let results = devices;
    if (selectedManufacturer) {
      results = results.filter(d => d.manufacturer === selectedManufacturer);
    }
    if (query.trim() !== '') {
      const qTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      results = results.filter(d => {
        const text = `${d.manufacturer} ${d.model}`.toLowerCase();
        return qTerms.every(term => text.includes(term));
      });
    }

    const groups: Record<string, Defibrillator[]> = {};
    results.forEach(dev => {
      if (!groups[dev.manufacturer]) groups[dev.manufacturer] = [];
      groups[dev.manufacturer].push(dev);
    });

    const sortedGroups: Array<{ manufacturer: string, items: Defibrillator[] }> = [];
    Object.keys(groups).sort().forEach(m => {
      sortedGroups.push({
        manufacturer: m,
        items: groups[m].sort((a, b) => a.model.localeCompare(b.model))
      });
    });

    return sortedGroups;
  }, [query, selectedManufacturer]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideWrapper = wrapperRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideWrapper && !insideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (device: Defibrillator) => {
    setQuery(`${device.manufacturer} ${device.model}`); 
    setIsOpen(false);
    onSelect(device);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedManufacturer(null);
    setIsOpen(false);
    onSelect(null);
  };

  const toggleManufacturer = (m: string | null) => {
    if (selectedManufacturer === m) {
      setSelectedManufacturer(null);
    } else {
      setSelectedManufacturer(m);
      setIsOpen(true);
    }
  };

  const getDropdownStyle = (): React.CSSProperties => {
    if ('top' in dropdownStyleRef.current) return dropdownStyleRef.current;
    if (!inputAnchorRef.current) return {};
    const rect = inputAnchorRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    };
  };

  // DOM-based repositioning (no React re-renders on scroll)
  const dropdownStyleRef = useRef<React.CSSProperties>({});
  
  useEffect(() => {
    if (!isOpen) return;
    let rafId = 0;
    let lastTop = 0;
    let lastLeft = 0;
    let lastWidth = 0;
    
    const reposition = () => {
      if (!inputAnchorRef.current) return;
      const rect = inputAnchorRef.current.getBoundingClientRect();
      // Skip update if position hasn't meaningfully changed (< 1px)
      if (Math.abs(rect.bottom - lastTop) < 1 && Math.abs(rect.left - lastLeft) < 1 && Math.abs(rect.width - lastWidth) < 1) return;
      lastTop = rect.bottom;
      lastLeft = rect.left;
      lastWidth = rect.width;
      
      dropdownStyleRef.current = {
        position: 'fixed',
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      };
      
      // Direct DOM update — no React re-render
      if (dropdownRef.current) {
        dropdownRef.current.style.top = `${rect.bottom}px`;
        dropdownRef.current.style.left = `${rect.left}px`;
        dropdownRef.current.style.width = `${rect.width}px`;
      }
    };
    
    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(() => { rafId = 0; reposition(); });
    };
    
    reposition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isOpen]);

  const containerVariants = {
    hidden: { opacity: 0, scaleY: 0, originY: 0 },
    show: {
      opacity: 1, 
      scaleY: 1,
      transition: {
        duration: 0.12,
        ease: easeOut,
        staggerChildren: 0.02
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.12 } }
  };

  return (
    <div className="w-full flex-col gap-md" ref={wrapperRef} style={{ position: 'relative', zIndex: 10 }}>
      <svg className="svg-filters" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>
      
      <div className="flex-col gap-sm">
        <label className="flex-row align-center gap-xs" style={{ fontSize: '0.8rem', color: 'var(--footer-color)', paddingLeft: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
          <Factory size={16} color="var(--primary-color)" /> Hersteller
        </label>
        <div 
          ref={chipAreaRef} 
          className="chip-wrapper"
          onMouseMove={handleGlobalMouseMove}
          style={{
            ...(orientation ? {
              transform: `perspective(800px) rotateX(${-orientation.tiltX * 3}deg) rotateY(${orientation.tiltY * 3}deg)`,
              transition: 'transform 0.2s ease-out',
            } : {}),
          }}
        >
          <div className="chip-container" style={{ perspective: '1000px' }}>
            <MagneticChip 
              label="Alle" 
              isActive={selectedManufacturer === null} 
              onClick={() => toggleManufacturer(null)} 
            />
            {manufacturers.map(m => (
              <MagneticChip 
                key={m}
                label={m}
                isActive={selectedManufacturer === m}
                onClick={() => toggleManufacturer(m)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-col gap-xs">
        <label htmlFor="device-search-input" className="flex-row align-center gap-xs" style={{ fontSize: '0.8rem', color: 'var(--footer-color)', paddingLeft: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
          <Search size={14} color="var(--primary-color)" /> Gerätesuche
        </label>
        <div 
          ref={inputAnchorRef}
          className="dent flex-row align-center w-full glow-border" 
          style={{ padding: '14px 20px', position: 'relative', borderRadius: '18px' }}
        >
          <Search size={22} color="var(--primary-color)" style={{ marginRight: '18px', filter: 'drop-shadow(0 0 6px var(--primary-glow))', flexShrink: 0 }} />
          <input 
            id="device-search-input"
            name="device-search"
            className="dent" 
            style={{ padding: 0, boxShadow: 'none', fontSize: '1.1rem', background: 'transparent', flex: 1, fontWeight: 700, caretColor: 'var(--primary-color)' }}
            type="text" 
            placeholder="Modell suchen..." 
            autoComplete="off"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (val.trim() !== '') {
                setIsOpen(true);
              } else {
                setIsOpen(false);
                onSelect(null);
              }
            }}
            onFocus={() => setIsOpen(true)}
          />
          {query ? (
            <button
              type="button"
              aria-label="Suche löschen"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                marginLeft: '4px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={22} color="var(--footer-color)" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={isOpen ? 'Geräteliste schließen' : 'Alle Geräte anzeigen'}
              onClick={() => {
                if (!isOpen) {
                  setSelectedManufacturer(null);
                  setIsOpen(true);
                } else {
                  setIsOpen(false);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                marginLeft: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.3s ease',
              }}
            >
              <ChevronDown size={22} color="var(--footer-color)" style={{ transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
          )}
        </div>
      </div>

      {isOpen && groupedDevices.length > 0 && createPortal(
        <motion.div 
          ref={dropdownRef}
          className="device-list-container attached wave-border"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ 
            ...getDropdownStyle(),
            maxHeight: '350px', 
            overflowY: 'auto',
            paddingBottom: '10px'
          }}
        >
          {groupedDevices.map(group => (
            <div key={group.manufacturer} className="flex-col">
              <div className="group-header">
                <Cpu size={12} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
                {group.manufacturer}
              </div>
              {group.items.map(dev => (
                <motion.div 
                  key={dev.id} 
                  variants={itemVariants}
                  className="flex-row align-center gap-sm device-item"
                  style={{ padding: '10px 15px', cursor: 'pointer' }}
                  onClick={() => handleSelect(dev)}
                >
                  <div style={{ 
                    width: '38px', 
                    height: '38px', 
                    background: 'var(--device-img-bg)', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px',
                    boxShadow: 'inset 2px 2px 6px var(--shadow-dark), inset -1px -1px 2px var(--shadow-light)',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}>
                    <img 
                      src={dev.imageUrl || "/aed.png"} 
                      alt="Defi" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="flex-col">
                    <div style={{ fontWeight: '600', color: 'var(--text-color)', fontSize: '0.95rem' }}>{dev.model}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </motion.div>,
        document.body
      )}
      {isOpen && groupedDevices.length === 0 && createPortal(
        <motion.div 
          ref={dropdownRef}
          className="device-list-container"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={getDropdownStyle()}
        >
          <div style={{ padding: '30px', color: 'var(--footer-color)', textAlign: 'center', fontStyle: 'italic' }}>
            {query.trim() !== '' ? 'Keine Geräte gefunden' : 'Keine Geräte verfügbar'}
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
};
