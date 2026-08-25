import React, { useState } from 'react';
import { X, Save, Clock, User, Truck, DoorOpen, ShieldCheck, FileText, Lock } from 'lucide-react';
import {
  DockRecord,
  CompanyUnit,
  DockOperation,
  DockStatus,
  VehicleType,
  TransporterName,
  PodStatus,
  Language,
  SUPERVISOR_ROSTER,
} from '../types';
import { t } from '../utils/translations';

interface EditDockModalProps {
  record: DockRecord;
  lang: Language;
  onClose: () => void;
  onSave: (updated: DockRecord) => void;
}

export const EditDockModal: React.FC<EditDockModalProps> = ({
  record,
  lang,
  onClose,
  onSave,
}) => {
  const dict = t[lang];

  const [unit, setUnit] = useState<CompanyUnit>(record.unit);
  const [gateNo, setGateNo] = useState<string>(record.gateNo);
  const [operation, setOperation] = useState<DockOperation>(record.operation);
  const [vehicleNo, setVehicleNo] = useState<string>(record.vehicleNo);
  const [sealNo, setSealNo] = useState<string>(record.sealNo || '');
  const [location, setLocation] = useState<string>(record.location || record.cfaLocation || '');
  const [invoiceNo, setInvoiceNo] = useState<string>(record.invoiceNo || '');
  const [lrNo, setLrNo] = useState<string>(record.lrNo || '');
  const [podStatus, setPodStatus] = useState<PodStatus>(record.podStatus || 'POD Clean');
  const [vehicleType, setVehicleType] = useState<VehicleType>(record.vehicleType || '32 Ft Single Axle (SXL)');
  const [transporterName, setTransporterName] = useState<TransporterName>(record.transporterName || 'ICRL');
  const [supervisorName, setSupervisorName] = useState<string>(record.supervisorName);
  const [startTime, setStartTime] = useState<string>(record.startTime);
  const [exitTime, setExitTime] = useState<string>(record.exitTime || '');
  const [status, setStatus] = useState<DockStatus>(record.status);
  const [remarks, setRemarks] = useState<string>(record.remarks || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...record,
      unit,
      gateNo,
      operation,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      sealNo: sealNo.trim() ? sealNo.trim().toUpperCase() : undefined,
      location: location.trim() || undefined,
      cfaLocation: location.trim() || undefined,
      invoiceNo: invoiceNo.trim() ? invoiceNo.trim().toUpperCase() : undefined,
      lrNo: lrNo.trim() ? lrNo.trim().toUpperCase() : undefined,
      podStatus,
      vehicleType,
      transporterName,
      supervisorName: supervisorName.trim(),
      startTime,
      exitTime: exitTime.trim() || undefined,
      status,
      remarks: remarks.trim() || undefined,
    });
    onClose();
  };

  const handleSetExitNow = () => {
    const now = new Date();
    const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setExitTime(timeNow);
    setStatus('Completed');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <DoorOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {lang === 'hi' ? 'डॉक एवं POD रिकॉर्ड संपादित करें' : 'Edit Dock & POD Record'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">ID: {record.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 overflow-y-auto flex-1">
          {/* Unit & Gate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {dict.companyUnitLabel}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as CompanyUnit)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium shadow-2xs"
              >
                <option value="AHPL">AHPL (Docks 1 to 4)</option>
                <option value="AIL">AIL (Docks 5 to 9)</option>
                <option value="AHPL & AIL">AHPL & AIL (Joint)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {dict.gateDockNo}
              </label>
              <select
                value={gateNo}
                onChange={(e) => setGateNo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium shadow-2xs"
              >
                <optgroup label="AHPL Docks (1–4)">
                  <option value="Dock 1">Dock 1</option>
                  <option value="Dock 2">Dock 2</option>
                  <option value="Dock 3">Dock 3</option>
                  <option value="Dock 4">Dock 4</option>
                </optgroup>
                <optgroup label="AIL Docks (5–9)">
                  <option value="Dock 5">Dock 5</option>
                  <option value="Dock 6">Dock 6</option>
                  <option value="Dock 7">Dock 7</option>
                  <option value="Dock 8">Dock 8</option>
                  <option value="Dock 9">Dock 9</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Operation & Vehicle Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {dict.operationType}
              </label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as DockOperation)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium shadow-2xs"
              >
                <option value="Loading">{dict.loading}</option>
                <option value="Unloading">{dict.unloading}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium shadow-2xs"
              >
                <option value="32 Ft Single Axle (SXL)">32 Ft Single Axle (SXL)</option>
                <option value="32 Ft Multi Axle (MXL)">32 Ft Multi Axle (MXL)</option>
                <option value="32 Ft 15 MT">32 Ft 15 MT</option>
                <option value="32 Ft 18 MT">32 Ft 18 MT</option>
                <option value="24 Ft 9 MT">24 Ft 9 MT</option>
                <option value="PTL">PTL</option>
                <option value="Local">Local</option>
              </select>
            </div>
          </div>

          {/* Transporter & Supervisor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Transporter Name
              </label>
              <select
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value as TransporterName)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium shadow-2xs"
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {dict.assignedSupervisor}
              </label>
              <select
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium shadow-2xs"
              >
                {SUPERVISOR_ROSTER.map((sName) => (
                  <option key={sName} value={sName}>
                    {sName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Number & Seal Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {dict.vehicleNo}
              </label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                required
                className="w-full border border-slate-300 rounded-lg p-2 text-sm uppercase font-mono font-semibold shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Vehicle Seal No.
              </label>
              <input
                type="text"
                value={sealNo}
                onChange={(e) => setSealNo(e.target.value.toUpperCase())}
                placeholder="SL-987654"
                className="w-full border border-slate-300 rounded-lg p-2 text-sm uppercase font-mono font-semibold shadow-2xs"
              />
            </div>
          </div>

          {/* Location / Destination */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Location / Destination (Origin / Destination)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kolkata / Mumbai / Raipur / Balram CFA"
              className="w-full border border-slate-300 rounded-lg p-2 text-sm shadow-2xs"
            />
          </div>

          {/* Invoice & LR Number */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                placeholder="INV-2026-001"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono font-semibold bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                LR Number
              </label>
              <input
                type="text"
                value={lrNo}
                onChange={(e) => setLrNo(e.target.value.toUpperCase())}
                placeholder="LR-554433"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono font-semibold bg-white"
              />
            </div>
          </div>

          {/* POD Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              POD Status (Incidence / Clean)
            </label>
            <select
              value={podStatus}
              onChange={(e) => setPodStatus(e.target.value as PodStatus)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold bg-white shadow-2xs text-slate-800"
            >
              <option value="POD Clean">✔ POD Clean (No Incidence)</option>
              <option value="POD Hold - Damage">⚠ POD Hold - Material Damage</option>
              <option value="POD Hold - Insurance Claim">⚠ POD Hold - Insurance Claim</option>
              <option value="POD Hold - Goods Not Unloaded / Shortage">⚠ POD Hold - Goods Not Unloaded / Shortage</option>
              <option value="POD Hold - Goods Not Received">⚠ POD Hold - Goods Not Received</option>
              <option value="POD Hold - Shortage">⚠ POD Hold - Shortage / Leakage</option>
            </select>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {dict.startTime}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono shadow-2xs"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">
                  {dict.exitTime}
                </label>
                <button
                  type="button"
                  onClick={handleSetExitNow}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                >
                  {lang === 'hi' ? 'अभी का समय भरें' : 'Set Now'}
                </button>
              </div>
              <input
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono shadow-2xs"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {dict.dockStatus}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DockStatus)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold bg-white shadow-2xs"
            >
              <option value="Completed">✓ {dict.completed}</option>
              <option value="In-Progress">⟳ {dict.inProgress}</option>
              <option value="Gate-In Waiting">! {dict.gateInWaiting}</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {dict.remarksLabel}
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Loading finished on time / Seal verified"
              className="w-full border border-slate-300 rounded-lg p-2 text-xs shadow-2xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
            >
              {dict.clearBtn}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{dict.updateRecordBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
