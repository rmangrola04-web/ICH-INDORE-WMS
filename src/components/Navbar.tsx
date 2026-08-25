import React, { useEffect, useState } from 'react';
import { Warehouse, Globe, PackageCheck, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenStockModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenStockModal,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  const dict = t[lang];

  return (
    <header className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 shadow-md sticky top-0 z-30 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-inner flex items-center justify-center text-white">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-wide text-white">
                AHPL & AIL
              </h1>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-400/30 font-medium">
                Dock Operations
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              AHPL: Docks 1–4 | AIL: Docks 5–9 | Dispatch & POD Audit Control
            </p>
          </div>
        </div>

        {/* Right Status and Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 text-sm">
          {/* Inventory Overview Button */}
          <button
            type="button"
            id="viewStockBtn"
            onClick={onOpenStockModal}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <PackageCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{dict.stockInventory}</span>
            <span className="sm:hidden">Stock</span>
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            id="langToggleBtn"
            onClick={onToggleLang}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Toggle Language / भाषा बदलें"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
          </button>

          {/* Live Systems Active Pill */}
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{dict.liveActive}</span>
          </span>

          {/* Live Clock & Date */}
          <div className="text-right hidden sm:block">
            <div id="liveClock" className="text-slate-200 font-mono text-xs font-semibold tracking-wider">
              {currentTime}
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              {currentDate}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
