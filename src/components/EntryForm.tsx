import React, { useState } from 'react';
import { PlusCircle, RotateCcw, Check, Sparkles } from 'lucide-react';
import { CompanyUnit, MovementType, MovementStatus, MovementRecord, Language } from '../types';
import { t } from '../utils/translations';

interface EntryFormProps {
  lang: Language;
  onAddRecord: (record: Omit<MovementRecord, 'id' | 'timestamp' | 'date'>) => void;
}

const COMMON_SKU_SUGGESTIONS = [
  'Packing Consignment',
  'Dispatch Batch A-2',
  'Stock Transfer',
  'Finished Fastener Assemblies',
  'Polyethylene Film Rolls',
  'Modular Terminal Brackets',
  'Standard Electrical Conduit Casings',
  'Joint Logistics Raw Material',
  'Hardware Consumables'
];

export const EntryForm: React.FC<EntryFormProps> = ({ lang, onAddRecord }) => {
  const dict = t[lang];

  const [unit, setUnit] = useState<CompanyUnit>('AHPL');
  const [type, setType] = useState<MovementType>('Inbound');
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [skuDesc, setSkuDesc] = useState<string>('');
  const [qty, setQty] = useState<string>('');
  const [unitMeasure, setUnitMeasure] = useState<string>('Cases');
  const [status, setStatus] = useState<MovementStatus>('Completed');
  const [driverName, setDriverName] = useState<string>('');
  const [dockGate, setDockGate] = useState<string>('Gate-01');
  const [remarks, setRemarks] = useState<string>('');
  
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim() || !skuDesc.trim() || !qty) return;

    onAddRecord({
      unit,
      type,
      vehicleNo: vehicleNo.trim().toUpperCase(),
      skuDesc: skuDesc.trim(),
      qty: Number(qty),
      unitMeasure,
      status,
      driverName: driverName.trim() || undefined,
      dockGate: dockGate.trim() || undefined,
      remarks: remarks.trim() || undefined,
      challanNo: `CH-${unit.replace(/\s+/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
    });

    // Reset inputs
    setVehicleNo('');
    setSkuDesc('');
    setQty('');
    setDriverName('');
    setRemarks('');
    
    // Show quick feedback
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2500);
  };

  const handleReset = () => {
    setUnit('AHPL');
    setType('Inbound');
    setVehicleNo('');
    setSkuDesc('');
    setQty('');
    setUnitMeasure('Cases');
    setStatus('Completed');
    setDriverName('');
    setDockGate('Gate-01');
    setRemarks('');
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-600" />
          <span>{dict.newEntryTitle}</span>
        </h2>
        {isSuccess && (
          <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            {lang === 'hi' ? 'सफलतापूर्वक दर्ज!' : 'Saved!'}
          </span>
        )}
      </div>

      <form id="entryForm" onSubmit={handleSubmit} className="space-y-4">
        {/* Company / Unit */}
        <div>
          <label htmlFor="companyUnit" className="block text-xs font-semibold text-slate-700 mb-1">
            {dict.companyUnitLabel}
          </label>
          <div className="relative">
            <select
              id="companyUnit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as CompanyUnit)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white font-medium shadow-2xs"
            >
              <option value="AHPL">AHPL</option>
              <option value="AIL">AIL</option>
              <option value="AHPL & AIL">
                AHPL & AIL {lang === 'hi' ? '(संयुक्त)' : '(Joint)'}
              </option>
            </select>
          </div>
        </div>

        {/* Movement Type */}
        <div>
          <label htmlFor="entryType" className="block text-xs font-semibold text-slate-700 mb-1">
            {dict.movementTypeLabel}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('Inbound')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'Inbound'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${type === 'Inbound' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              {dict.inboundOption}
            </button>
            <button
              type="button"
              onClick={() => setType('Outbound')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'Outbound'
                  ? 'bg-purple-50 text-purple-800 border-purple-500 ring-2 ring-purple-500/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${type === 'Outbound' ? 'bg-purple-500' : 'bg-slate-400'}`}></span>
              {dict.outboundOption}
            </button>
          </div>
        </div>

        {/* Vehicle / Dock No */}
        <div>
          <label htmlFor="vehicleNo" className="block text-xs font-semibold text-slate-700 mb-1">
            {dict.vehicleNoLabel} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="vehicleNo"
            placeholder="e.g. MP-09-AB-1234"
            required
            value={vehicleNo}
            onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none uppercase font-mono tracking-wide placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        {/* Material / SKU Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="skuDesc" className="block text-xs font-semibold text-slate-700">
              {dict.skuDescLabel} <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 cursor-pointer">
              <Sparkles className="w-3 h-3" />
            </span>
          </div>
          <input
            type="text"
            id="skuDesc"
            list="sku-suggestions"
            placeholder="e.g. Finished Stock / Raw Material"
            required
            value={skuDesc}
            onChange={(e) => setSkuDesc(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder:text-slate-400 shadow-2xs"
          />
          <datalist id="sku-suggestions">
            {COMMON_SKU_SUGGESTIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        {/* Quantity & Unit of Measure */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="qty" className="block text-xs font-semibold text-slate-700 mb-1">
              {dict.qtyLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="qty"
              min="1"
              step="1"
              placeholder="e.g. 150"
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none font-mono placeholder:font-sans placeholder:text-slate-400 shadow-2xs"
            />
          </div>
          <div>
            <label htmlFor="unitMeasure" className="block text-xs font-semibold text-slate-700 mb-1">
              {dict.measureLabel}
            </label>
            <select
              id="unitMeasure"
              value={unitMeasure}
              onChange={(e) => setUnitMeasure(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white shadow-2xs"
            >
              <option value="Cases">Cases</option>
              <option value="Cartons">Cartons</option>
              <option value="Boxes">Boxes</option>
              <option value="Units">Units</option>
              <option value="Pallets">Pallets</option>
              <option value="Rolls">Rolls</option>
              <option value="Kg">Kg</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-xs font-semibold text-slate-700 mb-1">
            {dict.statusLabel}
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as MovementStatus)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none bg-white font-medium shadow-2xs"
          >
            <option value="Completed">{dict.completed}</option>
            <option value="In-Progress">{dict.inProgress}</option>
            <option value="Pending">{dict.pending}</option>
          </select>
        </div>

        {/* Additional Optional Fields (Driver & Dock) */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <div>
            <label htmlFor="driverName" className="block text-[11px] font-semibold text-slate-600 mb-1">
              {dict.driverNameLabel}
            </label>
            <input
              type="text"
              id="driverName"
              placeholder="e.g. Ramesh Singh"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="dockGate" className="block text-[11px] font-semibold text-slate-600 mb-1">
              {dict.dockGateLabel}
            </label>
            <input
              type="text"
              id="dockGate"
              placeholder="e.g. Gate-02 / Bay-3"
              value={dockGate}
              onChange={(e) => setDockGate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="submit"
            id="submitRecordBtn"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{dict.addRecordBtn}</span>
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            title={dict.clearBtn}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
