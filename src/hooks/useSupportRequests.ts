import { useState, useEffect, useCallback } from 'react';

export interface SupportRequest {
  id: string;
  deviceName: string;
  note: string;
  timestamp: number;
}

const STORAGE_KEY = 'stk-defi-support-requests';

function loadRequests(): SupportRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveRequests(requests: SupportRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {
    // localStorage full or unavailable
  }
}

export function generateMdExport(requests: SupportRequest[]): string {
  const sorted = [...requests].sort((a, b) => a.timestamp - b.timestamp);
  if (sorted.length === 0) return '# Support-Anfragen\n\n_Keine Anfragen vorhanden._\n';

  const lines: string[] = [
    '# Support-Anfragen — Neue Defibrillatoren',
    '',
    `> Generiert am ${new Date().toLocaleString('de-DE')}`,
    `> ${sorted.length} Anfrage${sorted.length !== 1 ? 'n' : ''}`,
    '',
    '---',
    '',
  ];

  for (const req of sorted) {
    const date = new Date(req.timestamp).toLocaleString('de-DE');
    lines.push(`## ${req.deviceName}`);
    lines.push('');
    lines.push(`- **Datum:** ${date}`);
    lines.push(`- **ID:** \`${req.id}\``);
    if (req.note.trim()) {
      lines.push(`- **Notiz:** ${req.note.trim()}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadMdFile(requests: SupportRequest[]): void {
  const md = generateMdExport(requests);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `support-anfragen-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface UseSupportRequestsReturn {
  requests: SupportRequest[];
  addRequest: (deviceName: string, note: string) => void;
  removeRequest: (id: string) => void;
  clearAll: () => void;
  exportMd: () => void;
}

export function useSupportRequests(): UseSupportRequestsReturn {
  const [requests, setRequests] = useState<SupportRequest[]>(loadRequests);

  useEffect(() => {
    saveRequests(requests);
  }, [requests]);

  const addRequest = useCallback((deviceName: string, note: string) => {
    const newReq: SupportRequest = {
      id: crypto.randomUUID(),
      deviceName: deviceName.trim(),
      note: note.trim(),
      timestamp: Date.now(),
    };
    setRequests(prev => [newReq, ...prev]);
  }, []);

  const removeRequest = useCallback((id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setRequests([]);
  }, []);

  const exportMd = useCallback(() => {
    downloadMdFile(requests);
  }, [requests]);

  return { requests, addRequest, removeRequest, clearAll, exportMd };
}
