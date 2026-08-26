import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { MovementRecord, CompanyUnit, MovementType, MovementStatus, Language } from '../types';
import { t } from '../utils/translations';

interface EditRecordModalProps {
  record: MovementRecord | null;
  lang: Language;
  onClose: () => void;
  onSave: (updatedRecord: MovementRecord) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  record,
  lang,
  onClose,
  onSave,
}) => {
  if (!record) return null;

  const dict = t[lang];

  const [unit, setUnit] = useState<CompanyUnit>(record.unit);
  const [type, setType] = useState<MovementType>(record.type);
  const [vehicleNo, setVehicleNo] = useState<string>(record.vehicleNo);
  const [skuDesc, setSkuDesc] = useState<string>(record.skuDesc);
  const [qty, setQty] = useState<number>(record.qty);
  const [unitMeasure, setUnitMeasure] = useState<string>(record.unitMeasure);
  const [status, setStatus] = useState<MovementStatus>(record.status);
  const [driverName, setDriverName] = useState<string>(record.driverName || '');
  const [dockGate, setDockGate] = useState<string>(record.dockGate || '');
  const [remarks, setRemarks] = useState<string>(record.remarks || '');

  useEffect(() => {
    if (record) {
      setUnit(record.unit);
      setType(record.type);
      setVehicleNo(record.vehicleNo);
      setSkuDesc(record.skuDesc);
      setQty(record.qty);
      setUnitMeasure(record.unitMeasure);
      setStatus(record.status);
      setDriverName(record.driverName || '');
      setDockGate(record.dockGate || '');
      setRemarks(record.remarks || '');
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...record,
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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">
              {lang === 'hi' ? 'मूवमेंट रिकॉर्ड संशोधित करें' : 'Edit Movement Record'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {dict.companyUnitLabel}
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as CompanyUnit)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
            >
              <option value="AHPL">AHPL</option>
              <option value="AIL">AIL</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {dict.movementTypeLabel}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MovementType)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
              >
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {dict.statusLabel}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MovementStatus)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
              >
                <option value="Completed">{dict.completed}</option>
                <option value="In-Progress">{dict.inProgress}</option>
                <option value="Pending">{dict.pending}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {dict.vehicleNoLabel}
            </label>
            <input
              type="text"
              required
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm uppercase font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {dict.skuDescLabel}
            </label>
            <input
              type="text"
              required
              value={skuDesc}
              onChange={(e) => setSkuDesc(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {dict.qtyLabel}
              </label>
              <input
                type="number"
                required
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {dict.measureLabel}
              </label>
              <select
                value={unitMeasure}
                onChange={(e) => setUnitMeasure(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {dict.driverNameLabel}
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {dict.dockGateLabel}
              </label>
              <input
                type="text"
                value={dockGate}
                onChange={(e) => setDockGate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition"
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
