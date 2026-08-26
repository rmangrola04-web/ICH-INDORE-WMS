import React from 'react';
import { Truck, Activity, FileSpreadsheet, BarChart3, Warehouse, ClipboardList, PackageCheck } from 'lucide-react';
import { AppTab, Language } from '../types';
import { t } from '../utils/translations';

interface NavigationTabsProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  lang: Language;
  dockCount: number;
  activeBayCount: number;
  movementCount: number;
  planCount?: number;
  pendingPlanCount?: number;
  onOpenStockModal: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  lang,
  dockCount,
  activeBayCount,
  movementCount,
  planCount = 0,
  pendingPlanCount = 0,
  onOpenStockModal,
}) => {
  const dict = t[lang];

  const tabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: string | number; pulse?: boolean }[] = [
    {
      id: 'loading',
      label: dict.tabLoading,
      icon: <Truck className="w-4 h-4" />,
      badge: `${activeBayCount}/5 In Dock`,
    },
    {
      id: 'plan',
      label: dict.tabPlan || 'Daily Plan Execution',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: planCount > 0 ? (pendingPlanCount > 0 ? `${pendingPlanCount} Pending` : planCount) : undefined,
      pulse: pendingPlanCount > 0,
    },
    {
      id: 'live',
      label: dict.tabLive,
      icon: <Activity className="w-4 h-4" />,
      pulse: true,
    },
    {
      id: 'tracker',
      label: dict.tabTracker || (lang === 'hi' ? 'गेट व सुपरवाइजर ट्रैकर' : 'Movement Tracker'),
      icon: <Warehouse className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: dict.tabReports,
      icon: <FileSpreadsheet className="w-4 h-4" />,
      badge: dockCount,
    },
    {
      id: 'analytics',
      label: dict.tabAnalytics,
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'movement',
      label: dict.movementTab,
      icon: <Warehouse className="w-4 h-4" />,
      badge: movementCount,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 md:top-[65px] z-20 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 overflow-x-auto py-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50/90 border border-indigo-200 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-slate-500'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.pulse && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                )}
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-medium ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Inventory Overview Link */}
        <div className="hidden lg:flex items-center pl-3 border-l border-slate-200">
          <button
            type="button"
            onClick={onOpenStockModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition cursor-pointer"
          >
            <PackageCheck className="w-4 h-4 text-indigo-500" />
            <span>{dict.stockInventory}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
