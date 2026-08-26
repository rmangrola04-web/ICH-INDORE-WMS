import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  Plane,
  Package,
  Layers,
  AlertCircle,
  RefreshCw,
  X,
  Calendar,
  Building2,
  MapPin,
  FileText,
  Weight,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  DailyPlanRecord,
  PlanExecutionStatus,
  DispatchMode,
  Language,
  AHPL_DOCKS,
  AIL_DOCKS,
  ALL_DOCKS,
  getDocksForCompany,
} from '../types';
import { t } from '../utils/translations';

interface DailyPlanExecutionViewProps {
  plans: DailyPlanRecord[];
  lang: Language;
  onAddPlan: (plan: Omit<DailyPlanRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePlan: (plan: DailyPlanRecord) => void;
  onDeletePlan: (id: string) => void;
  onQuickStatusChange: (id: string, newStatus: PlanExecutionStatus) => void;
  onSyncGoogleSheets?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
}

const DEFAULT_TRANSPORTERS = [
  'ICRL',
  'MATA',
  'OPM',
  'DHTC',
  'MCM',
  'FLY GREEN',
  'VARUNA',
  'JEET',
  'BLUEDART (AIR)',
  'DELHIVERY (AIR/SURFACE)',
  'SAFEEXPRESS (SURFACE)',
  'TCI EXPRESS',
  'DTDC',
  'OTHER',
];

const DISPATCH_MODES: DispatchMode[] = [
  'Dedicated Vehicle (FTL / 32ft / 24ft / 14ft / Tata Ace / Bolero)',
  'Air Courier',
  'Surface Courier',
  'Part Load (PTL)',
];

const STATUS_OPTIONS: PlanExecutionStatus[] = [
  'Pending',
  'Vehicle Placed',
  'In-Progress',
  'Executed / Dispatched',
  'Cancelled / Hold',
];

const POPULAR_DESTINATIONS = [
  'Indore Local / City Hub',
  'Bhopal Depot',
  'Mumbai Central Hub (Bhiwandi)',
  'Delhi NCR Logistics Park',
  'Ahmedabad Hub (Aslali)',
  'Bangalore Regional DC',
  'Hyderabad Hub',
  'Kolkata Hub (Dankuni)',
  'Raipur Depot',
  'Jaipur DC',
  'Nagpur Central Hub',
  'Pune Hub (Chakan)',
];

export const DailyPlanExecutionView: React.FC<DailyPlanExecutionViewProps> = ({
  plans,
  lang,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onQuickStatusChange,
  onSyncGoogleSheets,
  isSyncing = false,
  lastSyncTime,
}) => {
  const dict = t[lang];

  // Filters State
  const [companyFilter, setCompanyFilter] = useState<'All' | 'AHPL' | 'AIL'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [modeFilter, setModeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('All'); // 'All', 'Today', or specific YYYY-MM-DD
  const [customDate, setCustomDate] = useState<string>('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<DailyPlanRecord | null>(null);

  // Form Fields for Add / Edit
  const todayStr = new Date().toISOString().slice(0, 10);
  const [formPlanDate, setFormPlanDate] = useState<string>(todayStr);
  const [formCompany, setFormCompany] = useState<'AHPL' | 'AIL'>('AHPL');
  const [formDestination, setFormDestination] = useState<string>('');
  const [formTransporter, setFormTransporter] = useState<string>('MATA');
  const [formCustomTransporter, setFormCustomTransporter] = useState<string>('');
  const [formDispatchMode, setFormDispatchMode] = useState<DispatchMode>(
    'Dedicated Vehicle (FTL / 32ft / 24ft / 14ft / Tata Ace / Bolero)'
  );
  const [formTotalInvoices, setFormTotalInvoices] = useState<string>('');
  const [formTotalBoxes, setFormTotalBoxes] = useState<string>('');
  const [formTotalWeight, setFormTotalWeight] = useState<string>('');
  const [formStatus, setFormStatus] = useState<PlanExecutionStatus>('Pending');
  const [formAssignedDock, setFormAssignedDock] = useState<string>('Dock 01');
  const [formAwbOrDocket, setFormAwbOrDocket] = useState<string>('');
  const [formVehicleNo, setFormVehicleNo] = useState<string>('');
  const [formRemarks, setFormRemarks] = useState<string>('');

  // Dynamic Docks for selected company in form
  const availableFormDocks = useMemo(() => {
    return formCompany === 'AIL' ? AIL_DOCKS : AHPL_DOCKS;
  }, [formCompany]);

  // When company changes in form, adjust assigned dock if out of range
  const handleFormCompanyChange = (newComp: 'AHPL' | 'AIL') => {
    setFormCompany(newComp);
    if (newComp === 'AIL' && !AIL_DOCKS.includes(formAssignedDock as any)) {
      setFormAssignedDock('Dock 05');
    } else if (newComp === 'AHPL' && !AHPL_DOCKS.includes(formAssignedDock as any)) {
      setFormAssignedDock('Dock 01');
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingPlan(null);
    setFormPlanDate(todayStr);
    setFormCompany('AHPL');
    setFormDestination('');
    setFormTransporter('MATA');
    setFormCustomTransporter('');
    setFormDispatchMode('Dedicated Vehicle (FTL / 32ft / 24ft / 14ft / Tata Ace / Bolero)');
    setFormTotalInvoices('');
    setFormTotalBoxes('');
    setFormTotalWeight('');
    setFormStatus('Pending');
    setFormAssignedDock('Dock 01');
    setFormAwbOrDocket('');
    setFormVehicleNo('');
    setFormRemarks('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (plan: DailyPlanRecord) => {
    setEditingPlan(plan);
    setFormPlanDate(plan.planDate || todayStr);
    setFormCompany(plan.company || 'AHPL');
    setFormDestination(plan.destination || '');
    
    if (DEFAULT_TRANSPORTERS.includes(plan.transporterName)) {
      setFormTransporter(plan.transporterName);
      setFormCustomTransporter('');
    } else {
      setFormTransporter('OTHER');
      setFormCustomTransporter(plan.transporterName);
    }

    setFormDispatchMode(plan.dispatchMode || 'Dedicated Vehicle (FTL / 32ft / 24ft / 14ft / Tata Ace / Bolero)');
    setFormTotalInvoices(plan.totalInvoices ? String(plan.totalInvoices) : '');
    setFormTotalBoxes(plan.totalBoxes ? String(plan.totalBoxes) : '');
    setFormTotalWeight(plan.totalWeight ? String(plan.totalWeight) : '');
    setFormStatus(plan.status || 'Pending');
    setFormAssignedDock(plan.assignedDock || (plan.company === 'AIL' ? 'Dock 05' : 'Dock 01'));
    setFormAwbOrDocket(plan.awbOrDocketNo || '');
    setFormVehicleNo(plan.vehicleNo || '');
    setFormRemarks(plan.remarks || '');
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDestination.trim()) {
      alert('Please specify the Destination / Place of Plan Location.');
      return;
    }

    const resolvedTransporter =
      formTransporter === 'OTHER'
        ? formCustomTransporter.trim() || 'OTHER'
        : formTransporter;

    if (editingPlan) {
      // Update existing
      const updated: DailyPlanRecord = {
        ...editingPlan,
        planDate: formPlanDate,
        company: formCompany,
        destination: formDestination.trim(),
        transporterName: resolvedTransporter,
        dispatchMode: formDispatchMode,
        totalInvoices: formTotalInvoices.trim() || undefined,
        totalBoxes: formTotalBoxes.trim() || undefined,
        totalWeight: formTotalWeight.trim() || undefined,
        status: formStatus,
        assignedDock: formAssignedDock,
        awbOrDocketNo: formAwbOrDocket.trim() || undefined,
        vehicleNo: formVehicleNo.trim().toUpperCase() || undefined,
        remarks: formRemarks.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      onUpdatePlan(updated);
    } else {
      // Add new
      onAddPlan({
        planDate: formPlanDate,
        company: formCompany,
        destination: formDestination.trim(),
        transporterName: resolvedTransporter,
        dispatchMode: formDispatchMode,
        totalInvoices: formTotalInvoices.trim() || undefined,
        totalBoxes: formTotalBoxes.trim() || undefined,
        totalWeight: formTotalWeight.trim() || undefined,
        status: formStatus,
        assignedDock: formAssignedDock,
        awbOrDocketNo: formAwbOrDocket.trim() || undefined,
        vehicleNo: formVehicleNo.trim().toUpperCase() || undefined,
        remarks: formRemarks.trim() || undefined,
      });
    }

    setIsAddModalOpen(false);
  };

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Company Filter
      if (companyFilter !== 'All' && plan.company !== companyFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'All') {
        if (plan.status !== statusFilter) return false;
      }

      // Mode Filter
      if (modeFilter !== 'All') {
        if (modeFilter === 'Air Courier' && !plan.dispatchMode.toLowerCase().includes('air')) return false;
        if (modeFilter === 'Surface Courier' && !plan.dispatchMode.toLowerCase().includes('surface')) return false;
        if (modeFilter === 'Part Load (PTL)' && !plan.dispatchMode.toLowerCase().includes('part') && !plan.dispatchMode.includes('PTL')) return false;
        if (modeFilter === 'Dedicated Vehicle' && !plan.dispatchMode.toLowerCase().includes('dedicated') && !plan.dispatchMode.includes('FTL')) return false;
      }

      // Date Filter
      if (dateFilter === 'Today') {
        const todayFormatted = new Date().toISOString().slice(0, 10);
        if (plan.planDate && !plan.planDate.includes(todayFormatted)) {
          const inDate = new Date().toLocaleDateString('en-IN');
          if (plan.planDate !== inDate) return false;
        }
      } else if (dateFilter === 'Custom' && customDate) {
        if (plan.planDate && !plan.planDate.includes(customDate)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          plan.destination?.toLowerCase().includes(q) ||
          plan.transporterName?.toLowerCase().includes(q) ||
          plan.assignedDock?.toLowerCase().includes(q) ||
          plan.awbOrDocketNo?.toLowerCase().includes(q) ||
          plan.vehicleNo?.toLowerCase().includes(q) ||
          plan.remarks?.toLowerCase().includes(q) ||
          plan.id?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [plans, companyFilter, statusFilter, modeFilter, dateFilter, customDate, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = plans.length;
    const ahplCount = plans.filter((p) => p.company === 'AHPL').length;
    const ailCount = plans.filter((p) => p.company === 'AIL').length;
    const pendingPlacement = plans.filter((p) => p.status === 'Pending').length;
    const vehiclePlaced = plans.filter((p) => p.status === 'Vehicle Placed').length;
    const inProgress = plans.filter((p) => p.status === 'In-Progress').length;
    const airCourierCount = plans.filter(
      (p) => p.dispatchMode.toLowerCase().includes('air') || p.dispatchMode.toLowerCase().includes('courier')
    ).length;
    const executed = plans.filter((p) => p.status === 'Executed / Dispatched').length;
    const cancelled = plans.filter((p) => p.status === 'Cancelled / Hold').length;

    return {
      total,
      ahplCount,
      ailCount,
      pendingPlacement,
      vehiclePlaced,
      inProgress,
      airCourierCount,
      executed,
      cancelled,
    };
  }, [plans]);

  // Status Badge Helper
  const getStatusBadge = (status: PlanExecutionStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            <span>Pending Placement</span>
          </span>
        );
      case 'Vehicle Placed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
            <Truck className="w-3 h-3 text-blue-600" />
            <span>Vehicle Placed</span>
          </span>
        );
      case 'In-Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-2xs">
            <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
            <span>In-Progress (Loading)</span>
          </span>
        );
      case 'Executed / Dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Executed / Dispatched</span>
          </span>
        );
      case 'Cancelled / Hold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
            <X className="w-3 h-3 text-rose-600" />
            <span>Cancelled / Hold</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Dispatch Mode Icon Helper
  const getDispatchModeTag = (mode: string) => {
    const isAir = mode.toLowerCase().includes('air');
    const isCourier = mode.toLowerCase().includes('courier');
    const isPtl = mode.toLowerCase().includes('part') || mode.includes('PTL');

    if (isAir) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Plane className="w-3 h-3 text-purple-600" />
          <span>Air Courier</span>
        </span>
      );
    }
    if (isCourier) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
          <Package className="w-3 h-3 text-cyan-600" />
          <span>Surface Courier</span>
        </span>
      );
    }
    if (isPtl) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Layers className="w-3 h-3 text-amber-600" />
          <span>Part Load (PTL)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Truck className="w-3 h-3 text-slate-500" />
        <span className="truncate max-w-[140px]" title={mode}>Dedicated FTL</span>
      </span>
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPlans.length === 0) {
      alert('No plans to export.');
      return;
    }

    const headers = [
      'Plan ID',
      'Plan Date',
      'Company',
      'Destination / Location',
      'Transporter',
      'Dispatch Mode',
      'Assigned Dock',
      'Invoices',
      'Boxes',
      'Weight (KG)',
      'Status',
      'Vehicle No',
      'AWB / Docket / Remarks',
    ];

    const rows = filteredPlans.map((p) => [
      `"${p.id}"`,
      `"${p.planDate}"`,
      `"${p.company}"`,
      `"${(p.destination || '').replace(/"/g, '""')}"`,
      `"${(p.transporterName || '').replace(/"/g, '""')}"`,
      `"${(p.dispatchMode || '').replace(/"/g, '""')}"`,
      `"${p.assignedDock || ''}"`,
      `"${p.totalInvoices || ''}"`,
      `"${p.totalBoxes || ''}"`,
      `"${p.totalWeight || ''}"`,
      `"${p.status}"`,
      `"${p.vehicleNo || ''}"`,
      `"${(p.awbOrDocketNo || p.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daily_Plan_Execution_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Formatted Sheet
  const handlePrintPlans = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-inner">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>Daily Plan Execution</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-bold">
                  {plans.length} Total Plans
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Log, prioritize, track and execute incoming dispatch plans across AHPL & AIL docks.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {onSyncGoogleSheets && (
            <button
              type="button"
              onClick={onSyncGoogleSheets}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer disabled:opacity-50"
              title="Sync Daily Plans directly with Google Sheet tab: Daily_Plan_Execution"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Sheet Tab'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPlans}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer hidden sm:inline-flex"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Daily Plan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Plans Received */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Plans Received</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
              <span className="text-blue-600 font-bold">AHPL: {stats.ahplCount}</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold">AIL: {stats.ailCount}</span>
            </div>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Pending Placement */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Placement</p>
            <h3 className="text-2xl font-black text-amber-800 mt-1">{stats.pendingPlacement}</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              {stats.vehiclePlaced > 0 ? `${stats.vehiclePlaced} Vehicle Placed` : 'Awaiting Vehicle Placement'}
            </p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 border border-amber-200">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* 3. Air / Courier Shipments */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Air / Courier Shipments</p>
            <h3 className="text-2xl font-black text-purple-900 mt-1">{stats.airCourierCount}</h3>
            <p className="text-[11px] text-purple-600 font-medium mt-1">
              AWB / Docket Tracked
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600 border border-purple-200">
            <Plane className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Executed / Completed */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Executed / Completed</p>
            <h3 className="text-2xl font-black text-emerald-800 mt-1">{stats.executed}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-medium">
              <span>{stats.total > 0 ? `${Math.round((stats.executed / stats.total) * 100)}% Execution Rate` : 'Ready to Dispatch'}</span>
            </div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Interactive Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Quick Search */}
          <div className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Destination, Transporter, Dock, AWB, Vehicle..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Company Filter Pill */}
            <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
              {(['All', 'AHPL', 'AIL'] as const).map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setCompanyFilter(comp)}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    companyFilter === comp
                      ? comp === 'AHPL'
                        ? 'bg-blue-600 text-white'
                        : comp === 'AIL'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {comp === 'All' ? 'All Units' : comp}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Mode Filter */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
            >
              <option value="All">All Modes</option>
              <option value="Dedicated Vehicle">Dedicated Vehicle (FTL)</option>
              <option value="Air Courier">Air Courier</option>
              <option value="Surface Courier">Surface Courier</option>
              <option value="Part Load (PTL)">Part Load (PTL)</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today's Plans</option>
              <option value="Custom">Custom Date</option>
            </select>

            {dateFilter === 'Custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Plan Date & ID</th>
                <th className="py-3 px-3.5">Company</th>
                <th className="py-3 px-3.5">Destination / Hub</th>
                <th className="py-3 px-3.5">Transporter</th>
                <th className="py-3 px-3.5">Dispatch Mode</th>
                <th className="py-3 px-3.5">Assigned Dock</th>
                <th className="py-3 px-3.5">Load Summary</th>
                <th className="py-3 px-3.5">Execution Status</th>
                <th className="py-3 px-3.5">AWB / Docket / Remarks</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No daily dispatch plans found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click "+ Add New Daily Plan" above to create today's dispatch schedule.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  return (
                    <tr
                      key={plan.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Plan Date & ID */}
                      <td className="py-3 px-3.5 font-mono text-xs">
                        <div className="font-bold text-slate-800">{plan.planDate}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{plan.id}</div>
                      </td>

                      {/* Company */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            plan.company === 'AHPL'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {plan.company}
                        </span>
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="font-semibold">{plan.destination}</span>
                        </div>
                      </td>

                      {/* Transporter */}
                      <td className="py-3 px-3.5 font-medium text-slate-700">
                        <div className="font-semibold text-slate-800">{plan.transporterName}</div>
                        {plan.vehicleNo && (
                          <div className="text-[11px] font-mono text-slate-500 font-bold flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-400" />
                            <span>{plan.vehicleNo}</span>
                          </div>
                        )}
                      </td>

                      {/* Dispatch Mode */}
                      <td className="py-3 px-3.5">
                        {getDispatchModeTag(plan.dispatchMode)}
                      </td>

                      {/* Assigned Dock */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                          {plan.assignedDock || (plan.company === 'AIL' ? 'Dock 05' : 'Dock 01')}
                        </span>
                      </td>

                      {/* Load Summary */}
                      <td className="py-3 px-3.5 text-xs text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          {plan.totalInvoices && (
                            <span>
                              <b>{plan.totalInvoices}</b> Invoices
                            </span>
                          )}
                          {plan.totalBoxes && (
                            <span>
                              <b>{plan.totalBoxes}</b> Boxes
                            </span>
                          )}
                          {plan.totalWeight && (
                            <span className="text-slate-500">
                              <b>{plan.totalWeight}</b> KG
                            </span>
                          )}
                          {!plan.totalInvoices && !plan.totalBoxes && !plan.totalWeight && (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Execution Status + Quick Toggle */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-1">
                          <div>{getStatusBadge(plan.status)}</div>
                          {/* Quick Change Dropdown */}
                          <select
                            value={plan.status}
                            onChange={(e) =>
                              onQuickStatusChange(plan.id, e.target.value as PlanExecutionStatus)
                            }
                            className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                Change: {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* AWB / Docket / Remarks */}
                      <td className="py-3 px-3.5 text-xs max-w-[200px]">
                        {plan.awbOrDocketNo && (
                          <div className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 inline-block mb-1">
                            AWB: {plan.awbOrDocketNo}
                          </div>
                        )}
                        {plan.remarks && (
                          <div className="text-slate-500 text-[11px] truncate" title={plan.remarks}>
                            {plan.remarks}
                          </div>
                        )}
                        {!plan.awbOrDocketNo && !plan.remarks && (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(plan)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete plan ${plan.id} for ${plan.destination}?`)) {
                                onDeletePlan(plan.id);
                              }
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MODAL: + Add New Daily Plan / Edit Daily Plan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingPlan ? 'Edit Daily Plan' : '+ Add New Daily Plan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter the dispatch plan details, destination, assigned transporter, mode, and dock.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitPlan} className="space-y-4 pt-4">
              {/* Row 1: Plan Date & Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plan Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formPlanDate}
                    onChange={(e) => setFormPlanDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formCompany}
                    onChange={(e) => handleFormCompanyChange(e.target.value as 'AHPL' | 'AIL')}
                    className="w-full border border-blue-300 rounded-xl px-3 py-2 text-sm bg-blue-50/50 font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                  >
                    <option value="AHPL">AHPL (Docks 01 - 04)</option>
                    <option value="AIL">AIL (Docks 05 - 09)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Destination / Hub Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Place of Plan Location / Destination <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder="e.g. Mumbai Hub, Bhopal Depot, Delhi Logistics Park, Indore Local..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>
                {/* Popular Destinations Quick Click */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Quick Suggestions:</span>
                  {POPULAR_DESTINATIONS.slice(0, 5).map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => setFormDestination(dest)}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded font-medium transition cursor-pointer"
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Transporter & Dispatch Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Transport / Transporter Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formTransporter}
                    onChange={(e) => setFormTransporter(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  >
                    {DEFAULT_TRANSPORTERS.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                  {formTransporter === 'OTHER' && (
                    <input
                      type="text"
                      placeholder="Specify custom transporter name"
                      value={formCustomTransporter}
                      onChange={(e) => setFormCustomTransporter(e.target.value)}
                      className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Type / Dispatch Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDispatchMode}
                    onChange={(e) => setFormDispatchMode(e.target.value as DispatchMode)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  >
                    {DISPATCH_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Assigned Dock & Execution Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Dock ({formCompany}) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formAssignedDock}
                    onChange={(e) => setFormAssignedDock(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  >
                    {availableFormDocks.map((dock) => (
                      <option key={dock} value={dock}>
                        {dock} ({formCompany})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Execution Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PlanExecutionStatus)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Total Invoices / Boxes / Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Invoices (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={formTotalInvoices}
                    onChange={(e) => setFormTotalInvoices(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Boxes / Ctns (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 450"
                    value={formTotalBoxes}
                    onChange={(e) => setFormTotalBoxes(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Weight (KG) (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3500 KG"
                    value={formTotalWeight}
                    onChange={(e) => setFormTotalWeight(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 6: Vehicle No (If Placed) & AWB / Docket No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle No (If Placed)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MP09GH1234"
                    value={formVehicleNo}
                    onChange={(e) => setFormVehicleNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Remarks / Air Waybill (AWB) / Docket No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AWB# 882910394 / Urgency / Special handling"
                    value={formAwbOrDocket}
                    onChange={(e) => setFormAwbOrDocket(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 7: Additional Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Additional dispatch instructions, priority markings, or driver details..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  {editingPlan ? 'Save Changes' : '+ Create Daily Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
