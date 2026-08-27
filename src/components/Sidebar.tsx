import React from 'react';
import {
  CheckSquare,
  LayoutDashboard,
  ClipboardList,
  Truck,
  Grid,
  Shield,
  FileSpreadsheet,
  BarChart3,
  RefreshCw,
  Cloud,
  HelpCircle,
  X,
} from 'lucide-react';
import { AppTab, Language } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  lang: Language;
  taskCount?: number;
  onRefreshData: () => void;
  onOpenSyncSettings: () => void;
  onOpenSystemGuide: () => void;
  isSyncing?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  lang,
  taskCount = 3,
  onRefreshData,
  onOpenSyncSettings,
  onOpenSystemGuide,
  isSyncing = false,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems: Array<{
    id: AppTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }> = [
    {
      id: 'executive',
      label: lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'plan',
      label: lang === 'hi' ? 'डिस्पैच प्लान (फोटो स्कैन)' : 'Dispatch Plan (Photo Scan)',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'loading',
      label: lang === 'hi' ? 'डॉक ऑपरेशन्स' : 'Dock Operations',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: 'live',
      label: lang === 'hi' ? 'लाइव डॉक्स (1–9)' : 'Live Docks (1–9)',
      icon: <Grid className="w-4 h-4" />,
    },
    {
      id: 'tracker',
      label: lang === 'hi' ? 'गेट सिक्योरिटी लॉग' : 'Gate Security Log',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: lang === 'hi' ? 'रिपोर्ट्स एवं सिंक' : 'Reports & Sync',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: lang === 'hi' ? 'एनालिटिक्स एवं अंतर्दृष्टि' : 'Analytics & Insights',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  const handleSelect = (tab: AppTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={`fixed lg:sticky top-0 z-50 lg:z-30 w-64 bg-[#ECE7DC] border-r border-[#DCD5C5] flex flex-col justify-between p-4 h-screen shrink-0 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4 overflow-y-auto pr-0.5">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between lg:hidden pb-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Navigation Menu</span>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-300/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top User Card (Exact Match) */}
          <div className="bg-[#F7F4EC] p-3.5 rounded-2xl border border-[#DCD5C5] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2C3E50] text-amber-100 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
              RP
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-bold text-slate-900 truncate">Rahul Prajapati</h2>
              <p className="text-[10px] text-slate-500 font-medium truncate">Warehouse Staff / Lead</p>
            </div>
          </div>

          {/* Top Primary Menu: My Tasks */}
          <button
            type="button"
            onClick={() => handleSelect('tasks')}
            className={`sidebar-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-white text-slate-900 font-bold shadow-xs border border-amber-200'
                : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-amber-800" />
              <span>{lang === 'hi' ? 'मेरे कार्य (टास्क)' : 'My Tasks'}</span>
            </div>
            {taskCount > 0 && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {taskCount}
              </span>
            )}
          </button>

          {/* Modules Group */}
          <div className="pt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              {lang === 'hi' ? 'मॉड्यूल सूची' : 'Modules'}
            </p>

            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`sidebar-item w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-white text-[#1E293B] font-bold shadow-xs border border-[#DCD5C5]'
                        : 'text-slate-700 hover:bg-white/60'
                    }`}
                  >
                    <span className={isActive ? 'text-slate-900' : 'text-slate-600'}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions (Exact Match) */}
        <div className="space-y-1.5 pt-3 border-t border-[#DCD5C5] shrink-0">
          <button
            type="button"
            onClick={onRefreshData}
            disabled={isSyncing}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white/70 hover:bg-white border border-[#DCD5C5] transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="Refresh Live Data from Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? (lang === 'hi' ? 'सिंक हो रहा है...' : 'Refreshing...') : (lang === 'hi' ? 'डेटा रीफ्रेश करें' : 'Refresh Data')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSyncSettings}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white/60 transition cursor-pointer"
            title="Google Sheets Connection Settings"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'hi' ? 'गूगल शीट सिंक' : 'Google Sheet Sync'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSystemGuide}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Open System Changelog and Operations Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'hi' ? 'सिस्टम गाइड' : 'System Guide'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
