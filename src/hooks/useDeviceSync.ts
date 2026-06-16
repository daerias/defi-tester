import { useState, useEffect, useCallback } from 'react';
import { devices as fallbackDevices } from '../data/devices';
import type { Defibrillator } from '../data/devices';

const CACHE_KEY = 'stk-defi-devices-cache';
const CACHE_TIMESTAMP_KEY = 'stk-defi-devices-timestamp';
const SETTINGS_KEY = 'stk-defi-settings';

export interface DeviceSyncState {
  devices: Defibrillator[];
  lastUpdate: number | null;
  loading: boolean;
  error: string | null;
  autoUpdate: boolean;
  updateUrl: string;
}

function loadSettings(): { autoUpdate: boolean; updateUrl: string } {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        autoUpdate: parsed.autoUpdate ?? true,
        updateUrl: parsed.updateUrl ?? '',
      };
    }
  } catch { /* ignore */ }
  return { autoUpdate: true, updateUrl: '' };
}

function saveSettings(settings: { autoUpdate: boolean; updateUrl: string }) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

function getCachedDevices(): { devices: Defibrillator[]; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (raw && ts) {
      return { devices: JSON.parse(raw), timestamp: parseInt(ts, 10) };
    }
  } catch { /* ignore */ }
  return null;
}

function setCachedDevices(devices: Defibrillator[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(devices));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
  } catch { /* ignore */ }
}

export function useDeviceSync() {
  const [state, setState] = useState<DeviceSyncState>(() => {
    const cached = getCachedDevices();
    const settings = loadSettings();
    return {
      devices: cached?.devices || fallbackDevices,
      lastUpdate: cached?.timestamp || null,
      loading: false,
      error: null,
      autoUpdate: settings.autoUpdate,
      updateUrl: settings.updateUrl,
    };
  });

  // Core fetch function — defined first so it can be referenced by others
  const fetchDevicesViaUrl = useCallback(async (fetchUrl: string) => {
    if (!fetchUrl) {
      // No remote URL configured — use fallback
      setState(prev => ({
        ...prev,
        devices: fallbackDevices,
        error: null,
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(fetchUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const parsed = parseDeviceMarkdown(text);

      if (parsed.length === 0) {
        throw new Error('Keine Geräte in der Remote-Liste gefunden');
      }

      setCachedDevices(parsed);
      setState(prev => ({
        ...prev,
        devices: parsed,
        lastUpdate: Date.now(),
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error('Device sync failed:', err);
      const cached = getCachedDevices();
      setState(prev => ({
        ...prev,
        devices: cached?.devices || fallbackDevices,
        lastUpdate: cached?.timestamp || prev.lastUpdate,
        loading: false,
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      }));
    }
  }, []);

  // Public fetch that delegates to core function
  const fetchDevices = useCallback(async (url?: string) => {
    const fetchUrl = url || state.updateUrl;
    await fetchDevicesViaUrl(fetchUrl);
  }, [state.updateUrl, fetchDevicesViaUrl]);

  // Auto-update on mount if enabled — uses localStorage directly to avoid stale closure
  useEffect(() => {
    const settings = loadSettings();
    if (settings.autoUpdate && settings.updateUrl) {
      fetchDevicesViaUrl(settings.updateUrl);
    }
  }, []); // Only run on mount — intentional (uses localStorage, not state)

  const setAutoUpdate = useCallback((enabled: boolean) => {
    const settings = loadSettings();
    const newSettings = { ...settings, autoUpdate: enabled };
    saveSettings(newSettings);
    setState(prev => ({ ...prev, autoUpdate: enabled }));
  }, []);

  const setUpdateUrl = useCallback((url: string) => {
    const settings = loadSettings();
    const newSettings = { ...settings, updateUrl: url };
    saveSettings(newSettings);
    setState(prev => ({ ...prev, updateUrl: url }));
  }, []);

  return {
    ...state,
    fetchDevices,
    setAutoUpdate,
    setUpdateUrl,
  };
}

/**
 * Parses a Markdown-formatted device list.
 * Expected format:
 * 
 * ## Manufacturer Model
 * - category: aed | defibrillator
 * - tolerance: percentage,15,greater_of,2
 * - shocks: 120,150,200
 * - image: /path/to/image.jpg
 * - electrode: /path/to/electrode.jpg
 * - userManual: https://...
 * - serviceManual: https://...
 */
function parseDeviceMarkdown(markdown: string): Defibrillator[] {
  const devices: Defibrillator[] = [];
  const sections = markdown.split(/^## /gm).slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const header = lines[0].trim();
    const [manufacturer, ...modelParts] = header.split(' - ');
    const model = modelParts.join(' - ') || header;

    if (!manufacturer || !model) continue;

    const props: Record<string, string> = {};
    for (const line of lines.slice(1)) {
      const match = line.match(/^-\s*(\w+):\s*(.+)$/);
      if (match) {
        props[match[1]] = match[2].trim();
      }
    }

    const shocks = (props['shocks'] || '').split(',').map(Number).filter(n => !isNaN(n));
    if (shocks.length < 3) continue;

    const category = props['category'] === 'aed' ? 'aed' : 'defibrillator';

    let tolerance: Defibrillator['tolerance'] = { type: 'percentage', value: 15 };
    if (props['tolerance']) {
      const parts = props['tolerance'].split(',');
      if (parts[0] === 'percentage' || parts[0] === 'fixed') {
        tolerance = {
          type: parts[0],
          value: Number(parts[1]) || 15,
        };
        if (parts[2] === 'greater_of' && parts[3]) {
          tolerance.greater_of = { type: 'fixed', value: Number(parts[3]) || 2 };
        }
      }
    }

    const id = `${manufacturer.toLowerCase().replace(/\s+/g, '-')}-${model.toLowerCase().replace(/\s+/g, '-')}`;

    devices.push({
      id,
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      category,
      standardShocks: shocks.map((target, i) => ({
        label: `Schock ${i + 1}`,
        targetEnergy: target,
      })),
      tolerance,
      imageUrl: props['image'],
      electrodeUrl: props['electrode'],
      userManualUrl: props['userManual'],
      serviceManualUrl: props['serviceManual'],
    });
  }

  return devices;
}
