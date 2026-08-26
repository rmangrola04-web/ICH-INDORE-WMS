import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Truck,
  Clock,
  CheckCircle2,
  Play,
  UserCheck,
  RefreshCw,
  KeyRound,
  Settings,
  Save,
  Send,
  Copy,
  FileCode,
  Check,
  LayoutDashboard,
  KanbanSquare,
  ClipboardList,
  Box,
  CheckCircle,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  Phone,
  Layers,
  User,
  Search,
  Filter,
  ArrowUpRight,
  Building2,
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  ChevronRight,
  UploadCloud,
  Download,
  X
} from 'lucide-react';
import {
  DockRecord,
  CompanyUnit,
  SUPERVISOR_ROSTER,
  Language,
  AHPL_DOCKS,
  AIL_DOCKS,
  ALL_DOCKS,
  getDocksForCompany,
} from '../types';
import { CSVImportModal } from './CSVImportModal';
import { downloadSampleCSVTemplate, CSVImportResult } from '../utils/csvImportUtils';
import { COMPLETE_GOOGLE_APPS_SCRIPT_CODE_GS } from '../utils/googleSheetsService';

interface GuardSupervisorTrackerProps {
  records: DockRecord[];
  lang: Language;
  onAddGuardEntry: (entry: {
    vehicleNo: string;
    driverName: string;
    driverMobile?: string;
    transporterName: string;
    unit: CompanyUnit;
    locationType?: 'LL' | 'TP' | string;
    cfaLocation?: string;
    binNo?: string;
    supervisor?: string;
    gateNo?: string;
    tokenId?: string;
    activityType?: 'Loading' | 'Unloading';
  }) => void;
  onStartActivity: (id: string, activityType: 'Loading' | 'Unloading', supervisorName: string, gateNo: string) => void;
  onCloseActivity: (id: string) => void;
  onSyncFromSheet?: (sheetRecords: DockRecord[]) => void;
  onBatchUpdateRecords?: (records: DockRecord[]) => void;
}

export const GuardSupervisorTracker: React.FC<GuardSupervisorTrackerProps> = ({
  records,
  lang,
  onAddGuardEntry,
  onStartActivity,
  onCloseActivity,
  onSyncFromSheet,
  onBatchUpdateRecords,
}) => {
  // View mode switcher: 'auto' | 'laptop' | 'tablet' | 'mobile' (with 'desktop' aliasing to laptop)
  const [viewMode, setViewMode] = useState<'auto' | 'laptop' | 'desktop' | 'tablet' | 'mobile'>('auto');

  // CSV Import Modal & Feedback State
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);

  const handleApplyCSVImport = (updatedRecords: DockRecord[], summary: CSVImportResult) => {
    if (onBatchUpdateRecords) {
      onBatchUpdateRecords(updatedRecords);
    } else if (onSyncFromSheet) {
      onSyncFromSheet(updatedRecords);
    }
    const msg = `CSV Update Successful! ${summary.updatedCount} records corrected, ${summary.addedCount} new records added (${summary.totalParsed} total rows processed).`;
    setCsvSuccessMsg(msg);
    setTimeout(() => setCsvSuccessMsg(null), 8000);
  };

  // Desktop active tab
  const [desktopTab, setDesktopTab] = useState<'dashboard' | 'taskboard' | 'gateEntry' | 'records'>('dashboard');

  // Mobile active tab
  const [mobileTab, setMobileTab] = useState<'supervisor' | 'gateEntry' | 'records' | 'stats'>('supervisor');
  const [mobileSupervisorFilter, setMobileSupervisorFilter] = useState<string>('ALL');

  // Form State (for Gate In Entry)
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [activityType, setActivityType] = useState<'Loading' | 'Unloading' | ''>('Loading');
  const [transporter, setTransporter] = useState('MATA');
  const [otherTransporter, setOtherTransporter] = useState('');
  const [locationType, setLocationType] = useState<string>('LL');
  const [cfaLocation, setCfaLocation] = useState('');
  const [binNo, setBinNo] = useState('Dock 01');
  const [supervisor, setSupervisor] = useState(SUPERVISOR_ROSTER[0]);
  const [unit, setUnit] = useState<CompanyUnit | ''>('AHPL');
  const [guardSuccessMsg, setGuardSuccessMsg] = useState<string | null>(null);

  // Dynamic Docks for Company
  const availableGateDocks = unit ? getDocksForCompany(unit) : [];

  const handleUnitChange = (newUnit: CompanyUnit | '') => {
    setUnit(newUnit);
    if (newUnit === 'AHPL') {
      setBinNo('Dock 01');
    } else if (newUnit === 'AIL') {
      setBinNo('Dock 05');
    } else {
      setBinNo('');
    }
  };

  // Supervisor Action Modal / Selection
  const [selectedTokenToStart, setSelectedTokenToStart] = useState<DockRecord | null>(null);
  const [chosenActivity, setChosenActivity] = useState<'Loading' | 'Unloading'>('Loading');
  const [chosenSupervisor, setChosenSupervisor] = useState<string>(SUPERVISOR_ROSTER[0]);
  const [chosenGate, setChosenGate] = useState<string>('Dock 01');

  // Apps Script Webhook integration settings
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem('ahpl_apps_script_url') || '';
  });
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [showCodeGuide, setShowCodeGuide] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Search & Filter in Table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Complete Google Apps Script snippet for Live Google Sheets sync
  const APPS_SCRIPT_SNIPPET = COMPLETE_GOOGLE_APPS_SCRIPT_CODE_GS;

  const handleSaveWebhook = () => {
    localStorage.setItem('ahpl_apps_script_url', appsScriptUrl.trim());
    setWebhookStatus('Webhook URL saved successfully!');
    setTimeout(() => setWebhookStatus(null), 3500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Helper status checkers
  const isWaitingStatus = (r: DockRecord) => r.status === 'Dock Assigned' || r.status === 'Gate-In Waiting';
  const isInDockStatus = (r: DockRecord) => r.status === 'In Progress (In Dock)' || r.status === 'In-Progress';
  const isCompletedStatus = (r: DockRecord) => r.status === 'Loaded' || r.status === 'Unloaded' || r.status === 'Completed';

  // KPI Calculations
  const totalCount = records.length;
  const assignedWaitingVehicles = useMemo(() => records.filter(isWaitingStatus), [records]);
  const inProgressInDockVehicles = useMemo(() => records.filter(isInDockStatus), [records]);
  const completedVehicles = useMemo(() => records.filter(isCompletedStatus), [records]);

  // Loading & Unloading pipeline sets
  const loadingPipelineVehicles = useMemo(() => {
    return records.filter((r) => {
      const act = r.activityType || r.operation || 'Loading';
      return act === 'Loading' && !isCompletedStatus(r);
    });
  }, [records]);

  const unloadingPipelineVehicles = useMemo(() => {
    return records.filter((r) => {
      const act = r.activityType || r.operation || 'Unloading';
      return act === 'Unloading' && !isCompletedStatus(r);
    });
  }, [records]);

  // Transporter distribution
  const transporterDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const t = r.transporterName || 'Other';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [records]);

  // Filtered supervisor cards for mobile
  const mobileFilteredTasks = useMemo(() => {
    return records.filter((r) => {
      if (isCompletedStatus(r)) return false;
      if (mobileSupervisorFilter === 'ALL') return true;
      return r.supervisorName?.toLowerCase().includes(mobileSupervisorFilter.toLowerCase());
    });
  }, [records, mobileSupervisorFilter]);

  // Fetch Live Data from Google Apps Script (doGet)
  const handleFetchFromSheet = async () => {
    const url = appsScriptUrl.trim();
    if (!url) {
      setShowWebhookSettings(true);
      alert('Please paste and save your Google Apps Script Web App URL first.');
      return;
    }

    setIsFetchingSheet(true);
    setWebhookStatus('Syncing 14 columns from Google Sheet...');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0 && onSyncFromSheet) {
        const mappedRecords: DockRecord[] = data.map((item: any, idx: number) => {
          const rawStatus = (item.status || '').trim();
          const isDone = rawStatus === 'Loaded' || rawStatus === 'Unloaded' || rawStatus === 'Completed';
          const isInProgress = rawStatus.includes('In Progress') || rawStatus.includes('Started') || rawStatus === 'In-Progress';

          const resolvedActivity: 'Loading' | 'Unloading' = 
            (item.activityType === 'Unloading' || rawStatus.includes('Unloaded') || rawStatus.includes('Unloading')) 
              ? 'Unloading' 
              : 'Loading';

          let resolvedStatus = 'Dock Assigned';
          if (rawStatus === 'Loaded' || rawStatus === 'Unloaded') {
            resolvedStatus = rawStatus;
          } else if (isDone) {
            resolvedStatus = resolvedActivity === 'Loading' ? 'Loaded' : 'Unloaded';
          } else if (isInProgress) {
            resolvedStatus = 'In Progress (In Dock)';
          } else {
            resolvedStatus = 'Dock Assigned';
          }

          const rawUnit = (item.unit || item.Unit || item.company || '').toUpperCase();
          const resolvedUnit: CompanyUnit = rawUnit.includes('AIL') ? 'AIL' : 'AHPL';
          const defaultDock = resolvedUnit === 'AIL' ? 'Dock 05' : 'Dock 01';

          return {
            id: item.id || `SHEET-${item.tokenId || item.TokenId || idx}`,
            tokenId: item.tokenId || item.TokenId || `TKN-${idx + 1000}`,
            unit: resolvedUnit,
            gateNo: item.binNo || item.dock || item.gateNo || defaultDock,
            binNo: item.binNo || item.dock || item.gateNo || '',
            operation: resolvedActivity,
            activityType: resolvedActivity,
            vehicleNo: (item.vehicleNo || item.VehicleNo || '').toUpperCase(),
            driverName: item.driverName || item.DriverName || '',
            driverMobile: item.driverMobile || item.DriverMobile || '',
            transporterName: item.transporter || item.Transporter || 'MATA',
            locationType: item.locationType || item.LocationType || 'LL',
            cfaLocation: item.cfaLocation || item.CFALocation || '',
            supervisorName: item.supervisor || item.Supervisor || SUPERVISOR_ROSTER[0],
            inTime: item.inTime || item.InTime || '',
            startTime: item.startTime || item.InDockTime || '',
            exitTime: item.closeTime || item.ExitTime || '',
            status: resolvedStatus as any,
            date: item.inTime ? item.inTime.split(' ')[0] : new Date().toISOString().slice(0, 10),
            podStatus: item.podStatus || 'POD Clean',
            remarks: `Synced from Google Sheet (${item.status || 'Active'})`,
          };
        });

        onSyncFromSheet(mappedRecords);
        setWebhookStatus(`Successfully synced ${mappedRecords.length} records from Google Sheet!`);
      } else {
        setWebhookStatus('Connected to Google Sheet, but no rows were found.');
      }
    } catch (err: any) {
      console.warn('Google Sheet fetch error:', err);
      setWebhookStatus('Could not read from Google Sheet. Verify Web App is deployed with "Anyone" access.');
    } finally {
      setIsFetchingSheet(false);
      setTimeout(() => setWebhookStatus(null), 5000);
    }
  };

  // Handle Gate Entry Submission
  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim() || !driverName.trim()) return;

    let selectedTransporter = transporter;
    if (selectedTransporter === 'Other') {
      selectedTransporter = otherTransporter.trim() || 'Other';
    } else if (!selectedTransporter) {
      selectedTransporter = 'MATA';
    }

    const defaultDock = unit === 'AIL' ? 'Dock 05' : 'Dock 01';
    const resolvedDock = binNo.trim() || defaultDock;

    const payload = {
      action: 'SECURITY_ENTRY',
      vehicleNo: vehicleNo.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverMobile: driverMobile.trim(),
      activityType: (activityType as 'Loading' | 'Unloading') || 'Loading',
      transporter: selectedTransporter,
      unit: unit || 'AHPL',
      locationType: locationType || 'LL',
      cfaLocation: cfaLocation.trim(),
      binNo: resolvedDock,
      supervisor: supervisor.trim() || SUPERVISOR_ROSTER[0],
    };

    const generatedToken = `TKN-${Math.floor(1000 + Math.random() * 9000)}`;

    onAddGuardEntry({
      vehicleNo: payload.vehicleNo,
      driverName: payload.driverName,
      driverMobile: payload.driverMobile,
      transporterName: payload.transporter,
      unit: (unit as CompanyUnit) || 'AHPL',
      locationType: payload.locationType,
      cfaLocation: payload.cfaLocation,
      binNo: payload.binNo,
      gateNo: payload.binNo,
      supervisor: payload.supervisor,
      tokenId: generatedToken,
      activityType: payload.activityType,
    });

    setGuardSuccessMsg(
      lang === 'hi'
        ? `गाड़ी की एंट्री सफलतापूर्वक दर्ज हो गई! (Token: ${generatedToken})`
        : `Vehicle Gate Entry successfully recorded! (Token: ${generatedToken})`
    );

    // Sync to webhook
    if (appsScriptUrl.trim()) {
      try {
        await fetch(appsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        setTimeout(() => {
          handleFetchFromSheet();
        }, 1200);
      } catch (err) {
        console.warn('Google Sheet Webhook POST error:', err);
      }
    }

    // Reset Form
    setVehicleNo('');
    setDriverName('');
    setDriverMobile('');
    setActivityType('Loading');
    setTransporter('MATA');
    setOtherTransporter('');
    setLocationType('LL');
    setCfaLocation('');
    setBinNo(unit === 'AIL' ? 'Dock 05' : 'Dock 01');
    setSupervisor(SUPERVISOR_ROSTER[0]);
    setTimeout(() => setGuardSuccessMsg(null), 4500);
  };

  // Open Start Modal
  const handleOpenStartModal = (record: DockRecord, type: 'Loading' | 'Unloading') => {
    setSelectedTokenToStart(record);
    setChosenActivity(type);
    const defaultDock = record.unit === 'AIL' ? 'Dock 05' : 'Dock 01';
    setChosenGate(record.binNo || record.gateNo || defaultDock);
    if (record.supervisorName && record.supervisorName !== 'Pending Assignment') {
      setChosenSupervisor(record.supervisorName);
    }
  };

  // Confirm Start (Time 2)
  const handleConfirmStart = async () => {
    if (!selectedTokenToStart) return;

    onStartActivity(selectedTokenToStart.id, chosenActivity, chosenSupervisor, chosenGate);

    if (appsScriptUrl.trim()) {
      try {
        fetch(appsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'START_ACTIVITY',
            tokenId: selectedTokenToStart.tokenId || selectedTokenToStart.id,
            activityType: chosenActivity,
            supervisorName: chosenSupervisor,
            gateNo: chosenGate,
          }),
        }).catch((err) => console.warn(err));

        setTimeout(() => handleFetchFromSheet(), 1200);
      } catch (err) {
        console.warn(err);
      }
    }

    setSelectedTokenToStart(null);
  };

  // Close Activity (Time 3)
  const handleCloseActivityClick = async (record: DockRecord) => {
    onCloseActivity(record.id);

    if (appsScriptUrl.trim()) {
      try {
        fetch(appsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CLOSE_ACTIVITY',
            tokenId: record.tokenId || record.id,
          }),
        }).catch((err) => console.warn(err));

        setTimeout(() => handleFetchFromSheet(), 1200);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Filtered records for table
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        searchTerm === '' ||
        (r.tokenId && r.tokenId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.driverName && r.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.transporterName && r.transporterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.cfaLocation && r.cfaLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.binNo && r.binNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.supervisorName && r.supervisorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.locationType && r.locationType.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter === 'All') return true;
      if (statusFilter === 'Dock Assigned') return isWaitingStatus(r);
      if (statusFilter === 'In Progress') return isInDockStatus(r);
      if (statusFilter === 'Loaded / Unloaded') return isCompletedStatus(r);
      return true;
    });
  }, [records, searchTerm, statusFilter]);

  const showDesktop = viewMode === 'desktop' || (viewMode === 'auto');
  const showMobile = viewMode === 'mobile' || (viewMode === 'auto');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* 1. Mode Switcher Top Bar / Device Switcher Controls */}
      <div className="bg-slate-800 text-slate-300 px-4 py-2 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-400" />
          <span className="text-white font-bold">Logistics Ops Hub & Dock Management</span>
          <span className="hidden sm:inline-block bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] border border-blue-400/30">
            14-Col Apps Script Sync
          </span>
        </div>

        <div className="device-switcher-bar flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-lg border border-slate-700">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Device:</span>
          <button
            type="button"
            id="btnAutoMode"
            onClick={() => setViewMode('auto')}
            className={`device-btn px-2.5 py-1 rounded text-xs transition cursor-pointer font-medium ${
              viewMode === 'auto' ? 'bg-blue-600 text-white font-bold active' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            Auto
          </button>
          <button
            type="button"
            id="btnLaptop"
            onClick={() => setViewMode('laptop')}
            className={`device-btn px-2.5 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1 font-medium ${
              viewMode === 'laptop' || viewMode === 'desktop' ? 'bg-blue-600 text-white font-bold active' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Laptop</span>
          </button>
          <button
            type="button"
            id="btnTablet"
            onClick={() => setViewMode('tablet')}
            className={`device-btn px-2.5 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1 font-medium ${
              viewMode === 'tablet' ? 'bg-blue-600 text-white font-bold active' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            id="btnMobile"
            onClick={() => setViewMode('mobile')}
            className={`device-btn px-2.5 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1 font-medium ${
              viewMode === 'mobile' ? 'bg-blue-600 text-white font-bold active' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* 2. Top Brand Header */}
      <header className="top-brand-header bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 w-10 h-10 rounded-lg shadow-inner flex items-center justify-center text-white shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="brand-title flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-white">
                INTRIGATED CENTRAL HUB - INDORE
              </h1>
              <span className="badge-hub bg-blue-600/25 border border-blue-500/50 text-blue-300 text-xs font-bold px-2 py-0.5 rounded">
                Dock Operations
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Docks 1 to 9 | Movement, Dispatch & Audit Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => downloadSampleCSVTemplate()}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            title="Download 14-Column Sample CSV Template"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Sample CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCSVModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs border border-blue-400/30"
            title="Upload CSV/Excel file to update wrong data"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload CSV / Correct Data</span>
          </button>

          <button
            type="button"
            onClick={handleFetchFromSheet}
            disabled={isFetchingSheet}
            className="text-slate-300 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-50"
            title="Refresh Data from Google Sheet"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingSheet ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* CSV Success Notification Banner */}
      {csvSuccessMsg && (
        <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{csvSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setCsvSuccessMsg(null)}
            className="text-emerald-100 hover:text-white p-1 rounded transition cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Webhook Configuration Drawer */}
      {showWebhookSettings && (
        <div className="bg-blue-50 border-b border-blue-200 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Google Apps Script Web App URL (doPost & doGet - 14 Columns)
            </span>
            <button
              type="button"
              onClick={() => setShowWebhookSettings(false)}
              className="text-slate-400 hover:text-slate-700 text-base"
            >
              &times;
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSaveWebhook}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save URL
            </button>
          </div>
          {webhookStatus && <p className="text-blue-800 font-semibold">{webhookStatus}</p>}
        </div>
      )}

      {/* Code Guide Modal */}
      {showCodeGuide && (
        <div className="bg-slate-900 text-slate-100 p-4 border-b border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white">Google Sheet 14-Column Header & Apps Script</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Script'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCodeGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
          </div>
          <pre className="bg-slate-950 p-2.5 rounded-lg font-mono text-[10px] overflow-x-auto text-emerald-400 border border-slate-800 max-h-48">
            {APPS_SCRIPT_SNIPPET}
          </pre>
        </div>
      )}

      {/* ================= 2. DESKTOP / LAPTOP LAYOUT ================= */}
      <div className={`desktop-layout flex min-h-[620px] ${viewMode === 'mobile' || viewMode === 'tablet' ? 'hidden' : viewMode === 'laptop' || viewMode === 'desktop' ? 'flex' : 'hidden md:flex'}`}>
        {/* Sidebar */}
        <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2 font-bold text-blue-400 text-sm">
            <Truck className="w-5 h-5 text-blue-400" />
            <span>Logistics Hub</span>
          </div>

          <ul className="p-3 space-y-1.5 flex-1 text-sm font-medium">
            <li>
              <button
                type="button"
                onClick={() => setDesktopTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition cursor-pointer text-left ${
                  desktopTab === 'dashboard' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setDesktopTab('taskboard')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition cursor-pointer text-left ${
                  desktopTab === 'taskboard' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <KanbanSquare className="w-4 h-4" />
                  <span>Task Board</span>
                </span>
                {assignedWaitingVehicles.length > 0 && (
                  <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.2 rounded-full">
                    {assignedWaitingVehicles.length}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setDesktopTab('gateEntry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition cursor-pointer text-left ${
                  desktopTab === 'gateEntry' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Gate In Entry</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setDesktopTab('records')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition cursor-pointer text-left ${
                  desktopTab === 'records' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Log Reports</span>
              </button>
            </li>
            <li className="pt-2">
              <button
                type="button"
                onClick={() => setIsCSVModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 transition cursor-pointer text-left font-bold text-xs"
              >
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <span>Upload CSV / Correct</span>
              </button>
            </li>
          </ul>

          <div className="p-3 border-t border-slate-800 space-y-1.5">
            <button
              type="button"
              onClick={() => setShowCodeGuide(!showCodeGuide)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>14-Col Apps Script</span>
            </button>
            <button
              type="button"
              onClick={() => setShowWebhookSettings(!showWebhookSettings)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Webhook Setup</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
          {/* Top Header */}
          <header className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-20">
            <div>
              <h1 id="dPageTitle" className="text-base font-bold text-slate-800">
                {desktopTab === 'dashboard' && 'Dashboard Overview'}
                {desktopTab === 'taskboard' && 'Interactive Dock Task Board'}
                {desktopTab === 'gateEntry' && 'New Vehicle Gate In Entry'}
                {desktopTab === 'records' && 'Vehicle Movement & Status Logs'}
              </h1>
              <p className="text-xs text-slate-500">Live 14-column spreadsheet sync & real-time tracking</p>
            </div>

            <button
              type="button"
              onClick={handleFetchFromSheet}
              disabled={isFetchingSheet}
              className="btn-submit bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </header>

          <div className="p-6 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Vehicles</p>
                  <h2 id="dKpiTotal" className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</h2>
                </div>
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/10 shadow-2xs flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Dock Assigned</p>
                  <h2 id="dKpiAssigned" className="text-2xl font-bold text-amber-900 mt-1">{assignedWaitingVehicles.length}</h2>
                </div>
                <div className="w-11 h-11 bg-amber-100 text-amber-800 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-cyan-200 bg-cyan-50/10 shadow-2xs flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">In Progress (In Dock)</p>
                  <h2 id="dKpiInDock" className="text-2xl font-bold text-cyan-900 mt-1">{inProgressInDockVehicles.length}</h2>
                </div>
                <div className="w-11 h-11 bg-cyan-100 text-cyan-800 rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/10 shadow-2xs flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Loaded / Unloaded</p>
                  <h2 id="dKpiCompleted" className="text-2xl font-bold text-emerald-900 mt-1">{completedVehicles.length}</h2>
                </div>
                <div className="w-11 h-11 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Desktop Tab 1: Dashboard */}
            {desktopTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Live Dock Operation Status</span>
                  </h3>
                  <div className="space-y-3.5 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-amber-700">Dock Assigned (Waiting)</span>
                        <span>{assignedWaitingVehicles.length} ({totalCount ? Math.round((assignedWaitingVehicles.length / totalCount) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalCount ? (assignedWaitingVehicles.length / totalCount) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-cyan-700">In Progress (In Dock)</span>
                        <span>{inProgressInDockVehicles.length} ({totalCount ? Math.round((inProgressInDockVehicles.length / totalCount) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${totalCount ? (inProgressInDockVehicles.length / totalCount) * 100 : 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-emerald-700">Loaded / Unloaded</span>
                        <span>{completedVehicles.length} ({totalCount ? Math.round((completedVehicles.length / totalCount) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalCount ? (completedVehicles.length / totalCount) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Vehicles by Transporter</span>
                  </h3>
                  <div className="space-y-2 pt-2">
                    {Object.entries(transporterDistribution).map(([tr, countVal]) => {
                      const count = Number(countVal) || 0;
                      const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
                      return (
                        <div key={tr} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700">{tr}</span>
                            <span className="text-slate-500">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Tab 2: Task Board */}
            {desktopTab === 'taskboard' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Column 1: Loading Pipeline */}
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 flex flex-col min-h-[460px]">
                  <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-300 font-bold text-sm text-slate-800">
                    <span className="flex items-center gap-1.5 text-cyan-800">
                      <Box className="w-4 h-4 text-cyan-600" />
                      <span>Loading Pipeline</span>
                    </span>
                    <span className="bg-cyan-200 text-cyan-900 text-xs px-2 py-0.5 rounded-full font-bold">
                      {loadingPipelineVehicles.length}
                    </span>
                  </div>

                  <div id="dLoadingCards" className="space-y-3 flex-1 overflow-y-auto">
                    {loadingPipelineVehicles.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-medium">No active vehicles in dock</div>
                    ) : (
                      loadingPipelineVehicles.map((v) => {
                        const isInDock = isInDockStatus(v);
                        return (
                          <div key={v.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {v.tokenId || v.id}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isInDock ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isInDock ? 'In Progress' : 'Dock Assigned'}
                              </span>
                            </div>
                            <div className="font-mono font-bold text-slate-900 text-sm">{v.vehicleNo}</div>
                            <div className="text-xs text-slate-600 space-y-0.5">
                              <div><b>Driver:</b> {v.driverName} {v.transporterName ? `(${v.transporterName})` : ''}</div>
                              <div><b>Dock:</b> {v.binNo || v.gateNo || 'Dock 01'} | <b>Supervisor:</b> {v.supervisorName}</div>
                            </div>
                            {!isInDock ? (
                              <button
                                type="button"
                                onClick={() => handleOpenStartModal(v, 'Loading')}
                                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-1.5 px-3 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <Play className="w-3 h-3" />
                                <span>Start In-Dock</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCloseActivityClick(v)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Complete Loading</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Column 2: Unloading Pipeline */}
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 flex flex-col min-h-[460px]">
                  <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-300 font-bold text-sm text-slate-800">
                    <span className="flex items-center gap-1.5 text-purple-800">
                      <Truck className="w-4 h-4 text-purple-600" />
                      <span>Unloading Pipeline</span>
                    </span>
                    <span className="bg-purple-200 text-purple-900 text-xs px-2 py-0.5 rounded-full font-bold">
                      {unloadingPipelineVehicles.length}
                    </span>
                  </div>

                  <div id="dUnloadingCards" className="space-y-3 flex-1 overflow-y-auto">
                    {unloadingPipelineVehicles.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-medium">No active vehicles in dock</div>
                    ) : (
                      unloadingPipelineVehicles.map((v) => {
                        const isInDock = isInDockStatus(v);
                        return (
                          <div key={v.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                                {v.tokenId || v.id}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isInDock ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isInDock ? 'In Progress' : 'Dock Assigned'}
                              </span>
                            </div>
                            <div className="font-mono font-bold text-slate-900 text-sm">{v.vehicleNo}</div>
                            <div className="text-xs text-slate-600 space-y-0.5">
                              <div><b>Driver:</b> {v.driverName} {v.transporterName ? `(${v.transporterName})` : ''}</div>
                              <div><b>Dock:</b> {v.binNo || v.gateNo || 'Dock 01'} | <b>Supervisor:</b> {v.supervisorName}</div>
                            </div>
                            {!isInDock ? (
                              <button
                                type="button"
                                onClick={() => handleOpenStartModal(v, 'Unloading')}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-3 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <Play className="w-3 h-3" />
                                <span>Start In-Dock</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleCloseActivityClick(v)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-3 rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Complete Unloading</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Column 3: Completed */}
                <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 flex flex-col min-h-[460px]">
                  <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-300 font-bold text-sm text-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Completed</span>
                    </span>
                    <span className="bg-emerald-200 text-emerald-900 text-xs px-2 py-0.5 rounded-full font-bold">
                      {completedVehicles.length}
                    </span>
                  </div>

                  <div id="dCompletedCards" className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                    {completedVehicles.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs font-medium">No active vehicles in dock</div>
                    ) : (
                      completedVehicles.slice(0, 10).map((v) => (
                        <div key={v.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-mono font-bold text-slate-700">{v.tokenId || v.id}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              {v.status}
                            </span>
                          </div>
                          <div className="font-mono font-bold text-slate-900 text-sm">{v.vehicleNo}</div>
                          <div className="text-[11px] text-slate-500">
                            {v.driverName} • {v.transporterName}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Tab 3: Gate Entry Form */}
            {desktopTab === 'gateEntry' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2">
                  New Vehicle Gate Entry & Dock Assignment Form
                </h3>

                {guardSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{guardSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleGateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Company Name*</label>
                      <select
                        id="dUnit"
                        value={unit}
                        onChange={(e) => handleUnitChange(e.target.value as CompanyUnit)}
                        required
                        className="w-full border border-blue-300 rounded-lg p-2 text-sm bg-blue-50/50 font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AHPL">AHPL</option>
                        <option value="AIL">AIL</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Vehicle Number*</label>
                      <input
                        type="text"
                        id="dVehicleNo"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                        placeholder="e.g. MP09 AB 1234"
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Driver Name*</label>
                      <input
                        type="text"
                        id="dDriverName"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="Driver Name"
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Driver Mobile*</label>
                      <input
                        type="tel"
                        id="dDriverMobile"
                        value={driverMobile}
                        onChange={(e) => setDriverMobile(e.target.value)}
                        placeholder="10-digit mobile"
                        pattern="[0-9]{10}"
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Assigned Purpose*</label>
                      <select
                        id="dActivityType"
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value as any)}
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      >
                        <option value="Loading">Loading</option>
                        <option value="Unloading">Unloading</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Transporter Name*</label>
                      <select
                        id="dTransporter"
                        value={transporter}
                        onChange={(e) => setTransporter(e.target.value)}
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      >
                        <option value="MATA">MATA</option>
                        <option value="DHTC">DHTC</option>
                        <option value="ICRL">ICRL</option>
                        <option value="OPM">OPM</option>
                        <option value="VARUNA">VARUNA</option>
                        <option value="FLY GREEN">FLY GREEN</option>
                        <option value="JEET">JEET</option>
                        <option value="MCM">MCM</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Location Type*</label>
                      <select
                        id="dLocationType"
                        value={locationType}
                        onChange={(e) => setLocationType(e.target.value)}
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      >
                        <option value="LL">LL</option>
                        <option value="Third Party">Third Party</option>
                        <option value="Stock Transfer">Stock Transfer</option>
                        <option value="Invoice">Invoice</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Place / CFA (Optional)</label>
                      <input
                        type="text"
                        id="dCfaLocation"
                        value={cfaLocation}
                        onChange={(e) => setCfaLocation(e.target.value)}
                        placeholder="e.g. Kolkata / Balram CFA"
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Assigned Dock / Bay No* {unit && <span className="text-blue-600 font-semibold">({unit})</span>}
                      </label>
                      <select
                        id="dBinNo"
                        value={binNo}
                        onChange={(e) => setBinNo(e.target.value)}
                        required
                        disabled={!unit}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-mono disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {!unit ? (
                          <option value="">Select Company First</option>
                        ) : (
                          availableGateDocks.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Supervisor In-Charge*</label>
                      <select
                        id="dSupervisor"
                        value={supervisor}
                        onChange={(e) => setSupervisor(e.target.value)}
                        required
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      >
                        {SUPERVISOR_ROSTER.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-submit w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition cursor-pointer flex items-center justify-center gap-2 mt-4"
                  >
                    <Send className="w-4 h-4" />
                    <span>Record Gate In (Generate Token)</span>
                  </button>
                </form>
              </div>
            )}

            {/* Desktop Tab 4: Records Table */}
            {desktopTab === 'records' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h3 className="font-bold text-slate-800 text-base">Vehicle History & Status Logs</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search vehicle, driver..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-52 focus:outline-none"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Dock Assigned">Dock Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Loaded / Unloaded">Loaded / Unloaded</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => downloadSampleCSVTemplate()}
                      className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Download 14-Column CSV Template"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">CSV Template</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCSVModalOpen(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Upload CSV/Excel to fix or update records"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload / Correct CSV</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="py-2.5 px-3 font-bold">Token</th>
                        <th className="py-2.5 px-3 font-bold">Vehicle No</th>
                        <th className="py-2.5 px-3 font-bold">Driver</th>
                        <th className="py-2.5 px-3 font-bold">Activity</th>
                        <th className="py-2.5 px-3 font-bold">Transporter</th>
                        <th className="py-2.5 px-3 font-bold">Location</th>
                        <th className="py-2.5 px-3 font-bold">Dock</th>
                        <th className="py-2.5 px-3 font-bold">Supervisor</th>
                        <th className="py-2.5 px-3 font-bold">Gate In</th>
                        <th className="py-2.5 px-3 font-bold">In Dock</th>
                        <th className="py-2.5 px-3 font-bold">End Time</th>
                        <th className="py-2.5 px-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody id="dRecordsTableBody" className="divide-y divide-slate-100">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-8 text-center text-slate-400">No records found</td>
                        </tr>
                      ) : (
                        filteredRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{r.tokenId || r.id}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.vehicleNo}</td>
                            <td className="py-2.5 px-3">{r.driverName}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                (r.activityType || r.operation) === 'Loading' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {r.activityType || r.operation || 'Loading'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{r.transporterName || 'ICRL'}</td>
                            <td className="py-2.5 px-3">{r.cfaLocation || r.locationType || '-'}</td>
                            <td className="py-2.5 px-3 font-mono">{r.binNo || r.gateNo || '-'}</td>
                            <td className="py-2.5 px-3">{r.supervisorName || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">{r.inTime || r.startTime || '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">{isInDockStatus(r) || isCompletedStatus(r) ? r.startTime : '-'}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">{isCompletedStatus(r) ? r.exitTime : '-'}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompletedStatus(r)
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInDockStatus(r)
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ================= 3. TABLET VIEW ================= */}
      <div className={`view-container tablet-view p-4 max-w-5xl mx-auto ${viewMode === 'tablet' ? 'block' : 'hidden'}`} id="tabletView">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supervisor Quick Tasks */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <KanbanSquare className="w-4 h-4 text-blue-600" />
                Supervisor Active Pipeline
              </h3>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                {mobileFilteredTasks.length} Active
              </span>
            </div>
            <select
              id="tSupervisorSelector"
              value={mobileSupervisorFilter}
              onChange={(e) => setMobileSupervisorFilter(e.target.value)}
              className="w-full p-2.5 border-2 border-blue-600 rounded-lg text-sm font-bold text-blue-900 bg-white focus:outline-none"
            >
              <option value="ALL">-- All Supervisors --</option>
              {SUPERVISOR_ROSTER.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div id="tSupervisorCardList" className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {mobileFilteredTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400 font-medium">
                  No active vehicles in dock
                </div>
              ) : (
                mobileFilteredTasks.map((task) => {
                  const isInDock = isInDockStatus(task);
                  const act = task.activityType || task.operation || 'Loading';

                  return (
                    <div key={task.id} className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                            {task.tokenId || task.id}
                          </span>
                          <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                            {task.vehicleNo}
                          </div>
                        </div>
                        <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-xs font-mono">
                          {task.binNo || task.gateNo || 'Dock 01'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div><b>Driver:</b> {task.driverName} {task.driverMobile && `(${task.driverMobile})`}</div>
                        <div><b>Transporter:</b> {task.transporterName || 'Transporter'} • <b>Purpose:</b> {act}</div>
                        <div><b>Supervisor:</b> <span className="text-blue-700 font-semibold">{task.supervisorName}</span></div>
                      </div>
                      {!isInDock ? (
                        <button
                          type="button"
                          onClick={() => handleOpenStartModal(task, act as any)}
                          className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start In-Dock Activity</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCloseActivityClick(task)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete Activity</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Gate In Entry Form */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Quick Gate In
            </h3>
            {guardSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{guardSuccessMsg}</span>
              </div>
            )}
            <form onSubmit={handleGateSubmit} className="space-y-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700">Company Name*</label>
                <select
                  id="tUnit"
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value as CompanyUnit)}
                  required
                  className="w-full border border-blue-300 rounded-lg p-2 text-xs bg-blue-50/50 font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AHPL">AHPL</option>
                  <option value="AIL">AIL</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Vehicle Number*</label>
                <input
                  type="text"
                  id="tVehicleNo"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="e.g. MP09 AB 1234"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Driver Mobile*</label>
                <input
                  type="tel"
                  id="tDriverMobile"
                  value={driverMobile}
                  onChange={(e) => setDriverMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  pattern="[0-9]{10}"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Purpose*</label>
                <select
                  id="tActivityType"
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as any)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Loading">Loading</option>
                  <option value="Unloading">Unloading</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Transporter*</label>
                <select
                  id="tTransporter"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MATA">MATA</option>
                  <option value="DHTC">DHTC</option>
                  <option value="ICRL">ICRL</option>
                  <option value="OPM">OPM</option>
                  <option value="VARUNA">VARUNA</option>
                  <option value="FLY GREEN">FLY GREEN</option>
                  <option value="JEET">JEET</option>
                  <option value="MCM">MCM</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Assigned Dock* {unit && <span className="text-blue-600 font-semibold">({unit})</span>}
                </label>
                <select
                  id="tBinNo"
                  value={binNo}
                  onChange={(e) => setBinNo(e.target.value)}
                  required
                  disabled={!unit}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {!unit ? (
                    <option value="">Select Company First</option>
                  ) : (
                    availableGateDocks.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))
                  )}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Submit Gate In</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ================= 4. MOBILE LAYOUT ================= */}
      <div className={`mobile-layout pb-20 ${viewMode === 'desktop' || viewMode === 'laptop' || viewMode === 'tablet' ? 'hidden' : viewMode === 'mobile' ? 'block' : 'block md:hidden'}`}>
        {/* Mobile Header */}
        <header className="mobile-header bg-slate-900 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <h2 className="text-sm font-bold flex items-center gap-2 text-white">
            <Truck className="w-4 h-4 text-blue-400" />
            <span>Dock Ops App</span>
          </h2>
          <button
            type="button"
            onClick={handleFetchFromSheet}
            disabled={isFetchingSheet}
            className="text-white p-1 hover:text-blue-300 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingSheet ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="p-4 space-y-4">
          {/* Mobile Tab 1: Supervisor Tasks */}
          {mobileTab === 'supervisor' && (
            <div className="space-y-3">
              {/* Supervisor Selector Box */}
              <div className="supervisor-select-box bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Supervisor Filter
                </label>
                <select
                  id="mSupervisorSelector"
                  value={mobileSupervisorFilter}
                  onChange={(e) => setMobileSupervisorFilter(e.target.value)}
                  className="w-full p-2.5 border-2 border-blue-600 rounded-lg text-sm font-bold text-blue-900 bg-white focus:outline-none"
                >
                  <option value="ALL">-- Show All Tasks ({mobileFilteredTasks.length}) --</option>
                  {SUPERVISOR_ROSTER.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Task Cards List */}
              <div id="mSupervisorCardList" className="space-y-3">
                {mobileFilteredTasks.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 font-medium">
                    No active vehicles in dock
                  </div>
                ) : (
                  mobileFilteredTasks.map((task) => {
                    const isInDock = isInDockStatus(task);
                    const act = task.activityType || task.operation || 'Loading';

                    return (
                      <div key={task.id} className="m-card bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              {task.tokenId || task.id}
                            </span>
                            <div className="m-vehicle text-base font-extrabold text-slate-900 font-mono mt-1">
                              {task.vehicleNo}
                            </div>
                          </div>
                          <span className="m-dock bg-blue-50 text-blue-800 font-bold px-2 py-1 rounded text-xs font-mono">
                            {task.binNo || task.gateNo || 'Dock 01'}
                          </span>
                        </div>

                        <div className="m-details text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div><b>Driver:</b> {task.driverName} {task.driverMobile && `(${task.driverMobile})`}</div>
                          <div><b>Transporter:</b> {task.transporterName || 'Transporter'} • <b>Purpose:</b> {act}</div>
                          <div><b>Supervisor:</b> <span className="text-blue-700 font-semibold">{task.supervisorName}</span></div>
                          <div className="text-[10px] text-slate-400">Gate In: {task.inTime || task.startTime || 'Recorded'}</div>
                        </div>

                        {!isInDock ? (
                          <button
                            type="button"
                            onClick={() => handleOpenStartModal(task, act as any)}
                            className="m-btn m-btn-start w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start In-Dock Activity (Time 2)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCloseActivityClick(task)}
                            className="m-btn m-btn-complete w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete Activity (Time 3)</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Mobile Tab 2: Gate Entry */}
          {mobileTab === 'gateEntry' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                Gate In Entry (Security)
              </h3>

              {guardSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{guardSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleGateSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Company Name*</label>
                  <select
                    id="mUnit"
                    value={unit}
                    onChange={(e) => handleUnitChange(e.target.value as CompanyUnit)}
                    required
                    className="w-full border border-blue-300 rounded-lg p-2 text-xs bg-blue-50/50 font-semibold text-blue-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AHPL">AHPL</option>
                    <option value="AIL">AIL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Vehicle Number*</label>
                  <input
                    type="text"
                    id="mVehicleNo"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                    placeholder="e.g. MP09 AB 1234"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Driver Name*</label>
                  <input
                    type="text"
                    id="mDriverName"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver Name"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Driver Mobile*</label>
                  <input
                    type="tel"
                    id="mDriverMobile"
                    value={driverMobile}
                    onChange={(e) => setDriverMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    pattern="[0-9]{10}"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Purpose*</label>
                    <select
                      id="mActivityType"
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as any)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    >
                      <option value="Loading">Loading</option>
                      <option value="Unloading">Unloading</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Transporter*</label>
                    <select
                      id="mTransporter"
                      value={transporter}
                      onChange={(e) => setTransporter(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    >
                      <option value="MATA">MATA</option>
                      <option value="DHTC">DHTC</option>
                      <option value="ICRL">ICRL</option>
                      <option value="OPM">OPM</option>
                      <option value="VARUNA">VARUNA</option>
                      <option value="FLY GREEN">FLY GREEN</option>
                      <option value="JEET">JEET</option>
                      <option value="MCM">MCM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Dock / Bay* {unit && <span className="text-blue-600 font-semibold">({unit})</span>}
                    </label>
                    <select
                      id="mBinNo"
                      value={binNo}
                      onChange={(e) => setBinNo(e.target.value)}
                      required
                      disabled={!unit}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {!unit ? (
                        <option value="">Select Company First</option>
                      ) : (
                        availableGateDocks.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Supervisor*</label>
                    <select
                      id="mSupervisor"
                      value={supervisor}
                      onChange={(e) => setSupervisor(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                    >
                      {SUPERVISOR_ROSTER.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Record Gate In</span>
                </button>
              </form>
            </div>
          )}

          {/* Mobile Tab 3: Records */}
          {mobileTab === 'records' && (
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <h3 className="font-bold text-slate-800 text-xs">All Vehicle Logs</h3>
                <input
                  type="text"
                  placeholder="Search vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-2.5">
                {filteredRecords.map((r) => (
                  <div key={r.id} className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex justify-between font-mono font-bold">
                      <span className="text-blue-700">{r.tokenId || r.id}</span>
                      <span className="text-slate-900">{r.vehicleNo}</span>
                    </div>
                    <div className="text-slate-600">{r.driverName} • {r.transporterName || 'ICRL'}</div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                      <span>{r.binNo || r.gateNo || 'Dock-01'}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                        isCompletedStatus(r) ? 'bg-emerald-100 text-emerald-800' : isInDockStatus(r) ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Tab 4: Stats */}
          {mobileTab === 'stats' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total</p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalCount}</h3>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 text-center shadow-2xs">
                <p className="text-[10px] font-bold text-amber-700 uppercase">Assigned</p>
                <h3 className="text-xl font-bold text-amber-900 mt-0.5">{assignedWaitingVehicles.length}</h3>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/20 text-center shadow-2xs">
                <p className="text-[10px] font-bold text-cyan-700 uppercase">In Dock</p>
                <h3 className="text-xl font-bold text-cyan-900 mt-0.5">{inProgressInDockVehicles.length}</h3>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 text-center shadow-2xs">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Completed</p>
                <h3 className="text-xl font-bold text-emerald-900 mt-0.5">{completedVehicles.length}</h3>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-40 shadow-lg">
          <button
            type="button"
            onClick={() => setMobileTab('supervisor')}
            className={`b-nav-item flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
              mobileTab === 'supervisor' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Tasks</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('gateEntry')}
            className={`b-nav-item flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
              mobileTab === 'gateEntry' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Gate In</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('records')}
            className={`b-nav-item flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
              mobileTab === 'records' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Reports</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('stats')}
            className={`b-nav-item flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
              mobileTab === 'stats' ? 'text-blue-600 font-bold' : 'text-slate-500'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Stats</span>
          </button>
        </nav>
      </div>

      {/* Start Modal */}
      {selectedTokenToStart && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span>Start In-Dock Activity (Time 2)</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTokenToStart(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>Token: <b className="font-mono text-blue-700">{selectedTokenToStart.tokenId || selectedTokenToStart.id}</b></div>
              <div>Vehicle: <b className="font-mono">{selectedTokenToStart.vehicleNo}</b></div>
              <div>
                Driver: <b>{selectedTokenToStart.driverName}</b>{' '}
                {selectedTokenToStart.transporterName ? `(${selectedTokenToStart.transporterName})` : ''}
              </div>
              {selectedTokenToStart.unit && (
                <div>Unit / Company: <b className="text-blue-700">{selectedTokenToStart.unit}</b></div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Operation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChosenActivity('Loading')}
                    className={`py-2 px-3 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1 border ${
                      chosenActivity === 'Loading' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    Loading
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenActivity('Unloading')}
                    className={`py-2 px-3 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-1 border ${
                      chosenActivity === 'Unloading' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Unloading
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Assigned Dock / Bay {selectedTokenToStart.unit && `(${selectedTokenToStart.unit})`}
                </label>
                <select
                  value={chosenGate}
                  onChange={(e) => setChosenGate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono bg-white"
                >
                  {getDocksForCompany(selectedTokenToStart.unit).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Supervisor In-Charge</label>
                <select
                  value={chosenSupervisor}
                  onChange={(e) => setChosenSupervisor(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  {SUPERVISOR_ROSTER.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTokenToStart(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs flex items-center justify-center gap-1 shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                Confirm Start (Time 2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV / Excel Data Upload & Correction Modal */}
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        existingRecords={records}
        onApplyImport={handleApplyCSVImport}
        lang={lang}
      />
    </div>
  );
};
