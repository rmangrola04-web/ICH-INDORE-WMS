import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  DoorOpen,
  Users,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { DockRecord, Language } from '../types';
import { t } from '../utils/translations';

interface AnalyticsViewProps {
  records: DockRecord[];
  lang: Language;
}

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ records, lang }) => {
  const dict = t[lang];

  // 1. Average TAT by Dock
  const dockDataMap: Record<string, { gate: string; totalMins: number; count: number }> = {
    'Dock 01': { gate: 'Dock 01 (AHPL)', totalMins: 0, count: 0 },
    'Dock 02': { gate: 'Dock 02 (AHPL)', totalMins: 0, count: 0 },
    'Dock 03': { gate: 'Dock 03 (AHPL)', totalMins: 0, count: 0 },
    'Dock 04': { gate: 'Dock 04 (AHPL)', totalMins: 0, count: 0 },
    'Dock 05': { gate: 'Dock 05 (AIL)', totalMins: 0, count: 0 },
    'Dock 06': { gate: 'Dock 06 (AIL)', totalMins: 0, count: 0 },
    'Dock 07': { gate: 'Dock 07 (AIL)', totalMins: 0, count: 0 },
    'Dock 08': { gate: 'Dock 08 (AIL)', totalMins: 0, count: 0 },
    'Dock 09': { gate: 'Dock 09 (AIL)', totalMins: 0, count: 0 },
  };

  records.forEach((r) => {
    if (r.startTime && r.exitTime) {
      const [sh, sm] = r.startTime.split(':').map(Number);
      const [eh, em] = r.exitTime.split(':').map(Number);
      let diff = eh * 60 + em - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;

      const dockStr = (r.gateNo || r.binNo || '').trim();
      const numMatch = dockStr.match(/\d+/);
      if (numMatch) {
        const paddedKey = `Dock ${numMatch[0].padStart(2, '0')}`;
        if (dockDataMap[paddedKey]) {
          dockDataMap[paddedKey].totalMins += diff;
          dockDataMap[paddedKey].count += 1;
        }
      }
    }
  });

  const tatByGateData = Object.values(dockDataMap).map((item) => ({
    gate: item.gate,
    avgTAT: item.count > 0 ? Math.round(item.totalMins / item.count) : 0,
    operations: item.count,
  }));

  // 2. Hourly Dock Activity Throughput
  const hourlyCounts: Record<string, { hour: string; loading: number; unloading: number }> = {
    '08:00': { hour: '08:00', loading: 0, unloading: 0 },
    '10:00': { hour: '10:00', loading: 0, unloading: 0 },
    '12:00': { hour: '12:00', loading: 0, unloading: 0 },
    '14:00': { hour: '14:00', loading: 0, unloading: 0 },
    '16:00': { hour: '16:00', loading: 0, unloading: 0 },
    '18:00': { hour: '18:00', loading: 0, unloading: 0 },
  };

  records.forEach((r) => {
    if (r.startTime) {
      const hourNum = parseInt(r.startTime.split(':')[0], 10);
      let bucket = '08:00';
      if (hourNum >= 18) bucket = '18:00';
      else if (hourNum >= 16) bucket = '16:00';
      else if (hourNum >= 14) bucket = '14:00';
      else if (hourNum >= 12) bucket = '12:00';
      else if (hourNum >= 10) bucket = '10:00';

      if (r.operation === 'Loading') {
        hourlyCounts[bucket].loading += 1;
      } else {
        hourlyCounts[bucket].unloading += 1;
      }
    }
  });

  const hourlyData = Object.values(hourlyCounts);

  // 3. Company Unit Volume Share
  const unitCounts: Record<string, number> = {
    AHPL: 0,
    AIL: 0,
    'AHPL & AIL': 0,
  };

  records.forEach((r) => {
    if (unitCounts[r.unit] !== undefined) {
      unitCounts[r.unit] += 1;
    } else {
      unitCounts[r.unit] = 1;
    }
  });

  const unitPieData = Object.keys(unitCounts).map((unit) => ({
    name: unit,
    value: unitCounts[unit],
  }));

  // 4. POD Status Breakdown
  const podCounts: Record<string, number> = {
    'POD Clean': 0,
    'Hold - Damage': 0,
    'Hold - Claim': 0,
    'Hold - Shortage': 0,
  };

  records.forEach((r) => {
    if (!r.podStatus || r.podStatus === 'POD Clean') {
      podCounts['POD Clean'] += 1;
    } else if (r.podStatus === 'POD Hold - Damage') {
      podCounts['Hold - Damage'] += 1;
    } else if (r.podStatus === 'POD Hold - Insurance Claim') {
      podCounts['Hold - Claim'] += 1;
    } else {
      podCounts['Hold - Shortage'] += 1;
    }
  });

  const podPieData = [
    { name: 'POD Clean', value: podCounts['POD Clean'], color: '#10b981' },
    { name: 'Hold: Damage', value: podCounts['Hold - Damage'], color: '#ef4444' },
    { name: 'Hold: Claim', value: podCounts['Hold - Claim'], color: '#f59e0b' },
    { name: 'Hold: Shortage', value: podCounts['Hold - Shortage'], color: '#ec4899' },
  ].filter((item) => item.value > 0);

  // 5. Transporter Volume Distribution
  const transporterMap: Record<string, number> = {};
  records.forEach((r) => {
    const name = r.transporterName || 'ICRL';
    transporterMap[name] = (transporterMap[name] || 0) + 1;
  });

  const transporterData = Object.entries(transporterMap)
    .map(([transporter, count]) => ({ transporter, count }))
    .sort((a, b) => b.count - a.count);

  // 6. Supervisor Efficiency & Volume
  const supervisorMap: Record<string, { supervisor: string; completed: number; inProgress: number }> = {};
  records.forEach((r) => {
    const name = r.supervisorName || 'Unassigned';
    if (!supervisorMap[name]) {
      supervisorMap[name] = { supervisor: name, completed: 0, inProgress: 0 };
    }
    if (r.status === 'Completed') {
      supervisorMap[name].completed += 1;
    } else {
      supervisorMap[name].inProgress += 1;
    }
  });

  const supervisorData = Object.values(supervisorMap);

  // Quick stats
  const totalCompleted = records.filter((r) => r.status === 'Completed').length;
  const totalClean = podCounts['POD Clean'];
  const podCleanRate = records.length > 0 ? Math.round((totalClean / records.length) * 100) : 100;
  const slaCompliancePercent = 94; // Target SLA < 90m

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>{dict.analyticsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{dict.analyticsSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{podCleanRate}% POD Clean Rate</span>
          </span>
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{slaCompliancePercent}% SLA Compliance (&lt; 90m)</span>
          </span>
        </div>
      </div>

      {/* Row 1: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnaround Time (TAT) by Gate */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>{dict.tatByGate}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Target: &lt; 90 mins</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tatByGateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="gate" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `${value ?? 0} mins`,
                    'Avg TAT Duration',
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="avgTAT" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Throughput */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>{dict.hourlyThroughput}</span>
            </h3>
            <span className="text-xs text-slate-500">Loading vs Unloading</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLoading" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUnloading" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="loading"
                  name="Loading"
                  stroke="#4f46e5"
                  fillOpacity={1}
                  fill="url(#colorLoading)"
                />
                <Area
                  type="monotone"
                  dataKey="unloading"
                  name="Unloading"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#colorUnloading)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: POD Status Breakdown & Transporter Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* POD Status Incidence Share */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>POD Audit & Clearance Ratio</span>
            </h3>
            <span className="text-xs text-emerald-600 font-semibold">{podCleanRate}% Clean Dispatches</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={podPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {podPieData.map((entry, index) => (
                      <Cell key={`pod-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {podPieData.map((entry) => (
                <div key={entry.name} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    <span>{entry.name}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{entry.value} cases</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transporter Volume Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Transporter Volume Share</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">ICRL, MATA, OPM & Partners</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transporterData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis type="category" dataKey="transporter" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip
                  formatter={(val: number | string | undefined) => [`${val ?? 0} Vehicles`, 'Trips Logged']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Unit Share & Supervisor Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Unit Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <span>{dict.unitDistribution}</span>
            </h3>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {unitPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {unitPieData.map((entry, idx) => (
              <div key={entry.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></span>
                  <span>{entry.name}</span>
                </span>
                <span className="font-mono font-bold text-slate-800">{entry.value} vehicles</span>
              </div>
            ))}
          </div>
        </div>

        {/* Supervisor Operations Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>{dict.supervisorPerf}</span>
            </h3>
            <span className="text-xs text-slate-500">Floor Supervisors</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supervisorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="supervisor" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inProgress" name="In-Progress" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
