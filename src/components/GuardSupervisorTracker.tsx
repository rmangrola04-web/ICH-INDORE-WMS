import React, { useState } from 'react';
import { Shield, Truck, Clock, CheckCircle2, Play, AlertCircle, ArrowRight, UserCheck, RefreshCw, KeyRound, ExternalLink, Settings, Save, Send } from 'lucide-react';
import { DockRecord, CompanyUnit, SupervisorName, SUPERVISOR_ROSTER, Language } from '../types';

interface GuardSupervisorTrackerProps {
  records: DockRecord[];
  lang: Language;
  onAddGuardEntry: (entry: {
    vehicleNo: string;
    driverName: string;
    transporterName: string;
    unit: CompanyUnit;
    gateNo?: string;
  }) => void;
  onStartActivity: (id: string, activityType: 'Loading' | 'Unloading', supervisorName: string, gateNo: string) => void;
  onCloseActivity: (id: string) => void;
}

export const GuardSupervisorTracker: React.FC<GuardSupervisorTrackerProps> = ({
  records,
  lang,
  onAddGuardEntry,
  onStartActivity,
  onCloseActivity,
}) => {
  const [subTab, setSubTab] = useState<'guard' | 'supervisor'>('guard');
  
  // Guard Form State
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [transporter, setTransporter] = useState('ICRL');
  const [unit, setUnit] = useState<CompanyUnit>('AHPL');
  const [guardSuccessMsg, setGuardSuccessMsg] = useState<string | null>(null);

  // Supervisor Action Modal / State
  const [selectedTokenToStart, setSelectedTokenToStart] = useState<DockRecord | null>(null);
  const [chosenActivity, setChosenActivity] = useState<'Loading' | 'Unloading'>('Loading');
  const [chosenSupervisor, setChosenSupervisor] = useState<string>(SUPERVISOR_ROSTER[0]);
  const [chosenGate, setChosenGate] = useState<string>('Dock 1');

  // Apps Script Webhook integration settings
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem('ahpl_apps_script_url') || '';
  });
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  const handleSaveWebhook = () => {
    localStorage.setItem('ahpl_apps_script_url', appsScriptUrl.trim());
    setWebhookStatus('Webhook URL saved!');
    setTimeout(() => setWebhookStatus(null), 3000);
  };

  const handleGuardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim() || !driverName.trim()) return;

    const vNo = vehicleNo.trim().toUpperCase();
    const dName = driverName.trim();
    const tName = transporter.trim();

    onAddGuardEntry({
      vehicleNo: vNo,
      driverName: dName,
      transporterName: tName,
      unit,
    });

    // If Apps Script URL is configured, send async POST
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
            transporter: tName,
            unit,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => console.warn('Apps script sync notice:', err));
      } catch (err) {
        console.warn('Apps script sync error:', err);
      }
    }

    setGuardSuccessMsg(`Token Generated & In-Time Recorded for ${vNo}`);
    setVehicleNo('');
    setDriverName('');
    setTimeout(() => setGuardSuccessMsg(null), 4000);
  };

  const handleOpenStartModal = (record: DockRecord, type: 'Loading' | 'Unloading') => {
    setSelectedTokenToStart(record);
    setChosenActivity(type);
    setChosenGate(record.unit === 'AIL' ? 'Dock 5' : 'Dock 1');
  };

  const handleConfirmStart = async () => {
    if (!selectedTokenToStart) return;

    onStartActivity(selectedTokenToStart.id, chosenActivity, chosenSupervisor, chosenGate);

    // Apps Script Sync
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
            startTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
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

    // Apps Script Sync
    if (appsScriptUrl.trim()) {
      try {
        fetch(appsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CLOSE_ACTIVITY',
            tokenId: tokenId,
            closeTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          }),
        }).catch((err) => console.warn(err));
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const waitingVehicles = records.filter((r) => r.status === 'Gate-In Waiting');
  const inProgressVehicles = records.filter((r) => r.status === 'In-Progress');
  const completedVehicles = records.filter((r) => r.status === 'Completed');

  return (
    <div className="space-y-6">
      {/* Top Banner with Sub-Tab Selector & Apps Script Setting */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {lang === 'hi' ? '🚛 वाहन मूवमेंट ट्रैकर (गेट गार्ड व सुपरवाइजर)' : '🚛 Vehicle Movement Tracker (Gate & Supervisor)'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'सिक्योरिटी गेट एंट्री टोकन, सुपरवाइजर लोडिंग/अनलोडिंग एक्टिविटी टाइमर एवं गूगल शीट सिंक'
                  : 'Security Gate Token Entry, Supervisor Loading/Unloading Workflow & Google Sheet Apps Script integration'}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs buttons */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSubTab('guard')}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                subTab === 'guard'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{lang === 'hi' ? '1. सिक्योरिटी गार्ड गेट एंट्री' : '1. Security Guard Entry'}</span>
              {waitingVehicles.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${subTab === 'guard' ? 'bg-indigo-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {waitingVehicles.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubTab('supervisor')}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                subTab === 'supervisor'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{lang === 'hi' ? '2. सुपरवाइजर डैशबोर्ड' : '2. Supervisor Dashboard'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${subTab === 'supervisor' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {inProgressVehicles.length} Live
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowWebhookSettings(!showWebhookSettings)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
            title="Google Apps Script Webhook Settings"
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
              Google Apps Script Web App URL (वैकल्पिक / Optional)
            </span>
            <span className="text-[11px] text-slate-500">Auto-sync entries & status directly to your Google Sheet</span>
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
              Save
            </button>
          </div>
          {webhookStatus && (
            <p className="text-emerald-700 font-semibold">{webhookStatus}</p>
          )}
        </div>
      )}

      {/* SUB-TAB 1: SECURITY GUARD ENTRY */}
      {subTab === 'guard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Guard Entry Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'hi' ? 'गेट एंट्री (सिक्योरिटी गार्ड)' : 'Gate Entry (Security Guard)'}</span>
              </h3>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                In-Time Tracker
              </span>
            </div>

            {guardSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{guardSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleGuardSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'गाड़ी नंबर (Vehicle No):' : 'Vehicle Number:'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="MP-09-AB-1234"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm uppercase font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'hi' ? 'ड्राइवर का नाम (Driver Name):' : 'Driver Name:'} <span className="text-rose-500">*</span>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'hi' ? 'ट्रांसपोर्टर (Transporter):' : 'Transporter:'}
                  </label>
                  <select
                    value={transporter}
                    onChange={(e) => setTransporter(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ICRL">ICRL</option>
                    <option value="MATA">MATA</option>
                    <option value="OPM">OPM</option>
                    <option value="DHTC">DHTC</option>
                    <option value="MCM">MCM</option>
                    <option value="FLY GREEN">FLY GREEN</option>
                    <option value="VARUNA">VARUNA</option>
                    <option value="JEET">JEET</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'hi' ? 'यूनिट (Unit):' : 'Unit:'}
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as CompanyUnit)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="AHPL">AHPL (Docks 1-4)</option>
                    <option value="AIL">AIL (Docks 5-9)</option>
                    <option value="AHPL & AIL">Joint AHPL & AIL</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'hi' ? 'गेट एंट्री सबमिट करें (In Time Record)' : 'Submit Gate Entry (Record In-Time)'}</span>
              </button>
            </form>
          </div>

          {/* Real-time Gate Token Queue */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>{lang === 'hi' ? 'गेट-इन वेटिंग कतार (Waiting for Supervisor)' : 'Gate-In Waiting Queue'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'hi'
                    ? 'सिक्योरिटी द्वारा दर्ज की गई गाड़ियां जो बे / डॉक असाइनमेंट की प्रतीक्षा कर रही हैं'
                    : 'Vehicles checked in at gate, waiting for supervisor to assign loading/unloading bay'}
                </p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-lg border border-amber-200">
                {waitingVehicles.length} Waiting
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Token ID</th>
                    <th className="py-2.5 px-3">Vehicle No</th>
                    <th className="py-2.5 px-3">Driver / Transporter</th>
                    <th className="py-2.5 px-3">Gate In Time</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        {lang === 'hi' ? 'वर्तमान में कोई गाड़ी गेट वेटिंग में नहीं है।' : 'No vehicles currently waiting at gate.'}
                      </td>
                    </tr>
                  ) : (
                    waitingVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {v.tokenId || v.id}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-slate-900">{v.vehicleNo}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          <div className="font-medium">{v.driverName || 'Driver'}</div>
                          <div className="text-[10px] text-slate-500 font-semibold">{v.transporterName || 'ICRL'}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                          {v.startTime}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.unit === 'AHPL' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                            {v.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Waiting for Supervisor
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSubTab('supervisor');
                              handleOpenStartModal(v, 'Loading');
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span>Assign Bay</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SUPERVISOR DASHBOARD */}
      {subTab === 'supervisor' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'hi' ? 'लाइव व्हीकल कतार एवं सुपरवाइजर कंट्रोल' : 'Live Vehicle Queue (Supervisor Panel)'}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi'
                  ? 'सुपरवाइजर द्वारा स्टार्ट टाइम दर्ज करें, लोडिंग/अनलोडिंग ऑपरेशन चलाएं एवं क्लोज डिस्पैच करें'
                  : 'Start loading/unloading activities, record start time, monitor turnaround and complete/close dispatch'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-mono font-medium">
                {records.length} Total Vehicles Tracked
              </span>
            </div>
          </div>

          {/* Supervisor Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900 text-white text-[11px] uppercase">
                <tr>
                  <th className="py-3 px-3">Token</th>
                  <th className="py-3 px-3">Vehicle No</th>
                  <th className="py-3 px-3">Gate In</th>
                  <th className="py-3 px-3">Activity / Dock</th>
                  <th className="py-3 px-3">Supervisor</th>
                  <th className="py-3 px-3">Start Time</th>
                  <th className="py-3 px-3">Close Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100" id="vehicleTableBody">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No vehicles found. Submit an entry via Gate Guard.
                    </td>
                  </tr>
                ) : (
                  records.map((v) => {
                    const isWaiting = v.status === 'Gate-In Waiting';
                    const isInProgress = v.status === 'In-Progress';
                    const isDone = v.status === 'Completed';

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                          {v.tokenId || v.id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-slate-900">{v.vehicleNo}</div>
                          <div className="text-[10px] text-slate-500">{v.driverName || 'Driver'} • {v.transporterName || 'ICRL'}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                          {v.startTime}
                        </td>
                        <td className="py-3 px-3">
                          {isWaiting ? (
                            <span className="text-slate-400 font-medium">-</span>
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {v.operation} <span className="text-indigo-600 font-normal">({v.gateNo})</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {isWaiting ? '-' : v.supervisorName}
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenStartModal(v, 'Loading')}
                                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[11px] font-semibold cursor-pointer shadow-xs"
                              >
                                Start Loading
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenStartModal(v, 'Unloading')}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold cursor-pointer shadow-xs"
                              >
                                Start Unloading
                              </button>
                            </div>
                          )}

                          {isInProgress && (
                            <button
                              type="button"
                              onClick={() => handleCloseActivityClick(v)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold cursor-pointer shadow-xs"
                            >
                              Complete & Close
                            </button>
                          )}

                          {isDone && (
                            <span className="text-emerald-600 font-semibold text-xs flex items-center justify-end gap-1">
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
                <label className="block font-semibold text-slate-700 mb-1">Assigned Dock / Bay:</label>
                <select
                  value={chosenGate}
                  onChange={(e) => setChosenGate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <optgroup label="AHPL (Docks 1-4)">
                    <option value="Dock 1">Dock 1 (AHPL)</option>
                    <option value="Dock 2">Dock 2 (AHPL)</option>
                    <option value="Dock 3">Dock 3 (AHPL)</option>
                    <option value="Dock 4">Dock 4 (AHPL)</option>
                  </optgroup>
                  <optgroup label="AIL (Docks 5-9)">
                    <option value="Dock 5">Dock 5 (AIL)</option>
                    <option value="Dock 6">Dock 6 (AIL)</option>
                    <option value="Dock 7">Dock 7 (AIL)</option>
                    <option value="Dock 8">Dock 8 (AIL)</option>
                    <option value="Dock 9">Dock 9 (AIL)</option>
                  </optgroup>
                </select>
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
