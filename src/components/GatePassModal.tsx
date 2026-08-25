import React from 'react';
import { X, Printer, CheckCircle, Shield, Building2, Truck, FileCheck } from 'lucide-react';
import { MovementRecord, Language } from '../types';

interface GatePassModalProps {
  record: MovementRecord | null;
  lang: Language;
  onClose: () => void;
}

export const GatePassModal: React.FC<GatePassModalProps> = ({ record, lang, onClose }) => {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">
              {lang === 'hi' ? 'वेयरहाउस गेट पास / चालान' : 'Warehouse Gate Pass / Challan'}
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

        {/* Printable Pass Area */}
        <div id="printable-gate-pass" className="p-6 space-y-5 bg-white text-slate-800">
          {/* Company Branding */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 font-bold text-xs mb-1">
              <Building2 className="w-3.5 h-3.5" />
              {record.unit} OPERATIONS HUB
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-wide">
              AHPL & AIL LOGISTICS DIVISION
            </h2>
            <p className="text-xs text-slate-500">
              Authorized Warehouse Inward / Outward Movement Slip
            </p>
          </div>

          {/* Key Slip Information */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Challan / Slip No:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {record.challanNo || `CH-${record.id}`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Date & Time:</span>
              <span className="font-semibold text-slate-800">
                {record.date} • {record.timestamp}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Movement Type:</span>
              <span className={`inline-block font-bold mt-0.5 px-2 py-0.5 rounded text-[11px] ${
                record.type === 'Inbound' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {record.type.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Dock / Gate:</span>
              <span className="font-semibold text-slate-800">
                {record.dockGate || 'Main Gate-01'}
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Field</th>
                  <th className="p-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 text-slate-500 font-medium">Vehicle Number</td>
                  <td className="p-2.5 font-mono font-bold text-slate-800">{record.vehicleNo}</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-500 font-medium">Material / SKU</td>
                  <td className="p-2.5 font-medium text-slate-800">{record.skuDesc}</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-500 font-medium">Total Quantity</td>
                  <td className="p-2.5 font-mono font-bold text-indigo-700">
                    {record.qty} {record.unitMeasure}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-500 font-medium">Driver / Carrier</td>
                  <td className="p-2.5 text-slate-800">{record.driverName || 'Authorized Driver'}</td>
                </tr>
                {record.remarks && (
                  <tr>
                    <td className="p-2.5 text-slate-500 font-medium">Remarks</td>
                    <td className="p-2.5 text-slate-600 italic">{record.remarks}</td>
                  </tr>
                )}
                <tr>
                  <td className="p-2.5 text-slate-500 font-medium">Operational Status</td>
                  <td className="p-2.5">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {record.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Barcode & Signature stamps */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-[11px] text-slate-500">
            <div>
              <div className="font-mono text-xs tracking-widest bg-slate-100 px-2 py-1 rounded inline-block font-bold">
                |||| ||| ||||| || |||||| |
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">SECURITY VERIFIED</div>
            </div>
            <div className="text-right">
              <div className="h-6"></div>
              <div className="border-t border-slate-300 pt-1 font-medium text-slate-700">
                Authorized Officer Sign
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'प्रिंट करें / PDF' : 'Print / Save PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
