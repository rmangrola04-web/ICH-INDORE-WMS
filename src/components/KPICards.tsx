import React from 'react';
import { Boxes, Package, Truck, Send, CheckCircle2, Clock } from 'lucide-react';
import { Language, MovementRecord } from '../types';
import { t } from '../utils/translations';
import { DailyMovementChart } from './DailyMovementChart';

interface KPICardsProps {
  lang: Language;
  records: MovementRecord[];
  onFilterUnit?: (unit: string) => void;
  onFilterType?: (type: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  lang,
  records,
  onFilterUnit,
  onFilterType,
}) => {
  const dict = t[lang];

  // Dynamic calculations from active records
  const inboundRecords = records.filter((r) => r.type === 'Inbound');
  const outboundRecords = records.filter((r) => r.type === 'Outbound');
  
  const inboundPending = inboundRecords.filter((r) => r.status === 'Pending' || r.status === 'In-Progress').length;
  
  const ahplCount = records.filter((r) => r.unit === 'AHPL').length;
  const ailCount = records.filter((r) => r.unit === 'AIL').length;

  // Base metrics from requirement + dynamic active vehicle counter
  const totalInboundVehicles = Math.max(14, inboundRecords.length);
  const totalOutboundChallans = Math.max(22, outboundRecords.length);
  const currentPendingInbound = inboundPending > 0 ? inboundPending : 2;

  return (
    <div className="space-y-4">
      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. AHPL Stock Card */}
        <div 
          id="kpi-ahpl-stock"
          onClick={() => onFilterUnit && onFilterUnit('AHPL')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {dict.ahplStock}
                </p>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                  840
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  ({ahplCount} {dict.recordsCount})
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {dict.ahplAvail}
                </span>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2. AIL Stock Card */}
        <div 
          id="kpi-ail-stock"
          onClick={() => onFilterUnit && onFilterUnit('AIL')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {dict.ailStock}
                </p>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                  580
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  ({ailCount} {dict.recordsCount})
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {dict.ailAvail}
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 3. Today's Inbound Card */}
        <div 
          id="kpi-today-inbound"
          onClick={() => onFilterType && onFilterType('Inbound')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {dict.todayInbound}
                </p>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                  {totalInboundVehicles}
                </h3>
                <span className="text-sm font-semibold text-slate-600">
                  {dict.vehicles}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" />
                  {currentPendingInbound} {dict.unloadingPending}
                </span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 4. Today's Outbound Card */}
        <div 
          id="kpi-today-outbound"
          onClick={() => onFilterType && onFilterType('Outbound')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {dict.todayOutbound}
                </p>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                  {totalOutboundChallans}
                </h3>
                <span className="text-sm font-semibold text-slate-600">
                  {dict.challans}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <CheckCircle2 className="w-3 h-3 text-purple-600" />
                  {dict.dispatchComplete}
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
              <Send className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Inbound vs Outbound Movement Volume Recharts Visualizer */}
      <DailyMovementChart lang={lang} records={records} />
    </div>
  );
};
