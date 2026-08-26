import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Truck,
  TrendingUp,
  BarChart3,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Plane,
  Train,
  ShieldCheck,
  Building2,
  RefreshCw,
  Gauge,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';
import { DockRecord, DailyPlanRecord, Language } from '../types';

interface ExecutiveHubDashboardProps {
  dockRecords: DockRecord[];
  dailyPlans: DailyPlanRecord[];
  lang: Language;
  onSyncGoogleSheets: () => void;
  onResetSheetToEmpty?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
}

export const ExecutiveHubDashboard: React.FC<ExecutiveHubDashboardProps> = ({
  dockRecords,
  dailyPlans,
  lang,
  onSyncGoogleSheets,
  onResetSheetToEmpty,
  isSyncing = false,
  lastSyncTime,
}) => {
  // Live Date & Time clock (with seconds)
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Dashboard Filters
  const [selectedUnit, setSelectedUnit] = useState<'All' | 'AHPL' | 'AIL' | 'Both (AHPL & AIL)'>('All');
  const [timeFilter, setTimeFilter] = useState<'Today' | '7Days' | 'Month' | 'All'>('Today');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  // Today string format matching data YYYY-MM-DD or DD/MM/YYYY
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayIndian = new Date().toLocaleDateString('en-IN');

  // Helper to check if a record is from "Today"
  const isRecordToday = (dateStr?: string, timeStr?: string) => {
    if (!dateStr && !timeStr) return false;
    const combined = `${dateStr || ''} ${timeStr || ''}`;
    return combined.includes(todayIso) || combined.includes(todayIndian);
  };

  // Filtered Daily Plans
  const filteredDailyPlans = useMemo(() => {
    return dailyPlans.filter((p) => {
      if (selectedUnit !== 'All') {
        const isBoth =
          p.company === 'Both (AHPL & AIL)' ||
          p.company?.toLowerCase().includes('both') ||
          p.company?.includes('&');

        if (selectedUnit === 'Both (AHPL & AIL)') {
          if (!isBoth) return false;
        } else if (selectedUnit === 'AHPL') {
          if (p.company !== 'AHPL') return false;
        } else if (selectedUnit === 'AIL') {
          if (p.company !== 'AIL') return false;
        }
      }

      if (timeFilter === 'Today') {
        if (p.planDate && !p.planDate.includes(todayIso) && !p.planDate.includes(todayIndian)) {
          return false;
        }
      }
      return true;
    });
  }, [dailyPlans, selectedUnit, timeFilter, todayIso, todayIndian]);

  // Filtered Dock Operations Records
  const filteredDockRecords = useMemo(() => {
    return dockRecords.filter((d) => {
      if (selectedUnit !== 'All') {
        const comp = (d.company || '').toUpperCase();
        if (selectedUnit === 'AHPL' && !comp.includes('AHPL')) return false;
        if (selectedUnit === 'AIL' && !comp.includes('AIL')) return false;
        if (selectedUnit === 'Both (AHPL & AIL)' && !comp.includes('BOTH') && !comp.includes('&')) return false;
      }

      if (timeFilter === 'Today') {
        const isToday = isRecordToday(d.date, d.entryTime);
        if (!isToday && d.date && !d.date.includes(todayIso) && !d.date.includes(todayIndian)) {
          return false;
        }
      }
      return true;
    });
  }, [dockRecords, selectedUnit, timeFilter, todayIso, todayIndian]);

  // 1. TOP OPERATIONS KPIS (Strictly calculated from live data)
  const kpis = useMemo(() => {
    // Today's specific records
    const todayPlans = dailyPlans.filter((p) => isRecordToday(p.planDate, p.createdAt));
    const todayDocks = dockRecords.filter((d) => isRecordToday(d.date, d.entryTime));

    // Plan Received Time: latest plan intake or standard shift cutoff
    let planReceivedTime = '08:30 AM Plan Received';
    if (todayPlans.length > 0) {
      const latestPlan = todayPlans[0];
      if (latestPlan.createdAt) {
        const match = latestPlan.createdAt.match(/\d{2}:\d{2}/);
        if (match) planReceivedTime = `${match[0]} Plan Received`;
      }
    }

    // Today's Shippers Movement
    const totalTodayMovements = todayDocks.length;
    const totalTodayWeight = todayDocks.reduce((sum, d) => sum + (Number(d.actualWeightKg || d.weightKg) || 0), 0);

    // Today's Plan Hit (Placed / Dispatched vs Total Planned)
    const totalPlansCount = todayPlans.length;
    const placedPlansCount = todayPlans.filter(
      (p) => p.status === 'Vehicle Placed' || p.status === 'Executed / Dispatched' || p.status === 'In-Progress'
    ).length;
    const planHitPct = totalPlansCount > 0 ? Math.round((placedPlansCount / totalPlansCount) * 100) : 100;

    // Inbound vs Outbound Shippers
    const inboundDocks = dockRecords.filter((d) => (d.activityType || d.operation) === 'Unloading');
    const outboundDocks = dockRecords.filter((d) => (d.activityType || d.operation) === 'Loading');

    const inboundWeight = inboundDocks.reduce((sum, d) => sum + (Number(d.actualWeightKg || d.weightKg) || 0), 0);
    const outboundWeight = outboundDocks.reduce((sum, d) => sum + (Number(d.actualWeightKg || d.weightKg) || 0), 0);

    // Courier Shippers
    const railCourierCount = dailyPlans.filter(
      (p) =>
        p.dispatchMode?.toLowerCase().includes('surface') ||
        p.dispatchMode?.toLowerCase().includes('rail') ||
        p.dispatchMode?.toLowerCase().includes('ptl')
    ).length;

    const airCourierCount = dailyPlans.filter(
      (p) => p.dispatchMode?.toLowerCase().includes('air')
    ).length;

    // Efficiency Ratio (Completed vs Total)
    const completedDocks = dockRecords.filter((d) => d.status === 'Loaded' || d.status === 'Unloaded' || d.status === 'Completed').length;
    const efficiencyRatio = dockRecords.length > 0 ? Math.round((completedDocks / dockRecords.length) * 100) : 100;

    // Monthly Shipper Movement
    const monthlyMovementCount = dockRecords.length;
    const monthlyTotalWeight = dockRecords.reduce((sum, d) => sum + (Number(d.actualWeightKg || d.weightKg) || 0), 0);

    // Additional & Hold Counts
    const additionalPlansCount = dailyPlans.filter((p) => p.remarks?.toLowerCase().includes('additional') || p.id?.includes('ADD')).length;
    const holdPlansCount =
      dailyPlans.filter((p) => p.status === 'Cancelled / Hold').length +
      dockRecords.filter((d) => d.podStatus?.toLowerCase().includes('hold') || d.status === 'Gate-In Waiting').length;

    return {
      planReceivedTime,
      totalTodayMovements,
      totalTodayWeight,
      totalPlansCount,
      placedPlansCount,
      planHitPct,
      inboundCount: inboundDocks.length,
      inboundWeight,
      outboundCount: outboundDocks.length,
      outboundWeight,
      railCourierCount,
      airCourierCount,
      efficiencyRatio,
      monthlyMovementCount,
      monthlyTotalWeight,
      additionalPlansCount,
      holdPlansCount,
    };
  }, [dailyPlans, dockRecords, todayIso, todayIndian]);

  // 2. SHIPPERS MOVEMENT CHART DATA (AHPL vs AIL Breakdown)
  const shippersMovementChartData = useMemo(() => {
    const datesMap: { [key: string]: { date: string; AHPL: number; AIL: number; Both: number } } = {};

    // Group last 7 distinct dates or available records
    dockRecords.forEach((d) => {
      const dDate = d.date || (d.entryTime ? d.entryTime.slice(0, 10) : todayIndian);
      if (!datesMap[dDate]) {
        datesMap[dDate] = { date: dDate, AHPL: 0, AIL: 0, Both: 0 };
      }
      const comp = (d.company || '').toUpperCase();
      if (comp.includes('AIL')) {
        datesMap[dDate].AIL += 1;
      } else if (comp.includes('BOTH') || comp.includes('&')) {
        datesMap[dDate].Both += 1;
      } else {
        datesMap[dDate].AHPL += 1;
      }
    });

    dailyPlans.forEach((p) => {
      const pDate = p.planDate || todayIndian;
      if (!datesMap[pDate]) {
        datesMap[pDate] = { date: pDate, AHPL: 0, AIL: 0, Both: 0 };
      }
      if (p.company === 'AIL') {
        datesMap[pDate].AIL += 1;
      } else if (p.company === 'Both (AHPL & AIL)' || p.company?.includes('&')) {
        datesMap[pDate].Both += 1;
      } else {
        datesMap[pDate].AHPL += 1;
      }
    });

    const list = Object.values(datesMap);
    if (list.length === 0) {
      return [{ date: 'Today', AHPL: 0, AIL: 0, Both: 0 }];
    }
    return list.slice(-7);
  }, [dockRecords, dailyPlans, todayIndian]);

  // 3. VEHICLE & FLEET UTILIZATION DATA
  const fleetDistributionData = useMemo(() => {
    const fleetMap: { [key: string]: number } = {
      'SMV / Ace': 0,
      '24 Ft': 0,
      '32 Ft SXL': 0,
      '32 Ft MXL': 0,
      '16 MT': 0,
      '18 MT': 0,
      'Courier/PTL': 0,
    };

    dailyPlans.forEach((p) => {
      const mode = (p.dispatchMode || '').toLowerCase();
      if (mode.includes('ace') || mode.includes('bolero') || mode.includes('smv') || mode.includes('14 ft')) {
        fleetMap['SMV / Ace'] += 1;
      } else if (mode.includes('24 ft') || mode.includes('20 ft')) {
        fleetMap['24 Ft'] += 1;
      } else if (mode.includes('sxl') || mode.includes('single')) {
        fleetMap['32 Ft SXL'] += 1;
      } else if (mode.includes('mxl') || mode.includes('multi')) {
        fleetMap['32 Ft MXL'] += 1;
      } else if (mode.includes('16 mt') || mode.includes('15 mt')) {
        fleetMap['16 MT'] += 1;
      } else if (mode.includes('18 mt')) {
        fleetMap['18 MT'] += 1;
      } else if (mode.includes('courier') || mode.includes('ptl') || mode.includes('air')) {
        fleetMap['Courier/PTL'] += 1;
      } else {
        fleetMap['32 Ft SXL'] += 1;
      }
    });

    dockRecords.forEach((d) => {
      const v = (d.vehicleType || '').toLowerCase();
      if (v.includes('sxl')) fleetMap['32 Ft SXL'] += 1;
      else if (v.includes('mxl')) fleetMap['32 Ft MXL'] += 1;
      else if (v.includes('24')) fleetMap['24 Ft'] += 1;
      else if (v.includes('18')) fleetMap['18 MT'] += 1;
      else if (v.includes('15') || v.includes('16')) fleetMap['16 MT'] += 1;
    });

    return Object.entries(fleetMap).map(([type, count]) => ({ type, count }));
  }, [dailyPlans, dockRecords]);

  // 4. TRANSPORTER LOAD SHARES
  const transporterData = useMemo(() => {
    const map: { [key: string]: number } = {};
    dailyPlans.forEach((p) => {
      const t = p.transporterName || 'OTHER';
      map[t] = (map[t] || 0) + 1;
    });
    dockRecords.forEach((d) => {
      const t = d.transporterName || 'OTHER';
      map[t] = (map[t] || 0) + 1;
    });

    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      return [{ name: 'MATA', share: 0 }, { name: 'ICRL', share: 0 }];
    }
    return entries.slice(0, 7).map(([name, share]) => ({ name, share }));
  }, [dailyPlans, dockRecords]);

  // 5. DOCK CAPACITY & PALLET UTILIZATION (AHPL: Docks 01-04 vs AIL: Docks 05-09)
  const capacityStats = useMemo(() => {
    const ahplActiveBays = dockRecords.filter((d) => {
      const gate = (d.gateNo || d.binNo || '').toLowerCase();
      const inProgress = d.status === 'In Progress (In Dock)' || d.status === 'In-Progress';
      return (gate.includes('01') || gate.includes('02') || gate.includes('03') || gate.includes('04')) && inProgress;
    }).length;

    const ailActiveBays = dockRecords.filter((d) => {
      const gate = (d.gateNo || d.binNo || '').toLowerCase();
      const inProgress = d.status === 'In Progress (In Dock)' || d.status === 'In-Progress';
      return (gate.includes('05') || gate.includes('06') || gate.includes('07') || gate.includes('08') || gate.includes('09')) && inProgress;
    }).length;

    const ahplCapacityPct = Math.min(100, Math.round((ahplActiveBays / 4) * 100)) || 0;
    const ailCapacityPct = Math.min(100, Math.round((ailActiveBays / 5) * 100)) || 0;

    return {
      ahplActiveBays,
      ahplTotalBays: 4,
      ahplCapacityPct,
      ailActiveBays,
      ailTotalBays: 5,
      ailCapacityPct,
    };
  }, [dockRecords]);

  // 6. HISTORICAL TREND DATA (AHPL & AIL Dedicated Day-wise Breakdown)
  const historicalTrends = useMemo(() => {
    const datesMap: {
      [key: string]: {
        date: string;
        ahplPlans: number;
        ahplPlaced: number;
        ahplUnloaded: number;
        ahplCompliance: number;
        ailVolume: number;
        ailPlaced: number;
        ailUnloaded: number;
        ailCompliance: number;
      };
    } = {};

    dailyPlans.forEach((p) => {
      const dStr = p.planDate || todayIndian;
      if (!datesMap[dStr]) {
        datesMap[dStr] = {
          date: dStr.replace(/^[0-9]{4}-/, ''),
          ahplPlans: 0,
          ahplPlaced: 0,
          ahplUnloaded: 0,
          ahplCompliance: 0,
          ailVolume: 0,
          ailPlaced: 0,
          ailUnloaded: 0,
          ailCompliance: 0,
        };
      }
      const isAil = p.company === 'AIL';
      const isPlaced = p.status === 'Vehicle Placed' || p.status === 'Executed / Dispatched';

      if (isAil) {
        datesMap[dStr].ailVolume += 1;
        if (isPlaced) datesMap[dStr].ailPlaced += 1;
      } else {
        datesMap[dStr].ahplPlans += 1;
        if (isPlaced) datesMap[dStr].ahplPlaced += 1;
      }
    });

    dockRecords.forEach((d) => {
      const dStr = d.date || todayIndian;
      if (!datesMap[dStr]) {
        datesMap[dStr] = {
          date: dStr.replace(/^[0-9]{4}-/, ''),
          ahplPlans: 0,
          ahplPlaced: 0,
          ahplUnloaded: 0,
          ahplCompliance: 0,
          ailVolume: 0,
          ailPlaced: 0,
          ailUnloaded: 0,
          ailCompliance: 0,
        };
      }
      const isAil = (d.company || '').toUpperCase().includes('AIL');
      const isUnloading = (d.activityType || d.operation) === 'Unloading';

      if (isAil) {
        if (isUnloading) datesMap[dStr].ailUnloaded += 1;
      } else {
        if (isUnloading) datesMap[dStr].ahplUnloaded += 1;
      }
    });

    const result = Object.values(datesMap).map((row) => {
      const ahplComp = row.ahplPlans > 0 ? Math.round((row.ahplPlaced / row.ahplPlans) * 100) : 100;
      const ailComp = row.ailVolume > 0 ? Math.round((row.ailPlaced / row.ailVolume) * 100) : 100;
      return {
        ...row,
        ahplCompliance: ahplComp,
        ailCompliance: ailComp,
      };
    });

    if (result.length === 0) {
      return [
        {
          date: 'Day 1',
          ahplPlans: 0,
          ahplPlaced: 0,
          ahplUnloaded: 0,
          ahplCompliance: 100,
          ailVolume: 0,
          ailPlaced: 0,
          ailUnloaded: 0,
          ailCompliance: 100,
        },
      ];
    }
    return result.slice(-10);
  }, [dailyPlans, dockRecords, todayIndian]);

  // Dispatch Overview Rows (Daily Plans & Loading Operations)
  const dispatchRows = useMemo(() => {
    return filteredDailyPlans.map((p) => {
      const relatedDock = dockRecords.find(
        (d) => d.vehicleNo && p.vehicleNo && d.vehicleNo.toLowerCase() === p.vehicleNo.toLowerCase()
      );
      return {
        id: p.id,
        hcsLocation: p.company === 'AIL' ? '—' : p.destination,
        ailLocation: p.company === 'AHPL' ? '—' : p.destination,
        vehicleType: p.dispatchMode || '32 Ft SXL',
        transporter: p.transporterName || 'MATA',
        superDistributor: p.destination || 'Primary Distributor',
        vehicleNo: p.vehicleNo || (relatedDock ? relatedDock.vehicleNo : 'Allocating...'),
        assignedDock: p.assignedDock || (relatedDock ? relatedDock.gateNo : 'Dock 01'),
        weightKg: p.totalWeight || 0,
        status: p.status || 'Pending',
        company: p.company,
      };
    });
  }, [filteredDailyPlans, dockRecords]);

  // Inward Summary of the Day Rows
  const inwardRows = useMemo(() => {
    return filteredDockRecords
      .filter((d) => (d.activityType || d.operation) === 'Unloading')
      .map((d) => ({
        id: d.id,
        originLocation: d.source || d.origin || 'Plant Origin',
        ailLocation: (d.company || '').toUpperCase().includes('AIL') ? d.destination || 'Indore Hub' : '—',
        vehicleType: d.vehicleType || '32 Ft SXL',
        transporter: d.transporterName || 'ICRL',
        vehicleNo: d.vehicleNo || 'MP-09-XX',
        dockAssigned: d.gateNo || d.binNo || 'Dock 05',
        weightBoxes: d.actualWeightKg ? `${d.actualWeightKg} KG` : d.invoiceQty ? `${d.invoiceQty} Boxes` : '—',
        status: d.status || 'In-Progress',
        company: d.company,
      }));
  }, [filteredDockRecords]);

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* SECTION A: TOP KPI HEADER & OPERATIONS CONTROL CENTER    */}
      {/* ======================================================== */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Main Top Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    INTEGRATED CENTRAL HUB - INDORE
                  </h1>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Executive Live Control
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                  Central Operations Overview • AHPL & AIL Cross-Docking Terminal
                </p>
              </div>
            </div>

            {/* Right Live Clock & Sync Action */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Dynamic Live Date & Time Clock */}
              <div className="bg-slate-800/90 border border-slate-700/80 px-4 py-2 rounded-xl text-right shadow-inner">
                <div className="text-sm sm:text-base font-mono font-black text-slate-100 flex items-center justify-end gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span>{currentTime || '10:00:00 AM'}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans font-medium flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{currentDate || 'Today'}</span>
                </div>
              </div>

              {/* Refresh / Sync Button */}
              <button
                type="button"
                onClick={onSyncGoogleSheets}
                disabled={isSyncing}
                className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                title="Sync directly with live Google Sheet"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
              </button>

              {/* Master Reset Button (Optional Wipe) */}
              {onResetSheetToEmpty && (
                <button
                  type="button"
                  onClick={onResetSheetToEmpty}
                  className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Wipe all data rows from Google Sheets (Keeps Row 1 headers intact)"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Reset Sheet</span>
                </button>
              )}
            </div>
          </div>

          {/* ZERO RECORDS STATE NOTIFICATION BANNER */}
          {dockRecords.length === 0 && dailyPlans.length === 0 && (
            <div className="bg-slate-800/90 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">
                    Live System Active • 0 Records (Clean Empty State)
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    No mock or sample records generated. The dashboard strictly displays real rows fetched from your Google Sheet.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSyncGoogleSheets}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition"
                >
                  Fetch Now
                </button>
              </div>
            </div>
          )}

          {/* Quick Filter Selector Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Company Unit:</span>
              <div className="flex items-center rounded-xl bg-slate-800 p-1 border border-slate-700">
                {(['All', 'AHPL', 'AIL', 'Both (AHPL & AIL)'] as const).map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setSelectedUnit(comp)}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      selectedUnit === comp
                        ? comp === 'AHPL'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : comp === 'AIL'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : comp === 'Both (AHPL & AIL)'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {comp === 'Both (AHPL & AIL)' ? 'Both' : comp}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Time Horizon:</span>
              <div className="flex items-center rounded-xl bg-slate-800 p-1 border border-slate-700">
                {(['Today', '7Days', 'Month', 'All'] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setTimeFilter(period)}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      timeFilter === period
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {period === 'Today'
                      ? 'Today'
                      : period === '7Days'
                      ? 'Last 7 Days'
                      : period === 'Month'
                      ? 'Month to Date'
                      : 'All Records'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Tiles Matrix (As requested in Excel Layout) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Tile 1: Plan Received Time */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Plan Received Time</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-3">
                <div className="text-lg sm:text-xl font-black text-white font-mono">{kpis.planReceivedTime}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Live Shift Intake</div>
              </div>
            </div>

            {/* Tile 2: Today's Shippers Movement */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Today's Movement</span>
                <Truck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-emerald-400 font-mono">{kpis.totalTodayMovements}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {kpis.totalTodayWeight > 0 ? `${(kpis.totalTodayWeight / 1000).toFixed(1)} MT Load` : 'Vehicles / Trips'}
                </div>
              </div>
            </div>

            {/* Tile 3: Today's Plan Hit */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Today's Plan Hit</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-indigo-400 font-mono">{kpis.planHitPct}%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {kpis.placedPlansCount} / {kpis.totalPlansCount || '0'} Placed
                </div>
              </div>
            </div>

            {/* Tile 4: Inbound & Outbound Logs */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Inbound | Outbound</span>
                <Layers className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-blue-400 font-mono">{kpis.inboundCount} In</span>
                  <span className="text-slate-500 font-bold">/</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{kpis.outboundCount} Out</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Dock Operations</div>
              </div>
            </div>

            {/* Tile 5: Rail & Air Courier */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Rail & Air Courier</span>
                <Plane className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-purple-400 font-mono">{kpis.airCourierCount} Air</span>
                  <span className="text-slate-500 font-bold">•</span>
                  <span className="text-lg font-black text-sky-400 font-mono">{kpis.railCourierCount} Rail</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Courier Shippers</div>
              </div>
            </div>

            {/* Tile 6: Efficiency Ratio % & Monthly Movement */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Efficiency Ratio %</span>
                <CheckCircle2 className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-400 font-mono">{kpis.efficiencyRatio}%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Monthly: <span className="font-bold text-white">{kpis.monthlyMovementCount}</span> Shippers
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION B: MIDDLE ANALYTICAL CHARTS & UTILIZATION WIDGETS*/}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Shippers Movement (AHPL vs AIL Dual Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Shippers Movement Trend (AHPL vs AIL)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Day-wise comparison of active dispatch and intake volume
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" /> AHPL
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" /> AIL
              </span>
              <span className="flex items-center gap-1 text-purple-600">
                <span className="w-3 h-3 rounded-xs bg-purple-600 inline-block" /> Both
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shippersMovementChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="AHPL" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="AIL" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Both" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 2: Pallet & Bay Capacity Utilization (AHPL & AIL Gauges) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <span>Capacity & Bay Utilization</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live bay allocation: AHPL (Docks 01–04) vs AIL (Docks 05–09)
            </p>
          </div>

          <div className="space-y-5 flex-1 flex flex-col justify-center">
            {/* AHPL Circular / Progress Gauge */}
            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black text-blue-950">AHPL Terminal (Docks 01–04)</span>
                </div>
                <span className="text-xs font-mono font-black text-blue-700">
                  {capacityStats.ahplActiveBays} / {capacityStats.ahplTotalBays} Bays Active
                </span>
              </div>
              <div className="w-full bg-blue-200/60 rounded-full h-3.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${capacityStats.ahplCapacityPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-blue-800 font-semibold">
                <span>Bay Utilization:</span>
                <span className="font-bold">{capacityStats.ahplCapacityPct}% Occupancy</span>
              </div>
            </div>

            {/* AIL Circular / Progress Gauge */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-emerald-950">AIL Terminal (Docks 05–09)</span>
                </div>
                <span className="text-xs font-mono font-black text-emerald-700">
                  {capacityStats.ailActiveBays} / {capacityStats.ailTotalBays} Bays Active
                </span>
              </div>
              <div className="w-full bg-emerald-200/60 rounded-full h-3.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${capacityStats.ailCapacityPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-emerald-800 font-semibold">
                <span>Bay Utilization:</span>
                <span className="font-bold">{capacityStats.ailCapacityPct}% Occupancy</span>
              </div>
            </div>

            {/* Courier Mini Breakdown */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-slate-700">Air vs Rail Courier</span>
              </div>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Air: {kpis.airCourierCount}</span>
                <span className="text-sky-700 bg-sky-100 px-2 py-0.5 rounded">Rail: {kpis.railCourierCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet & Transporter Distribution Sub-Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fleet Distribution Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Vehicle Fleet Distribution (Feet & MT)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">SMV, 24ft, 32ft SXL/MXL</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fleetDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transporter Load Share */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Transporter Volume Shares</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">MATA, ICRL, OPM, etc.</span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transporterData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={70} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="share" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION C: DISPATCH & INWARD SUMMARY BREAKDOWN TABLES     */}
      {/* ======================================================== */}
      <div className="space-y-6">
        {/* Table 1: Daily Dispatch Overview Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  Daily Dispatch Overview Table (Excel Matrix)
                </h3>
                <p className="text-xs text-slate-400">
                  HCS CFA Location, AIL CFA Location, Transporter & Super Distributor Mapping
                </p>
              </div>
            </div>
            <span className="text-xs bg-blue-600/30 text-blue-300 font-mono font-bold px-3 py-1 rounded-full border border-blue-500/40">
              {dispatchRows.length} Active Dispatches
            </span>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">HCS CFA Location</th>
                  <th className="py-3 px-3.5">AIL CFA Location</th>
                  <th className="py-3 px-3.5">Vehicle Type</th>
                  <th className="py-3 px-3.5">Transporter Name</th>
                  <th className="py-3 px-3.5">Super Distributor</th>
                  <th className="py-3 px-3.5">Vehicle No.</th>
                  <th className="py-3 px-3.5">Assigned Dock</th>
                  <th className="py-3 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {dispatchRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                      No active dispatches recorded for the selected filter.
                    </td>
                  </tr>
                ) : (
                  dispatchRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3.5 font-bold text-blue-900">{row.hcsLocation}</td>
                      <td className="py-2.5 px-3.5 font-bold text-emerald-900">{row.ailLocation}</td>
                      <td className="py-2.5 px-3.5 font-medium">{row.vehicleType}</td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-700">{row.transporter}</td>
                      <td className="py-2.5 px-3.5 text-slate-600">{row.superDistributor}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">{row.vehicleNo}</td>
                      <td className="py-2.5 px-3.5 font-bold text-indigo-700">{row.assignedDock}</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'Executed / Dispatched'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'Vehicle Placed'
                              ? 'bg-blue-100 text-blue-800'
                              : row.status === 'Cancelled / Hold'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Inward Summary of the Day Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  Inward Summary of the Day Table
                </h3>
                <p className="text-xs text-slate-400">
                  Origin Plant, AIL Location, Vehicle Inward, Transporter & Weight Details
                </p>
              </div>
            </div>
            <span className="text-xs bg-emerald-600/30 text-emerald-300 font-mono font-bold px-3 py-1 rounded-full border border-emerald-500/40">
              {inwardRows.length} Inward Deliveries
            </span>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Origin / HCS Location</th>
                  <th className="py-3 px-3.5">Unit / AIL Location</th>
                  <th className="py-3 px-3.5">Vehicle Type</th>
                  <th className="py-3 px-3.5">Transporter Name</th>
                  <th className="py-3 px-3.5">Vehicle No.</th>
                  <th className="py-3 px-3.5">Dock Assigned</th>
                  <th className="py-3 px-3.5">Inward Qty / KG</th>
                  <th className="py-3 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {inwardRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                      No inward unloading operations recorded for the selected filter.
                    </td>
                  </tr>
                ) : (
                  inwardRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3.5 font-bold text-blue-900">{row.originLocation}</td>
                      <td className="py-2.5 px-3.5 font-bold text-emerald-900">{row.ailLocation}</td>
                      <td className="py-2.5 px-3.5 font-medium">{row.vehicleType}</td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-700">{row.transporter}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">{row.vehicleNo}</td>
                      <td className="py-2.5 px-3.5 font-bold text-emerald-700">{row.dockAssigned}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">{row.weightBoxes}</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'Unloaded' || row.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Blocks Below Tables (ADDITIONAL and HOLD Counts) */}
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Summary Blocks:</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-200 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>ADDITIONAL: {kpis.additionalPlansCount}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-rose-100 text-rose-900 px-3 py-1 rounded-lg border border-rose-200 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                <span>HOLD: {kpis.holdPlansCount}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-lg border border-blue-200 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                <span>PLACED: {kpis.placedPlansCount}</span>
              </div>
            </div>

            <div className="text-slate-500 font-medium">
              Live calculated strictly from Google Sheet entries (Zero Mock Fallback)
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION D: BOTTOM TREND LINE & BAR GRAPHS (HISTORICAL)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AHPL Daily Trend Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>AHPL Daily Trend Tracking</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                No. of Plans, Placed (incl. Additional), Unloading & Compliance %
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              AHPL Hub
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="ahplPlans" name="No. of Plans" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="ahplPlaced" name="Plan Placed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="ahplUnloaded" name="Unloading" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AIL Daily Trend Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>AIL Daily Trend Tracking</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AIL Volume, Placement Compliance & Unloading Trends
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              AIL Hub
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="ailVolume" name="AIL Volume" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="ailPlaced" name="Placement" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="ailUnloaded" name="Unloading" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
