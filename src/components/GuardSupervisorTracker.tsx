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
  User
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
  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'taskboard' | 'gateEntry' | 'allRecords'>('taskboard');

  // Gate In Form State (Driver Mobile, Bay/Bin, Supervisor, Location Type & CFA Location)
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [transporter, setTransporter] = useState('ICRL');
  const [locationType, setLocationType] = useState<'LL' | 'TP' | ''>('LL');
  const [cfaLocation, setCfaLocation] = useState('');
  const [binNo, setBinNo] = useState('Dock 1');
  const [supervisor, setSupervisor] = useState<string>(SUPERVISOR_ROSTER[0]);
  const [unit, setUnit] = useState<CompanyUnit>('AHPL');
  const [guardSuccessMsg, setGuardSuccessMsg] = useState<string | null>(null);

  // Supervisor Action Modal / Selection
  const [selectedTokenToStart, setSelectedTokenToStart] = useState<DockRecord | null>(null);
  const [chosenActivity, setChosenActivity] = useState<'Loading' | 'Unloading'>('Loading');
  const [chosenSupervisor, setChosenSupervisor] = useState<string>(SUPERVISOR_ROSTER[0]);
  const [chosenGate, setChosenGate] = useState<string>('Dock 1');

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

  const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var now = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
    var dateToday = new Date().toLocaleDateString("en-IN");
    var fullTimestamp = dateToday + " " + now;

    // 1. सिक्योरिटी गार्ड की एंट्री (मोबाइल, बे/बिन और सुपरवाइजर के साथ)
    if (data.action === "SECURITY_ENTRY") {
      var tokenId = "TKN-" + Math.floor(1000 + Math.random() * 9000);
      
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
        "", // Start Time
        "", // Close Time
        "Waiting for Supervisor" // Status
      ]);

      return ContentService.createTextOutput(JSON.stringify({ 
        result: "success", 
        tokenId: tokenId 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. लोडिंग / अनलोडिंग स्टार्ट
    if (data.action === "START_ACTIVITY") {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.tokenId) {
          sheet.getRange(i + 1, 11).setValue(fullTimestamp); // Col K: Start Time
          sheet.getRange(i + 1, 13).setValue(data.activityType + " Started"); // Col M: Status
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. क्लोज़ / डिस्पैच
    if (data.action === "CLOSE_ACTIVITY") {
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == data.tokenId) {
          sheet.getRange(i + 1, 12).setValue(fullTimestamp); // Col L: Close Time
          sheet.getRange(i + 1, 13).setValue("Completed");    // Col M: Status
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
      startTime: rows[i][10],
      closeTime: rows[i][11],
      status: rows[i][12]
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

  // Live KPI Calculations
  const waitingVehicles = useMemo(() => records.filter((r) => r.status === 'Gate-In Waiting'), [records]);
  const loadingVehicles = useMemo(() => records.filter((r) => r.status === 'In-Progress' && r.operation === 'Loading'), [records]);
  const unloadingVehicles = useMemo(() => records.filter((r) => r.status === 'In-Progress' && r.operation === 'Unloading'), [records]);
  const inProgressVehicles = useMemo(() => records.filter((r) => r.status === 'In-Progress'), [records]);
  const completedVehicles = useMemo(() => records.filter((r) => r.status === 'Completed'), [records]);
  const totalCount = records.length;

  // Transporter Distribution for Charts
  const transporterDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const t = r.transporterName || 'Other';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [records]);

  // Fetch Live Data from Google Apps Script (doGet) - 13 Columns
  const handleFetchFromSheet = async () => {
    const url = appsScriptUrl.trim();
    if (!url) {
      setShowWebhookSettings(true);
      alert('Please paste and save your Google Apps Script Web App URL first.');
      return;
    }

    setIsFetchingSheet(true);
    setWebhookStatus('Syncing with Google Sheet...');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0 && onSyncFromSheet) {
        const mappedRecords: DockRecord[] = data.map((item: any, idx: number) => {
          const isDone = item.status === 'Completed';
          const isInProgress = item.status && item.status.includes('Started');
          const isWaiting = !isDone && !isInProgress;

          const op: 'Loading' | 'Unloading' = (item.status && item.status.includes('Unloading')) ? 'Unloading' : 'Loading';
          const unitResolved: CompanyUnit = 'AHPL';

          return {
            id: `SHEET-${item.tokenId || idx}`,
            tokenId: item.tokenId || `TKN-${idx + 100}`,
            unit: unitResolved,
            gateNo: item.binNo || (op === 'Unloading' ? 'Dock 5' : 'Dock 1'),
            binNo: item.binNo || '',
            operation: op,
            vehicleNo: item.vehicleNo || 'UNKNOWN',
            driverName: item.driverName || 'Driver',
            driverMobile: item.driverMobile || '',
            transporterName: item.transporter || 'ICRL',
            locationType: item.locationType || 'LL',
            cfaLocation: item.cfaLocation || '',
            supervisorName: item.supervisor || 'Sheet Synced',
            startTime: item.startTime ? item.startTime.split(' ').pop() || item.startTime : item.inTime || '09:00',
            exitTime: item.closeTime ? item.closeTime.split(' ').pop() || item.closeTime : '',
            status: isDone ? 'Completed' : isInProgress ? 'In-Progress' : 'Gate-In Waiting',
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

  // Handle Security Gate Entry Submission (with Mobile, Bay/Bin, Supervisor)
  const handleGuardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim() || !driverName.trim()) return;

    const vNo = vehicleNo.trim().toUpperCase();
    const dName = driverName.trim();
    const dMobile = driverMobile.trim();
    const tName = transporter.trim();
    const locType = locationType || 'LL';
    const cfaLoc = cfaLocation.trim();
    const bNo = binNo.trim() || 'Dock 1';
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
    });

    // If Apps Script URL is configured, send async POST with exact 13-column matching payload
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
            unit,
            timestamp: new Date().toISOString(),
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
    setChosenGate(record.binNo || record.gateNo || (record.unit === 'AIL' ? 'Dock 5' : 'Dock 1'));
    if (record.supervisorName && record.supervisorName !== 'Pending Assignment') {
      setChosenSupervisor(record.supervisorName);
    }
  };

  const handleConfirmStart = async () => {
    if (!selectedTokenToStart) return;

    onStartActivity(selectedTokenToStart.id, chosenActivity, chosenSupervisor, chosenGate);

    // Apps Script Sync (Matching START_ACTIVITY: Col 11 Start Time, Col 13 Status)
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
    const confirmText = lang === 'hi'
      ? `क्या आप ${tokenId} (${record.vehicleNo}) की प्रोसेस क्लोज़ करना चाहते हैं?`
      : `Do you want to complete & close activity for ${tokenId} (${record.vehicleNo})?`;

    if (!window.confirm(confirmText)) return;

    onCloseActivity(record.id);

    // Apps Script Sync (Matching CLOSE_ACTIVITY: Col 12 Close Time, Col 13 Status)
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
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter(
      (r) =>
        r.vehicleNo.toLowerCase().includes(term) ||
        (r.tokenId && r.tokenId.toLowerCase().includes(term)) ||
        (r.driverName && r.driverName.toLowerCase().includes(term)) ||
        (r.driverMobile && r.driverMobile.toLowerCase().includes(term)) ||
        (r.transporterName && r.transporterName.toLowerCase().includes(term)) ||
        (r.cfaLocation && r.cfaLocation.toLowerCase().includes(term)) ||
        (r.binNo && r.binNo.toLowerCase().includes(term)) ||
        (r.supervisorName && r.supervisorName.toLowerCase().includes(term)) ||
        (r.locationType && r.locationType.toLowerCase().includes(term))
    );
  }, [records, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>{lang === 'hi' ? '🚛 वाहन मूवमेंट ट्रैकर (Logistics Movement Hub)' : '🚛 Vehicle Movement Tracker (Logistics Movement Hub)'}</span>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                  Google Sheet 13-Col Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'ड्राइवर मोबाइल, बे/बिन, सुपरवाइजर, LL/TP एवं CFA के साथ लाइव 13-कॉलम Google Sheet doPost/doGet सिंक'
                  : '13-column live Google Sheet sync with Driver Mobile, Bay/Bin, Supervisor, LL/TP, and CFA'}
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
                activeSubTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('taskboard')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'taskboard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'टास्क बोर्ड' : 'Task Board'}</span>
              {waitingVehicles.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubTab === 'taskboard' ? 'bg-indigo-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {waitingVehicles.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('gateEntry')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'gateEntry' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सिक्योरिटी गेट एंट्री' : 'Gate Entry'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('allRecords')}
              className={`px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'allRecords' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सभी रिकॉर्ड (Log)' : 'All Records'}</span>
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
            <span className="hidden sm:inline">Sync Sheet</span>
          </button>

          {/* Code Guide Modal Button */}
          <button
            type="button"
            onClick={() => setShowCodeGuide(!showCodeGuide)}
            className="px-2.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs flex items-center gap-1.5 cursor-pointer font-medium"
            title="View Google Apps Script Code (doPost / doGet)"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Apps Script</span>
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
        <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Google Apps Script Web App URL (doPost & doGet)
            </span>
            <span className="text-[11px] text-slate-500">Live 13-column spreadsheet synchronization</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSaveWebhook}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save URL
            </button>
          </div>
          {webhookStatus && (
            <p className="text-indigo-800 font-semibold">{webhookStatus}</p>
          )}
        </div>
      )}

      {/* Code Guide Modal */}
      {showCodeGuide && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-white">Google Sheet Row 1 Header (13 Cols) & Apps Script Code</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
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
            <b>Google Sheet Column Setup (Row 1 Header - 13 Columns):</b>
            <div className="font-mono text-emerald-400 overflow-x-auto whitespace-nowrap bg-slate-900 p-2 rounded">
              Token ID | In Time | Vehicle No | Driver Name | Driver Mobile | Transporter | Location Type | CFA / Place Name | Bay / Bin No | Supervisor | Start Time | Close Time | Status
            </div>
            <div className="text-[10px] text-slate-400">
              Columns: A (Token), B (In-Time), C (Vehicle), D (Driver), E (Mobile), F (Transporter), G (LL/TP), H (CFA), I (Bay/Bin), J (Supervisor), K (Start Time), L (Close Time), M (Status)
            </div>
          </div>

          <pre className="bg-slate-950 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto text-emerald-400 border border-slate-800 max-h-60">
            {APPS_SCRIPT_SNIPPET}
          </pre>
        </div>
      )}

      {/* KPI METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'hi' ? 'कुल गाड़ियां (Total)' : 'Total Vehicles'}</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalCount}</h3>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </span>
        </div>

        {/* Waiting */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{lang === 'hi' ? 'वेटिंग (Waiting)' : 'Waiting Gate-In'}</p>
            <h3 className="text-2xl font-black text-amber-900 mt-1">{waitingVehicles.length}</h3>
          </div>
          <span className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </span>
        </div>

        {/* Loading */}
        <div className="bg-white p-4 rounded-xl border border-cyan-200 bg-cyan-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">{lang === 'hi' ? 'लोडिंग (Loading)' : 'Loading Active'}</p>
            <h3 className="text-2xl font-black text-cyan-900 mt-1">{loadingVehicles.length}</h3>
          </div>
          <span className="p-3 bg-cyan-100 text-cyan-700 rounded-xl">
            <Box className="w-5 h-5" />
          </span>
        </div>

        {/* Unloading */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">{lang === 'hi' ? 'अनलोडिंग (Unloading)' : 'Unloading Active'}</p>
            <h3 className="text-2xl font-black text-purple-900 mt-1">{unloadingVehicles.length}</h3>
          </div>
          <span className="p-3 bg-purple-100 text-purple-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </span>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{lang === 'hi' ? 'पूर्ण (Completed)' : 'Completed'}</p>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">{completedVehicles.length}</h3>
          </div>
          <span className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* VIEW 1: DASHBOARD (OVERVIEW & CHARTS) */}
      {activeSubTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Status Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'hi' ? 'लाइव स्टेटस शेयर' : 'Live Status Share'}</span>
            </h3>

            <div className="space-y-3 pt-2">
              {/* Waiting bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-700">{lang === 'hi' ? 'वेटिंग (Waiting)' : 'Waiting Gate-In'}</span>
                  <span>{waitingVehicles.length} ({totalCount ? Math.round((waitingVehicles.length / totalCount) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalCount ? (waitingVehicles.length / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Loading bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-cyan-700">{lang === 'hi' ? 'लोडिंग (Loading)' : 'Loading'}</span>
                  <span>{loadingVehicles.length} ({totalCount ? Math.round((loadingVehicles.length / totalCount) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalCount ? (loadingVehicles.length / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Unloading bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-purple-700">{lang === 'hi' ? 'अनलोडिंग (Unloading)' : 'Unloading'}</span>
                  <span>{unloadingVehicles.length} ({totalCount ? Math.round((unloadingVehicles.length / totalCount) * 100) : 0}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalCount ? (unloadingVehicles.length / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Completed bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-700">{lang === 'hi' ? 'पूर्ण (Completed)' : 'Completed'}</span>
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
          </div>

          {/* Transporter Volume Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
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
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
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

      {/* VIEW 2: TASK BOARD (KANBAN PIPELINE) */}
      {activeSubTab === 'taskboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: Waiting / Gate In */}
          <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 flex flex-col min-h-[480px]">
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-200 font-bold text-xs text-slate-800">
              <span className="flex items-center gap-1.5 text-amber-800">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>1. {lang === 'hi' ? 'वेटिंग / गेट इन' : 'Waiting / Gate In'}</span>
              </span>
              <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {waitingVehicles.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {waitingVehicles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'कोई गाड़ी वेटिंग में नहीं है' : 'No vehicles waiting'}
                </div>
              ) : (
                waitingVehicles.map((v) => {
                  const placeText = v.cfaLocation ? ` | CFA: ${v.cfaLocation}` : '';
                  return (
                    <div key={v.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:shadow-sm transition">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {v.tokenId || v.id}
                        </span>
                        {v.locationType && (
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-100 px-1.5 py-0.5 rounded">
                            {v.locationType}{placeText}
                          </span>
                        )}
                      </div>

                      <div className="font-mono font-bold text-slate-900 text-sm">{v.vehicleNo}</div>

                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span><b>Driver:</b> {v.driverName || 'Driver'} ({v.transporterName || 'ICRL'})</span>
                        </div>
                        {v.driverMobile && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                            <a href={`tel:${v.driverMobile}`} className="hover:underline font-mono">{v.driverMobile}</a>
                          </div>
                        )}
                        {(v.binNo || v.gateNo) && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Layers className="w-3 h-3 text-amber-500 shrink-0" />
                            <span><b>Bay/Dock:</b> {v.binNo || v.gateNo}</span>
                          </div>
                        )}
                        {v.supervisorName && v.supervisorName !== 'Pending Assignment' && (
                          <div className="text-[10px] text-indigo-600 font-semibold">
                            Supervisor: {v.supervisorName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">Gate In: {v.startTime}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenStartModal(v, 'Loading')}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start Loading</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenStartModal(v, 'Unloading')}
                          className="bg-purple-600 hover:bg-purple-700 text-white py-1.5 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start Unload</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Loading in-Progress */}
          <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 flex flex-col min-h-[480px]">
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-200 font-bold text-xs text-slate-800">
              <span className="flex items-center gap-1.5 text-cyan-800">
                <Box className="w-4 h-4 text-cyan-600" />
                <span>2. {lang === 'hi' ? 'लोडिंग चालू है' : 'Loading in-Progress'}</span>
              </span>
              <span className="bg-cyan-200 text-cyan-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {loadingVehicles.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {loadingVehicles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'कोई सक्रिय लोडिंग नहीं है' : 'No active loading'}
                </div>
              ) : (
                loadingVehicles.map((v) => {
                  const placeText = v.cfaLocation ? ` | CFA: ${v.cfaLocation}` : '';
                  return (
                    <div key={v.id} className="bg-white p-3.5 rounded-xl border border-cyan-200 shadow-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded">
                          {v.tokenId || v.id}
                        </span>
                        <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">
                          {v.binNo || v.gateNo || 'Dock 1'}
                        </span>
                      </div>

                      <div className="font-mono font-bold text-slate-900 text-sm">{v.vehicleNo}</div>

                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div><b>Driver:</b> {v.driverName || 'Driver'} ({v.transporterName || 'ICRL'})</div>
                        {v.driverMobile && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                            <a href={`tel:${v.driverMobile}`} className="hover:underline font-mono">{v.driverMobile}</a>
                          </div>
                        )}
                        <div><b>Started:</b> {v.startTime}</div>
                        {v.supervisorName && (
                          <div className="text-[10px] text-slate-500">Supervisor: <b>{v.supervisorName}</b></div>
                        )}
                        {v.locationType && (
                          <div className="text-[10px] text-indigo-700 font-semibold">Type: {v.locationType}{placeText}</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCloseActivityClick(v)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-xs mt-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete & Close</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 3: Unloading in-Progress */}
          <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 flex flex-col min-h-[480px]">
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-200 font-bold text-xs text-slate-800">
              <span className="flex items-center gap-1.5 text-purple-800">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>3. {lang === 'hi' ? 'अनलोडिंग चालू है' : 'Unloading in-Progress'}</span>
              </span>
              <span className="bg-purple-200 text-purple-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {unloadingVehicles.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {unloadingVehicles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'कोई सक्रिय अनलोडिंग नहीं है' : 'No active unloading'}
                </div>
              ) : (
                unloadingVehicles.map((v) => {
                  const placeText = v.cfaLocation ? ` | CFA: ${v.cfaLocation}` : '';
                  return (
                    <div key={v.id} className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded">
                          {v.tokenId || v.id}
                        </span>
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                          {v.binNo || v.gateNo || 'Dock 5'}
                        </span>
                      </div>

                      <div className="font-mono font-bold text-slate-900 text-sm">{v.vehicleNo}</div>

                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div><b>Driver:</b> {v.driverName || 'Driver'} ({v.transporterName || 'ICRL'})</div>
                        {v.driverMobile && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                            <a href={`tel:${v.driverMobile}`} className="hover:underline font-mono">{v.driverMobile}</a>
                          </div>
                        )}
                        <div><b>Started:</b> {v.startTime}</div>
                        {v.supervisorName && (
                          <div className="text-[10px] text-slate-500">Supervisor: <b>{v.supervisorName}</b></div>
                        )}
                        {v.locationType && (
                          <div className="text-[10px] text-indigo-700 font-semibold">Type: {v.locationType}{placeText}</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCloseActivityClick(v)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-xs mt-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete & Close</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 flex flex-col min-h-[480px]">
            <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-slate-200 font-bold text-xs text-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>4. {lang === 'hi' ? 'कार्य पूर्ण (Completed)' : 'Completed / Dispatched'}</span>
              </span>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {completedVehicles.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto">
              {completedVehicles.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {lang === 'hi' ? 'कोई पूर्ण गाड़ी नहीं है' : 'No completed vehicles'}
                </div>
              ) : (
                completedVehicles.map((v) => (
                  <div key={v.id} className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs space-y-1.5 opacity-90 hover:opacity-100 transition">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {v.tokenId || v.id}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Dispatched
                      </span>
                    </div>

                    <div className="font-mono font-bold text-slate-900 text-sm">{v.vehicleNo}</div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div><b>Transporter:</b> {v.transporterName || 'ICRL'}</div>
                      {v.driverMobile && (
                        <div className="text-[10px] text-slate-500 font-mono">Mobile: {v.driverMobile}</div>
                      )}
                      <div><b>Closed:</b> {v.exitTime || 'Completed'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SECURITY GATE ENTRY FORM */}
      {activeSubTab === 'gateEntry' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'hi' ? 'नई गाड़ी गेट एंट्री फॉर्म (Security Entry)' : 'New Vehicle Gate Entry Form (Security)'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'ड्राइवर मोबाइल, बे/बिन, सुपरवाइजर, LL/TP एवं CFA के साथ नया टोकन जनरेट करें'
                  : 'Record gate-in with Driver Mobile, Bay/Bin, Supervisor, Location Type and CFA name'}
              </p>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold">
              Live Token Generator
            </span>
          </div>

          {guardSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{guardSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleGuardSubmit} className="space-y-4">
            {/* Row 1: Vehicle No, Driver Name, Driver Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Vehicle Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'गाड़ी नंबर (Vehicle Number)*' : 'Vehicle Number*'}
                </label>
                <input
                  type="text"
                  required
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="MP09 AB 1234"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm uppercase font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Driver Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'ड्राइवर का नाम (Driver Name)*' : 'Driver Name*'}
                </label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Driver Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'ड्राइवर मोबाइल नंबर (Mobile No)' : 'Driver Mobile'}
                </label>
                <input
                  type="tel"
                  value={driverMobile}
                  onChange={(e) => setDriverMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Transporter, Location Type, CFA / Place */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Transporter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'ट्रांसपोर्टर (Transporter)*' : 'Transporter Name*'}
                </label>
                <input
                  type="text"
                  required
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="ICRL / SafeXpress / V-Trans"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Location Type (LL / TP) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Type (LL / TP)*
                </label>
                <select
                  required
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value as 'LL' | 'TP')}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="LL">LL (Local / Intra-Plant)</option>
                  <option value="TP">TP (Third Party / CFA)</option>
                </select>
              </div>

              {/* CFA / Location Name (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Place of CFA / Location Name
                </label>
                <input
                  type="text"
                  value={cfaLocation}
                  onChange={(e) => setCfaLocation(e.target.value)}
                  placeholder="जैसे: बलराम CFA / Indore Warehouse"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Bay/Bin/Dock No & Supervisor Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {/* Bay / Bin No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'बे / बिन / डॉक नंबर (Bay / Bin No)' : 'Bay / Bin / Dock No'}
                </label>
                <input
                  type="text"
                  value={binNo}
                  onChange={(e) => setBinNo(e.target.value)}
                  placeholder="Dock 1 / Bay A-2 / Bin 104"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Supervisor Assignment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'सुपरवाइजर (Supervisor In-Charge)' : 'Supervisor In-Charge'}
                </label>
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {SUPERVISOR_ROSTER.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'hi' ? 'गेट एंट्री सबमिट करें (Record In-Time)' : 'Submit Gate Entry (Record In-Time)'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 4: ALL RECORDS TABLE (13 Columns Sync) */}
      {activeSubTab === 'allRecords' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'hi' ? 'सभी वाहनों की हिस्ट्री और लॉग्स' : 'All Vehicle Movement Logs & History'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                13-column full log matching Google Spreadsheet columns (Token, In-Time, Vehicle, Driver, Mobile, Transporter, LL/TP, CFA, Bay/Bin, Supervisor, Start, Close, Status)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search token, vehicle, driver, mobile, CFA, supervisor..."
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-mono font-medium">
                {filteredRecords.length} Records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Token</th>
                  <th className="py-3 px-3">In Time</th>
                  <th className="py-3 px-3">Vehicle No</th>
                  <th className="py-3 px-3">Driver</th>
                  <th className="py-3 px-3">Mobile</th>
                  <th className="py-3 px-3">Transporter</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Place / CFA</th>
                  <th className="py-3 px-3">Bay / Bin</th>
                  <th className="py-3 px-3">Supervisor</th>
                  <th className="py-3 px-3">Start Time</th>
                  <th className="py-3 px-3">Close Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((v) => {
                    const isWaiting = v.status === 'Gate-In Waiting';
                    const isInProgress = v.status === 'In-Progress';
                    const isDone = v.status === 'Completed';

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {v.tokenId || v.id}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {v.startTime || '-'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {v.vehicleNo}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {v.driverName || '-'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {v.driverMobile ? (
                            <a href={`tel:${v.driverMobile}`} className="hover:underline text-indigo-600 font-semibold">{v.driverMobile}</a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {v.transporterName || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                            {v.locationType || 'LL'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {v.cfaLocation || '-'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {v.binNo || v.gateNo || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          {v.supervisorName || '-'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {isWaiting ? '-' : v.startTime}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {v.exitTime || '-'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isInProgress
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isDone ? 'Completed' : isInProgress ? `${v.operation} Started` : 'Waiting for Supervisor'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isWaiting && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenStartModal(v, 'Loading')}
                                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Start Load
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenStartModal(v, 'Unloading')}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Start Unload
                              </button>
                            </div>
                          )}

                          {isInProgress && (
                            <button
                              type="button"
                              onClick={() => handleCloseActivityClick(v)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Close
                            </button>
                          )}

                          {isDone && (
                            <span className="text-emerald-600 font-semibold text-xs inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                            </span>
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

      {/* Start Activity Modal */}
      {selectedTokenToStart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-600" />
                <span>Start {chosenActivity} Activity</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTokenToStart(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><span className="text-slate-500">Token ID:</span> <span className="font-mono font-bold text-indigo-700">{selectedTokenToStart.tokenId || selectedTokenToStart.id}</span></p>
              <p><span className="text-slate-500">Vehicle Number:</span> <span className="font-mono font-bold text-slate-800">{selectedTokenToStart.vehicleNo}</span></p>
              <p><span className="text-slate-500">Driver & Transporter:</span> <span className="font-semibold text-slate-700">{selectedTokenToStart.driverName || 'Driver'} ({selectedTokenToStart.transporterName || 'ICRL'})</span></p>
              {selectedTokenToStart.driverMobile && (
                <p><span className="text-slate-500">Mobile:</span> <span className="font-mono font-semibold text-indigo-600">{selectedTokenToStart.driverMobile}</span></p>
              )}
              {selectedTokenToStart.locationType && (
                <p><span className="text-slate-500">Type & CFA:</span> <span className="font-semibold text-indigo-700">{selectedTokenToStart.locationType} {selectedTokenToStart.cfaLocation ? `(${selectedTokenToStart.cfaLocation})` : ''}</span></p>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operation Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChosenActivity('Loading')}
                    className={`py-2 rounded-lg font-bold text-center border transition cursor-pointer ${
                      chosenActivity === 'Loading' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Loading
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenActivity('Unloading')}
                    className={`py-2 rounded-lg font-bold text-center border transition cursor-pointer ${
                      chosenActivity === 'Unloading' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Unloading
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Dock / Bay / Bin:</label>
                <input
                  type="text"
                  value={chosenGate}
                  onChange={(e) => setChosenGate(e.target.value)}
                  placeholder="Dock 1 / Bay A / Bin 104"
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supervisor In-Charge:</label>
                <select
                  value={chosenSupervisor}
                  onChange={(e) => setChosenSupervisor(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SUPERVISOR_ROSTER.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTokenToStart(null)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Confirm & Record Start Time</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
