import React, { useState } from 'react';
import { X, Boxes, Package, Search, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { StockItem, Language } from '../types';
import { INITIAL_STOCK_ITEMS } from '../data/initialData';

interface StockOverviewModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
}

export const StockOverviewModal: React.FC<StockOverviewModalProps> = ({
  isOpen,
  lang,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'ALL' | 'AHPL' | 'AIL'>('ALL');
  const [search, setSearch] = useState('');

  const filteredItems = INITIAL_STOCK_ITEMS.filter((item) => {
    if (activeTab !== 'ALL' && item.company !== activeTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.locationRack.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {lang === 'hi' ? 'स्टॉक इन्वेंटरी एवं SKU सारांश' : 'Stock Inventory & SKU Summary'}
              </h3>
              <p className="text-xs text-slate-400">
                AHPL (840 SKUs) & AIL (580 SKUs) Active Stock Matrix
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border border-slate-300 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'hi' ? 'सभी इकाइयां' : 'All Units'} (1,420 SKUs)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AHPL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'AHPL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              AHPL (840 SKUs - 99.1%)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AIL')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                activeTab === 'AIL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              AIL (580 SKUs - 97.8%)
            </button>
          </div>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'hi' ? 'SKU या लोकेशन खोजें...' : 'Search SKU or location...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Item Name</th>
                <th className="p-2.5">Company</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Rack Location</th>
                <th className="p-2.5">Current Stock</th>
                <th className="p-2.5">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold text-xs">
                    No records available
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 font-mono font-bold text-slate-800">{item.code}</td>
                    <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          item.company === 'AHPL'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.company}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500">{item.category}</td>
                    <td className="p-2.5 font-mono text-slate-600 font-medium">{item.locationRack}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-900">
                      {item.currentStock.toLocaleString('en-IN')} {item.unit}
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Optimal
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Real-time synchronisation active</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition"
          >
            {lang === 'hi' ? 'ठीक है' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
