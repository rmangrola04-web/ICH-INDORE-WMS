import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Clock, DoorOpen, RotateCcw, Upload, FileCheck, X } from 'lucide-react';
import {
  CompanyUnit,
  DockOperation,
  DockStatus,
  DockRecord,
  Language,
  VehicleType,
  TransporterName,
  PodStatus,
  SUPERVISOR_ROSTER,
  AttachedDocument,
} from '../types';
import { t } from '../utils/translations';

interface DockEntryFormProps {
  lang: Language;
  onAddDockRecord: (record: Omit<DockRecord, 'id' | 'date'>) => void;
}

const AHPL_DOCKS = ['Dock 1', 'Dock 2', 'Dock 3', 'Dock 4'];
const AIL_DOCKS = ['Dock 5', 'Dock 6', 'Dock 7', 'Dock 8', 'Dock 9'];

const VEHICLE_TYPES = [
  '32 Ft Single Axle (SXL)',
  '32 Ft Multi Axle (MXL)',
  '32 Ft 15 MT',
  '32 Ft 18 MT',
  '24 Ft 9 MT',
  'PTL',
  'Local',
];

const TRANSPORTERS = [
  'ICRL',
  'MATA',
  'OPM',
  'DHTC',
  'MCM',
  'FLY GREEN',
  'VARUNA',
  'JEET',
  'OTHER',
];

export const DockEntryForm: React.FC<DockEntryFormProps> = ({ lang, onAddDockRecord }) => {
  const dict = t[lang];

  // Helper for default current time in HH:MM
  const getCurrentTimeHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const [unit, setUnit] = useState<CompanyUnit>('AHPL');
  const [gateNo, setGateNo] = useState<string>('Dock 1');
  const [operation, setOperation] = useState<DockOperation>('Loading');
  const [vehicleType, setVehicleType] = useState<VehicleType>('32 Ft Single Axle (SXL)');
  const [transporterName, setTransporterName] = useState<TransporterName>('ICRL');
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [sealNo, setSealNo] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [lrNo, setLrNo] = useState<string>('');
  const [podStatus, setPodStatus] = useState<PodStatus>('POD Clean');
  const [attachedDoc, setAttachedDoc] = useState<AttachedDocument | undefined>(undefined);
  const [supervisorName, setSupervisorName] = useState<string>(SUPERVISOR_ROSTER[0]);
  const [startTime, setStartTime] = useState<string>(getCurrentTimeHHMM());
  const [exitTime, setExitTime] = useState<string>('');
  const [status, setStatus] = useState<DockStatus>('In-Progress');
  const [remarks, setRemarks] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize default dock when unit changes
  const availableDocks = unit === 'AHPL' ? AHPL_DOCKS : unit === 'AIL' ? AIL_DOCKS : [...AHPL_DOCKS, ...AIL_DOCKS];

  useEffect(() => {
    if (!availableDocks.includes(gateNo)) {
      setGateNo(availableDocks[0]);
    }
  }, [unit]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedDoc({
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim() || !supervisorName.trim() || !startTime) return;

    onAddDockRecord({
      unit,
      gateNo,
      operation,
      vehicleType,
      transporterName,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      sealNo: sealNo.trim() ? sealNo.trim().toUpperCase() : undefined,
      invoiceNo: invoiceNo.trim() ? invoiceNo.trim().toUpperCase() : undefined,
      lrNo: lrNo.trim() ? lrNo.trim().toUpperCase() : undefined,
      podStatus,
      attachedDoc,
      supervisorName: supervisorName.trim(),
      startTime,
      exitTime: exitTime.trim() || undefined,
      status,
      remarks: remarks.trim() || undefined,
    });

    // Reset & flash success
    setVehicleNo('');
    setSealNo('');
    setInvoiceNo('');
    setLrNo('');
    setPodStatus('POD Clean');
    setAttachedDoc(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSupervisorName(SUPERVISOR_ROSTER[0]);
    setExitTime('');
    setRemarks('');
    setStartTime(getCurrentTimeHHMM());
    setStatus('In-Progress');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleReset = () => {
    setUnit('AHPL');
    setGateNo('Dock 1');
    setOperation('Loading');
    setVehicleType('32 Ft Single Axle (SXL)');
    setTransporterName('ICRL');
    setVehicleNo('');
    setSealNo('');
    setInvoiceNo('');
    setLrNo('');
    setPodStatus('POD Clean');
    setAttachedDoc(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSupervisorName(SUPERVISOR_ROSTER[0]);
    setStartTime(getCurrentTimeHHMM());
    setExitTime('');
    setStatus('In-Progress');
    setRemarks('');
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <span>{lang === 'hi' ? 'वाहन डिस्पैच एवं POD एंट्री' : 'New Vehicle & POD Entry'}</span>
          </h2>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-100">
            Dock TAT & POD
          </span>
        </div>

        {isSuccess && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{lang === 'hi' ? 'डॉक एवं POD एंट्री सफलतापूर्वक सेव की गई!' : 'Vehicle Dispatch & POD entry successfully saved!'}</span>
          </div>
        )}

        <form id="dockForm" onSubmit={handleSubmit} className="space-y-3.5">
          {/* Company / Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Company / Operating Unit
            </label>
            <select
              id="companyUnit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as CompanyUnit)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium shadow-2xs text-slate-800"
            >
              <option value="AHPL">AHPL (Docks 1 to 4)</option>
              <option value="AIL">AIL (Docks 5 to 9)</option>
              <option value="AHPL & AIL">
                AHPL & AIL {lang === 'hi' ? '(संयुक्त)' : '(Joint Operations)'}
              </option>
            </select>
          </div>

          {/* Assigned Dock & Operation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Assigned Dock
              </label>
              <select
                id="dockNo"
                value={gateNo}
                onChange={(e) => setGateNo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium shadow-2xs"
              >
                {availableDocks.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Operation
              </label>
              <select
                id="opType"
                value={operation}
                onChange={(e) => setOperation(e.target.value as DockOperation)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium shadow-2xs"
              >
                <option value="Loading">{dict.loading}</option>
                <option value="Unloading">{dict.unloading}</option>
              </select>
            </div>
          </div>

          {/* Vehicle Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Vehicle Type
            </label>
            <div className="relative">
              <select
                id="vehicleType"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium shadow-2xs text-slate-800"
              >
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transporter Name & Supervisor Name (2 Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Transporter
              </label>
              <select
                id="transporterName"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium shadow-2xs text-slate-800"
              >
                {TRANSPORTERS.map((trans) => (
                  <option key={trans} value={trans}>
                    {trans}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Supervisor
              </label>
              <select
                id="supervisorName"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium shadow-2xs text-slate-800"
              >
                {SUPERVISOR_ROSTER.map((sName) => (
                  <option key={sName} value={sName}>
                    {sName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Number & Seal No (2 Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Vehicle Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="vehicleNo"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                placeholder="MP-09-AB-1234"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Vehicle Seal No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="sealNo"
                value={sealNo}
                onChange={(e) => setSealNo(e.target.value.toUpperCase())}
                placeholder="SL-987654"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Documentation Numbers (Invoice & LR) */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Invoice Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="invoiceNo"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                placeholder="INV-2026-001"
                required
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                LR Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="lrNo"
                value={lrNo}
                onChange={(e) => setLrNo(e.target.value.toUpperCase())}
                placeholder="LR-554433"
                required
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {/* POD Status Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              POD Status / Incidence Category
            </label>
            <select
              id="podStatus"
              value={podStatus}
              onChange={(e) => setPodStatus(e.target.value as PodStatus)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-semibold shadow-2xs text-slate-800"
            >
              <option value="POD Clean" className="text-emerald-600 font-semibold">
                ✔ POD Clean (No Incidence)
              </option>
              <option value="POD Hold - Damage" className="text-rose-600 font-semibold">
                ⚠ POD Hold - Material Damage
              </option>
              <option value="POD Hold - Insurance Claim" className="text-amber-600 font-semibold">
                ⚠ POD Hold - Insurance Claim
              </option>
              <option value="POD Hold - Goods Not Unloaded / Shortage" className="text-orange-600 font-semibold">
                ⚠ POD Hold - Goods Not Unloaded / Shortage
              </option>
              <option value="POD Hold - Goods Not Received" className="text-red-700 font-semibold">
                ⚠ POD Hold - Goods Not Received (माल नहीं आया)
              </option>
            </select>
          </div>

          {/* File Upload Option */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Upload Document / Proof
            </label>
            {attachedDoc ? (
              <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="truncate font-medium">{attachedDoc.name}</span>
                  {attachedDoc.size && (
                    <span className="text-[10px] text-slate-500">({Math.round(attachedDoc.size / 1024)} KB)</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedDoc(undefined);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="docUpload"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg bg-white p-1 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Start Time & Exit Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-600">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setStartTime(getCurrentTimeHHMM())}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <Clock className="w-3 h-3" />
                  <span>Now</span>
                </button>
              </div>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono shadow-2xs"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-600">
                  Exit Time
                </label>
                <button
                  type="button"
                  onClick={() => setExitTime(getCurrentTimeHHMM())}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <Clock className="w-3 h-3" />
                  <span>Now</span>
                </button>
              </div>
              <input
                type="time"
                id="exitTime"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono shadow-2xs"
              />
            </div>
          </div>

          {/* Dock Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Dock Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as DockStatus)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-semibold shadow-2xs"
            >
              <option value="In-Progress">In-Progress (In Dock)</option>
              <option value="Completed">Completed (Exited)</option>
              <option value="Gate-In Waiting">Waiting for Dock</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {dict.remarksLabel}
            </label>
            <input
              type="text"
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Bay pallet stacking / Seal check done / POD verification"
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition shadow-sm hover:shadow active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <DoorOpen className="w-4 h-4" />
              <span>Save Entry</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              title={dict.clearBtn}
              className="p-2.5 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg transition text-xs font-medium cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
