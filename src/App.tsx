import React, { useState, useEffect } from 'react';
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
import { INITIAL_RECORDS, INITIAL_DOCK_RECORDS } from './data/initialData';
import { t } from './utils/translations';

const LOCAL_STORAGE_KEY = 'ahpl_ail_warehouse_records_v1';
const LOCAL_STORAGE_DOCK_KEY = 'ahpl_ail_dock_records_v1';
const LOCAL_STORAGE_LANG_KEY = 'ahpl_ail_warehouse_lang_v1';
const LOCAL_STORAGE_TAB_KEY = 'ahpl_ail_active_tab_v2';

export default function App() {
  // Active Navigation Tab ('loading', 'live', 'reports', 'analytics', 'movement')
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TAB_KEY);
      if (saved && ['loading', 'live', 'reports', 'analytics', 'movement'].includes(saved)) {
        return saved as AppTab;
      }
    } catch (e) {
      console.warn('Failed to parse active tab', e);
    }
    return 'loading';
  });

  // Load saved movement records or initial default data
  const [records, setRecords] = useState<MovementRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage records', e);
    }
    return INITIAL_RECORDS;
  });

  // Load saved dock records or initial default data
  const [dockRecords, setDockRecords] = useState<DockRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DOCK_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage dock records', e);
    }
    return INITIAL_DOCK_RECORDS;
  });

  // Language state (defaults to 'hi' as requested by user)
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
      console.warn('Failed to save records to localStorage', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DOCK_KEY, JSON.stringify(dockRecords));
    } catch (e) {
      console.warn('Failed to save dock records to localStorage', e);
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

  // Dock & TAT Handlers
  const handleAddDockRecord = (newEntry: Omit<DockRecord, 'id' | 'date'>) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const fullDockRecord: DockRecord = {
      ...newEntry,
      id: `DOCK-${Date.now().toString().slice(-4)}`,
      date: dateStr,
    };
    setDockRecords((prev) => [fullDockRecord, ...prev]);
  };

  const handleUpdateDockStatus = (id: string, newStatus: DockStatus) => {
    setDockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        if (newStatus === 'Completed' && !rec.exitTime) {
          const now = new Date();
          const exitStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          return { ...rec, status: newStatus, exitTime: exitStr };
        }
        return { ...rec, status: newStatus };
      })
    );
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

  const handleDeleteDockRecord = (id: string) => {
    setDockRecords((prev) => prev.filter((rec) => rec.id !== id));
  };

  const handleBulkDeleteDock = (ids: string[]) => {
    setDockRecords((prev) => prev.filter((rec) => !ids.includes(rec.id)));
  };

  const handleQuickCompleteDock = (id: string) => {
    const now = new Date();
    const exitStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setDockRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status: 'Completed', exitTime: exitStr } : rec))
    );
  };

  const handleSaveEditedDockRecord = (updated: DockRecord) => {
    setDockRecords((prev) =>
      prev.map((rec) => (rec.id === updated.id ? updated : rec))
    );
  };

  // Guard & Supervisor Tracker Handlers
  const handleAddGuardEntry = (entry: {
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
  }) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const tokenSeq = (dockRecords.length + 1).toString().padStart(3, '0');
    const tokenId = entry.tokenId || `TKN-${tokenSeq}`;

    const newDockRecord: DockRecord = {
      id: `DOCK-${Date.now().toString().slice(-4)}`,
      tokenId: tokenId,
      unit: entry.unit,
      gateNo: entry.binNo || entry.gateNo || (entry.unit === 'AIL' ? 'Dock 5' : 'Dock 1'),
      binNo: entry.binNo || '',
      operation: 'Loading',
      vehicleNo: entry.vehicleNo,
      driverName: entry.driverName,
      driverMobile: entry.driverMobile || '',
      transporterName: entry.transporterName,
      locationType: entry.locationType || 'LL',
      cfaLocation: entry.cfaLocation || '',
      supervisorName: entry.supervisor || 'Pending Assignment',
      startTime: timeStr,
      status: 'Gate-In Waiting',
      date: dateStr,
      podStatus: 'POD Clean',
      remarks: `Gate-In Entry via Security. Driver: ${entry.driverName} ${entry.driverMobile ? `(${entry.driverMobile})` : ''}`,
    };

    setDockRecords((prev) => [newDockRecord, ...prev]);
  };

  const handleSyncFromSheet = (sheetRecords: DockRecord[]) => {
    // Merge or replace sheet records seamlessly
    setDockRecords((prev) => {
      const existingIds = new Set(sheetRecords.map((r) => r.tokenId || r.id));
      const filteredPrev = prev.filter((r) => !existingIds.has(r.tokenId || r.id));
      return [...sheetRecords, ...filteredPrev];
    });
  };

  const handleStartSupervisorActivity = (
    id: string,
    activityType: 'Loading' | 'Unloading',
    supervisorName: string,
    gateNo: string
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setDockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        return {
          ...rec,
          operation: activityType,
          supervisorName: supervisorName,
          gateNo: gateNo,
          startTime: timeStr,
          status: 'In-Progress' as DockStatus,
          remarks: `${activityType} started by Supervisor ${supervisorName}`,
        };
      })
    );
  };

  const handleCloseSupervisorActivity = (id: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setDockRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        return {
          ...rec,
          exitTime: timeStr,
          status: 'Completed' as DockStatus,
          remarks: `Operation closed & dispatched at ${timeStr}`,
        };
      })
    );
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'hi' ? 'en' : 'hi'));
  };

  const activeBayCount = Array.from(
    new Set(
      dockRecords
        .filter((r) => r.status === 'In-Progress')
        .map((r) => r.gateNo)
    )
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenStockModal={() => setIsStockModalOpen(true)}
      />

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
            © {new Date().getFullYear()} <strong>AAHPL & AIL</strong> - Warehouse & Logistics Hub. All rights reserved.
          </span>
          <span className="font-mono text-slate-400">
            Gate Ops & TAT Engine v2.4 • Active Nodes: 5/5
          </span>
        </div>
      </footer>

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
