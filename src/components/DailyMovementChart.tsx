import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart3, Activity, ArrowDownRight, ArrowUpRight, Layers } from 'lucide-react';
import { Language, MovementRecord } from '../types';
import { t } from '../utils/translations';

interface DailyMovementChartProps {
  lang: Language;
  records: MovementRecord[];
}

interface DayData {
  dateKey: string;
  displayDate: string;
  shortDay: string;
  inboundCount: number;
  outboundCount: number;
  inboundQty: number;
  outboundQty: number;
}

export const DailyMovementChart: React.FC<DailyMovementChartProps> = ({ lang, records }) => {
  const dict = t[lang];
  const [metricMode, setMetricMode] = useState<'count' | 'qty'>('count');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  // Generate the last 7 days data with dynamic inclusion of records
  const chartData = useMemo<DayData[]>(() => {
    const days: DayData[] = [];
    const baseDate = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);

      // Localized display date
      const monthNamesHi = ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सितं', 'अक्टू', 'नव', 'दिसं'];
      const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNamesHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
      const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const dayNum = d.getDate();
      const monthStr = lang === 'hi' ? monthNamesHi[d.getMonth()] : monthNamesEn[d.getMonth()];
      const dayName = lang === 'hi' ? dayNamesHi[d.getDay()] : dayNamesEn[d.getDay()];

      const displayDate = i === 0 ? (lang === 'hi' ? `आज (${dayNum} ${monthStr})` : `Today (${dayNum} ${monthStr})`) : `${dayNum} ${monthStr}`;

      // Aggregate from active user records on this date
      const dayRecords = records.filter((r) => r.date === dateKey);
      const activeInbound = dayRecords.filter((r) => r.type === 'Inbound');
      const activeOutbound = dayRecords.filter((r) => r.type === 'Outbound');

      const activeInCount = activeInbound.length;
      const activeOutCount = activeOutbound.length;
      const activeInQty = activeInbound.reduce((acc, curr) => acc + (curr.qty || 0), 0);
      const activeOutQty = activeOutbound.reduce((acc, curr) => acc + (curr.qty || 0), 0);

      days.push({
        dateKey,
        displayDate,
        shortDay: dayName,
        inboundCount: activeInCount,
        outboundCount: activeOutCount,
        inboundQty: activeInQty,
        outboundQty: activeOutQty,
      });
    }

    return days;
  }, [lang, records]);

  // Cumulative 7-day stats
  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, item) => ({
        inboundCount: acc.inboundCount + item.inboundCount,
        outboundCount: acc.outboundCount + item.outboundCount,
        inboundQty: acc.inboundQty + item.inboundQty,
        outboundQty: acc.outboundQty + item.outboundQty,
      }),
      { inboundCount: 0, outboundCount: 0, inboundQty: 0, outboundQty: 0 }
    );
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 font-semibold text-slate-200">
            <span>{data.displayDate} ({data.shortDay})</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>{dict.inboundVolume}:</span>
              </div>
              <span className="font-mono font-bold text-white">
                {metricMode === 'count'
                  ? `${data.inboundCount} ${lang === 'hi' ? 'गाड़ियां' : 'Vehicles'}`
                  : `${data.inboundQty.toLocaleString('en-IN')} ${lang === 'hi' ? 'मात्रा' : 'Qty'}`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-purple-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
                <span>{dict.outboundVolume}:</span>
              </div>
              <span className="font-mono font-bold text-white">
                {metricMode === 'count'
                  ? `${data.outboundCount} ${lang === 'hi' ? 'चालान' : 'Challans'}`
                  : `${data.outboundQty.toLocaleString('en-IN')} ${lang === 'hi' ? 'मात्रा' : 'Qty'}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <span>{dict.volumeChartTitle}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {dict.volumeChartSubtitle}
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Metric Selector: Count vs Qty */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMetricMode('count')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                metricMode === 'count'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dict.viewByCount}
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('qty')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                metricMode === 'qty'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dict.viewByQty}
            </button>
          </div>

          {/* Chart Type Selector: Bar vs Area */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Bar Chart"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              title="Area Trend"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Badges for 7-Day Window */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <div>
            <span className="text-slate-500 block text-[11px]">{dict.total7DayInbound}</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {metricMode === 'count' ? `${totals.inboundCount} ${lang === 'hi' ? 'गाड़ियां' : 'Vehicles'}` : `${totals.inboundQty.toLocaleString('en-IN')} Cases`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <div>
            <span className="text-slate-500 block text-[11px]">{dict.total7DayOutbound}</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {metricMode === 'count' ? `${totals.outboundCount} ${lang === 'hi' ? 'चालान' : 'Challans'}` : `${totals.outboundQty.toLocaleString('en-IN')} Cases`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-100/70 text-emerald-700">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">{lang === 'hi' ? 'दैनिक औसत इनबाउंड' : 'Daily Avg Inbound'}</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {metricMode === 'count' ? `${Math.round(totals.inboundCount / 7)} / दिन` : `${Math.round(totals.inboundQty / 7).toLocaleString('en-IN')} / दिन`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-purple-100/70 text-purple-700">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">{lang === 'hi' ? 'दैनिक औसत आउटबाउंड' : 'Daily Avg Outbound'}</span>
            <span className="font-mono font-bold text-purple-700 text-sm">
              {metricMode === 'count' ? `${Math.round(totals.outboundCount / 7)} / दिन` : `${Math.round(totals.outboundQty / 7).toLocaleString('en-IN')} / दिन`}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-64 sm:h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-slate-700 font-medium text-xs">
                    {value === 'inbound' ? dict.inboundVolume : dict.outboundVolume}
                  </span>
                )}
              />
              <Bar
                name="inbound"
                dataKey={metricMode === 'count' ? 'inboundCount' : 'inboundQty'}
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="outbound"
                dataKey={metricMode === 'count' ? 'outboundCount' : 'outboundQty'}
                fill="#8B5CF6"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-slate-700 font-medium text-xs">
                    {value === 'inbound' ? dict.inboundVolume : dict.outboundVolume}
                  </span>
                )}
              />
              <Area
                type="monotone"
                name="inbound"
                dataKey={metricMode === 'count' ? 'inboundCount' : 'inboundQty'}
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#inboundGrad)"
              />
              <Area
                type="monotone"
                name="outbound"
                dataKey={metricMode === 'count' ? 'outboundCount' : 'outboundQty'}
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#outboundGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
