import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  User,
  DoorOpen,
  Check,
  ShieldCheck,
  UploadCloud,
  AlertTriangle
} from 'lucide-react';
import { DockRecord, CompanyUnit, DockStatus, DockOperation, PodStatus, Language } from '../types';
import { t } from '../utils/translations';
import { CSVImportModal } from './CSVImportModal';
import { downloadSampleCSVTemplate, CSVImportResult } from '../utils/csvImportUtils';

interface DockTurnaroundTableProps {
  records: DockRecord[];
  lang: Language;
  onUpdateStatus: (id: string, newStatus: DockStatus) => void;
  onBulkUpdateStatus?: (ids: string[], newStatus: DockStatus) => void;
  onDeleteRecord: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onEditRecord: (record: DockRecord) => void;
  onQuickComplete?: (id: string) => void;
  onApplyCSVImport?: (records: DockRecord[]) => void;
}

export const DockTurnaroundTable: React.FC<DockTurnaroundTableProps> = ({
  records,
  lang,
  onUpdateStatus,
  onBulkUpdateStatus,
  onDeleteRecord,
  onBulkDelete,
  onEditRecord,
  onQuickComplete,
  onApplyCSVImport,
}) => {
  const dict = t[lang];

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeUnitFilter, setActiveUnitFilter] = useState<string>('All');
  const [activeGateFilter, setActiveGateFilter] = useState<string>('All');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');
  const [activeOpFilter, setActiveOpFilter] = useState<string>('All');
  const [activePodFilter, setActivePodFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'startTime' | 'vehicleNo' | 'gateNo'>('startTime');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState<boolean>(false);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);

  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  const handleApplyImport = (updatedRecords: DockRecord[], summary: CSVImportResult) => {
    if (onApplyCSVImport) {
      onApplyCSVImport(updatedRecords);
    }
    const msg = `CSV Updated: ${summary.updatedCount} records corrected, ${summary.addedCount} new entries added!`;
    setCsvSuccessMsg(msg);
    setTimeout(() => setCsvSuccessMsg(null), 6000);
  };

  // Helper: Turnaround Time (TAT) calculation
  const calculateTAT = (startStr: string, exitStr?: string, status?: DockStatus) => {
    if (!startStr) return { text: '--', isElapsed: false };
    if (!exitStr) {
      if (status === 'Gate-In Waiting') {
        return { text: lang === 'hi' ? 'वेटिंग' : 'Waiting', isElapsed: false };
      }
      return { text: dict.inDock, isElapsed: true };
    }

    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = exitStr.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
      return { text: '--', isElapsed: false };
    }

    let diffMins = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMins < 0) diffMins += 24 * 60; // Midnight rollover

    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return {
      text: `${hrs > 0 ? hrs + 'h ' : ''}${mins}m`,
      isElapsed: false,
    };
  };

  // Helper: Format to 12h AM/PM
  const formatTime12H = (timeStr?: string) => {
    if (!timeStr) return '-- : --';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const min = parts[1];
    if (isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${min} ${ampm}`;
  };

  // Helper: Format transporter badge color
  const getTransporterBadge = (name?: string) => {
    if (!name) return <span className="text-slate-400 font-medium">--</span>;
    const tName = name.toUpperCase();
    if (tName.includes('ICRL')) {
      return <span className="font-semibold text-indigo-700">ICRL</span>;
    }
    if (tName.includes('MATA')) {
      return <span className="font-semibold text-blue-700">MATA</span>;
    }
    if (tName.includes('DHTC')) {
      return <span className="font-semibold text-purple-700">DHTC</span>;
    }
    if (tName.includes('FLY GREEN')) {
      return <span className="font-semibold text-emerald-700">FLY GREEN</span>;
    }
    if (tName.includes('OPM')) {
      return <span className="font-semibold text-amber-700">OPM</span>;
    }
    if (tName.includes('VARUNA')) {
      return <span className="font-semibold text-cyan-700">VARUNA</span>;
    }
    if (tName.includes('MCM')) {
      return <span className="font-semibold text-rose-700">MCM</span>;
    }
    if (tName.includes('JEET')) {
      return <span className="font-semibold text-teal-700">JEET</span>;
    }
    return <span className="font-semibold text-slate-700">{name}</span>;
  };

  // Helper: Render POD Badge
  const getPodBadge = (podStatus?: PodStatus) => {
    if (!podStatus || podStatus === 'POD Clean') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          <span>Clean</span>
        </span>
      );
    }
    if (podStatus === 'POD Hold - Damage') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" />
          <span>Hold: Damage</span>
        </span>
      );
    }
    if (podStatus === 'POD Hold - Insurance Claim') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          <span>Hold: Claim</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3" />
        <span>Hold: Shortage</span>
      </span>
    );
  };

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        // Unit Filter
        if (activeUnitFilter !== 'All' && record.unit !== activeUnitFilter) {
          return false;
        }

        // Gate Filter
        if (activeGateFilter !== 'All') {
          const matchNum = activeGateFilter.match(/\d+/);
          const targetNum = matchNum ? parseInt(matchNum[0], 10) : null;
          const recMatch = (record.gateNo || record.binNo || '').match(/\d+/);
          const recNum = recMatch ? parseInt(recMatch[0], 10) : null;
          if (targetNum !== null && recNum !== null) {
            if (targetNum !== recNum) return false;
          } else if (!record.gateNo.toLowerCase().includes(activeGateFilter.toLowerCase())) {
            return false;
          }
        }

        // Status Filter
        if (activeStatusFilter !== 'All' && record.status !== activeStatusFilter) {
          return false;
        }

        // Operation Filter
        if (activeOpFilter !== 'All' && record.operation !== activeOpFilter) {
          return false;
        }

        // POD Filter
        if (activePodFilter === 'Clean' && record.podStatus && record.podStatus !== 'POD Clean') {
          return false;
        }
        if (activePodFilter === 'Hold' && (!record.podStatus || record.podStatus === 'POD Clean')) {
          return false;
        }

        // Search Term
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          const matchesVehicle = record.vehicleNo.toLowerCase().includes(term);
          const matchesSeal = record.sealNo ? record.sealNo.toLowerCase().includes(term) : false;
          const matchesInvoice = record.invoiceNo ? record.invoiceNo.toLowerCase().includes(term) : false;
          const matchesLr = record.lrNo ? record.lrNo.toLowerCase().includes(term) : false;
          const matchesSupervisor = record.supervisorName.toLowerCase().includes(term);
          const matchesGate = record.gateNo.toLowerCase().includes(term);
          const matchesRemarks = record.remarks ? record.remarks.toLowerCase().includes(term) : false;
          return matchesVehicle || matchesSeal || matchesInvoice || matchesLr || matchesSupervisor || matchesGate || matchesRemarks;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [
    records,
    activeUnitFilter,
    activeGateFilter,
    activeStatusFilter,
    activeOpFilter,
    activePodFilter,
    searchTerm,
    sortField,
    sortAsc,
  ]);

  // Clean up selectedIds if any records deleted
  useEffect(() => {
    const existingIds = new Set(records.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => existingIds.has(id)));
  }, [records]);

  // Master checkbox logic
  const allFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(r.id));
  const someFilteredSelected =
    filteredRecords.some((r) => selectedIds.includes(r.id)) && !allFilteredSelected;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredRecords.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const filteredIds = filteredRecords.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (newStatus: DockStatus) => {
    if (selectedIds.length === 0) return;
    if (onBulkUpdateStatus) {
      onBulkUpdateStatus(selectedIds, newStatus);
    } else {
      selectedIds.forEach((id) => onUpdateStatus(id, newStatus));
    }
    setSelectedIds([]);
  };

  const handleBulkDeleteRecords = () => {
    if (selectedIds.length === 0) return;
    const confirmMsg = `${dict.bulkDeleteConfirm} (${selectedIds.length} ${dict.recordsCount})`;
    if (window.confirm(confirmMsg)) {
      if (onBulkDelete) {
        onBulkDelete(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteRecord(id));
      }
      setSelectedIds([]);
    }
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      'ID',
      'Date',
      'Unit',
      'Gate/Dock',
      'Operation',
      'Vehicle No',
      'Vehicle Type',
      'Seal No',
      'Invoice No',
      'LR No',
      'POD Status',
      'Transporter',
      'Supervisor',
      'Start Time',
      'Exit Time',
      'TAT',
      'Status',
      'Remarks',
    ];

    const rows = filteredRecords.map((r) => {
      const tat = calculateTAT(r.startTime, r.exitTime, r.status).text;
      return [
        `"${r.id}"`,
        `"${r.date}"`,
        `"${r.unit}"`,
        `"${r.gateNo}"`,
        `"${r.operation}"`,
        `"${r.vehicleNo}"`,
        `"${r.vehicleType || ''}"`,
        `"${r.sealNo || ''}"`,
        `"${r.invoiceNo || ''}"`,
        `"${r.lrNo || ''}"`,
        `"${r.podStatus || 'POD Clean'}"`,
        `"${r.transporterName || ''}"`,
        `"${r.supervisorName}"`,
        `"${r.startTime}"`,
        `"${r.exitTime || ''}"`,
        `"${tat}"`,
        `"${r.status}"`,
        `"${r.remarks || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AHPL_AIL_Dock_POD_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUnitBadge = (unit: CompanyUnit) => {
    if (unit === 'AHPL') {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
          AHPL
        </span>
      );
    }
    if (unit === 'AIL') {
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">
          AIL
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200">
        AHPL & AIL
      </span>
    );
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header toolbar */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              <span>{lang === 'hi' ? 'डॉक टर्नअराउंड एवं POD ऑडिट लॉग' : 'Dock TAT & POD Audit Log'}</span>
            </h2>
            <span
              id="rowCount"
              className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-mono"
            >
              {filteredRecords.length} {dict.recordsCount}
            </span>
            {selectedIds.length > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md font-semibold border border-indigo-200 animate-pulse">
                {selectedIds.length} {dict.selectedCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => downloadSampleCSVTemplate()}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Download Sample CSV Template"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">CSV Template</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCSVModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Upload CSV/Excel to correct or update records"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'CSV डेटा अपलोड / सुधार' : 'Upload / Correct CSV'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{dict.exportCsv}</span>
            </button>
          </div>
        </div>

        {/* CSV Import Success Toast */}
        {csvSuccessMsg && (
          <div className="mb-4 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{csvSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setCsvSuccessMsg(null)}
              className="text-emerald-100 hover:text-white p-1"
            >
              &times;
            </button>
          </div>
        )}

        {/* Bulk Actions Floating Toolbar */}
        {selectedIds.length > 0 && (
          <div
            id="dock-bulk-actions"
            className="mb-4 bg-slate-900 text-white p-3 rounded-xl shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {selectedIds.length} {dict.selectedRecords}
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline">
                {dict.bulkActions}:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStatusChange('Completed')}
                className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{dict.markCompleted}</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkStatusChange('In-Progress')}
                className="px-2.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{dict.markInProgress}</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkStatusChange('Gate-In Waiting')}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'वेटिंग मार्क करें' : 'Mark Waiting'}</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDeleteRecords}
                className="px-2.5 py-1.5 text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.bulkDelete}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vehicle no, seal, invoice, LR, supervisor..."
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Gate Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Dock:</span>
              <select
                value={activeGateFilter}
                onChange={(e) => setActiveGateFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1 focus:outline-none"
              >
                <option value="All">{dict.filterAll} Docks</option>
                <optgroup label="AHPL Docks (01–04)">
                  <option value="Dock 01">Dock 01</option>
                  <option value="Dock 02">Dock 02</option>
                  <option value="Dock 03">Dock 03</option>
                  <option value="Dock 04">Dock 04</option>
                </optgroup>
                <optgroup label="AIL Docks (05–09)">
                  <option value="Dock 05">Dock 05</option>
                  <option value="Dock 06">Dock 06</option>
                  <option value="Dock 07">Dock 07</option>
                  <option value="Dock 08">Dock 08</option>
                  <option value="Dock 09">Dock 09</option>
                </optgroup>
              </select>
            </div>

            {/* POD Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">POD:</span>
              <select
                value={activePodFilter}
                onChange={(e) => setActivePodFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1 focus:outline-none font-medium"
              >
                <option value="All">All POD</option>
                <option value="Clean">✔ Clean Only</option>
                <option value="Hold">⚠ Holds / Claims</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Status:</span>
              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1 focus:outline-none"
              >
                <option value="All">{dict.filterAll}</option>
                <option value="Completed">{lang === 'hi' ? 'पूर्ण' : 'Completed'}</option>
                <option value="In-Progress">{lang === 'hi' ? 'प्रगति पर' : 'In-Progress'}</option>
                <option value="Gate-In Waiting">{lang === 'hi' ? 'गेट-इन वेटिंग' : 'Gate-In Waiting'}</option>
              </select>
            </div>
          </div>

          {/* Unit Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">{dict.unit}:</span>
            <div className="flex rounded-md border border-slate-300 bg-white p-0.5 shadow-2xs">
              {(['All', 'AHPL', 'AIL'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setActiveUnitFilter(u)}
                  className={`px-2.5 py-0.5 text-xs font-medium rounded transition cursor-pointer ${
                    activeUnitFilter === u
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {u === 'All' ? dict.filterAll : u}
                </button>
              ))}
            </div>

            {/* Op Type filter */}
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveOpFilter('All')}
                className={`px-2 py-0.5 text-xs rounded font-medium cursor-pointer ${
                  activeOpFilter === 'All' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dict.filterAll}
              </button>
              <button
                type="button"
                onClick={() => setActiveOpFilter('Loading')}
                className={`px-2 py-0.5 text-xs rounded font-medium cursor-pointer ${
                  activeOpFilter === 'Loading' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dict.loading}
              </button>
              <button
                type="button"
                onClick={() => setActiveOpFilter('Unloading')}
                className={`px-2 py-0.5 text-xs rounded font-medium cursor-pointer ${
                  activeOpFilter === 'Unloading' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dict.unloading}
              </button>
            </div>
          </div>
        </div>

        {/* Live Loading & Turnaround Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200 select-none">
              <tr>
                {/* Master Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      ref={masterCheckboxRef}
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                  </div>
                </th>
                <th className="py-3 px-3">{dict.unit}</th>
                <th className="py-3 px-3">Dock</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition"
                  onClick={() => {
                    setSortField('vehicleNo');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Vehicle & Seal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Docs (Inv / LR)</th>
                <th className="py-3 px-3">Transporter</th>
                <th className="py-3 px-3">{dict.supervisor}</th>
                <th className="py-3 px-3">POD Status</th>
                <th className="py-3 px-3">Timing / TAT</th>
                <th className="py-3 px-3">{dict.status}</th>
                <th className="py-3 px-3 text-right">{dict.actions}</th>
              </tr>
            </thead>
            <tbody id="dockTable" className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 px-4 text-center text-slate-400 text-sm">
                    <p className="font-medium text-slate-500">
                      {records.length === 0
                        ? lang === 'hi'
                          ? 'कोई ऑडिट लॉग प्रविष्टि नहीं मिली। ट्रैकिंग शुरू करने के लिए नई मूवमेंट प्रविष्टि सबमिट करें।'
                          : 'No audit log entries found. Submit a new movement entry to start tracking.'
                        : lang === 'hi'
                        ? 'चयनित फ़िल्टर के अनुसार कोई रिकॉर्ड नहीं मिला।'
                        : 'No records match the active search/filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  const tatObj = calculateTAT(record.startTime, record.exitTime, record.status);
                  const timingText = `${formatTime12H(record.startTime)} → ${record.exitTime ? formatTime12H(record.exitTime) : '--:--'}`;

                  return (
                    <tr
                      key={record.id}
                      className={`transition-colors group text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-indigo-50/70 hover:bg-indigo-50 text-slate-900 font-medium'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-3 w-10 text-center"
                        onClick={(e) => handleToggleRow(record.id, e)}
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleRow(record.id, e)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          />
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3">
                        {getUnitBadge(record.unit)}
                      </td>

                      {/* Dock */}
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{record.gateNo}</span>
                        </div>
                      </td>

                      {/* Vehicle Details & Seal */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 font-mono text-sm">{record.vehicleNo}</div>
                        <div className="text-[11px] text-slate-500 font-normal flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{record.vehicleType || '32 Ft SXL'} • {record.operation}</span>
                          {(record.location || record.cfaLocation) && (
                            <span className="text-blue-700 bg-blue-50 px-1 rounded text-[10px] border border-blue-200 font-medium">
                              📍 {record.location || record.cfaLocation}
                            </span>
                          )}
                          {record.sealNo && (
                            <span className="font-mono text-slate-700 bg-slate-100 px-1 rounded text-[10px] border border-slate-200">
                              🔒 {record.sealNo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Documents (Invoice / LR) */}
                      <td className="py-3 px-3">
                        {record.invoiceNo || record.lrNo ? (
                          <div className="space-y-0.5 text-xs font-mono">
                            {record.invoiceNo && (
                              <div className="text-slate-800 font-medium">Inv: {record.invoiceNo}</div>
                            )}
                            {record.lrNo && (
                              <div className="text-slate-500 text-[11px]">LR: {record.lrNo}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">--</span>
                        )}
                      </td>

                      {/* Transporter */}
                      <td className="py-3 px-3">
                        {getTransporterBadge(record.transporterName)}
                      </td>

                      {/* Supervisor */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="flex items-center gap-1.5 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{record.supervisorName}</span>
                        </div>
                      </td>

                      {/* POD Status */}
                      <td className="py-3 px-3">
                        {getPodBadge(record.podStatus)}
                      </td>

                      {/* Timing / TAT */}
                      <td className="py-3 px-3">
                        <div className="text-xs text-slate-600 font-mono">{timingText}</div>
                        <div className="mt-0.5 font-mono text-xs">
                          {tatObj.isElapsed ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-600 border border-amber-200">
                              {tatObj.text}
                            </span>
                          ) : record.status === 'Gate-In Waiting' ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                              Waiting
                            </span>
                          ) : (
                            <span className="text-indigo-600 font-bold text-xs">
                              TAT: {tatObj.text}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {record.status === 'Completed' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 inline-block">
                            Completed
                          </span>
                        ) : record.status === 'In-Progress' ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 inline-block">
                            In-Progress
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 inline-block">
                            Gate-In Waiting
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Complete / Exit Time button if in-progress */}
                          {record.status !== 'Completed' && onQuickComplete && (
                            <button
                              type="button"
                              onClick={() => onQuickComplete(record.id)}
                              title={lang === 'hi' ? 'अभी एग्जिट करें एवं पूर्ण मार्क करें' : 'Exit Now & Complete'}
                              className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEditRecord(record)}
                            title={dict.edit}
                            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(dict.deleteConfirm)) {
                                onDeleteRecord(record.id);
                              }
                            }}
                            title={dict.delete}
                            className="p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV / Excel Upload Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        existingRecords={records}
        onApplyImport={handleApplyImport}
        lang={lang}
      />
    </div>
  );
};
