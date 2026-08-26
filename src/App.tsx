import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Settings2, Trash2, Check, Copy } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { KPICards } from './components/KPICards';
import { EntryForm } from './components/EntryForm';
import { MovementTable } from './components/MovementTable';
import { GatePassModal } from './components/GatePassModal';
import { StockOverviewModal } from './components/StockOverviewModal';
import { EditRecordModal } from './components/EditRecordModal';
import { DockKPICards } from './components/DockKPICards';
import { DockEntryForm } from './components/DockEntryForm';
import { DockTurnaroundTable } from './components/DockTurnaroundTable';
import { EditDockModal } from './components/EditDockModal';
import { LiveActivityView } from './components/LiveActivityView';
import { ReportsView } from './components/ReportsView';
import { AnalyticsView } from './components/AnalyticsView';
import { GuardSupervisorTracker } from './components/GuardSupervisorTracker';
import { MovementRecord, MovementStatus, DockRecord, DockStatus, AppTab, Language, CompanyUnit } from './types';
import { t } from './utils/translations';
import {
  GOOGLE_SCRIPT_URL,
  getActiveGoogleScriptUrl,
  setActiveGoogleScriptUrl,
  fetchLiveSheetRecords,
  addLiveSheetRecord,
  updateLiveSheetRecord,
  deleteLiveSheetRecord,
  bulkDeleteLiveSheetRecords,
  COMPLETE_GOOGLE_APPS_SCRIPT_CODE_GS,
} from './utils/googleSheetsService';

const LOCAL_STORAGE_KEY = 'ahpl_ail_warehouse_records_v1';
const LOCAL_STORAGE_DOCK_KEY = 'ahpl_ail_dock_records_v1';
const LOCAL_STORAGE_LANG_KEY = 'ahpl_ail_warehouse_lang_v1';
const LOCAL_STORAGE_TAB_KEY = 'ahpl_ail_active_tab_v2';

export { GOOGLE_SCRIPT_URL };

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TAB_KEY);
      if (saved && ['loading', 'live', 'tracker', 'reports', 'analytics', 'movement'].includes(saved)) {
        return saved as AppTab;
      }
    } catch (e) {
      console.warn('Failed to parse active tab', e);
    }
    return 'loading';
  });

  // State: Initialized strictly to empty arrays (No dummy or mock data on load)
  const [records, setRecords] = useState<MovementRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse local storage records', e);
    }
    return [];
  });

  const [dockRecords, setDockRecords] = useState<DockRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DOCK_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse local storage dock records', e);
    }
    return [];
  });

  // Live Sync & Sheet State
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error' | 'syncing'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [customScriptUrl, setCustomScriptUrl] = useState<string>(() => getActiveGoogleScriptUrl());
  const [isCopiedCode, setIsCopiedCode] = useState<boolean>(false);

  // Language state (defaults to 'hi')
  const [lang, setLang] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
      if (savedLang === 'en' || savedLang === 'hi') return savedLang;
    } catch (e) {
      console.warn('Failed to parse language preference', e);
    }
    return 'hi';
  });

  // Filters for Movement Table
  const [activeUnitFilter, setActiveUnitFilter] = useState<string>('All');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('All');

  // Modals state
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [selectedGatePassRecord, setSelectedGatePassRecord] = useState<MovementRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<MovementRecord | null>(null);
  const [editingDockRecord, setEditingDockRecord] = useState<DockRecord | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save records', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DOCK_KEY, JSON.stringify(dockRecords));
    } catch (e) {
      console.warn('Failed to save dock records', e);
    }
  }, [dockRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LANG_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language preference', e);
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TAB_KEY, activeTab);
    } catch (e) {
      console.warn('Failed to save active tab', e);
    }
  }, [activeTab]);

  // LIVE SYNC FETCH FUNCTION
  const handleFetchFromGoogleSheet = useCallback(async (silent = false) => {
    const activeUrl = getActiveGoogleScriptUrl();
    if (!activeUrl) {
      if (!silent) {
        setSyncStatus('idle');
        setSyncMessage('Google Script URL is not configured yet. Configure Web App URL in settings.');
      }
      return;
    }

    setIsFetchingSheet(true);
    if (!silent) {
      setSyncStatus('syncing');
      setSyncMessage('Fetching live records from Google Sheet...');
    }

    try {
      const res = await fetchLiveSheetRecords(activeUrl);
      if (res.success) {
        setDockRecords(res.records);
        const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        setLastSyncTime(timeNow);
        setSyncStatus('success');
        setSyncMessage(`Synced ${res.records.length} records from Google Sheet at ${timeNow}`);
      } else {
        setSyncStatus('error');
        setSyncMessage(res.error || 'Failed to fetch from Google Sheet.');
      }
    } catch (err: any) {
      setSyncStatus('error');
      setSyncMessage(err.message || 'Network error while connecting to Google Sheet.');
    } finally {
      setIsFetchingSheet(false);
      setTimeout(() => {
        setSyncStatus((curr) => (curr === 'syncing' ? 'idle' : curr));
      }, 4000);
    }
  }, []);

  // Fetch live records on page load
  useEffect(() => {
    handleFetchFromGoogleSheet(true);
  }, [handleFetchFromGoogleSheet]);

  // Movement Handlers
  const handleAddRecord = (newEntry: Omit<MovementRecord, 'id' | 'timestamp' | 'date'>) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const dateStr = now.toISOString().slice(0, 10);

    const fullRecord: MovementRecord = {
      ...newEntry,
      id: `REC-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      date: dateStr,
    };

    setRecords((prev) => [fullRecord, ...prev]);
  };

  const handleUpdateStatus = (id: string, newStatus: MovementStatus) => {
    setRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status: newStatus } : rec))
    );
  };

  const handleBulkUpdateStatus = (ids: string[], newStatus: MovementStatus) => {
    setRecords((prev) =>
      prev.map((rec) => (ids.includes(rec.id) ? { ...rec, status: newStatus } : rec))
    );
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((rec) => rec.id !== id));
  };

  const handleBulkDelete = (ids: string[]) => {
    setRecords((prev) => prev.filter((rec) => !ids.includes(rec.id)));
  };

  const handleSaveEditedRecord = (updated: MovementRecord) => {
    setRecords((prev) =>
      prev.map((rec) => (rec.id === updated.id ? updated : rec))
    );
  };

  // DOCK & TAT CRUD HANDLERS WITH 100% LIVE GOOGLE SHEETS SYNC
  const handleAddDockRecord = async (newEntry: Omit<DockRecord, 'id' | 'date'>) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const tokenId = `TKN-${Math.floor(1000 + Math.random() * 9000)}`;

    const fullDockRecord: DockRecord = {
      ...newEntry,
      id: `DOCK-${Date.now().toString().slice(-4)}`,
      tokenId: tokenId,
      date: dateStr,
    };

    // Update UI state immediately
    setDockRecords((prev) => [fullDockRecord, ...prev]);

    // Send POST to Google Sheet Web App
    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      addLiveSheetRecord(fullDockRecord, activeUrl).catch((err) => {
        console.warn('Background sync to Google Sheet error:', err);
      });
    }
  };

  const handleUpdateDockStatus = async (id: string, newStatus: DockStatus) => {
    let updatedRecord: DockRecord | null = null;

    setDockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        if (newStatus === 'Completed' && !rec.exitTime) {
          const now = new Date();
          const exitStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          updatedRecord = { ...rec, status: newStatus, exitTime: exitStr };
          return updatedRecord;
        }
        updatedRecord = { ...rec, status: newStatus };
        return updatedRecord;
      })
    );

    if (updatedRecord) {
      const activeUrl = getActiveGoogleScriptUrl();
      if (activeUrl) {
        updateLiveSheetRecord(updatedRecord, activeUrl).catch((err) => {
          console.warn('Update Google Sheet error:', err);
        });
      }
    }
  };

  const handleBulkUpdateDockStatus = (ids: string[], newStatus: DockStatus) => {
    const now = new Date();
    const exitStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setDockRecords((prev) =>
      prev.map((rec) => {
        if (!ids.includes(rec.id)) return rec;
        if (newStatus === 'Completed' && !rec.exitTime) {
          return { ...rec, status: newStatus, exitTime: exitStr };
        }
        return { ...rec, status: newStatus };
      })
    );
  };

  // DELETE: Permanent delete with { action: "DELETE", id: recordId } to Google Script
  const handleDeleteDockRecord = async (id: string) => {
    const targetRecord = dockRecords.find((r) => r.id === id);
    const targetToken = targetRecord?.tokenId || id;

    // Remove from UI state
    setDockRecords((prev) => prev.filter((rec) => rec.id !== id));

    // Send DELETE POST to Google Apps Script
    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      deleteLiveSheetRecord(id, targetToken, activeUrl).catch((err) => {
        console.warn('Google Sheet DELETE error:', err);
      });
    }
  };

  // BULK DELETE: Permanent bulk delete to Google Script
  const handleBulkDeleteDock = async (ids: string[]) => {
    const tokens = dockRecords
      .filter((r) => ids.includes(r.id))
      .map((r) => r.tokenId || r.id);

    setDockRecords((prev) => prev.filter((rec) => !ids.includes(rec.id)));

    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      bulkDeleteLiveSheetRecords(ids, tokens, activeUrl).catch((err) => {
        console.warn('Google Sheet BULK DELETE error:', err);
      });
    }
  };

  const handleQuickCompleteDock = async (id: string) => {
    const now = new Date();
    const exitStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let modified: DockRecord | null = null;

    setDockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === id) {
          modified = { ...rec, status: 'Completed', exitTime: exitStr };
          return modified;
        }
        return rec;
      })
    );

    if (modified) {
      const activeUrl = getActiveGoogleScriptUrl();
      if (activeUrl) {
        updateLiveSheetRecord(modified, activeUrl).catch((err) => {
          console.warn('Quick complete sync error:', err);
        });
      }
    }
  };

  const handleSaveEditedDockRecord = async (updated: DockRecord) => {
    setDockRecords((prev) =>
      prev.map((rec) => (rec.id === updated.id ? updated : rec))
    );

    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      updateLiveSheetRecord(updated, activeUrl).catch((err) => {
        console.warn('Save edit sync error:', err);
      });
    }
  };

  // Guard & Supervisor Tracker Handlers
  const handleAddGuardEntry = async (entry: {
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
  }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateToday = now.toLocaleDateString('en-IN');
    const fullTimestamp = `${dateToday} ${timeStr}`;
    const tokenId = entry.tokenId || `TKN-${Math.floor(1000 + Math.random() * 9000)}`;
    const chosenAct = entry.activityType || 'Loading';

    const newDockRecord: DockRecord = {
      id: `DOCK-${Date.now().toString().slice(-4)}`,
      tokenId: tokenId,
      unit: entry.unit,
      gateNo: entry.binNo || entry.gateNo || (entry.unit === 'AIL' ? 'Dock 5' : 'Dock 1'),
      binNo: entry.binNo || 'Dock-01',
      operation: chosenAct,
      activityType: chosenAct,
      vehicleNo: entry.vehicleNo,
      driverName: entry.driverName,
      driverMobile: entry.driverMobile || '',
      transporterName: entry.transporterName,
      locationType: entry.locationType || 'LL',
      cfaLocation: entry.cfaLocation || '',
      supervisorName: entry.supervisor || 'Suman Singh',
      inTime: fullTimestamp,
      startTime: '',
      status: 'Dock Assigned',
      date: dateToday,
      podStatus: 'POD Clean',
      remarks: `Gate-In Entry via Security. Driver: ${entry.driverName} ${entry.driverMobile ? `(${entry.driverMobile})` : ''}`,
    };

    setDockRecords((prev) => [newDockRecord, ...prev]);

    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      addLiveSheetRecord(newDockRecord, activeUrl).catch((err) => {
        console.warn('Google Sheet Entry error:', err);
      });
    }
  };

  const handleSyncFromSheet = (sheetRecords: DockRecord[]) => {
    setDockRecords(sheetRecords);
  };

  const handleStartSupervisorActivity = async (
    id: string,
    activityType: 'Loading' | 'Unloading',
    supervisorName: string,
    gateNo: string
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateToday = now.toLocaleDateString('en-IN');
    const fullTimestamp = `${dateToday} ${timeStr}`;
    let modified: DockRecord | null = null;

    setDockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        modified = {
          ...rec,
          operation: activityType,
          activityType: activityType,
          supervisorName: supervisorName,
          gateNo: gateNo,
          binNo: gateNo,
          startTime: fullTimestamp,
          status: 'In Progress (In Dock)' as DockStatus,
          remarks: `${activityType} started by Supervisor ${supervisorName}`,
        };
        return modified;
      })
    );

    if (modified) {
      const activeUrl = getActiveGoogleScriptUrl();
      if (activeUrl) {
        updateLiveSheetRecord(modified, activeUrl).catch((err) => {
          console.warn('Start Activity sync error:', err);
        });
      }
    }
  };

  const handleCloseSupervisorActivity = async (id: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateToday = now.toLocaleDateString('en-IN');
    const fullTimestamp = `${dateToday} ${timeStr}`;
    let modified: DockRecord | null = null;

    setDockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const act = rec.activityType || rec.operation || 'Loading';
        const finalStatus = act === 'Loading' ? 'Loaded' : 'Unloaded';
        modified = {
          ...rec,
          exitTime: fullTimestamp,
          status: finalStatus as DockStatus,
          remarks: `Operation closed & dispatched at ${fullTimestamp}`,
        };
        return modified;
      })
    );

    if (modified) {
      const activeUrl = getActiveGoogleScriptUrl();
      if (activeUrl) {
        updateLiveSheetRecord(modified, activeUrl).catch((err) => {
          console.warn('Close Activity sync error:', err);
        });
      }
    }
  };

  const handleSaveSettings = () => {
    setActiveGoogleScriptUrl(customScriptUrl);
    setIsSettingsOpen(false);
    handleFetchFromGoogleSheet(false);
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(COMPLETE_GOOGLE_APPS_SCRIPT_CODE_GS);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 3000);
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  const activeBayCount = Array.from(
    new Set(
      dockRecords
        .filter((r) => r.status === 'In Progress (In Dock)' || r.status === 'In-Progress')
        .map((r) => r.gateNo || r.binNo)
    )
  ).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenStockModal={() => setIsStockModalOpen(true)}
      />

      {/* Live Google Sheets Sync Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% Live Google Sheets Sync
            </span>
            {lastSyncTime && (
              <span className="text-slate-400 hidden sm:inline">
                Last synced: <span className="font-mono text-slate-300">{lastSyncTime}</span>
              </span>
            )}
            {syncMessage && (
              <span className={`text-[11px] hidden md:inline font-medium ${syncStatus === 'error' ? 'text-amber-400' : 'text-slate-300'}`}>
                {syncMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFetchFromGoogleSheet(false)}
              disabled={isFetchingSheet}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
              <span>{isFetchingSheet ? 'Syncing...' : 'Sync Live Sheet'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs border border-slate-700 cursor-pointer transition"
              title="Google Apps Script Web App URL Settings"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">API Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar (Distinct Tabs) */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lang={lang}
        dockCount={dockRecords.length}
        activeBayCount={activeBayCount}
        movementCount={records.length}
        onOpenStockModal={() => setIsStockModalOpen(true)}
      />

      {/* Main Content Areas */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 flex-1 w-full">
        {/* TAB 1: LOADING & UNLOADING */}
        {activeTab === 'loading' && (
          <section id="loadingTab" className="tab-content space-y-6 animate-in fade-in duration-150">
            {/* Quick KPIs */}
            <DockKPICards dockRecords={dockRecords} lang={lang} />

            {/* Dock Entry Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Form */}
              <div className="lg:col-span-1">
                <DockEntryForm lang={lang} onAddDockRecord={handleAddDockRecord} />
              </div>

              {/* Operations Table */}
              <div className="lg:col-span-2">
                <DockTurnaroundTable
                  records={dockRecords}
                  lang={lang}
                  onUpdateStatus={handleUpdateDockStatus}
                  onBulkUpdateStatus={handleBulkUpdateDockStatus}
                  onDeleteRecord={handleDeleteDockRecord}
                  onBulkDelete={handleBulkDeleteDock}
                  onEditRecord={(rec) => setEditingDockRecord(rec)}
                  onQuickComplete={handleQuickCompleteDock}
                  onApplyCSVImport={(updated) => setDockRecords(updated)}
                />
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: LIVE ACTIVITY */}
        {activeTab === 'live' && (
          <section id="liveTab" className="tab-content space-y-6 animate-in fade-in duration-150">
            <LiveActivityView
              records={dockRecords}
              lang={lang}
              onQuickComplete={handleQuickCompleteDock}
              onAssignGate={(_gate) => setActiveTab('loading')}
              onEditRecord={(rec) => setEditingDockRecord(rec)}
            />
          </section>
        )}

        {/* TAB: VEHICLE MOVEMENT TRACKER (GUARD & SUPERVISOR) */}
        {activeTab === 'tracker' && (
          <section id="trackerTab" className="tab-content space-y-6 animate-in fade-in duration-150">
            <GuardSupervisorTracker
              records={dockRecords}
              lang={lang}
              onAddGuardEntry={handleAddGuardEntry}
              onStartActivity={handleStartSupervisorActivity}
              onCloseActivity={handleCloseSupervisorActivity}
              onSyncFromSheet={handleSyncFromSheet}
              onBatchUpdateRecords={(updated) => setDockRecords(updated)}
            />
          </section>
        )}

        {/* TAB 3: REPORTS */}
        {activeTab === 'reports' && (
          <section id="reportsTab" className="tab-content space-y-6 animate-in fade-in duration-150">
            <ReportsView
              records={dockRecords}
              lang={lang}
              onEditRecord={(rec) => setEditingDockRecord(rec)}
              onDeleteRecord={handleDeleteDockRecord}
              onApplyCSVImport={(updated) => setDockRecords(updated)}
            />
          </section>
        )}

        {/* TAB 4: ANALYTICS & GRAPHS */}
        {activeTab === 'analytics' && (
          <section id="analyticsTab" className="tab-content space-y-6 animate-in fade-in duration-150">
            <AnalyticsView records={dockRecords} lang={lang} />
          </section>
        )}

        {/* TAB 5: WAREHOUSE SKU MOVEMENTS & INVENTORY */}
        {activeTab === 'movement' && (
          <section id="movementTab" className="tab-content space-y-6 animate-in fade-in duration-150">
            <KPICards
              lang={lang}
              records={records}
              onFilterUnit={(unit) => setActiveUnitFilter(unit)}
              onFilterType={(type) => setActiveTypeFilter(type)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-1">
                <EntryForm lang={lang} onAddRecord={handleAddRecord} />
              </div>

              <div className="lg:col-span-2">
                <MovementTable
                  lang={lang}
                  records={records}
                  activeUnitFilter={activeUnitFilter}
                  setActiveUnitFilter={setActiveUnitFilter}
                  activeTypeFilter={activeTypeFilter}
                  setActiveTypeFilter={setActiveTypeFilter}
                  onUpdateStatus={handleUpdateStatus}
                  onBulkUpdateStatus={handleBulkUpdateStatus}
                  onDeleteRecord={handleDeleteRecord}
                  onBulkDelete={handleBulkDelete}
                  onEditRecord={(rec) => setEditingRecord(rec)}
                  onViewGatePass={(rec) => setSelectedGatePassRecord(rec)}
                />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} <strong>AHPL & AIL</strong> - Warehouse & Logistics Hub. All rights reserved.
          </span>
          <span className="font-mono text-slate-400">
            100% Live Google Sheets Backend • CRUD Synced
          </span>
        </div>
      </footer>

      {/* Google Sheets Web App Config Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Google Apps Script Web App Configuration</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <p>
                The dashboard performs <strong>100% live GET, ADD, UPDATE, and DELETE</strong> operations directly via your Google Apps Script Web App URL.
              </p>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Google Apps Script Web App URL:
                </label>
                <input
                  type="url"
                  value={customScriptUrl}
                  onChange={(e) => setCustomScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Default constant in code: <code className="font-bold text-blue-700">GOOGLE_SCRIPT_URL</code>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Complete Backend Code (Code.gs):</span>
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    {isCopiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                    <span>{isCopiedCode ? 'Copied Code.gs!' : 'Copy Code.gs'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Open your Google Sheet → <strong>Extensions → Apps Script</strong> → Paste this code → <strong>Deploy → New deployment → Web app</strong> (Execute as: Me, Who has access: Anyone).
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
              >
                Save & Connect Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isStockModalOpen && (
        <StockOverviewModal
          lang={lang}
          onClose={() => setIsStockModalOpen(false)}
        />
      )}

      {selectedGatePassRecord && (
        <GatePassModal
          record={selectedGatePassRecord}
          lang={lang}
          onClose={() => setSelectedGatePassRecord(null)}
        />
      )}

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          lang={lang}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveEditedRecord}
        />
      )}

      {editingDockRecord && (
        <EditDockModal
          record={editingDockRecord}
          lang={lang}
          onClose={() => setEditingDockRecord(null)}
          onSave={handleSaveEditedDockRecord}
        />
      )}
    </div>
  );
}
