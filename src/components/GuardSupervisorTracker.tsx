import React, { useState, useMemo } from 'react';
import {
  Shield,
  Truck,
  Clock,
  CheckCircle2,
  Play,
  ArrowRight,
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
  Calendar
} from 'lucide-react';
import { DockRecord, CompanyUnit, SUPERVISOR_ROSTER, Language } from '../types';

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
}

export const GuardSupervisorTracker: React.FC<GuardSupervisorTrackerProps> = ({
  records,
  lang,
  onAddGuardEntry,
  onStartActivity,
  onCloseActivity,
  onSyncFromSheet,
}) => {
  // Active Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'taskboard' | 'gateEntry' | 'allRecords'>('taskboard');

  // Gate In Form State (Driver Mobile, Bay/Bin, Supervisor, Location Type, CFA Location & Activity Type)
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [activityType, setActivityType] = useState<'Loading' | 'Unloading'>('Loading');
  const [transporter, setTransporter] = useState('ICRL');
  const [locationType, setLocationType] = useState<'LL' | 'TP' | ''>('LL');
  const [cfaLocation, setCfaLocation] = useState('');
  const [binNo, setBinNo] = useState('Dock-01');
  const [supervisor, setSupervisor] = useState<string>(SUPERVISOR_ROSTER[0]);
  const [unit, setUnit] = useState<CompanyUnit>('AHPL');
  const [guardSuccessMsg, setGuardSuccessMsg] = useState<string | null>(null);

  // Supervisor Action Modal / Selection
  const [selectedTokenToStart, setSelectedTokenToStart] = useState<DockRecord | null>(null);
  const [chosenActivity, setChosenActivity] = useState<'Loading' | 'Unloading'>('Loading');
  const [chosenSupervisor, setChosenSupervisor] = useState<string>(SUPERVISOR_ROSTER[0]);
  const [chosenGate, setChosenGate] = useState<string>('Dock-01');

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

  // 14-Column Google Apps Script code snippet matching user's backend
  const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var now = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
    var dateToday = new Date().toLocaleDateString("en-IN");
    var fullTimestamp = dateToday + " " + now;

    // 1. गेट एंट्री (Security In-Time)
    if (data.action === "SECURITY_ENTRY") {
      var tokenId = "TKN-" + Math.floor(1000 + Math.random() * 9000);
      var activity = data.activityType || "Loading";
      
      sheet.appendRow([
        tokenId,
        fullTimestamp,
        (data.vehicleNo || "").toUpperCase(),
        data.driverName || "",
        data.driverMobile || "",
        data.transporter || "",
        data.locationType || "",
        data.cfaLocation || "",
        data.binNo || "",
        data.supervisor || "",
        activity,
        "", // Start Time (In Dock Time)
        "", // End Time (Loaded/Unloaded Time)
        "Dock Assigned" // Status
      ]);

      return ContentService.createTextOutput(JSON.stringify({ 
        result: "success", 
        tokenId: tokenId 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. डॉक पर काम शुरू (In Progress In Dock - Time 2)
    if (data.action === "START_ACTIVITY") {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.tokenId) {
          var activityType = data.activityType || rows[i][10] || "Loading";
          sheet.getRange(i + 1, 11).setValue(activityType);
          sheet.getRange(i + 1, 12).setValue(fullTimestamp); // Col L: Start/Dock Time
          sheet.getRange(i + 1, 14).setValue("In Progress (In Dock)"); // Col N: Status
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. काम खत्म (Loaded / Unloaded - Time 3)
    if (data.action === "CLOSE_ACTIVITY") {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.tokenId) {
          var actType = rows[i][10] || "Loading";
          var finalStatus = actType === "Loading" ? "Loaded" : "Unloaded";

          sheet.getRange(i + 1, 13).setValue(fullTimestamp); // Col M: Close Time
          sheet.getRange(i + 1, 14).setValue(finalStatus);   // Col N: Status
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    result.push({
      tokenId: rows[i][0],
      inTime: rows[i][1],
      vehicleNo: rows[i][2],
      driverName: rows[i][3],
      driverMobile: rows[i][4],
      transporter: rows[i][5],
      locationType: rows[i][6],
      cfaLocation: rows[i][7],
      binNo: rows[i][8],
      supervisor: rows[i][9],
      activityType: rows[i][10],
      startTime: rows[i][11],
      closeTime: rows[i][12],
      status: rows[i][13]
    });
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}`;

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

  // Live KPI Calculations (matching exactly user's metrics: Total, Dock Assigned, In Progress In Dock, Loaded / Unloaded)
  const isWaitingStatus = (r: DockRecord) => r.status === 'Dock Assigned' || r.status === 'Gate-In Waiting';
  const isInDockStatus = (r: DockRecord) => r.status === 'In Progress (In Dock)' || r.status === 'In-Progress';
  const isCompletedStatus = (r: DockRecord) => r.status === 'Loaded' || r.status === 'Unloaded' || r.status === 'Completed';

  const assignedWaitingVehicles = useMemo(() => records.filter(isWaitingStatus), [records]);
  const inProgressInDockVehicles = useMemo(() => records.filter(isInDockStatus), [records]);
  const completedVehicles = useMemo(() => records.filter(isCompletedStatus), [records]);
  const totalCount = records.length;

  // Pipeline specific splits
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

  // Transporter Distribution for Charts
  const transporterDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const t = r.transporterName || 'Other';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [records]);

  // Fetch Live Data from Google Apps Script (doGet) - 14 Columns
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

          return {
            id: `SHEET-${item.tokenId || idx}`,
            tokenId: item.tokenId || `TKN-${idx + 1000}`,
            unit: 'AHPL' as CompanyUnit,
            gateNo: item.binNo || (resolvedActivity === 'Unloading' ? 'Dock-05' : 'Dock-01'),
            binNo: item.binNo || '',
            operation: resolvedActivity,
            activityType: resolvedActivity,
            vehicleNo: item.vehicleNo || 'UNKNOWN',
            driverName: item.driverName || 'Driver',
            driverMobile: item.driverMobile || '',
            transporterName: item.transporter || 'ICRL',
            locationType: item.locationType || 'LL',
            cfaLocation: item.cfaLocation || '',
            supervisorName: item.supervisor || 'Supervisor In-Charge',
            inTime: item.inTime || '',
            startTime: item.startTime || '',
            exitTime: item.closeTime || '',
            status: resolvedStatus as any,
            date: item.inTime ? item.inTime.split(' ')[0] : new Date().toISOString().slice(0, 10),
            podStatus: 'POD Clean',
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

  // Handle Security Gate Entry Submission (with Mobile, Bay/Bin, Supervisor, Activity)
  const handleGuardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim() || !driverName.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateToday = now.toLocaleDateString('en-IN');
    const fullTimestamp = `${dateToday} ${timeStr}`;

    const vNo = vehicleNo.trim().toUpperCase();
    const dName = driverName.trim();
    const dMobile = driverMobile.trim();
    const tName = transporter.trim();
    const locType = locationType || 'LL';
    const cfaLoc = cfaLocation.trim();
    const bNo = binNo.trim() || 'Dock-01';
    const supName = supervisor.trim() || SUPERVISOR_ROSTER[0];
    const generatedToken = `TKN-${Math.floor(1000 + Math.random() * 9000)}`;

    onAddGuardEntry({
      vehicleNo: vNo,
      driverName: dName,
      driverMobile: dMobile,
      transporterName: tName,
      unit,
      locationType: locType,
      cfaLocation: cfaLoc,
      binNo: bNo,
      supervisor: supName,
      tokenId: generatedToken,
      activityType: activityType,
    });

    // If Apps Script URL is configured, send async POST with exact 14-column matching payload
    if (appsScriptUrl.trim()) {
      try {
        fetch(appsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SECURITY_ENTRY',
            vehicleNo: vNo,
            driverName: dName,
            driverMobile: dMobile,
            transporter: tName,
            locationType: locType,
            cfaLocation: cfaLoc,
            binNo: bNo,
            supervisor: supName,
            activityType: activityType,
            timestamp: fullTimestamp,
          }),
        }).catch((err) => console.warn('Apps script sync notice:', err));
      } catch (err) {
        console.warn('Apps script sync error:', err);
      }
    }

    setGuardSuccessMsg(`Token ${generatedToken} Generated & Gate-In Recorded for ${vNo}`);
    setVehicleNo('');
    setDriverName('');
    setDriverMobile('');
    setCfaLocation('');
    setTimeout(() => setGuardSuccessMsg(null), 4500);
  };

  const handleOpenStartModal = (record: DockRecord, type: 'Loading' | 'Unloading') => {
    setSelectedTokenToStart(record);
    setChosenActivity(type);
    setChosenGate(record.binNo || record.gateNo || (record.unit === 'AIL' ? 'Dock-05' : 'Dock-01'));
    if (record.supervisorName && record.supervisorName !== 'Pending Assignment') {
      setChosenSupervisor(record.supervisorName);
    }
  };

  const handleConfirmStart = async () => {
    if (!selectedTokenToStart) return;

    onStartActivity(selectedTokenToStart.id, chosenActivity, chosenSupervisor, chosenGate);

    // Apps Script Sync (Matching START_ACTIVITY: Col 11 activityType, Col 12 Start Time, Col 14 Status)
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
      } catch (err) {
        console.warn(err);
      }
    }

    setSelectedTokenToStart(null);
  };

  const handleCloseActivityClick = async (record: DockRecord) => {
    const tokenId = record.tokenId || record.id;
    const isLoad = (record.activityType || record.operation) === 'Loading';
    const finalLabel = isLoad ? 'Loaded' : 'Unloaded';
    const confirmText = lang === 'hi'
      ? `क्या आप ${tokenId} (${record.vehicleNo}) का कार्य पूर्ण (${finalLabel}) घोषित करना चाहते हैं?`
      : `Do you want to mark ${tokenId} (${record.vehicleNo}) as ${finalLabel} and close dock operation?`;

    if (!window.confirm(confirmText)) return;

    onCloseActivity(record.id);

    // Apps Script Sync (Matching CLOSE_ACTIVITY: Col 13 Close Time, Col 14 Status)
    if (appsScriptUrl.trim()) {
      try {
        fetch(appsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CLOSE_ACTIVITY',
            tokenId: tokenId,
          }),
        }).catch((err) => console.warn(err));
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Filtered records for Table
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search term
      const matchesSearch =
        !searchTerm.trim() ||
        r.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.tokenId && r.tokenId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.driverName && r.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.driverMobile && r.driverMobile.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.transporterName && r.transporterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.cfaLocation && r.cfaLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.binNo && r.binNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.supervisorName && r.supervisorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.locationType && r.locationType.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      if (!matchesSearch) return false;
      if (statusFilter === 'All') return true;
      if (statusFilter === 'Dock Assigned') return isWaitingStatus(r);
      if (statusFilter === 'In Progress') return isInDockStatus(r);
      if (statusFilter === 'Loaded / Unloaded') return isCompletedStatus(r);
      return true;
    });
  }, [records, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>{lang === 'hi' ? '🚛 वाहन मूवमेंट ट्रैकर (Logistics Ops Hub)' : '🚛 Logistics Ops Hub & Vehicle Tracker'}</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  14-Col Sheet Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? '3-स्तरीय समय (Time 1: Gate In, Time 2: In Dock, Time 3: End Time) के साथ लाइव 14-कॉलम Google Sheet doPost/doGet सिंक'
                  : '3-stage timestamp tracking (Gate In, In-Dock, Loaded/Unloaded) with live 14-column Google Sheet doPost/doGet sync'}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSubTab('dashboard')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'डैशबोर्ड (Dashboard)' : 'Dashboard'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('taskboard')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'taskboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'टास्क बोर्ड (Task Board)' : 'Task Board'}</span>
              {assignedWaitingVehicles.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubTab === 'taskboard' ? 'bg-blue-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {assignedWaitingVehicles.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('gateEntry')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'gateEntry' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सिक्योरिटी गेट एंट्री (Gate In)' : 'Gate In Entry'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('allRecords')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'allRecords' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सभी रिकॉर्ड (Log Report)' : 'Log Report'}</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleFetchFromSheet}
            disabled={isFetchingSheet}
            className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Fetch live records from Google Sheet via doGet()"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lang === 'hi' ? 'रिफ्रेश करें' : 'Sync Sheet'}</span>
          </button>

          {/* Code Guide Modal Button */}
          <button
            type="button"
            onClick={() => setShowCodeGuide(!showCodeGuide)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1.5 cursor-pointer font-medium"
            title="View 14-Column Google Apps Script Code (doPost / doGet)"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">14-Col Apps Script</span>
          </button>

          {/* Settings Drawer Button */}
          <button
            type="button"
            onClick={() => setShowWebhookSettings(!showWebhookSettings)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
            title="Webhook Setup"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Webhook Configuration Drawer */}
      {showWebhookSettings && (
        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Google Apps Script Web App URL (doPost & doGet - 14 Columns)
            </span>
            <span className="text-[11px] text-slate-500">Live 14-column spreadsheet synchronization</span>
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
          {webhookStatus && (
            <p className="text-blue-800 font-semibold">{webhookStatus}</p>
          )}
        </div>
      )}

      {/* Code Guide Modal */}
      {showCodeGuide && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white">Google Sheet Row 1 Header (14 Columns) & Apps Script Code</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Script'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCodeGuide(false)}
                className="text-slate-400 hover:text-white text-base leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <b>Google Sheet Column Setup (Row 1 Header - 14 Columns):</b>
            <div className="font-mono text-emerald-400 overflow-x-auto whitespace-nowrap bg-slate-900 p-2 rounded">
              Token ID | In Time (Time 1) | Vehicle No | Driver Name | Driver Mobile | Transporter | Location Type | CFA / Place Name | Bay / Bin No | Supervisor | Activity Type | Start Time (Time 2) | Close Time (Time 3) | Status
            </div>
            <div className="text-[10px] text-slate-400">
              Columns: A (Token), B (In-Time), C (Vehicle), D (Driver), E (Mobile), F (Transporter), G (LL/TP), H (CFA), I (Bay/Bin), J (Supervisor), K (Activity Type), L (In-Dock Time 2), M (Close Time 3), N (Status: Dock Assigned | In Progress | Loaded | Unloaded)
            </div>
          </div>

          <pre className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto text-emerald-400 border border-slate-800 max-h-64">
            {APPS_SCRIPT_SNIPPET}
          </pre>
        </div>
      )}

      {/* KPI SUMMARY CARDS (Matching exact 4 KPI cards in user template) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'hi' ? 'कुल गाड़ियां (Total)' : 'Total Vehicles'}</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</h2>
          </div>
          <span className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg">
            <Truck className="w-6 h-6" />
          </span>
        </div>

        {/* 2. Dock Assigned (Waiting) */}
        <div className="bg-white p-4.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{lang === 'hi' ? 'डॉक असाइन (Waiting)' : 'Dock Assigned (Waiting)'}</p>
            <h2 className="text-2xl font-bold text-amber-900 mt-1">{assignedWaitingVehicles.length}</h2>
          </div>
          <span className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-lg">
            <Clock className="w-6 h-6" />
          </span>
        </div>

        {/* 3. In Progress (In Dock) */}
        <div className="bg-white p-4.5 rounded-xl border border-cyan-200 bg-cyan-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">{lang === 'hi' ? 'In Progress (In Dock)' : 'In Progress (In Dock)'}</p>
            <h2 className="text-2xl font-bold text-cyan-900 mt-1">{inProgressInDockVehicles.length}</h2>
          </div>
          <span className="w-12 h-12 bg-cyan-100 text-cyan-700 rounded-xl flex items-center justify-center text-lg">
            <Box className="w-6 h-6" />
          </span>
        </div>

        {/* 4. Loaded / Unloaded (Completed) */}
        <div className="bg-white p-4.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{lang === 'hi' ? 'Loaded / Unloaded' : 'Loaded / Unloaded'}</p>
            <h2 className="text-2xl font-bold text-emerald-900 mt-1">{completedVehicles.length}</h2>
          </div>
          <span className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-lg">
            <CheckCircle className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* 1. DASHBOARD TAB */}
      {activeSubTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Live Dock Operation Status Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>{lang === 'hi' ? 'लाइव डॉक ऑपरेशन स्टेटस' : 'Live Dock Operation Status'}</span>
            </h3>

            <div className="space-y-3.5 pt-2">
              {/* Waiting / Dock Assigned bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-700">{lang === 'hi' ? 'डॉक असाइन (Waiting)' : 'Dock Assigned (Waiting)'}</span>
                  <span>{assignedWaitingVehicles.length} ({totalCount ? Math.round((assignedWaitingVehicles.length / totalCount) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalCount ? (assignedWaitingVehicles.length / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* In Progress (In Dock) bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-cyan-700">{lang === 'hi' ? 'In Progress (In Dock)' : 'In Progress (In Dock)'}</span>
                  <span>{inProgressInDockVehicles.length} ({totalCount ? Math.round((inProgressInDockVehicles.length / totalCount) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalCount ? (inProgressInDockVehicles.length / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Completed (Loaded / Unloaded) bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-700">{lang === 'hi' ? 'Loaded / Unloaded (पूर्ण)' : 'Loaded / Unloaded'}</span>
                  <span>{completedVehicles.length} ({totalCount ? Math.round((completedVehicles.length / totalCount) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalCount ? (completedVehicles.length / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick summary box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Active Vehicles in Yard: <b>{assignedWaitingVehicles.length + inProgressInDockVehicles.length}</b></span>
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => setActiveSubTab('taskboard')}>
                View Pipelines &rarr;
              </span>
            </div>
          </div>

          {/* Transporter Volume Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>{lang === 'hi' ? 'ट्रांसपोर्टर अनुसार गाड़ियां' : 'Vehicles by Transporter'}</span>
            </h3>

            <div className="space-y-2.5 pt-2">
              {Object.entries(transporterDistribution).map(([tr, countVal]) => {
                const count = Number(countVal) || 0;
                const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
                return (
                  <div key={tr} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{tr}</span>
                      <span className="text-slate-500">{count} {count > 1 ? 'Vehicles' : 'Vehicle'} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. TASK BOARD TAB (3-Pipeline Kanban: Loading, Unloading, Completed Loaded/Unloaded) */}
      {activeSubTab === 'taskboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Loading Pipeline */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center pb-3 mb-3 border-b-2 border-slate-300 font-bold text-sm text-slate-800">
              <span className="flex items-center gap-1.5 text-cyan-800">
                <Box className="w-4 h-4 text-cyan-600" />
                <span>{lang === 'hi' ? 'लोडिंग पाइपलाइन (Loading)' : 'Loading Pipeline'}</span>
              </span>
              <span className="bg-cyan-200 text-cyan-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {loadingPipelineVehicles.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {loadingPipelineVehicles.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'कोई सक्रिय लोडिंग गाड़ी नहीं है' : 'No active loading vehicles'}
                </div>
              ) : (
                loadingPipelineVehicles.map((v) => {
                  const isInDock = isInDockStatus(v);
                  const placeText = v.cfaLocation ? ` | CFA: ${v.cfaLocation}` : '';

                  return (
                    <div key={v.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5 hover:shadow-sm transition">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {v.tokenId || v.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isInDock ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isInDock ? 'In Progress (In Dock)' : 'Dock Assigned (Waiting)'}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <div className="font-mono font-bold text-slate-900 text-base">{v.vehicleNo}</div>
                        {v.locationType && (
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded">
                            {v.locationType}{placeText}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span><b>Driver:</b> {v.driverName || 'Driver'} ({v.transporterName || 'ICRL'})</span>
                        </div>
                        {v.driverMobile && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <a href={`tel:${v.driverMobile}`} className="hover:underline font-mono text-blue-600 font-semibold">{v.driverMobile}</a>
                          </div>
                        )}
                        {(v.binNo || v.gateNo) && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span><b>Dock/Bay:</b> {v.binNo || v.gateNo}</span>
                          </div>
                        )}
                        {v.supervisorName && (
                          <div className="text-[11px] text-slate-500">
                            Supervisor: <b className="text-slate-800">{v.supervisorName}</b>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          Gate In (Time 1): <b>{v.inTime || v.startTime || 'Recorded'}</b>
                        </div>
                        {isInDock && v.startTime && (
                          <div className="text-[10px] text-cyan-700 font-semibold">
                            In-Dock (Time 2): {v.startTime}
                          </div>
                        )}
                      </div>

                      {/* Action buttons based on status */}
                      {!isInDock ? (
                        <button
                          type="button"
                          onClick={() => handleOpenStartModal(v, 'Loading')}
                          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start In-Dock (Time 2)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCloseActivityClick(v)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finish & Loaded (Time 3)</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Unloading Pipeline */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center pb-3 mb-3 border-b-2 border-slate-300 font-bold text-sm text-slate-800">
              <span className="flex items-center gap-1.5 text-purple-800">
                <Truck className="w-4 h-4 text-purple-600" />
                <span>{lang === 'hi' ? 'अनलोडिंग पाइपलाइन (Unloading)' : 'Unloading Pipeline'}</span>
              </span>
              <span className="bg-purple-200 text-purple-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {unloadingPipelineVehicles.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {unloadingPipelineVehicles.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'कोई सक्रिय अनलोडिंग गाड़ी नहीं है' : 'No active unloading vehicles'}
                </div>
              ) : (
                unloadingPipelineVehicles.map((v) => {
                  const isInDock = isInDockStatus(v);
                  const placeText = v.cfaLocation ? ` | CFA: ${v.cfaLocation}` : '';

                  return (
                    <div key={v.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5 hover:shadow-sm transition">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {v.tokenId || v.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isInDock ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isInDock ? 'In Progress (In Dock)' : 'Dock Assigned (Waiting)'}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <div className="font-mono font-bold text-slate-900 text-base">{v.vehicleNo}</div>
                        {v.locationType && (
                          <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded">
                            {v.locationType}{placeText}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span><b>Driver:</b> {v.driverName || 'Driver'} ({v.transporterName || 'ICRL'})</span>
                        </div>
                        {v.driverMobile && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <a href={`tel:${v.driverMobile}`} className="hover:underline font-mono text-blue-600 font-semibold">{v.driverMobile}</a>
                          </div>
                        )}
                        {(v.binNo || v.gateNo) && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span><b>Dock/Bay:</b> {v.binNo || v.gateNo}</span>
                          </div>
                        )}
                        {v.supervisorName && (
                          <div className="text-[11px] text-slate-500">
                            Supervisor: <b className="text-slate-800">{v.supervisorName}</b>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          Gate In (Time 1): <b>{v.inTime || v.startTime || 'Recorded'}</b>
                        </div>
                        {isInDock && v.startTime && (
                          <div className="text-[10px] text-purple-700 font-semibold">
                            In-Dock (Time 2): {v.startTime}
                          </div>
                        )}
                      </div>

                      {/* Action buttons based on status */}
                      {!isInDock ? (
                        <button
                          type="button"
                          onClick={() => handleOpenStartModal(v, 'Unloading')}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start In-Dock (Time 2)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCloseActivityClick(v)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finish & Unloaded (Time 3)</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Completed Pipeline (Loaded / Unloaded) */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center pb-3 mb-3 border-b-2 border-slate-300 font-bold text-sm text-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'hi' ? 'पूर्ण (Loaded / Unloaded)' : 'Completed (Loaded / Unloaded)'}</span>
              </span>
              <span className="bg-emerald-200 text-emerald-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {completedVehicles.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {completedVehicles.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'कोई पूर्ण गाड़ी नहीं है' : 'No completed vehicles'}
                </div>
              ) : (
                completedVehicles.map((v) => {
                  const isLoaded = v.status === 'Loaded' || v.operation === 'Loading';
                  const finalTag = v.status === 'Loaded' || v.status === 'Unloaded' ? v.status : isLoaded ? 'Loaded' : 'Unloaded';

                  return (
                    <div key={v.id} className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs space-y-2 opacity-95 hover:opacity-100 transition">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {v.tokenId || v.id}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                          {finalTag}
                        </span>
                      </div>

                      <div className="font-mono font-bold text-slate-900 text-base">{v.vehicleNo}</div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div><b>Transporter:</b> {v.transporterName || 'ICRL'} | {v.driverName}</div>
                        {v.driverMobile && (
                          <div className="text-[11px] text-slate-500 font-mono">Mobile: {v.driverMobile}</div>
                        )}
                        <div className="grid grid-cols-1 gap-0.5 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div>Gate In (Time 1): <b>{v.inTime || v.startTime || '-'}</b></div>
                          <div>In Dock (Time 2): <b>{v.startTime || '-'}</b></div>
                          <div>End Time (Time 3): <b className="text-emerald-700">{v.exitTime || 'Closed'}</b></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. GATE ENTRY TAB (Full 9-Field Form matching user HTML) */}
      {activeSubTab === 'gateEntry' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>{lang === 'hi' ? 'सिक्योरिटी गेट एंट्री एवं डॉक असाइनमेंट' : 'Security Gate In Entry & Dock Assignment'}</span>
            </h3>
            <span className="text-xs text-slate-500">Security Gate In-Time (Time 1)</span>
          </div>

          {guardSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{guardSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleGuardSubmit} className="space-y-5">
            {/* Row 1: Vehicle No, Driver Name, Driver Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'hi' ? 'गाड़ी नंबर (Vehicle Number)*' : 'Vehicle Number*'}
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="e.g. MP09 AB 1234"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'hi' ? 'ड्राइवर का नाम (Driver Name)*' : 'Driver Name*'}
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Singh"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'hi' ? 'ड्राइवर मोबाइल (Driver Mobile)*' : 'Driver Mobile*'}
                </label>
                <input
                  type="tel"
                  value={driverMobile}
                  onChange={(e) => setDriverMobile(e.target.value)}
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Row 2: Activity Type, Transporter, Location Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'hi' ? 'कार्य का प्रकार (Activity)*' : 'Activity Type*'}
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as 'Loading' | 'Unloading')}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="Loading">Loading (लोडिंग)</option>
                  <option value="Unloading">Unloading (अनलोडिंग)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'hi' ? 'ट्रांसपोर्टर का नाम (Transporter)*' : 'Transporter Name*'}
                </label>
                <input
                  type="text"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="e.g. ICRL / V-Trans / MCM"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Location Type (LL / TP)*
                </label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as 'LL' | 'TP' | '')}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
                >
                  <option value="">-- चुनें (Select) --</option>
                  <option value="LL">LL (Local / Intra-hub)</option>
                  <option value="TP">TP (Third Party / Long Haul)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Place/CFA, Assigned Dock/Bay, Assigned Supervisor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Place / CFA (Optional)
                </label>
                <input
                  type="text"
                  value={cfaLocation}
                  onChange={(e) => setCfaLocation(e.target.value)}
                  placeholder="e.g. Balram CFA / Indore"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'hi' ? 'असाइन किया गया बे/डॉक नंबर (Dock/Bay)*' : 'Assigned Dock / Bay No*'}
                </label>
                <input
                  type="text"
                  value={binNo}
                  onChange={(e) => setBinNo(e.target.value)}
                  placeholder="e.g. Dock-01 / Bay-3"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'hi' ? 'असाइन किया गया सुपरवाइज़र*' : 'Assigned Supervisor*'}
                </label>
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
                >
                  {SUPERVISOR_ROSTER.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'hi' ? 'गेट एंट्री दर्ज करें (Record Gate In)' : 'Record Gate In (Generate Token)'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. ALL RECORDS TAB (History Logs & 14-Col Overview) */}
      {activeSubTab === 'allRecords' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span>{lang === 'hi' ? 'सभी वाहनों की हिस्ट्री और स्टेटस लॉग्स' : 'All Vehicle Movement History Logs'}</span>
              </h3>
              <p className="text-xs text-slate-500">Live 14-column movement records with 3-stage timestamps</p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search token, vehicle, driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-48 sm:w-60 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Dock Assigned">Dock Assigned</option>
                <option value="In Progress">In Progress (In Dock)</option>
                <option value="Loaded / Unloaded">Loaded / Unloaded</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-3 font-bold">Token</th>
                  <th className="py-3 px-3 font-bold">Vehicle No</th>
                  <th className="py-3 px-3 font-bold">Driver & Mobile</th>
                  <th className="py-3 px-3 font-bold">Transporter</th>
                  <th className="py-3 px-3 font-bold">Type</th>
                  <th className="py-3 px-3 font-bold">Place / CFA</th>
                  <th className="py-3 px-3 font-bold">Dock / Bay</th>
                  <th className="py-3 px-3 font-bold">Supervisor</th>
                  <th className="py-3 px-3 font-bold">Activity</th>
                  <th className="py-3 px-3 font-bold">Gate In (Time 1)</th>
                  <th className="py-3 px-3 font-bold">In Dock (Time 2)</th>
                  <th className="py-3 px-3 font-bold">End Time (Time 3)</th>
                  <th className="py-3 px-3 font-bold">Status</th>
                  <th className="py-3 px-3 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400 text-xs">
                      {lang === 'hi' ? 'कोई रिकॉर्ड नहीं मिला' : 'No records found matching filters'}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isDone = isCompletedStatus(r);
                    const isInDock = isInDockStatus(r);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">
                          {r.tokenId || r.id}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {r.vehicleNo}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{r.driverName || 'Driver'}</div>
                          {r.driverMobile && (
                            <a href={`tel:${r.driverMobile}`} className="text-blue-600 font-mono text-[11px] hover:underline">
                              {r.driverMobile}
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{r.transporterName || 'ICRL'}</td>
                        <td className="py-3 px-3">
                          {r.locationType ? (
                            <span className="font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px]">
                              {r.locationType}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{r.cfaLocation || '-'}</td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800">{r.binNo || r.gateNo || '-'}</td>
                        <td className="py-3 px-3 text-slate-700">{r.supervisorName || '-'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            (r.activityType || r.operation) === 'Loading' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {r.activityType || r.operation || 'Loading'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {r.inTime || r.startTime || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {isInDock || isDone ? (r.startTime || '-') : '-'}
                        </td>
                        <td className="py-3 px-3 text-emerald-700 font-mono font-semibold text-[11px] whitespace-nowrap">
                          {isDone ? (r.exitTime || 'Completed') : '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isInDock
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {isDone ? (r.status === 'Loaded' || r.status === 'Unloaded' ? r.status : 'Completed') : isInDock ? 'In Progress (In Dock)' : 'Dock Assigned'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {!isDone && !isInDock && (
                            <button
                              type="button"
                              onClick={() => handleOpenStartModal(r, (r.activityType || r.operation || 'Loading') as 'Loading' | 'Unloading')}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition"
                            >
                              Start In-Dock
                            </button>
                          )}
                          {isInDock && (
                            <button
                              type="button"
                              onClick={() => handleCloseActivityClick(r)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition"
                            >
                              Complete
                            </button>
                          )}
                          {isDone && (
                            <span className="text-emerald-600 font-bold text-[11px]">&#10003; Done</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPERVISOR START IN-DOCK MODAL */}
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
              <div>Driver: <b>{selectedTokenToStart.driverName}</b> ({selectedTokenToStart.transporterName || 'ICRL'})</div>
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
                <label className="font-bold text-slate-700">Assigned Dock / Bay</label>
                <input
                  type="text"
                  value={chosenGate}
                  onChange={(e) => setChosenGate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                  placeholder="Dock-01"
                />
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
    </div>
  );
};
