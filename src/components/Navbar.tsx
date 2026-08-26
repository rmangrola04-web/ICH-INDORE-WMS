import React, { useEffect, useState } from 'react';
import { Warehouse, Globe, PackageCheck, ShieldCheck, History, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { t } from '../utils/translations';
import { CURRENT_APP_VERSION } from '../data/changelogData';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenStockModal: () => void;
  onOpenVersionModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenStockModal,
  onOpenVersionModal,
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
          <div className="bg-blue-600 w-11 h-11 rounded-xl shadow-inner flex items-center justify-center text-white shrink-0">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-wide text-white">
                INTEGRATED CENTRAL HUB - INDORE
              </h1>
              {/* Version History Live Badge Pill */}
              <button
                type="button"
                onClick={onOpenVersionModal}
                className="inline-flex items-center gap-1 text-xs bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/40 font-mono font-bold tracking-wide transition cursor-pointer shadow-2xs group"
                title="Click to view Version History & System Changelog"
              >
                <Sparkles className="w-3 h-3 text-indigo-400 group-hover:animate-spin" />
                <span>{CURRENT_APP_VERSION}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                <span className="text-[10px] text-emerald-400 uppercase font-sans font-extrabold">Live</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Docks 1 to 9 | Movement, Dispatch & Executive Control
            </p>
          </div>
        </div>

        {/* Right Status and Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-sm">
          {/* Version History Quick Link */}
          <button
            type="button"
            id="navVersionHistoryBtn"
            onClick={onOpenVersionModal}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="View Release Milestones & Changelog"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Changelog</span>
          </button>

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
          <div className="text-right hidden md:block">
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


