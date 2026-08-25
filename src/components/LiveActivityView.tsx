import React, { useState, useEffect } from 'react';
import {
  Radar,
  Truck,
  User,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  DoorOpen,
  Warehouse,
} from 'lucide-react';
import { DockRecord, Language } from '../types';
import { t } from '../utils/translations';

interface LiveActivityViewProps {
  records: DockRecord[];
  lang: Language;
  onQuickComplete: (id: string) => void;
  onAssignGate: (gateNo: string) => void;
  onEditRecord: (record: DockRecord) => void;
}

const AHPL_DOCKS = ['Dock 1', 'Dock 2', 'Dock 3', 'Dock 4'];
const AIL_DOCKS = ['Dock 5', 'Dock 6', 'Dock 7', 'Dock 8', 'Dock 9'];

export const LiveActivityView: React.FC<LiveActivityViewProps> = ({
  records,
  lang,
  onQuickComplete,
  onAssignGate,
  onEditRecord,
}) => {
  const dict = t[lang];
  const [, setCurrentMinute] = useState<number>(Date.now());

  // Update elapsed ticker every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMinute(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate elapsed time in minutes from a HH:MM start time string
  const calculateElapsed = (startTimeStr: string): { mins: number; formatted: string } => {
    if (!startTimeStr) return { mins: 0, formatted: '0m' };
    try {
      const [sh, sm] = startTimeStr.split(':').map(Number);
      if (isNaN(sh) || isNaN(sm)) return { mins: 0, formatted: '0m' };

      const now = new Date();
      const start = new Date();
      start.setHours(sh, sm, 0, 0);

      let diffMs = now.getTime() - start.getTime();
      if (diffMs < 0) diffMs = 0;

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours > 0) {
        return { mins: diffMins, formatted: `${hours}h ${mins}m` };
      }
      return { mins: diffMins, formatted: `${mins}m` };
    } catch {
      return { mins: 0, formatted: '0m' };
    }
  };

  // Helper to format TAT duration
  const formatTAT = (start: string, exit?: string) => {
    if (!start || !exit) return '--';
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = exit.split(':').map(Number);
      let diff = eh * 60 + em - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h}h ${m}m`;
    } catch {
      return '--';
    }
  };

  // Find active or latest record for a given dock name
  const getDockStatus = (dockName: string) => {
    // 1. Look for In-Progress record
    const inProgress = records.find(
      (r) => r.gateNo.toLowerCase().trim() === dockName.toLowerCase().trim() && r.status === 'In-Progress'
    );
    if (inProgress) return { state: 'in-progress' as const, record: inProgress };

    // 2. Look for Gate-In Waiting record
    const waiting = records.find(
      (r) => r.gateNo.toLowerCase().trim() === dockName.toLowerCase().trim() && r.status === 'Gate-In Waiting'
    );
    if (waiting) return { state: 'waiting' as const, record: waiting };

    // 3. Look for most recent completed record
    const completed = records.find(
      (r) => r.gateNo.toLowerCase().trim() === dockName.toLowerCase().trim() && r.status === 'Completed'
    );
    if (completed) return { state: 'completed' as const, record: completed };

    return { state: 'idle' as const, record: null };
  };

  // Summary counts
  const allDocks = [...AHPL_DOCKS, ...AIL_DOCKS];
  const activeCount = allDocks.filter((d) => getDockStatus(d).state === 'in-progress').length;
  const idleCount = allDocks.length - activeCount;

  // Helper: Transporter text color
  const getTransporterColor = (name?: string) => {
    if (!name) return 'text-slate-700';
    const tName = name.toUpperCase();
    if (tName.includes('ICRL')) return 'text-indigo-600';
    if (tName.includes('MATA')) return 'text-blue-600';
    if (tName.includes('DHTC')) return 'text-purple-600';
    if (tName.includes('FLY GREEN')) return 'text-emerald-600';
    if (tName.includes('OPM')) return 'text-amber-600';
    if (tName.includes('VARUNA')) return 'text-cyan-600';
    if (tName.includes('MCM')) return 'text-rose-600';
    if (tName.includes('JEET')) return 'text-teal-600';
    return 'text-slate-700';
  };

  // Render an individual Dock Bay Card
  const renderDockCard = (dockName: string, wingUnit: 'AHPL' | 'AIL') => {
    const { state, record } = getDockStatus(dockName);

    if (state === 'in-progress' && record) {
      const elapsed = calculateElapsed(record.startTime);
      const isOverSLA = elapsed.mins > 90;

      return (
        <div
          key={dockName}
          className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50/40 shadow-xs hover:shadow-md transition flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800 text-sm">{dockName}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Active"></span>
            </div>

            {/* Details */}
            <div className="space-y-0.5 text-xs mt-2">
              <p className="text-slate-500">
                Vehicle: <span className="font-semibold text-slate-800 font-mono">{record.vehicleNo}</span>
              </p>
              {record.sealNo && (
                <p className="text-slate-500">
                  Seal: <span className="font-mono text-slate-700 font-semibold">{record.sealNo}</span>
                </p>
              )}
              {record.invoiceNo && (
                <p className="text-slate-500">
                  Inv: <span className="font-mono text-slate-700 font-semibold">{record.invoiceNo}</span>
                </p>
              )}
              <p className="text-slate-500">
                Transporter: <span className={`font-semibold ${getTransporterColor(record.transporterName)}`}>
                  {record.transporterName || 'ICRL'}
                </span>
              </p>
              <p className="text-slate-500">
                Sup: <span className="font-semibold text-slate-700">{record.supervisorName}</span>
              </p>
              {record.podStatus && (
                <p className="text-slate-500">
                  POD: <span className={`font-semibold ${record.podStatus === 'POD Clean' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}`}>
                    {record.podStatus}
                  </span>
                </p>
              )}
              {record.vehicleType && (
                <p className="text-[11px] text-slate-400">
                  Type: <span className="text-slate-600">{record.vehicleType}</span>
                </p>
              )}
            </div>

            {/* Status bar */}
            <p className="text-xs text-amber-800 mt-2 font-mono bg-white px-2 py-1 rounded border border-amber-200 flex items-center justify-between">
              <span>{record.operation} ({record.startTime})</span>
              <span className="font-bold text-[10px] text-amber-600">{elapsed.formatted}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="mt-3 pt-2 border-t border-amber-200/80 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onQuickComplete(record.id)}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-1.5 px-2 rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'पूर्ण करें' : 'Exit Now'}</span>
            </button>
            <button
              type="button"
              onClick={() => onEditRecord(record)}
              className="p-1.5 text-slate-600 hover:bg-white rounded-lg transition text-xs border border-amber-200 cursor-pointer"
              title="Edit"
            >
              ✎
            </button>
          </div>
        </div>
      );
    }

    if (state === 'completed' && record) {
      const tat = formatTAT(record.startTime, record.exitTime);

      return (
        <div
          key={dockName}
          className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 shadow-xs hover:shadow-md transition flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800 text-sm">{dockName}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Completed"></span>
            </div>

            {/* Details */}
            <div className="space-y-0.5 text-xs mt-2">
              <p className="text-slate-500">
                Vehicle: <span className="font-semibold text-slate-800 font-mono">{record.vehicleNo}</span>
              </p>
              {record.sealNo && (
                <p className="text-slate-500">
                  Seal: <span className="font-mono text-slate-700 font-semibold">{record.sealNo}</span>
                </p>
              )}
              <p className="text-slate-500">
                Transporter: <span className={`font-semibold ${getTransporterColor(record.transporterName)}`}>
                  {record.transporterName || 'ICRL'}
                </span>
              </p>
              <p className="text-slate-500">
                Sup: <span className="font-semibold text-slate-700">{record.supervisorName}</span>
              </p>
              {record.podStatus && (
                <p className="text-slate-500">
                  POD: <span className={`font-semibold ${record.podStatus === 'POD Clean' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}`}>
                    {record.podStatus}
                  </span>
                </p>
              )}
              {record.vehicleType && (
                <p className="text-[11px] text-slate-400">
                  Type: <span className="text-slate-600">{record.vehicleType}</span>
                </p>
              )}
            </div>

            {/* Exited Badge */}
            <p className="text-xs text-emerald-800 mt-2 font-mono bg-white px-2 py-1 rounded border border-emerald-200 flex items-center justify-between">
              <span>Exited ({record.exitTime || '11:00 AM'})</span>
              <span className="font-bold text-[10px] text-emerald-700">TAT {tat}</span>
            </p>
          </div>

          {/* Quick Assign Action */}
          <div className="mt-3 pt-2 border-t border-emerald-200/80">
            <button
              type="button"
              onClick={() => onAssignGate(dockName)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-2 rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'नया वाहन लगाएं' : '+ Assign Bay'}</span>
            </button>
          </div>
        </div>
      );
    }

    if (state === 'waiting' && record) {
      return (
        <div
          key={dockName}
          className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50/40 shadow-xs hover:shadow-md transition flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-slate-800 text-sm">{dockName}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            </div>
            <div className="space-y-0.5 text-xs mt-2">
              <p className="text-slate-500">
                Vehicle: <span className="font-semibold text-slate-800 font-mono">{record.vehicleNo}</span>
              </p>
              <p className="text-slate-500">
                Transporter: <span className={`font-semibold ${getTransporterColor(record.transporterName)}`}>
                  {record.transporterName || 'ICRL'}
                </span>
              </p>
              <p className="text-slate-500">
                Sup: <span className="font-semibold text-slate-700">{record.supervisorName}</span>
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-2 font-mono bg-white px-2 py-1 rounded border border-blue-200 font-semibold text-center">
              Waiting for Dock
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-blue-200">
            <button
              type="button"
              onClick={() => onEditRecord(record)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-2 rounded-lg transition cursor-pointer"
            >
              {lang === 'hi' ? 'डॉक शुरू करें' : 'Start In-Dock'}
            </button>
          </div>
        </div>
      );
    }

    // Default: Idle Gate
    return (
      <div
        key={dockName}
        className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
      >
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-600 text-sm">{dockName}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">Available / Idle</p>
        </div>

        <div className="mt-4 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => onAssignGate(dockName)}
            className="w-full bg-slate-200 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'असाइन करें' : '+ Assign Dock'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Real-time Gate & Dock Status Board */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Radar className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>{dict.realTimeGateStatus}</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold">
                  {activeCount} / {allDocks.length} {lang === 'hi' ? 'डॉक सक्रिय' : 'Docks Active'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">{dict.realTimeSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{activeCount} {lang === 'hi' ? 'लोडिंग / अनलोडिंग' : 'In Dock'}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              <span>{idleCount} {dict.availableIdle}</span>
            </span>
          </div>
        </div>

        {/* Section 1: AHPL Dedicated Bays (Docks 1 – 4) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                AHPL
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                AHPL Dedicated Bays (Docks 1 – 4)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              4 Docking Bays
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {AHPL_DOCKS.map((dock) => renderDockCard(dock, 'AHPL'))}
          </div>
        </div>

        {/* Section 2: AIL Dedicated Bays (Docks 5 – 9) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                AIL
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                AIL Dedicated Bays (Docks 5 – 9)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              5 Docking Bays
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {AIL_DOCKS.map((dock) => renderDockCard(dock, 'AIL'))}
          </div>
        </div>
      </div>

      {/* Live Timeline / Event Log */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>{dict.liveTimelineTitle}</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Dock</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Vehicle Details</th>
                <th className="py-2.5 px-3">Transporter</th>
                <th className="py-2.5 px-3">Supervisor</th>
                <th className="py-2.5 px-3">Start</th>
                <th className="py-2.5 px-3">Exit</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.slice(0, 8).map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{rec.gateNo}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                        rec.unit === 'AHPL'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : rec.unit === 'AIL'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {rec.unit}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-800 font-mono text-xs">{rec.vehicleNo}</div>
                    <div className="text-[10px] text-slate-400">{rec.vehicleType || '32 Ft SXL'} • {rec.operation}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-xs">
                    <span className={getTransporterColor(rec.transporterName)}>
                      {rec.transporterName || 'ICRL'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 text-xs">{rec.supervisorName}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{rec.startTime}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{rec.exitTime || '--:--'}</td>
                  <td className="py-2.5 px-3">
                    {rec.status === 'Completed' ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">
                        Completed
                      </span>
                    ) : rec.status === 'In-Progress' ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                        In-Progress
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                        Waiting
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
