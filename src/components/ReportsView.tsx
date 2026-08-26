import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Code2,
  Copy,
  Check,
  Paperclip,
  Eye,
  Trash2,
  Edit,
  ExternalLink,
  UploadCloud,
  X,
} from 'lucide-react';
import { DockRecord, CompanyUnit, DockOperation, DockStatus, PodStatus, Language, AttachedDocument } from '../types';
import { t } from '../utils/translations';
import { exportToExcel, exportToPDF, downloadHTMLReport, generateHTMLReport, downloadStandaloneAppHTML } from '../utils/exportUtils';
import { CSVImportModal } from './CSVImportModal';
import { downloadSampleCSVTemplate, CSVImportResult } from '../utils/csvImportUtils';

interface ReportsViewProps {
  records: DockRecord[];
  lang: Language;
  onEditRecord: (record: DockRecord) => void;
  onDeleteRecord: (id: string) => void;
  onApplyCSVImport?: (records: DockRecord[]) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  lang,
  onEditRecord,
  onDeleteRecord,
  onApplyCSVImport,
}) => {
  const dict = t[lang];

  // Filters State
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  const [filterSupervisor, setFilterSupervisor] = useState<string>('ALL');
  const [filterOperation, setFilterOperation] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPod, setFilterPod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Modals / Copied state
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<{ doc: AttachedDocument; vehicleNo: string } | null>(null);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState<boolean>(false);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);

  const handleApplyImport = (updatedRecords: DockRecord[], summary: CSVImportResult) => {
    if (onApplyCSVImport) {
      onApplyCSVImport(updatedRecords);
    }
    const msg = `CSV Update Complete: ${summary.updatedCount} records corrected, ${summary.addedCount} new entries added!`;
    setCsvSuccessMsg(msg);
    setTimeout(() => setCsvSuccessMsg(null), 6000);
  };

  // Extract unique supervisors
  const uniqueSupervisors = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.supervisorName) set.add(r.supervisorName);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Date range filter
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;

      // Unit filter
      if (filterUnit !== 'ALL') {
        if (filterUnit === 'AHPL' && r.unit !== 'AHPL') return false;
        if (filterUnit === 'AIL' && r.unit !== 'AIL') return false;
        if (filterUnit === 'AHPL & AIL' && r.unit !== 'AHPL & AIL') return false;
      }
      // Supervisor filter
      if (filterSupervisor !== 'ALL' && r.supervisorName !== filterSupervisor) {
        return false;
      }
      // Operation filter
      if (filterOperation !== 'ALL' && r.operation !== filterOperation) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'ALL' && r.status !== filterStatus) {
        return false;
      }
      // POD status filter
      if (filterPod !== 'ALL') {
        if (filterPod === 'Clean' && r.podStatus && r.podStatus !== 'POD Clean') return false;
        if (filterPod === 'Hold' && (!r.podStatus || r.podStatus === 'POD Clean')) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchVehicle = r.vehicleNo.toLowerCase().includes(query);
        const matchGate = r.gateNo.toLowerCase().includes(query);
        const matchSupervisor = r.supervisorName.toLowerCase().includes(query);
        const matchId = r.id.toLowerCase().includes(query);
        const matchTransporter = (r.transporterName || '').toLowerCase().includes(query);
        const matchSeal = (r.sealNo || '').toLowerCase().includes(query);
        const matchInvoice = (r.invoiceNo || '').toLowerCase().includes(query);
        const matchLr = (r.lrNo || '').toLowerCase().includes(query);
        const matchRemarks = (r.remarks || '').toLowerCase().includes(query);
        if (
          !matchVehicle &&
          !matchGate &&
          !matchSupervisor &&
          !matchId &&
          !matchTransporter &&
          !matchSeal &&
          !matchInvoice &&
          !matchLr &&
          !matchRemarks
        ) {
          return false;
        }
      }
      return true;
    });
  }, [records, dateFrom, dateTo, filterUnit, filterSupervisor, filterOperation, filterStatus, filterPod, searchQuery]);

  // Helper to compute TAT duration string and minutes
  const getTATData = (start: string, exit?: string) => {
    if (!start || !exit) return { text: '--', minutes: 0 };
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = exit.split(':').map(Number);
      let diff = eh * 60 + em - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return { text: `${h}h ${m}m`, minutes: diff };
    } catch {
      return { text: '--', minutes: 0 };
    }
  };

  // Summary Metrics calculations
  const totalCount = filteredRecords.length;
  const completedCount = filteredRecords.filter((r) => r.status === 'Completed').length;
  const cleanPodCount = filteredRecords.filter((r) => !r.podStatus || r.podStatus === 'POD Clean').length;
  const holdPodCount = totalCount - cleanPodCount;

  let totalMinutes = 0;
  let countWithDuration = 0;

  filteredRecords.forEach((r) => {
    if (r.startTime && r.exitTime) {
      const tat = getTATData(r.startTime, r.exitTime);
      if (tat.minutes > 0) {
        totalMinutes += tat.minutes;
        countWithDuration += 1;
      }
    }
  });

  const avgMinutes = countWithDuration > 0 ? Math.round(totalMinutes / countWithDuration) : 0;
  const avgTatFormatted = `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m`;
  const totalHoursLogged = (totalMinutes / 60).toFixed(1);

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

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      'Report ID',
      'Date',
      'Company Unit',
      'Gate / Dock',
      'Operation',
      'Vehicle Number',
      'Vehicle Type',
      'Seal No',
      'Invoice No',
      'LR No',
      'POD Status',
      'Transporter',
      'Supervisor Name',
      'Start Time',
      'Exit Time',
      'Turnaround Time (TAT)',
      'Status',
      'Remarks',
    ];

    const rows = filteredRecords.map((r) => {
      const tat = getTATData(r.startTime, r.exitTime).text;
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
        `"${r.exitTime || '--'}"`,
        `"${tat}"`,
        `"${r.status}"`,
        `"${(r.remarks || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `AHPL_AIL_Dock_Operations_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Clean HTML Table Handler
  const handleCopyHTML = () => {
    const html = generateHTMLReport(filteredRecords);
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleResetFilters = () => {
    setFilterUnit('ALL');
    setFilterSupervisor('ALL');
    setFilterOperation('ALL');
    setFilterStatus('ALL');
    setFilterPod('ALL');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <span>{lang === 'hi' ? 'रिपोर्ट्स, HTML एवं एक्सपोर्ट हब' : 'Reports, HTML & Data Export Hub'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              AHPL (Docks 1-4) & AIL (Docks 5-9) | Direct Excel, PDF, CSV & Embedded HTML Table
            </p>
          </div>

          {/* Export & Import Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* CSV / Excel Upload to Correct Data */}
            <button
              type="button"
              onClick={() => setIsCSVModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Upload CSV or Excel file to update incorrect fields like Transporter, Location, Supervisor"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{lang === 'hi' ? 'CSV डेटा अपलोड / सुधार' : 'Upload / Correct CSV'}</span>
            </button>

            {/* Download 14-Col Template */}
            <button
              type="button"
              onClick={() => downloadSampleCSVTemplate()}
              className="border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Download standard 14-column CSV template"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Sample CSV</span>
            </button>

            {/* Single App HTML for GitHub */}
            <button
              type="button"
              onClick={() => downloadStandaloneAppHTML('index.html')}
              className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Download single-file standalone index.html ready for GitHub Pages or repository upload"
            >
              <Download className="w-4 h-4" />
              <span>GitHub Single HTML</span>
            </button>

            {/* Excel (.xlsx) */}
            <button
              type="button"
              onClick={() => exportToExcel(filteredRecords, `AHPL_AIL_Dock_POD_Export_${new Date().toISOString().slice(0, 10)}.xlsx`)}
              disabled={filteredRecords.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            {/* PDF (.pdf) */}
            <button
              type="button"
              onClick={() => exportToPDF(filteredRecords, `AHPL_AIL_Dock_Operations_${new Date().toISOString().slice(0, 10)}.pdf`)}
              disabled={filteredRecords.length === 0}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF (.pdf)</span>
            </button>

            {/* HTML (.html) */}
            <button
              type="button"
              onClick={() => downloadHTMLReport(filteredRecords, `AHPL_AIL_Report_${new Date().toISOString().slice(0, 10)}.html`)}
              disabled={filteredRecords.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>Download HTML</span>
            </button>

            {/* Copy HTML Code */}
            <button
              type="button"
              onClick={handleCopyHTML}
              disabled={filteredRecords.length === 0}
              className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              {copiedHtml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHtml ? 'Copied HTML!' : 'Copy HTML Table'}</span>
            </button>

            {/* CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          {/* Date From */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Unit Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {dict.filterByUnit}
            </label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All (AHPL & AIL)</option>
              <option value="AHPL">AHPL (Docks 01-04)</option>
              <option value="AIL">AIL (Docks 05-09)</option>
            </select>
          </div>

          {/* Supervisor Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {dict.filterBySupervisor}
            </label>
            <select
              value={filterSupervisor}
              onChange={(e) => setFilterSupervisor(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">{dict.allSupervisors}</option>
              {uniqueSupervisors.map((sup) => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>
          </div>

          {/* Operation Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {dict.filterByOperation}
            </label>
            <select
              value={filterOperation}
              onChange={(e) => setFilterOperation(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Operations</option>
              <option value="Loading">{dict.loading}</option>
              <option value="Unloading">{dict.unloading}</option>
            </select>
          </div>

          {/* POD Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              POD Status
            </label>
            <select
              value={filterPod}
              onChange={(e) => setFilterPod(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All PODs</option>
              <option value="Clean">✔ Clean Only</option>
              <option value="Hold">⚠ Holds / Claims</option>
            </select>
          </div>

          {/* Search Input & Reset */}
          <div className="flex items-end gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vehicle / docs..."
                className="w-full border border-slate-300 rounded-lg pl-8 pr-2 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">{dict.totalOperations}</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{totalCount}</p>
            <span className="text-[10px] text-slate-500">Filtered dataset</span>
          </div>
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase">POD Clean Rate</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">
              {totalCount > 0 ? Math.round((cleanPodCount / totalCount) * 100) : 100}%{' '}
              <span className="text-xs font-normal text-emerald-600">
                ({cleanPodCount} / {totalCount})
              </span>
            </p>
            <span className="text-[10px] text-emerald-600 font-medium">Clear dispatches</span>
          </div>
          <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
            <p className="text-[11px] font-semibold text-indigo-800 uppercase">{dict.avgTatTime}</p>
            <p className="text-xl font-bold text-indigo-700 mt-0.5">{avgTatFormatted}</p>
            <span className="text-[10px] text-indigo-600 font-medium">Target &lt; 1h 30m</span>
          </div>
          <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
            <p className="text-[11px] font-semibold text-rose-800 uppercase">POD Holds / Claims</p>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{holdPodCount} cases</p>
            <span className="text-[10px] text-rose-600 font-medium">Pending resolution</span>
          </div>
        </div>

        {/* Detailed Operational Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Date & ID</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3">Dock</th>
                <th className="py-3 px-3">Operation</th>
                <th className="py-3 px-3">Vehicle / Seal</th>
                <th className="py-3 px-3">Docs (Inv / LR)</th>
                <th className="py-3 px-3">POD Status</th>
                <th className="py-3 px-3">Proof / File</th>
                <th className="py-3 px-3">Transporter</th>
                <th className="py-3 px-3">Supervisor</th>
                <th className="py-3 px-3">Timing / TAT</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400 text-xs">
                    No matching records found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const tat = getTATData(rec.startTime, rec.exitTime);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs text-slate-500 block">{rec.date}</span>
                        <span className="font-mono text-[11px] text-slate-700 font-semibold">{rec.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                          rec.unit === 'AHPL' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          rec.unit === 'AIL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {rec.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{rec.gateNo}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            rec.operation === 'Loading'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {rec.operation}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold font-mono text-slate-800">{rec.vehicleNo}</div>
                        {rec.sealNo && (
                          <div className="text-[11px] font-mono text-slate-500">🔒 {rec.sealNo}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">
                        {rec.invoiceNo || rec.lrNo ? (
                          <div>
                            {rec.invoiceNo && <div className="text-slate-800">Inv: {rec.invoiceNo}</div>}
                            {rec.lrNo && <div className="text-slate-500 text-[11px]">LR: {rec.lrNo}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {getPodBadge(rec.podStatus)}
                      </td>
                      <td className="py-3 px-3">
                        {rec.attachedDoc ? (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({ doc: rec.attachedDoc!, vehicleNo: rec.vehicleNo })}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-xs font-medium border border-slate-200 transition cursor-pointer"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate max-w-[80px]" title={rec.attachedDoc.name}>
                              {rec.attachedDoc.name}
                            </span>
                            <Eye className="w-3 h-3 text-slate-400" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">--</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs font-semibold text-slate-700">
                        {rec.transporterName || 'ICRL'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 text-xs">{rec.supervisorName}</td>
                      <td className="py-3 px-3 font-mono text-xs">
                        <div className="text-slate-600">{rec.startTime} → {rec.exitTime || '--:--'}</div>
                        <div className="font-semibold text-indigo-700 mt-0.5">{tat.text}</div>
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditRecord(rec)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRecord(rec.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete"
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

      {/* Attachment Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-indigo-600" />
                  <span>Attached Document: {previewDoc.vehicleNo}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {previewDoc.doc.name} ({(previewDoc.doc.size / 1024).toFixed(1)} KB)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto flex items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
              {previewDoc.doc.type.startsWith('image/') ? (
                <img
                  src={previewDoc.doc.dataUrl}
                  alt={previewDoc.doc.name}
                  className="max-h-[55vh] rounded object-contain"
                />
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">{previewDoc.doc.name}</p>
                  <p className="text-xs text-slate-500">Document ready for download</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <a
                href={previewDoc.doc.dataUrl}
                download={previewDoc.doc.name}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Attachment</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
