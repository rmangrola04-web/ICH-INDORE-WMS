import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Download,
  Printer,
  Edit2,
  Trash2,
  Truck,
  Plane,
  Package,
  Layers,
  RefreshCw,
  X,
  MapPin,
  Scale,
  Box,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  DailyPlanRecord,
  Language,
} from '../types';
import { t } from '../utils/translations';

interface DailyPlanExecutionViewProps {
  plans: DailyPlanRecord[];
  lang: Language;
  onAddPlan: (plan: Omit<DailyPlanRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePlan: (plan: DailyPlanRecord) => void;
  onDeletePlan: (id: string) => void;
  onBulkDeletePlans?: (ids: string[]) => void;
  onQuickStatusChange?: (id: string, newStatus: any) => void;
  onSyncGoogleSheets?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
}

// Editable Array of Destinations / Locations for Dropdown
export const DEFAULT_PLAN_LOCATIONS: string[] = [
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
  'Surat Depot',
  'Gwalior Hub',
  'Jabalpur Hub',
  'Lucknow Hub',
  'Patna Depot',
  'Chandigarh DC',
  'Guwahati Regional Hub',
  'Other / Custom Location',
];

// Assigned Transport / Transporters
export const DEFAULT_TRANSPORTERS: string[] = [
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

// Vehicle Type / Feet Options
export const VEHICLE_TYPE_OPTIONS: string[] = [
  '32 Ft SXL',
  '32 Ft MXL',
  '24 Ft',
  '20 Ft',
  '14 Ft',
  'Tata Ace / Bolero',
  'Air Courier',
  'Surface Courier',
  'Part Load (PTL)',
];

export const DEFAULT_AHPL_DOCKS: string[] = ['Dock 01', 'Dock 02', 'Dock 03', 'Dock 04'];
export const DEFAULT_AIL_DOCKS: string[] = ['Dock 05', 'Dock 06', 'Dock 07', 'Dock 08', 'Dock 09'];
export const DEFAULT_BOTH_DOCKS: string[] = [
  'Dock 01 & Dock 05 (Dual Bay)',
  'Dock 02 & Dock 06 (Dual Bay)',
  'Dock 03 & Dock 07 (Dual Bay)',
  'Dock 04 & Dock 08 (Dual Bay)',
  'Dock 01',
  'Dock 02',
  'Dock 03',
  'Dock 04',
  'Dock 05',
  'Dock 06',
  'Dock 07',
  'Dock 08',
  'Dock 09',
  'Custom Dock / Dual Bay',
];

export const DailyPlanExecutionView: React.FC<DailyPlanExecutionViewProps> = ({
  plans,
  lang,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onBulkDeletePlans,
  onSyncGoogleSheets,
  isSyncing = false,
  lastSyncTime,
}) => {
  const dict = t[lang];

  // Selection State for Bulk Delete
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Filters State
  const [companyFilter, setCompanyFilter] = useState<'All' | 'AHPL' | 'AIL' | 'Both (AHPL & AIL)'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [customDate, setCustomDate] = useState<string>('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<DailyPlanRecord | null>(null);

  // Exact Form Fields Required
  const todayStr = new Date().toISOString().slice(0, 10);
  const [formPlanDate, setFormPlanDate] = useState<string>(todayStr);
  const [formCompany, setFormCompany] = useState<'AHPL' | 'AIL' | 'Both (AHPL & AIL)'>('AHPL');
  const [formAssignedDock, setFormAssignedDock] = useState<string>('Dock 01');
  const [formCustomDock, setFormCustomDock] = useState<string>('');
  const [formDestination, setFormDestination] = useState<string>(DEFAULT_PLAN_LOCATIONS[0]);
  const [formCustomDestination, setFormCustomDestination] = useState<string>('');
  const [formTransporter, setFormTransporter] = useState<string>('MATA');
  const [formCustomTransporter, setFormCustomTransporter] = useState<string>('');
  const [formVehicleType, setFormVehicleType] = useState<string>('32 Ft SXL');
  const [formWeight, setFormWeight] = useState<string>('');
  const [formCft, setFormCft] = useState<string>('');

  // Handle Company Selection Change in Modal to adapt Docks dynamically
  const handleCompanyChange = (newComp: 'AHPL' | 'AIL' | 'Both (AHPL & AIL)') => {
    setFormCompany(newComp);
    if (newComp === 'AHPL') {
      if (!DEFAULT_AHPL_DOCKS.includes(formAssignedDock)) {
        setFormAssignedDock('Dock 01');
      }
    } else if (newComp === 'AIL') {
      if (!DEFAULT_AIL_DOCKS.includes(formAssignedDock)) {
        setFormAssignedDock('Dock 05');
      }
    } else {
      // Both (AHPL & AIL)
      if (!DEFAULT_BOTH_DOCKS.includes(formAssignedDock)) {
        setFormAssignedDock('Dock 01 & Dock 05 (Dual Bay)');
      }
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingPlan(null);
    setFormPlanDate(todayStr);
    setFormCompany('AHPL');
    setFormAssignedDock('Dock 01');
    setFormCustomDock('');
    setFormDestination(DEFAULT_PLAN_LOCATIONS[0]);
    setFormCustomDestination('');
    setFormTransporter('MATA');
    setFormCustomTransporter('');
    setFormVehicleType('32 Ft SXL');
    setFormWeight('');
    setFormCft('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (plan: DailyPlanRecord) => {
    setEditingPlan(plan);
    setFormPlanDate(plan.planDate || todayStr);
    
    const comp: 'AHPL' | 'AIL' | 'Both (AHPL & AIL)' =
      plan.company === 'Both (AHPL & AIL)' ||
      plan.company?.toLowerCase().includes('both') ||
      plan.company?.includes('&')
        ? 'Both (AHPL & AIL)'
        : plan.company === 'AIL'
        ? 'AIL'
        : 'AHPL';
    setFormCompany(comp);

    const dock = plan.assignedDock || (comp === 'AIL' ? 'Dock 05' : comp === 'Both (AHPL & AIL)' ? 'Dock 01 & Dock 05 (Dual Bay)' : 'Dock 01');
    if (comp === 'AHPL') {
      setFormAssignedDock(DEFAULT_AHPL_DOCKS.includes(dock) ? dock : 'Dock 01');
      setFormCustomDock('');
    } else if (comp === 'AIL') {
      setFormAssignedDock(DEFAULT_AIL_DOCKS.includes(dock) ? dock : 'Dock 05');
      setFormCustomDock('');
    } else {
      if (DEFAULT_BOTH_DOCKS.includes(dock)) {
        setFormAssignedDock(dock);
        setFormCustomDock('');
      } else {
        setFormAssignedDock('Custom Dock / Dual Bay');
        setFormCustomDock(dock);
      }
    }

    if (DEFAULT_PLAN_LOCATIONS.includes(plan.destination)) {
      setFormDestination(plan.destination);
      setFormCustomDestination('');
    } else {
      setFormDestination('Other / Custom Location');
      setFormCustomDestination(plan.destination || '');
    }

    if (DEFAULT_TRANSPORTERS.includes(plan.transporterName || '')) {
      setFormTransporter(plan.transporterName || 'MATA');
      setFormCustomTransporter('');
    } else if (plan.transporterName) {
      setFormTransporter('OTHER');
      setFormCustomTransporter(plan.transporterName);
    } else {
      setFormTransporter('');
      setFormCustomTransporter('');
    }

    setFormVehicleType(plan.dispatchMode || '');
    setFormWeight(plan.totalWeight ? String(plan.totalWeight) : '');
    setFormCft(plan.totalCft ? String(plan.totalCft) : '');
    setIsAddModalOpen(true);
  };

  // Submit Plan Form
  const handleSubmitPlan = (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedDestination =
      formDestination === 'Other / Custom Location'
        ? formCustomDestination.trim()
        : formDestination;

    if (!resolvedDestination) {
      alert(lang === 'hi' ? 'कृपया गंतव्य स्थान (Destination) चुनें या दर्ज करें।' : 'Please select or enter the Destination Location.');
      return;
    }

    if (!formWeight.trim()) {
      alert(lang === 'hi' ? 'कृपया कुल वजन (Total Weight in KG) दर्ज करें।' : 'Please enter Total Weight (KG).');
      return;
    }

    const resolvedTransporter =
      formTransporter === 'OTHER'
        ? formCustomTransporter.trim() || 'OTHER'
        : formTransporter;

    const resolvedDock =
      formAssignedDock === 'Custom Dock / Dual Bay'
        ? formCustomDock.trim() || (formCompany === 'AIL' ? 'Dock 05' : formCompany === 'Both (AHPL & AIL)' ? 'Dock 01 & Dock 05' : 'Dock 01')
        : formAssignedDock;

    if (editingPlan) {
      const updated: DailyPlanRecord = {
        ...editingPlan,
        planDate: formPlanDate,
        company: formCompany,
        assignedDock: resolvedDock,
        destination: resolvedDestination,
        transporterName: resolvedTransporter || undefined,
        dispatchMode: formVehicleType || undefined,
        totalWeight: formWeight.trim(),
        totalCft: formCft.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      onUpdatePlan(updated);
    } else {
      onAddPlan({
        planDate: formPlanDate,
        company: formCompany,
        assignedDock: resolvedDock,
        destination: resolvedDestination,
        transporterName: resolvedTransporter || undefined,
        dispatchMode: formVehicleType || undefined,
        totalWeight: formWeight.trim(),
        totalCft: formCft.trim() || undefined,
      });
    }

    setIsAddModalOpen(false);
  };

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Company Filter
      if (companyFilter !== 'All') {
        const isBothPlan =
          plan.company === 'Both (AHPL & AIL)' ||
          plan.company?.toLowerCase().includes('both') ||
          plan.company?.includes('&');

        if (companyFilter === 'Both (AHPL & AIL)') {
          if (!isBothPlan) return false;
        } else if (companyFilter === 'AHPL') {
          if (plan.company !== 'AHPL') return false;
        } else if (companyFilter === 'AIL') {
          if (plan.company !== 'AIL') return false;
        }
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
          plan.dispatchMode?.toLowerCase().includes(q) ||
          plan.assignedDock?.toLowerCase().includes(q) ||
          plan.company?.toLowerCase().includes(q) ||
          String(plan.totalWeight || '').toLowerCase().includes(q) ||
          String(plan.totalCft || '').toLowerCase().includes(q) ||
          plan.id?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [plans, companyFilter, dateFilter, customDate, searchQuery]);

  // Master Checkbox & Selection State handlers
  const isAllSelected = filteredPlans.length > 0 && filteredPlans.every((p) => selectedPlanIds.includes(p.id));
  const isSomeSelected = filteredPlans.some((p) => selectedPlanIds.includes(p.id)) && !isAllSelected;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPlanIds((prev) => prev.filter((id) => !filteredPlans.some((p) => p.id === id)));
    } else {
      const visibleIds = filteredPlans.map((p) => p.id);
      setSelectedPlanIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPlanIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteSelected = () => {
    const count = selectedPlanIds.length;
    if (count === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete ${count} selected plan(s) from Google Sheets?`;
    if (window.confirm(confirmMsg)) {
      if (onBulkDeletePlans) {
        onBulkDeletePlans(selectedPlanIds);
      } else {
        selectedPlanIds.forEach((id) => onDeletePlan(id));
      }
      setSelectedPlanIds([]);
    }
  };

  // Aggregate Metrics derived directly from plans
  const totalWeightKg = useMemo(() => {
    return plans.reduce((acc, p) => {
      const num = parseFloat(String(p.totalWeight || 0).replace(/[^0-9.]/g, ''));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [plans]);

  const totalCftSum = useMemo(() => {
    return plans.reduce((acc, p) => {
      const num = parseFloat(String(p.totalCft || 0).replace(/[^0-9.]/g, ''));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [plans]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPlans.length === 0) {
      alert(lang === 'hi' ? 'निर्यात करने के लिए कोई प्लान उपलब्ध नहीं है।' : 'No plans to export.');
      return;
    }

    const headers = [
      'Plan ID',
      'Plan Date',
      'Company',
      'Destination Location',
      'Transporter',
      'Vehicle Type / Feet',
      'Weight (KG)',
      'CFT',
    ];

    const rows = filteredPlans.map((p) => [
      `"${p.id}"`,
      `"${p.planDate}"`,
      `"${p.company}"`,
      `"${(p.destination || '').replace(/"/g, '""')}"`,
      `"${(p.transporterName || '').replace(/"/g, '""')}"`,
      `"${(p.dispatchMode || '').replace(/"/g, '""')}"`,
      `"${p.totalWeight || ''}"`,
      `"${p.totalCft || ''}"`,
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

  const handlePrintPlans = () => {
    window.print();
  };

  // Helper for Vehicle Type badge
  const renderVehicleBadge = (vType?: string) => {
    if (!vType) return <span className="text-slate-400 text-xs">-</span>;
    const isAir = vType.toLowerCase().includes('air');
    const isCourier = vType.toLowerCase().includes('courier');
    const isPtl = vType.toLowerCase().includes('ptl') || vType.toLowerCase().includes('part');

    if (isAir) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Plane className="w-3.5 h-3.5 text-purple-600" />
          <span>{vType}</span>
        </span>
      );
    }
    if (isCourier) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
          <Package className="w-3.5 h-3.5 text-cyan-600" />
          <span>{vType}</span>
        </span>
      );
    }
    if (isPtl) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>{vType}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Truck className="w-3.5 h-3.5 text-slate-500" />
        <span>{vType}</span>
      </span>
    );
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
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-bold font-mono">
                  {plans.length} Records
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {lang === 'hi'
                  ? 'दैनिक डिस्पैच योजना का प्रबंधन, स्थान, ट्रांसपोर्टर और भार विवरण।'
                  : 'Manage daily dispatch intake plans, destinations, vehicle allocations, weights, and CFT volume.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {selectedPlanIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              title={`Permanently delete ${selectedPlanIds.length} selected plan(s)`}
            >
              <Trash2 className="w-4 h-4" />
              <span>🗑️ Delete Selected ({selectedPlanIds.length})</span>
            </button>
          )}

          {onSyncGoogleSheets && (
            <button
              type="button"
              onClick={onSyncGoogleSheets}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer disabled:opacity-50"
              title="Sync Daily Plans directly with Google Sheet tab: Daily_Plan_Execution"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isSyncing ? (lang === 'hi' ? 'सिंक हो रहा है...' : 'Syncing...') : (lang === 'hi' ? 'शीट सिंक करें' : 'Sync Sheet Tab')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV {lang === 'hi' ? 'निर्यात' : 'Export'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPlans}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer hidden sm:inline-flex"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>{lang === 'hi' ? 'प्रिंट' : 'Print'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ {lang === 'hi' ? 'नया डेली प्लान जोड़ें' : 'Add New Daily Plan'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Plans */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'hi' ? 'कुल दैनिक प्लान' : 'Total Daily Plans'}
            </p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{plans.length}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-medium">
              <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                AHPL: {plans.filter((p) => p.company === 'AHPL').length}
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                AIL: {plans.filter((p) => p.company === 'AIL').length}
              </span>
              <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                Both: {plans.filter((p) => p.company === 'Both (AHPL & AIL)' || p.company?.toLowerCase().includes('both') || p.company?.includes('&')).length}
              </span>
            </div>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Total Weight Scheduled */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {lang === 'hi' ? 'कुल निर्धारित वजन' : 'Total Planned Weight'}
            </p>
            <h3 className="text-2xl font-black text-blue-900 mt-1">
              {totalWeightKg.toLocaleString('en-IN')} <span className="text-sm font-bold text-blue-600">KG</span>
            </h3>
            <p className="text-[11px] text-blue-600 font-medium mt-1">
              {plans.length > 0 ? `${(totalWeightKg / 1000).toFixed(1)} Metric Tons` : '0 Metric Tons'}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 border border-blue-200">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Total CFT Volume */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              {lang === 'hi' ? 'कुल वॉल्यूम (CFT)' : 'Total Volume (CFT)'}
            </p>
            <h3 className="text-2xl font-black text-purple-900 mt-1">
              {totalCftSum.toLocaleString('en-IN')} <span className="text-sm font-bold text-purple-600">CFT</span>
            </h3>
            <p className="text-[11px] text-purple-600 font-medium mt-1">
              Cubic Feet Allocation
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600 border border-purple-200">
            <Box className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Active Locations */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {lang === 'hi' ? 'गंतव्य स्थान' : 'Destinations Covered'}
            </p>
            <h3 className="text-2xl font-black text-emerald-800 mt-1">
              {new Set(plans.map((p) => p.destination)).size}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Unique Hubs & Depots
            </p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 border border-emerald-200">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Interactive Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Floating Bulk Actions Bar when rows selected */}
        {selectedPlanIds.length > 0 && (
          <div className="p-3 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2.5">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {selectedPlanIds.length} {lang === 'hi' ? 'प्लान चयनित' : 'Plan(s) Selected'}
              </span>
              <span className="text-xs text-slate-300">
                {isAllSelected ? (lang === 'hi' ? 'सभी दृश्य प्लान चयनित हैं' : 'All visible plans selected') : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkDeleteSelected}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>🗑️ Delete Selected / Delete All ({selectedPlanIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlanIds([])}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition text-xs cursor-pointer"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Quick Search */}
          <div className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'hi' ? 'गंतव्य स्थान, ट्रांसपोर्टर, वाहन या वजन से खोजें...' : 'Search by Destination, Transporter, Vehicle, Weight...'}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Company Filter Pill */}
            <div className="flex flex-wrap items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
              {(['All', 'AHPL', 'AIL', 'Both (AHPL & AIL)'] as const).map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setCompanyFilter(comp)}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer text-xs ${
                    companyFilter === comp
                      ? comp === 'AHPL'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : comp === 'AIL'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : comp === 'Both (AHPL & AIL)'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {comp === 'All'
                    ? (lang === 'hi' ? 'सभी इकाइयाँ' : 'All Units')
                    : comp === 'Both (AHPL & AIL)'
                    ? 'Both'
                    : comp}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="All">{lang === 'hi' ? 'सभी दिनांक' : 'All Dates'}</option>
              <option value="Today">{lang === 'hi' ? 'आज का प्लान' : "Today's Plans"}</option>
              <option value="Custom">{lang === 'hi' ? 'कस्टम दिनांक' : 'Custom Date'}</option>
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

        {/* Streamlined Daily Plan Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                {/* Master Select All Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      ref={masterCheckboxRef}
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                    />
                  </div>
                </th>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3.5">Company / Unit</th>
                <th className="py-3 px-3.5">Destination Location</th>
                <th className="py-3 px-3.5">Transporter</th>
                <th className="py-3 px-3.5">Vehicle & Dock Bay</th>
                <th className="py-3 px-3.5">Weight (KG)</th>
                <th className="py-3 px-3.5">CFT</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">
                      {plans.length === 0
                        ? "No records available"
                        : "No records match the active search/filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const isSelected = selectedPlanIds.includes(plan.id);
                  const isBoth =
                    plan.company === 'Both (AHPL & AIL)' ||
                    plan.company?.toLowerCase().includes('both') ||
                    plan.company?.includes('&');

                  return (
                    <tr
                      key={plan.id}
                      className={`transition-colors group ${
                        isSelected
                          ? 'bg-indigo-50/70 hover:bg-indigo-50 text-slate-900 font-medium'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td
                        className="py-3.5 px-3 w-10 text-center"
                        onClick={(e) => handleToggleRow(plan.id, e)}
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleRow(plan.id, e)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                          />
                        </div>
                      </td>

                      {/* 1. Date */}
                      <td className="py-3.5 px-3.5 font-mono text-xs">
                        <div className="font-bold text-slate-800">{plan.planDate}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{plan.id}</div>
                      </td>

                      {/* 2. Company Badge */}
                      <td className="py-3.5 px-3.5">
                        {isBoth ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-purple-100 via-indigo-100 to-pink-100 text-purple-900 border border-purple-300 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse shrink-0"></span>
                            Both (AHPL & AIL)
                          </span>
                        ) : plan.company === 'AIL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                            AIL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                            AHPL
                          </span>
                        )}
                      </td>

                      {/* 3. Destination Location */}
                      <td className="py-3.5 px-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="font-bold text-slate-800">{plan.destination}</span>
                        </div>
                      </td>

                      {/* 4. Transporter */}
                      <td className="py-3.5 px-3.5 font-medium text-slate-700">
                        {plan.transporterName ? (
                          <span className="font-semibold text-slate-800">{plan.transporterName}</span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>

                      {/* 5. Vehicle Type & Assigned Dock */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-1">
                          <div>{renderVehicleBadge(plan.dispatchMode)}</div>
                          {plan.assignedDock && (
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>{plan.assignedDock}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Weight (KG) */}
                      <td className="py-3.5 px-3.5 font-mono font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                          <Scale className="w-3.5 h-3.5 text-blue-600" />
                          <span>{plan.totalWeight} KG</span>
                        </span>
                      </td>

                      {/* 7. CFT */}
                      <td className="py-3.5 px-3.5 font-mono text-slate-700">
                        {plan.totalCft ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                            <Box className="w-3.5 h-3.5 text-purple-600" />
                            <span>{plan.totalCft} CFT</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(plan)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title={lang === 'hi' ? 'प्लान संपादित करें' : 'Edit Plan'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`${lang === 'hi' ? 'क्या आप इस प्लान को हटाना चाहते हैं?' : 'Delete plan'} (${plan.destination})?`)) {
                                onDeletePlan(plan.id);
                              }
                            }}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={lang === 'hi' ? 'प्लान हटाएं' : 'Delete Plan'}
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

      {/* MODAL: Streamlined + Add New Daily Plan / Edit Daily Plan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingPlan
                      ? (lang === 'hi' ? 'डेली प्लान संपादित करें' : 'Edit Daily Plan')
                      : (lang === 'hi' ? '+ नया डेली प्लान जोड़ें' : '+ Add New Daily Plan')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'hi'
                      ? 'आवश्यक डिस्पैच इनटेक जानकारी दर्ज करें।'
                      : 'Enter essential dispatch intake details.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Streamlined Modal Form */}
            <form onSubmit={handleSubmitPlan} className="space-y-4 pt-4">
              {/* Field 1: Plan Date [Required] & Field 2: Company Name [Required] */}
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
                    onChange={(e) => handleCompanyChange(e.target.value as 'AHPL' | 'AIL' | 'Both (AHPL & AIL)')}
                    className={`w-full border rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:outline-none shadow-2xs cursor-pointer ${
                      formCompany === 'Both (AHPL & AIL)'
                        ? 'border-purple-300 bg-purple-50 text-purple-900 focus:ring-purple-500'
                        : formCompany === 'AIL'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900 focus:ring-emerald-500'
                        : 'border-blue-300 bg-blue-50 text-blue-900 focus:ring-blue-500'
                    }`}
                  >
                    <option value="AHPL">AHPL</option>
                    <option value="AIL">AIL</option>
                    <option value="Both (AHPL & AIL)">Both (AHPL & AIL)</option>
                  </select>
                </div>
              </div>

              {/* Field 2.5: Assigned Dock Bay (Dynamic based on Company selection) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Assigned Dock Bay <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    {formCompany === 'AHPL' && '(Docks 01–04 for AHPL)'}
                    {formCompany === 'AIL' && '(Docks 05–09 for AIL)'}
                    {formCompany === 'Both (AHPL & AIL)' && '(All Docks 01–09 or Dual Bays)'}
                  </span>
                </div>

                <select
                  required
                  value={formAssignedDock}
                  onChange={(e) => setFormAssignedDock(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                >
                  {formCompany === 'AHPL' &&
                    DEFAULT_AHPL_DOCKS.map((d) => (
                      <option key={d} value={d}>
                        {d} (AHPL Bay)
                      </option>
                    ))}
                  {formCompany === 'AIL' &&
                    DEFAULT_AIL_DOCKS.map((d) => (
                      <option key={d} value={d}>
                        {d} (AIL Bay)
                      </option>
                    ))}
                  {formCompany === 'Both (AHPL & AIL)' &&
                    DEFAULT_BOTH_DOCKS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>

                {formAssignedDock === 'Custom Dock / Dual Bay' && (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dock 01 & Dock 06 or Bay 03"
                    value={formCustomDock}
                    onChange={(e) => setFormCustomDock(e.target.value)}
                    className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                )}

                <p className="mt-1 text-[11px] text-slate-500">
                  {formCompany === 'AHPL' && 'AHPL चुनने पर सिर्फ AHPL लोड रहेगा (Docks 01–04)।'}
                  {formCompany === 'AIL' && 'AIL चुनने पर सिर्फ AIL लोड रहेगा (Docks 05–09)।'}
                  {formCompany === 'Both (AHPL & AIL)' &&
                    'Both (AHPL & AIL) चुनने पर सिंगल गाड़ी में दोनों कंपनियों का कंबाइंड लोड आसानी से ट्रैक और असाइन हो सकेगा (Docks 01–09)।'}
                </p>
              </div>

              {/* Field 3: Place of Plan Location / Destination [Required Dropdown] */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Place of Plan Location / Destination <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    {DEFAULT_PLAN_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {formDestination === 'Other / Custom Location' && (
                  <div className="mt-2 relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Type custom location / destination hub..."
                      value={formCustomDestination}
                      onChange={(e) => setFormCustomDestination(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* Field 4: Assigned Transport / Transporter Name [Optional] & Field 5: Vehicle Type / Feet [Optional] */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Transport / Transporter Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={formTransporter}
                    onChange={(e) => setFormTransporter(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select Transporter --</option>
                    {DEFAULT_TRANSPORTERS.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                  {formTransporter === 'OTHER' && (
                    <input
                      type="text"
                      placeholder="Specify custom transporter..."
                      value={formCustomTransporter}
                      onChange={(e) => setFormCustomTransporter(e.target.value)}
                      className="mt-2 w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Type / Feet <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={formVehicleType}
                    onChange={(e) => setFormVehicleType(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select Vehicle / Feet --</option>
                    {VEHICLE_TYPE_OPTIONS.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 6: Total Weight (KG) [Required] & Field 7: Total CFT (Cubic Feet) [Optional] */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Weight (KG) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3500"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl pl-3 pr-10 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">KG</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total CFT (Cubic Feet) <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 1200"
                      value={formCft}
                      onChange={(e) => setFormCft(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl pl-3 pr-11 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">CFT</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                >
                  {editingPlan
                    ? (lang === 'hi' ? 'परिवर्तन सहेजें' : 'Save Changes')
                    : (lang === 'hi' ? '+ डेली प्लान जोड़ें' : '+ Create Daily Plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
