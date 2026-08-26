import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  List,
  Search,
  Download,
  FileText,
  Trash2,
  Edit2,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { MovementRecord, CompanyUnit, MovementType, MovementStatus, Language } from '../types';
import { t } from '../utils/translations';

interface MovementTableProps {
  lang: Language;
  records: MovementRecord[];
  activeUnitFilter: string;
  setActiveUnitFilter: (unit: string) => void;
  activeTypeFilter: string;
  setActiveTypeFilter: (type: string) => void;
  onUpdateStatus: (id: string, newStatus: MovementStatus) => void;
  onBulkUpdateStatus?: (ids: string[], newStatus: MovementStatus) => void;
  onDeleteRecord: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onEditRecord: (record: MovementRecord) => void;
  onViewGatePass: (record: MovementRecord) => void;
}

export const MovementTable: React.FC<MovementTableProps> = ({
  lang,
  records,
  activeUnitFilter,
  setActiveUnitFilter,
  activeTypeFilter,
  setActiveTypeFilter,
  onUpdateStatus,
  onBulkUpdateStatus,
  onDeleteRecord,
  onBulkDelete,
  onEditRecord,
  onViewGatePass,
}) => {
  const dict = t[lang];

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'timestamp' | 'qty' | 'vehicleNo'>('timestamp');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Filtered & Sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        // Unit Filter
        if (activeUnitFilter !== 'All' && rec.unit !== activeUnitFilter) {
          return false;
        }
        // Type Filter
        if (activeTypeFilter !== 'All' && rec.type !== activeTypeFilter) {
          return false;
        }
        // Status Filter
        if (activeStatusFilter !== 'All' && rec.status !== activeStatusFilter) {
          return false;
        }
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesVehicle = rec.vehicleNo.toLowerCase().includes(q);
          const matchesSku = rec.skuDesc.toLowerCase().includes(q);
          const matchesUnit = rec.unit.toLowerCase().includes(q);
          const matchesDriver = rec.driverName?.toLowerCase().includes(q);
          const matchesChallan = rec.challanNo?.toLowerCase().includes(q);
          if (!matchesVehicle && !matchesSku && !matchesUnit && !matchesDriver && !matchesChallan) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'qty') {
          return sortAsc ? a.qty - b.qty : b.qty - a.qty;
        }
        if (sortField === 'vehicleNo') {
          return sortAsc
            ? a.vehicleNo.localeCompare(b.vehicleNo)
            : b.vehicleNo.localeCompare(a.vehicleNo);
        }
        return sortAsc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
      });
  }, [records, activeUnitFilter, activeTypeFilter, activeStatusFilter, searchTerm, sortField, sortAsc]);

  // Clean up selectedIds if any records were deleted
  useEffect(() => {
    const existingRecordIds = new Set(records.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => existingRecordIds.has(id)));
  }, [records]);

  // Handle master checkbox indeterminate and checked state
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

  const handleBulkStatusChange = (newStatus: MovementStatus) => {
    if (selectedIds.length === 0) return;
    if (onBulkUpdateStatus) {
      onBulkUpdateStatus(selectedIds, newStatus);
    } else {
      selectedIds.forEach((id) => onUpdateStatus(id, newStatus));
    }
    // Retain selection or show updated status
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

  const handleExportCSV = (onlySelected = false) => {
    const dataToExport = onlySelected && selectedIds.length > 0
      ? records.filter((r) => selectedIds.includes(r.id))
      : filteredRecords;

    if (dataToExport.length === 0) return;
    const headers = ['Time', 'Date', 'Unit', 'Type', 'Vehicle No', 'Material / SKU', 'Qty', 'Unit Measure', 'Status', 'Driver Name', 'Gate', 'Challan No'];
    const rows = dataToExport.map((r) => [
      `"${r.timestamp}"`,
      `"${r.date}"`,
      `"${r.unit}"`,
      `"${r.type}"`,
      `"${r.vehicleNo}"`,
      `"${r.skuDesc.replace(/"/g, '""')}"`,
      r.qty,
      `"${r.unitMeasure}"`,
      `"${r.status}"`,
      `"${r.driverName || ''}"`,
      `"${r.dockGate || ''}"`,
      `"${r.challanNo || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AHPL_AIL_Warehouse_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUnitBadge = (unit: CompanyUnit) => {
    if (unit === 'AHPL') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
          AHPL
        </span>
      );
    }
    if (unit === 'AIL') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          AIL
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
        AHPL & AIL
      </span>
    );
  };

  const getTypeBadge = (type: MovementType) => {
    if (type === 'Inbound') {
      return (
        <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
          {lang === 'hi' ? 'Inbound (इन)' : 'Inbound'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-purple-100 text-purple-800 border border-purple-200">
        {lang === 'hi' ? 'Outbound (आउट)' : 'Outbound'}
      </span>
    );
  };

  const getStatusBadge = (status: MovementStatus, id: string) => {
    if (status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {lang === 'hi' ? 'पूर्ण' : 'Completed'}
        </span>
      );
    }
    if (status === 'In-Progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600 animate-spin" />
          {lang === 'hi' ? 'प्रगति पर' : 'In-Progress'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <AlertCircle className="w-3 h-3 text-slate-500" />
        {lang === 'hi' ? 'पेंडिंग' : 'Pending'}
      </span>
    );
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        {/* Table Title & Top Controls */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <List className="w-5 h-5 text-indigo-600" />
              <span>{dict.tableTitle}</span>
            </h2>
            <span
              id="rowCount"
              className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono font-semibold border border-slate-200"
            >
              {filteredRecords.length} {dict.recordsCount}
            </span>
            {selectedIds.length > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md font-semibold border border-indigo-200 animate-pulse">
                {selectedIds.length} {dict.selectedCount}
              </span>
            )}
          </div>

          {/* Quick Action: Export CSV */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="exportCsvBtn"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>{dict.exportCsv}</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions Floating / Banner Bar */}
        {selectedIds.length > 0 && (
          <div
            id="bulk-actions-toolbar"
            className="mb-4 bg-slate-900 text-white p-3 sm:p-3.5 rounded-xl shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2.5">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {selectedIds.length} {dict.selectedRecords}
              </span>
              <span className="text-xs text-slate-300 hidden sm:inline">
                {dict.bulkActions}:
              </span>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Mark Completed */}
              <button
                type="button"
                onClick={() => handleBulkStatusChange('Completed')}
                className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                title={dict.markCompleted}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                <span>{dict.markCompleted}</span>
              </button>

              {/* Mark In-Progress */}
              <button
                type="button"
                onClick={() => handleBulkStatusChange('In-Progress')}
                className="px-2.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                title={dict.markInProgress}
              >
                <Clock className="w-3.5 h-3.5 text-slate-900" />
                <span>{dict.markInProgress}</span>
              </button>

              {/* Mark Pending */}
              <button
                type="button"
                onClick={() => handleBulkStatusChange('Pending')}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                title={dict.markPending}
              >
                <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                <span>{dict.markPending}</span>
              </button>

              {/* Bulk Delete */}
              <button
                type="button"
                onClick={handleBulkDeleteRecords}
                className="px-2.5 py-1.5 text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                title={dict.bulkDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.bulkDelete}</span>
              </button>

              {/* Deselect / Clear All */}
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1 cursor-pointer"
                title={dict.clearSelection}
              >
                <X className="w-4 h-4" />
                <span className="text-[11px] hidden md:inline">{dict.clearSelection}</span>
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Unit Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">{dict.unit}:</span>
              <div className="flex rounded-md border border-slate-300 bg-white p-0.5 shadow-2xs">
                {(['All', 'AHPL', 'AIL'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setActiveUnitFilter(u)}
                    className={`px-2 py-1 text-xs font-medium rounded transition ${
                      activeUnitFilter === u
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {u === 'All' ? dict.filterAll : u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Filter Line (Type + Status) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 text-xs text-slate-600">
            {/* Movement Type filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{dict.type}:</span>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('All')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  activeTypeFilter === 'All'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {dict.filterAll}
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('Inbound')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  activeTypeFilter === 'Inbound'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Inbound
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('Outbound')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  activeTypeFilter === 'Outbound'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-purple-700 hover:bg-purple-50'
                }`}
              >
                Outbound
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{dict.status}:</span>
              {(['All', 'Completed', 'In-Progress', 'Pending'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveStatusFilter(st)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    activeStatusFilter === st
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'All'
                    ? dict.filterAll
                    : st === 'Completed'
                    ? lang === 'hi' ? 'पूर्ण' : 'Completed'
                    : st === 'In-Progress'
                    ? lang === 'hi' ? 'प्रगति' : 'In-Progress'
                    : lang === 'hi' ? 'पेंडिंग' : 'Pending'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200 select-none">
              <tr>
                {/* Master Checkbox Header */}
                <th className="py-3 px-3 w-10 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      ref={masterCheckboxRef}
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      aria-label={dict.selectAll}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                  </div>
                </th>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition"
                  onClick={() => {
                    setSortField('timestamp');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <span>{dict.time}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">{dict.unit}</th>
                <th className="py-3 px-3 font-semibold">{dict.type}</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition"
                  onClick={() => {
                    setSortField('vehicleNo');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <span>{dict.vehicleNo}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">{dict.material}</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition"
                  onClick={() => {
                    setSortField('qty');
                    setSortAsc(!sortAsc);
                  }}
                >
                  <div className="flex items-center gap-1 font-semibold">
                    <span>{dict.quantity}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">{dict.status}</th>
                <th className="py-3 px-3 text-right font-semibold">{dict.actions}</th>
              </tr>
            </thead>
            <tbody id="movementTable" className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-slate-400 text-sm">
                    <p className="font-medium text-slate-500">{dict.noRecordsFound}</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  return (
                    <tr
                      key={record.id}
                      className={`transition-colors group text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-indigo-50/70 hover:bg-indigo-50 text-slate-900 font-medium'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      {/* Row Checkbox */}
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

                      {/* Time */}
                      <td className="py-3 px-3.5 text-slate-500 font-mono whitespace-nowrap">
                        {record.timestamp}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getUnitBadge(record.unit)}
                      </td>

                      {/* Movement Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getTypeBadge(record.type)}
                      </td>

                      {/* Vehicle No */}
                      <td className="py-3 px-3 font-semibold text-slate-800 font-mono whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{record.vehicleNo}</span>
                          {record.dockGate && (
                            <span className="text-[10px] font-sans font-normal text-slate-400">
                              {record.dockGate}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Material */}
                      <td className="py-3 px-3 text-slate-700 max-w-[180px] sm:max-w-xs truncate">
                        <span title={record.skuDesc} className="font-medium">
                          {record.skuDesc}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                        <span className="font-mono font-semibold">{record.qty}</span>{' '}
                        <span className="text-xs text-slate-500">{record.unitMeasure}</span>
                      </td>

                      {/* Status with Quick Toggle Dropdown */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={record.status}
                          onChange={(e) => onUpdateStatus(record.id, e.target.value as MovementStatus)}
                          className="text-xs font-semibold rounded-md border border-slate-200 bg-white py-1 px-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                        >
                          <option value="Completed">✓ {lang === 'hi' ? 'पूर्ण' : 'Completed'}</option>
                          <option value="In-Progress">⟳ {lang === 'hi' ? 'प्रगति' : 'In-Progress'}</option>
                          <option value="Pending">! {lang === 'hi' ? 'पेंडिंग' : 'Pending'}</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Gate Pass */}
                          <button
                            type="button"
                            onClick={() => onViewGatePass(record)}
                            title={dict.viewGatePass}
                            className="p-1.5 rounded text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Record */}
                          <button
                            type="button"
                            onClick={() => onEditRecord(record)}
                            title={dict.edit}
                            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Record */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(dict.deleteConfirm)) {
                                onDeleteRecord(record.id);
                              }
                            }}
                            title={dict.delete}
                            className="p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition"
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
    </div>
  );
};
