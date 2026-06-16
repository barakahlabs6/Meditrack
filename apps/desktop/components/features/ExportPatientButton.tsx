'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Props {
  patientId: number;
  patientName: string;
}

export function ExportPatientButton({ patientId, patientName }: Props) {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  async function handleExport() {
    setExporting(true);
    setMessage('');
    try {
      const [patient, appointments, records] = await Promise.all([
        apiFetch('/patients/' + patientId),
        apiFetch('/appointments'),
        apiFetch('/records?patient_id=' + patientId),
      ]);

      const exportData = JSON.stringify({
        exported_at: new Date().toISOString(),
        patient,
        appointments: appointments.filter((a: any) => a.patient_id === patientId),
        medical_records: records,
      }, null, 2);

      // Check if running inside Tauri
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const result = await invoke<string>('export_patient_record', {
          patientName,
          data: exportData,
        });
        setMessage(result);
      } else {
        // Browser fallback: download as file
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = patientName.replace(/ /g, '-') + '-record.json';
        a.click();
        URL.revokeObjectURL(url);
        setMessage('Downloaded to your browser downloads folder');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft disabled:opacity-50"
      >
        {exporting ? 'Exporting...' : 'Export record'}
      </button>
      {message && (
        <p className="mt-2 text-xs text-muted">{message}</p>
      )}
    </div>
  );
}
