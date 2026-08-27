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
  BookOpen,
  LogOut,
  X,
} from 'lucide-react';
import { AppTab, Language, UserAccount } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  lang: Language;
  currentUser?: UserAccount;
  taskCount?: number;
  onRefreshData: () => void;
  onOpenSyncSettings: () => void;
  onOpenUserManual: () => void;
  onLogout: () => void;
  isSyncing?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  lang,
  currentUser,
  taskCount = 3,
  onRefreshData,
  onOpenSyncSettings,
  onOpenUserManual,
  onLogout,
  isSyncing = false,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const role = currentUser?.role || 'SUPERVISOR';

  // Navigation Items matching role capabilities
  const allNavItems: Array<{
    id: AppTab;
    label: string;
    icon: React.ReactNode;
    roles: string[];
  }> = [
    {
      id: 'executive',
      label: lang === 'hi' ? 'डैशबोर्ड अवलोकन' : 'Dashboard Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPERVISOR', 'SECURITY', 'OPERATOR'],
    },
    {
      id: 'plan',
      label: lang === 'hi' ? 'प्लान समरी एवं रिसीव्ड' : 'Plan Summary & Received',
      icon: <ClipboardList className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'loading',
      label: lang === 'hi' ? 'डॉक एंट्री फॉर्म' : 'Dock Entry Form',
      icon: <Truck className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'],
    },
    {
      id: 'live',
      label: lang === 'hi' ? 'लाइव डॉक्स (1–9)' : 'Live Docks (1–9)',
      icon: <Grid className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'],
    },
    {
      id: 'tracker',
      label: lang === 'hi' ? 'गेट सिक्योरिटी लॉग' : 'Gate Security Log',
      icon: <Shield className="w-4 h-4" />,
      roles: ['ADMIN', 'SECURITY', 'SUPERVISOR'],
    },
    {
      id: 'reports',
      label: lang === 'hi' ? 'रिपोर्ट्स एवं एक्सपोर्ट' : 'Reports & Export',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
    {
      id: 'analytics',
      label: lang === 'hi' ? 'एनालिटिक्स एवं चार्ट्स' : 'Analytics & Charts',
      icon: <BarChart3 className="w-4 h-4" />,
      roles: ['ADMIN', 'SUPERVISOR'],
    },
  ];

  const filteredNavItems = allNavItems.filter((item) => item.roles.includes(role));

  const handleSelect = (tab: AppTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const displayName = currentUser?.fullName || 'Rahul Prajapati';
  const displayRole = currentUser?.role || 'SUPERVISOR';
  const displayInitials = currentUser?.avatarInitials || 'RP';

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
        className={`fixed lg:sticky top-0 z-50 lg:z-30 w-64 bg-[#E2E8F0] border-r border-slate-300 flex flex-col justify-between p-4 h-screen shrink-0 transition-transform duration-200 ease-in-out ${
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
              className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-300/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top User Profile Card (Glacier Match) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-300 shadow-xs flex items-center gap-3">
            <div
              id="userAvatar"
              className="w-10 h-10 rounded-xl bg-slate-800 text-slate-100 flex items-center justify-center font-bold text-sm shadow-inner shrink-0"
            >
              {displayInitials}
            </div>
            <div className="overflow-hidden">
              <h2 id="userBadgeName" className="text-xs font-bold text-slate-900 truncate">
                {displayName}
              </h2>
              <p id="userBadgeRole" className="text-[10px] text-slate-500 font-semibold uppercase truncate">
                {displayRole}
              </p>
            </div>
          </div>

          {/* My Tasks button */}
          <button
            type="button"
            onClick={() => handleSelect('tasks')}
            className={`sidebar-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tasks'
                ? 'active-nav'
                : 'text-slate-700 hover:bg-white/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-slate-700" />
              <span>{lang === 'hi' ? 'मेरे कार्य' : 'My Tasks'}</span>
            </div>
            {taskCount > 0 && (
              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {taskCount}
              </span>
            )}
          </button>

          {/* Modules Group */}
          <div className="pt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              {lang === 'hi' ? 'मॉड्यूल सूची' : 'Modules'}
            </p>

            <div className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`sidebar-item w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                      isActive
                        ? 'active-nav'
                        : 'text-slate-700 hover:bg-white/70'
                    }`}
                  >
                    <span className="text-slate-700">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-1.5 pt-4 border-t border-slate-300 shrink-0">
          <button
            type="button"
            onClick={onRefreshData}
            disabled={isSyncing}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition shadow-xs cursor-pointer disabled:opacity-60"
            title="Refresh Live Data from Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? (lang === 'hi' ? 'सिंक हो रहा है...' : 'Refreshing...') : (lang === 'hi' ? 'डेटा रीफ्रेश' : 'Refresh Data')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSyncSettings}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition shadow-xs cursor-pointer"
            title="Google Sheets Connection Settings"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'hi' ? 'लाइव 2-वे सिंक' : 'Live 2-Way Sync'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenUserManual}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white/60 transition cursor-pointer"
            title="Open User Manual and Operations Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>{lang === 'hi' ? 'उपयोगकर्ता गाइड' : 'User Manual & Guide'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Logout of current user session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>{lang === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

