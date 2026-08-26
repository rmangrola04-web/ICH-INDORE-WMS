import React, { useState, useRef } from 'react';
import { PlusCircle, Clock, RotateCcw, Check, FileCheck, X } from 'lucide-react';
import {
  CompanyUnit,
  DockOperation,
  DockStatus,
  DockRecord,
  Language,
  VehicleType,
  TransporterName,
  PodStatus,
  AttachedDocument,
  SUPERVISOR_ROSTER,
} from '../types';

interface DockEntryFormProps {
  lang: Language;
  onAddDockRecord: (record: Omit<DockRecord, 'id' | 'date'>) => void;
}

const ALL_DOCKS = [
  'Dock 1',
  'Dock 2',
  'Dock 3',
  'Dock 4',
  'Dock 5',
  'Dock 6',
  'Dock 7',
  'Dock 8',
  'Dock 9',
];

const VEHICLE_TYPES = [
  '32 Ft Single Axle (SXL)',
  '32 Ft Multi Axle (MXL)',
  '20 Ft Container',
  '24 Ft Container',
  '14 Ft / 17 Ft Open',
];

const TRANSPORTERS = [
  'ICRL',
  'MATA',
  'DHTC',
  'OPM',
  'VARUNA',
  'FLY GREEN',
  'JEET',
  'MCM',
];

const SUPERVISORS = SUPERVISOR_ROSTER;

const POD_STATUS_OPTIONS = [
  { value: 'POD Clean (No Incidence)', label: '✔ POD Clean (No Incidence)' },
  { value: 'Shortage Reported', label: 'Shortage Reported' },
  { value: 'Damage Reported', label: 'Damage Reported' },
  { value: 'Seal Broken', label: 'Seal Broken / Discrepancy' },
];

export const DockEntryForm: React.FC<DockEntryFormProps> = ({ lang, onAddDockRecord }) => {
  // Helper for formatted 12-hour or HH:MM current time
  const getFormattedCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const [companyUnit, setCompanyUnit] = useState<CompanyUnit>('AHPL');
  const [assignedDock, setAssignedDock] = useState<string>('Dock 1');
  const [operation, setOperation] = useState<DockOperation>('Loading');
  const [vehicleType, setVehicleType] = useState<VehicleType>('32 Ft Single Axle (SXL)');
  const [transporter, setTransporter] = useState<TransporterName>('ICRL');
  const [supervisor, setSupervisor] = useState<string>('Suman Singh');
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [sealNo, setSealNo] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [podStatus, setPodStatus] = useState<PodStatus>('POD Clean (No Incidence)');
  const [attachedDoc, setAttachedDoc] = useState<AttachedDocument | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>(getFormattedCurrentTime());
  const [exitTime, setExitTime] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const setCurrentTime = (targetField: 'inpStartTime' | 'inpExitTime') => {
    const timeStr = getFormattedCurrentTime();
    if (targetField === 'inpStartTime') {
      setStartTime(timeStr);
    } else {
      setExitTime(timeStr);
    }
  };

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
    if (!vehicleNo.trim() || !sealNo.trim() || !location.trim() || !startTime.trim()) return;

    const unitMapped: CompanyUnit = companyUnit === 'AIL' ? 'AIL' : 'AHPL';
    const statusMapped: DockStatus = exitTime.trim() ? 'Completed' : 'In-Progress';

    onAddDockRecord({
      unit: unitMapped,
      gateNo: assignedDock,
      operation,
      vehicleType,
      transporterName: transporter,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      sealNo: sealNo.trim().toUpperCase(),
      cfaLocation: location.trim(),
      location: location.trim(),
      podStatus,
      attachedDoc,
      supervisorName: supervisor.trim(),
      startTime,
      exitTime: exitTime.trim() || undefined,
      status: statusMapped,
    });

    // Reset & flash success
    setVehicleNo('');
    setSealNo('');
    setLocation('');
    setPodStatus('POD Clean (No Incidence)');
    setAttachedDoc(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStartTime(getFormattedCurrentTime());
    setExitTime('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleReset = () => {
    setCompanyUnit('AHPL');
    setAssignedDock('Dock 1');
    setOperation('Loading');
    setVehicleType('32 Ft Single Axle (SXL)');
    setTransporter('ICRL');
    setSupervisor('Suman Singh');
    setVehicleNo('');
    setSealNo('');
    setLocation('');
    setPodStatus('POD Clean (No Incidence)');
    setAttachedDoc(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStartTime(getFormattedCurrentTime());
    setExitTime('');
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <span>{lang === 'hi' ? 'वाहन एवं POD स्टेटस एंट्री' : 'Vehicle & POD Movement Entry'}</span>
          </h2>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-100">
            Dock & POD Ops
          </span>
        </div>

        {isSuccess && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'hi' ? 'POD एंट्री सफलतापूर्वक दर्ज की गई!' : 'POD Entry successfully saved & logged!'}</span>
          </div>
        )}

        {/* Form Container */}
        <form id="dockForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Company / Operating Unit */}
          <div className="form-group">
            <label htmlFor="inpCompany" className="block text-xs font-semibold text-slate-700 mb-1">
              Company / Operating Unit
            </label>
            <select
              id="inpCompany"
              value={companyUnit}
              onChange={(e) => setCompanyUnit(e.target.value as CompanyUnit)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800 shadow-2xs"
            >
              <option value="AHPL">AHPL (Docks 1 to 4)</option>
              <option value="AIL">AIL (Docks 5 to 9)</option>
            </select>
          </div>

          {/* Row 2: Assigned Dock, Operation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label htmlFor="inpAssignedDock" className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Dock
              </label>
              <select
                id="inpAssignedDock"
                value={assignedDock}
                onChange={(e) => setAssignedDock(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800 shadow-2xs"
              >
                {ALL_DOCKS.map((dock) => (
                  <option key={dock} value={dock}>
                    {dock}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="inpOperation" className="block text-xs font-semibold text-slate-700 mb-1">
                Operation
              </label>
              <select
                id="inpOperation"
                value={operation}
                onChange={(e) => setOperation(e.target.value as DockOperation)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800 shadow-2xs"
              >
                <option value="Loading">Loading</option>
                <option value="Unloading">Unloading</option>
              </select>
            </div>
          </div>

          {/* Row 3: Vehicle Type */}
          <div className="form-group">
            <label htmlFor="inpVehicleType" className="block text-xs font-semibold text-slate-700 mb-1">
              Vehicle Type
            </label>
            <select
              id="inpVehicleType"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800 shadow-2xs"
            >
              {VEHICLE_TYPES.map((vType) => (
                <option key={vType} value={vType}>
                  {vType}
                </option>
              ))}
            </select>
          </div>

          {/* Row 4: Transporter, Supervisor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label htmlFor="inpTransporter" className="block text-xs font-semibold text-slate-700 mb-1">
                Transporter
              </label>
              <select
                id="inpTransporter"
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800 shadow-2xs"
              >
                {TRANSPORTERS.map((trans) => (
                  <option key={trans} value={trans}>
                    {trans}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="inpSupervisor" className="block text-xs font-semibold text-slate-700 mb-1">
                Supervisor
              </label>
              <select
                id="inpSupervisor"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800 shadow-2xs"
              >
                {SUPERVISORS.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Vehicle Number, Vehicle Seal No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label htmlFor="inpVehicleNo" className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Number*
              </label>
              <input
                type="text"
                id="inpVehicleNo"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                placeholder="e.g. MP-09-AB-1234"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
              />
            </div>
            <div className="form-group">
              <label htmlFor="inpSealNo" className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Seal No.*
              </label>
              <input
                type="text"
                id="inpSealNo"
                value={sealNo}
                onChange={(e) => setSealNo(e.target.value.toUpperCase())}
                placeholder="e.g. SL-987654"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Row 6: Location / Destination (Only Location Field) */}
          <div className="form-group">
            <label htmlFor="inpLocation" className="block text-xs font-semibold text-slate-700 mb-1">
              Location / Destination (Origin / Destination)*
            </label>
            <input
              type="text"
              id="inpLocation"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kolkata / Mumbai / Raipur / Balram CFA"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Row 7: POD Status / Incidence Category */}
          <div className="form-group">
            <label htmlFor="inpPodStatus" className="block text-xs font-semibold text-slate-700 mb-1">
              POD Status / Incidence Category
            </label>
            <select
              id="inpPodStatus"
              value={podStatus}
              onChange={(e) => setPodStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800 shadow-2xs"
            >
              {POD_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Row 8: Upload Document / Proof */}
          <div className="form-group">
            <label htmlFor="inpProofDoc" className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Document / Proof
            </label>
            {attachedDoc ? (
              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate font-medium">{attachedDoc.name}</span>
                  {attachedDoc.size && (
                    <span className="text-[10px] text-slate-500">
                      ({Math.round(attachedDoc.size / 1024)} KB)
                    </span>
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
                  id="inpProofDoc"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ padding: '6px' }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg bg-white cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Row 9: Start Time, Exit Time with Live 'Now' Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="inpStartTime" className="text-xs font-semibold text-slate-700">
                  Start Time*
                </label>
                <button
                  type="button"
                  onClick={() => setCurrentTime('inpStartTime')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                  className="hover:underline flex items-center gap-0.5"
                >
                  <Clock className="w-3 h-3" />
                  <span>🕒 Now</span>
                </button>
              </div>
              <input
                type="text"
                id="inpStartTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="08:21 PM"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono shadow-2xs"
              />
            </div>
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="inpExitTime" className="text-xs font-semibold text-slate-700">
                  Exit Time
                </label>
                <button
                  type="button"
                  onClick={() => setCurrentTime('inpExitTime')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                  className="hover:underline flex items-center gap-0.5"
                >
                  <Clock className="w-3 h-3" />
                  <span>🕒 Now</span>
                </button>
              </div>
              <input
                type="text"
                id="inpExitTime"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                placeholder="-- : -- --"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono shadow-2xs"
              />
            </div>
          </div>

          {/* Form Submit & Reset */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="btn-submit flex-1"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '1rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Save & Submit POD Entry
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset Form"
              className="p-3 border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg transition text-xs font-medium cursor-pointer mt-2.5"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
