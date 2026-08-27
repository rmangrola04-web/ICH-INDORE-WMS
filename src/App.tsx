import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Settings2, Trash2, Check, Copy, History, Sparkles, Menu, Clock, Boxes, ShieldCheck, User } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MyTasksView } from './components/MyTasksView';
import { ExecutiveHubDashboard } from './components/ExecutiveHubDashboard';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { UserManualModal } from './components/UserManualModal';
import { AuthModal } from './components/AuthModal';
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
import { DailyPlanExecutionView } from './components/DailyPlanExecutionView';
import { CURRENT_APP_VERSION } from './data/changelogData';
import {
  MovementRecord,
  MovementStatus,
  DockRecord,
  DockStatus,
  AppTab,
  Language,
  CompanyUnit,
  DailyPlanRecord,
  PlanExecutionStatus,
  UserAccount,
  UserRole,
} from './types';
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
  fetchLiveDailyPlans,
  addLiveDailyPlan,
  batchAddLiveDailyPlans,
  updateLiveDailyPlan,
  deleteLiveDailyPlan,
  bulkDeleteLiveDailyPlans,
  resetSheetToEmpty,
  COMPLETE_GOOGLE_APPS_SCRIPT_CODE_GS,
} from './utils/googleSheetsService';

export { GOOGLE_SCRIPT_URL };

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'Admin User',
    role: 'ADMIN',
    avatarInitials: 'AD',
  },
  {
    username: 'supervisor',
    password: 'super123',
    fullName: 'Duty Supervisor',
    role: 'SUPERVISOR',
    avatarInitials: 'SUP',
  },
  {
    username: 'security',
    password: 'gate123',
    fullName: 'Gate Security',
    role: 'SECURITY',
    avatarInitials: 'SEC',
  },
  {
    username: 'operator',
    password: 'op123',
    fullName: 'Dock Operator',
    role: 'OPERATOR',
    avatarInitials: 'OP',
  },
];

export default function App() {
  // Authentication State
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('ahpl_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('ahpl_current_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_ACCOUNTS[1]; // Default to Rahul Prajapati (Supervisor)
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUserManualOpen, setIsUserManualOpen] = useState<boolean>(false);

  // Navigation State - Defaults to Flagship Executive Hub Dashboard
  const [activeTab, setActiveTab] = useState<AppTab>('executive');

  // State: Initialized strictly to empty arrays (No dummy or mock data on load, strictly network-driven)
  const [records, setRecords] = useState<MovementRecord[]>([]);
  const [dockRecords, setDockRecords] = useState<DockRecord[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlanRecord[]>([]);

  // Live Sync & Sheet State
  const [isFetchingSheet, setIsFetchingSheet] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error' | 'syncing'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [isResettingSheet, setIsResettingSheet] = useState<boolean>(false);
  const [customScriptUrl, setCustomScriptUrl] = useState<string>(() => getActiveGoogleScriptUrl());
  const [isCopiedCode, setIsCopiedCode] = useState<boolean>(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);

  // Language state (defaults to 'hi')
  const [lang, setLang] = useState<Language>('hi');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('ahpl_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ahpl_current_user');
      }
    } catch (e) {
      console.warn('User storage save error:', e);
    }
  }, [currentUser]);

  // Save registered users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ahpl_registered_users', JSON.stringify(registeredUsers));
    } catch (e) {
      console.warn('Registered users save error:', e);
    }
  }, [registeredUsers]);

  const handleRegisterUser = (newUser: UserAccount) => {
    setRegisteredUsers((prev) => [...prev, newUser]);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    // Contextually route to the optimal view for their role
    if (user.role === 'SECURITY') {
      setActiveTab('tracker');
    } else if (user.role === 'OPERATOR') {
      setActiveTab('live');
    } else {
      setActiveTab('executive');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Filters for Movement Table
  const [activeUnitFilter, setActiveUnitFilter] = useState<string>('All');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('All');

  // Modals state
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [selectedGatePassRecord, setSelectedGatePassRecord] = useState<MovementRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<MovementRecord | null>(null);
  const [editingDockRecord, setEditingDockRecord] = useState<DockRecord | null>(null);

  // ONE-TIME PURGE of legacy mock data caches while preserving Auth & Google Sheet Settings
  useEffect(() => {
    try {
      localStorage.removeItem('dock_records_cache');
      localStorage.removeItem('movement_records_cache');
    } catch (e) {
      console.warn('Storage cleanup error:', e);
    }
  }, []);

  // LIVE SYNC FETCH FUNCTION (Fetches both Dock Operations & Daily Plans)
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
      const [dockRes, planRes] = await Promise.allSettled([
        fetchLiveSheetRecords(activeUrl),
        fetchLiveDailyPlans(activeUrl),
      ]);

      let syncSummary: string[] = [];

      if (dockRes.status === 'fulfilled' && dockRes.value.success) {
        setDockRecords(dockRes.value.records);
        syncSummary.push(`${dockRes.value.records.length} dock records`);
      }

      if (planRes.status === 'fulfilled' && planRes.value.success) {
        setDailyPlans(planRes.value.plans);
        syncSummary.push(`${planRes.value.plans.length} daily plans`);
      }

      const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setLastSyncTime(timeNow);
      setSyncStatus('success');
      setSyncMessage(`Synced ${syncSummary.join(' & ') || 'data'} at ${timeNow}`);
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

  // Daily Plan Handlers
  const handleAddDailyPlan = (newPlanData: Omit<DailyPlanRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newId = `PLAN-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullPlan: DailyPlanRecord = {
      ...newPlanData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setDailyPlans((prev) => [fullPlan, ...prev]);

    // Push to Google Sheets in background
    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      addLiveDailyPlan(fullPlan, activeUrl).catch((err) => {
        console.warn('Background Daily Plan sync error:', err);
      });
    }
  };

  const handleBatchAddDailyPlans = async (newPlansData: Array<Omit<DailyPlanRecord, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const now = new Date().toISOString();
    const createdPlans: DailyPlanRecord[] = newPlansData.map((data, idx) => ({
      ...data,
      id: `PLAN-${Math.floor(1000 + Math.random() * 9000)}-${idx + 1}`,
      createdAt: now,
      updatedAt: now,
    }));

    setDailyPlans((prev) => [...createdPlans, ...prev]);

    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      try {
        await batchAddLiveDailyPlans(createdPlans, activeUrl);
      } catch (err) {
        console.warn('Batch daily plan upload error:', err);
      }
    }
  };

  const handleUpdateDailyPlan = (updatedPlan: DailyPlanRecord) => {
    setDailyPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? { ...updatedPlan, updatedAt: new Date().toISOString() } : p))
    );

    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      updateLiveDailyPlan(updatedPlan, activeUrl).catch((err) => {
        console.warn('Background Daily Plan update error:', err);
      });
    }
  };

  const handleDeleteDailyPlan = (id: string) => {
    setDailyPlans((prev) => prev.filter((p) => p.id !== id));

    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      deleteLiveDailyPlan(id, activeUrl).catch((err) => {
        console.warn('Background Daily Plan delete error:', err);
      });
    }
  };

  const handleBulkDeleteDailyPlans = (ids: string[]) => {
    setDailyPlans((prev) => prev.filter((p) => !ids.includes(p.id)));

    const activeUrl = getActiveGoogleScriptUrl();
    if (activeUrl) {
      bulkDeleteLiveDailyPlans(ids, activeUrl).catch((err) => {
        console.warn('Background Daily Plan bulk delete error:', err);
      });
    }
  };

  const handleQuickPlanStatusChange = (id: string, newStatus: PlanExecutionStatus) => {
    let targetPlan: DailyPlanRecord | undefined;
    setDailyPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          targetPlan = { ...p, status: newStatus, updatedAt: new Date().toISOString() };
          return targetPlan;
        }
        return p;
      })
    );

    if (targetPlan) {
      const activeUrl = getActiveGoogleScriptUrl();
      if (activeUrl) {
        updateLiveDailyPlan(targetPlan, activeUrl).catch((err) => {
          console.warn('Quick Plan status sync error:', err);
        });
      }
    }
  };

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

  const handleExecuteResetToEmpty = async () => {
    setIsResettingSheet(true);
    try {
      const activeUrl = (customScriptUrl || getActiveGoogleScriptUrl()).trim();
      if (activeUrl) {
        await resetSheetToEmpty(activeUrl);
      }
      setDockRecords([]);
      setDailyPlans([]);
      setRecords([]);
      setSyncStatus('success');
      setSyncMessage('Google Sheet reset cleanly to 0 records (Row 1 headers preserved).');
      setIsResetConfirmOpen(false);
      setIsSettingsOpen(false);
    } catch (err: any) {
      console.error('Reset sheet error:', err);
      setSyncStatus('error');
      setSyncMessage(err.message || 'Failed to reset sheet.');
    } finally {
      setIsResettingSheet(false);
    }
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

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex font-sans selection:bg-slate-300 selection:text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lang={lang}
        currentUser={currentUser || undefined}
        taskCount={3}
        onRefreshData={() => handleFetchFromGoogleSheet(false)}
        onOpenSyncSettings={() => setIsSettingsOpen(true)}
        onOpenUserManual={() => setIsUserManualOpen(true)}
        onLogout={handleLogout}
        isSyncing={isFetchingSheet}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 cursor-pointer"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 flex items-center gap-2">
                  <span>Plan Received AHPL & AIL Operations</span>
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Indore Hub • Location & Vehicle Wise Summary Active
                </p>
              </div>
            </div>

            {/* Right Header Status and Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-Sync Active</span>
              </div>

              {liveTime && (
                <div id="liveClock" className="hidden lg:flex items-center gap-1.5 text-xs font-mono font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                  <span>{liveTime}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleLang}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-white text-slate-700 border border-slate-300 rounded-xl transition cursor-pointer"
                title="Toggle Hindi / English"
              >
                {lang === 'hi' ? 'EN' : 'हिन्दी'}
              </button>

              <button
                type="button"
                onClick={() => setIsStockModalOpen(true)}
                className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-white text-slate-700 border border-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Stock Overview"
              >
                <Boxes className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">Stock</span>
              </button>

              <button
                type="button"
                onClick={() => handleFetchFromGoogleSheet(false)}
                disabled={isFetchingSheet}
                className="px-3 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Sync with Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isFetchingSheet ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content View Container */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
          {/* TAB 0: EXECUTIVE HUB DASHBOARD */}
          {activeTab === 'executive' && (
            <section id="executiveTab" className="tab-content space-y-6 animate-in fade-in duration-150">
              <ExecutiveHubDashboard
                dockRecords={dockRecords}
                dailyPlans={dailyPlans}
                lang={lang}
                onSyncGoogleSheets={() => handleFetchFromGoogleSheet(false)}
                onResetSheetToEmpty={() => setIsResetConfirmOpen(true)}
                isSyncing={isFetchingSheet}
                lastSyncTime={lastSyncTime}
              />
            </section>
          )}

          {/* TAB: MY TASKS */}
          {activeTab === 'tasks' && (
            <section id="tasksTab" className="tab-content space-y-6 animate-in fade-in duration-150">
              <MyTasksView lang={lang} />
            </section>
          )}

          {/* TAB: DAILY PLAN EXECUTION (PHOTO SCAN) */}
          {activeTab === 'plan' && (
            <section id="planTab" className="tab-content space-y-6 animate-in fade-in duration-150">
              <DailyPlanExecutionView
                plans={dailyPlans}
                lang={lang}
                onAddPlan={handleAddDailyPlan}
                onBatchAddPlans={handleBatchAddDailyPlans}
                onUpdatePlan={handleUpdateDailyPlan}
                onDeletePlan={handleDeleteDailyPlan}
                onBulkDeletePlans={handleBulkDeleteDailyPlans}
                onQuickStatusChange={handleQuickPlanStatusChange}
                onSyncGoogleSheets={() => handleFetchFromGoogleSheet(false)}
                isSyncing={isFetchingSheet}
                lastSyncTime={lastSyncTime}
              />
            </section>
          )}

          {/* TAB 1: LOADING & UNLOADING (DOCK OPERATIONS) */}
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
              />
            </section>
          )}

          {/* TAB 4: ANALYTICS & GRAPHS */}
          {activeTab === 'analytics' && (
            <section id="analyticsTab" className="tab-content space-y-6 animate-in fade-in duration-150">
              <AnalyticsView records={dockRecords} lang={lang} />
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E2DCCE] py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                © {new Date().getFullYear()} <strong>AHPL & AIL</strong> - Integrated Central Hub Indore. All rights reserved.
              </span>
              <button
                type="button"
                onClick={() => setIsVersionModalOpen(true)}
                className="inline-flex items-center gap-1 font-mono font-bold text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2 py-0.5 rounded border border-slate-300 transition cursor-pointer"
                title="View Version History & Release Notes"
              >
                <History className="w-3 h-3 text-indigo-500" />
                <span>{CURRENT_APP_VERSION} • Live</span>
              </button>
            </div>
            <span className="font-mono text-slate-400">
              100% Live Google Sheets Backend • Zero Mock Data
            </span>
          </div>
        </footer>
      </div>

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
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Permanent 2-Way Sync Web App URL Locked & Connected</span>
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

              {/* DANGER ZONE: MASTER WIPE TO 0 RECORDS */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Master Wipe / Clean Reset (Action: RESET_TO_EMPTY)</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Permanently wipe all data rows from <code>Dock_Operations</code> and <code>Daily_Plan_Execution</code> sheets. Row 1 column headers remain completely intact, instantly resetting total record counts to 0.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsResetConfirmOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe All Records & Reset to 0</span>
                </button>
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

      {/* Reset to 0 Confirmation Dialog Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset Sheet to Empty (0 Records)?</h3>
                <p className="text-xs text-slate-500">Action: RESET_TO_EMPTY</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will invoke the master backend wipe to delete <strong>all data rows</strong> from both <code className="font-mono text-slate-800 font-bold">Dock_Operations</code> and <code className="font-mono text-slate-800 font-bold">Daily_Plan_Execution</code> in your Google Spreadsheet. Row 1 headers will remain untouched.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
              <strong>Note:</strong> Zero dummy/mock records will be created. The system will start fresh with exactly 0 rows.
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResettingSheet}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResetToEmpty}
                disabled={isResettingSheet}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isResettingSheet ? 'Wiping Sheet...' : 'Yes, Wipe & Reset to 0'}</span>
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

      {/* Version History & Changelog Modal */}
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        lang={lang}
      />

      {/* User Manual & Guide Modal */}
      <UserManualModal
        isOpen={isUserManualOpen}
        onClose={() => setIsUserManualOpen(false)}
        lang={lang}
      />

      {/* Authentication Login & Registration Screen */}
      <AuthModal
        isOpen={isAuthModalOpen || currentUser === null}
        onLoginSuccess={handleLoginSuccess}
        registeredUsers={registeredUsers}
        onRegisterUser={handleRegisterUser}
      />
    </div>
  );
}
