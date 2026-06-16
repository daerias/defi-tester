import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Defibrillator } from './data/devices';
import { DeviceSearch } from './components/DeviceSearch';
import { DeviceAssistant } from './components/DeviceAssistant';
import { TestInputs } from './components/TestInputs';
import { ResultBubble } from './components/ResultBubble';
import { TestHistory } from './components/TestHistory';
import { SettingsPanel } from './components/Settings';
import { InfoGuide } from './components/InfoGuide';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ReflectionOverlay } from './components/ReflectionOverlay';
import { ThemeToggle } from './components/ThemeToggle';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { useTheme } from './hooks/useTheme';
import { useHistory } from './hooks/useHistory';
import { useSupportRequests } from './hooks/useSupportRequests';
import { useSound } from './hooks/useSound';
import { Zap, Heart, Wand2, History, Settings, Home, Info } from 'lucide-react';

const panelVariants = {
  initial: (direction: 'left' | 'right' | 'fade') => ({
    opacity: 0,
    x: direction === 'left' ? -40 : direction === 'right' ? 40 : 0,
    y: direction === 'fade' ? 10 : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
  },
  exit: (direction: 'left' | 'right' | 'fade') => ({
    opacity: 0,
    x: direction === 'left' ? -30 : direction === 'right' ? 30 : 0,
  }),
};

const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function App() {
  const [selectedDevice, setSelectedDevice] = useState<Defibrillator | null>(null);
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [hasInput, setHasInput] = useState<boolean>(false);
  const [showAssistant, setShowAssistant] = useState<boolean>(false);
  const [activePanel, setActivePanel] = useState<'main' | 'history' | 'settings' | 'info'>('main');

  const { orientation, normalized } = useDeviceOrientation();
  const { theme, toggle: toggleTheme } = useTheme();
  const { entries, addEntry, clearAll } = useHistory();
  const support = useSupportRequests();
  const { play } = useSound();

  const switchPanel = useCallback((target: 'main' | 'history' | 'settings' | 'info') => {
    if (activePanel === target) return;
    play('click');
    setActivePanel(target);
  }, [activePanel, play]);

  const handleResultChange = useCallback((passed: boolean | null) => {
    if (passed === null) {
      setHasInput(false);
      setIsPassed(false);
    } else {
      setIsPassed(passed);
      setHasInput(true);
    }
  }, []);

  const handleSaveTest = useCallback((device: Defibrillator, measuredValues: number[], passed: boolean) => {
    if (measuredValues.length === 0) return;
    
    const shockCount = Math.min(measuredValues.length, device.standardShocks.length);
    const targetValues = device.standardShocks.slice(0, shockCount).map(s => s.targetEnergy);
    const validValues = measuredValues.slice(0, shockCount);
    
    const deviationsJ = validValues.map((v, i) => {
      const diff = v - targetValues[i];
      return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}J`;
    });
    const deviationsPct = validValues.map((v, i) => {
      const diff = ((v - targetValues[i]) / targetValues[i]) * 100;
      return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
    });

    const deviceLabel = device.model.toLowerCase().startsWith(device.manufacturer.toLowerCase())
      ? device.model
      : `${device.manufacturer} ${device.model}`;

    const getToleranceText = () => {
      const t = device.tolerance;
      let text = `\u00b1${t.type === 'percentage' ? `${t.value}%` : `${t.value}J`}`;
      if (t.greater_of) text += ` or \u00b1${t.greater_of.value}J`;
      return text;
    };

    addEntry({
      timestamp: Date.now(),
      deviceId: device.id,
      deviceLabel,
      category: device.category,
      measuredValues: validValues,
      targetValues,
      deviationsJ,
      deviationsPct,
      passed,
      tolerance: getToleranceText(),
    });
  }, [addEntry]);

  const handleDeviceSelect = useCallback((dev: Defibrillator | null) => {
    setSelectedDevice(dev);
    setHasInput(false);
    setIsPassed(false);
    setActivePanel('main');
  }, []);

  const handleHome = useCallback(() => {
    setActivePanel('main');
    setSelectedDevice(null);
    setHasInput(false);
    setIsPassed(false);
    setShowAssistant(false);
  }, []);

  return (
    <>
      <AnimatedBackground />
      <ReflectionOverlay 
        orientation={normalized} 
        isActive={orientation.active} 
      />

      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        <header className="app-header" style={{ position: 'relative' }}>
          {/* Home button */}
          <button
            className="extruded header-btn header-home-btn"
            onClick={handleHome}
            title="Home"
          >
            <span className="icon-wrapper">
              <Home size={20} color="var(--primary-color)" />
            </span>
          </button>
          
          <button
            className="extruded header-btn"
            onClick={() => switchPanel(activePanel === 'history' ? 'main' : 'history')}
            title="Verlauf"
          >
            <span className="icon-wrapper">
              <History size={20} color={activePanel === 'history' ? 'var(--primary-color)' : 'var(--extruded-color)'} />
            </span>
          </button>
          <button
            className="extruded header-btn"
            onClick={() => switchPanel(activePanel === 'info' ? 'main' : 'info')}
            title="Anleitung"
          >
            <span className="icon-wrapper">
              <Info size={20} color={activePanel === 'info' ? 'var(--primary-color)' : 'var(--extruded-color)'} />
            </span>
          </button>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flex: 1,
          }}>
            <Zap size={32} color="var(--primary-color)" className="icon-neumorph-glow" style={{ filter: 'drop-shadow(0 0 14px var(--primary-glow)) drop-shadow(0 0 30px var(--primary-glow))' }} />
            <h1 className="app-title shimmer-text title-float">DeFi Tester</h1>
          </div>
          <div className="flex-row align-center gap-xs">
            <button
              className="extruded header-btn"
              onClick={() => switchPanel(activePanel === 'settings' ? 'main' : 'settings')}
              title="Einstellungen"
            >
              <span className="icon-wrapper">
                <Settings size={20} color={activePanel === 'settings' ? 'var(--primary-color)' : 'var(--extruded-color)'} />
              </span>
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>
        
        <main className="app-main panel-container">
          <AnimatePresence mode="sync" custom={activePanel === 'main' ? 'fade' : 'left'}>
            {/* History Panel */}
            {activePanel === 'history' && (
              <motion.div
                key="history"
                className="flex-col gap-md"
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                custom="left"
                transition={{ duration: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <h2 style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '1rem' }}>Testverlauf</h2>
                <TestHistory entries={entries} />
              </motion.div>
            )}

            {/* Info Panel */}
            {activePanel === 'info' && (
              <motion.div
                key="info"
                className="flex-col gap-md"
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                custom="left"
                transition={{ duration: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <h2 style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '1rem' }}>Anleitung</h2>
                <InfoGuide />
              </motion.div>
            )}

            {/* Settings Panel */}
            {activePanel === 'settings' && (
              <motion.div
                key="settings"
                className="flex-col gap-md"
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                custom="left"
                transition={{ duration: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <h2 style={{ fontWeight: 800, color: 'var(--text-color)', fontSize: '1rem' }}>Einstellungen</h2>
                <SettingsPanel 
                  historyCount={entries.length}
                  onClearHistory={clearAll}
                  supportRequests={support.requests}
                  onAddSupportRequest={support.addRequest}
                  onRemoveSupportRequest={support.removeRequest}
                  onClearSupportRequests={support.clearAll}
                  onExportSupportRequests={support.exportMd}
                />
              </motion.div>
            )}

            {/* Main Panel */}
            {activePanel === 'main' && (
              <motion.div
                key="main"
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <AnimatePresence mode='popLayout'>
                  {!showAssistant ? (
                    <motion.div
                      key="search"
                      className="search-section bump breathe flex-col gap-sm"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <DeviceSearch 
                        onSelect={handleDeviceSelect} 
                        orientation={normalized}
                      />
                      <button
                        className="assistant-launch-btn"
                        onClick={() => {
                          play('open');
                          setShowAssistant(true);
                        }}
                      >
                        <span className="wand-icon">
                          <Wand2 size={22} strokeWidth={1.8} color="var(--primary-color)" />
                        </span>
                        <span className="assistant-btn-text">Assistent</span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="assistant"
                      className="search-section"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <DeviceAssistant
                        onSelect={(dev) => {
                          play('success');
                          handleDeviceSelect(dev);
                          setShowAssistant(false);
                        }}
                        onClose={() => {
                          play('close');
                          setShowAssistant(false);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {selectedDevice && (
                  <motion.div
                    className="test-section"
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    {hasInput && (
                      <div className="result-section">
                        <ResultBubble 
                          isPassed={isPassed} 
                          hasInput={hasInput}
                          orientation={normalized}
                        />
                      </div>
                    )}

                    <TestInputs 
                      device={selectedDevice} 
                      onResultChange={handleResultChange}
                      onSaveTest={handleSaveTest}
                      orientation={normalized}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span className="footer-icon-wrap footer-icon-heart">
              <Heart size={12} color="var(--error-color)" />
            </span>
            <span>DeFi-Tester &copy; {new Date().getFullYear()}</span>
            <span className="footer-icon-wrap footer-icon-zap">
              <Zap size={12} color="var(--primary-color)" />
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
