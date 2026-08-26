import React from 'react';
import {
  X,
  History,
  Sparkles,
  Wrench,
  Bug,
  CheckCircle2,
  Tag,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { CHANGELOG_DATA, CURRENT_APP_VERSION } from '../data/changelogData';
import { Language } from '../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide">
                  {lang === 'hi' ? 'सिस्टम वर्जन एवं अपग्रेड हिस्ट्री' : 'System Version & Changelog'}
                </h2>
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  {CURRENT_APP_VERSION} • Live
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'hi'
                  ? 'इंटीग्रेटेड सेंट्रल हब - इंदौर के सभी रिलीज, नई सुविधाएं और फिक्स'
                  : 'Integrated Central Hub - Indore Release Milestones & System Evolution'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Vertical Timeline */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-slate-50/50">
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {CHANGELOG_DATA.map((release, idx) => {
              const isCurrent = release.version === CURRENT_APP_VERSION;

              const badgeColor =
                release.type === 'major'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : release.type === 'feature'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : release.type === 'patch'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200';

              return (
                <div key={release.version} className="relative group">
                  {/* Timeline Bullet */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                      isCurrent
                        ? 'bg-indigo-600 border-white shadow-md text-white ring-4 ring-indigo-100'
                        : 'bg-white border-slate-300 text-slate-400 group-hover:border-indigo-400'
                    }`}
                  >
                    {isCurrent ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                    )}
                  </div>

                  {/* Release Card */}
                  <div
                    className={`rounded-2xl p-5 border transition ${
                      isCurrent
                        ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100'
                        : 'bg-white border-slate-200 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Release Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                          {release.version}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badgeColor}`}
                        >
                          {release.typeLabel}
                        </span>
                        {isCurrent && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500 text-white shadow-2xs">
                            Current Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{release.releaseDate}</span>
                      </div>
                    </div>

                    {/* Highlight Description */}
                    <p className="text-sm font-semibold text-slate-700 mt-3 mb-4">
                      {release.highlight}
                    </p>

                    {/* Section Categories */}
                    <div className="space-y-3.5 text-xs">
                      {/* Features */}
                      {release.features && release.features.length > 0 && (
                        <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100/80">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-950 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{lang === 'hi' ? 'नई सुविधाएं (New Features)' : 'New Features & Modules'}</span>
                          </div>
                          <ul className="space-y-1 text-slate-700 pl-4 list-disc marker:text-indigo-500">
                            {release.features.map((item, i) => (
                              <li key={i} className="leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improvements */}
                      {release.improvements && release.improvements.length > 0 && (
                        <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100/80">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-950 mb-1.5">
                            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {lang === 'hi' ? 'सुधार और लॉजिक अपडेट (Improvements)' : 'Improvements & Logic Updates'}
                            </span>
                          </div>
                          <ul className="space-y-1 text-slate-700 pl-4 list-disc marker:text-emerald-500">
                            {release.improvements.map((item, i) => (
                              <li key={i} className="leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Bug Fixes */}
                      {release.bugfixes && release.bugfixes.length > 0 && (
                        <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100/80">
                          <div className="flex items-center gap-1.5 font-bold text-rose-950 mb-1.5">
                            <Bug className="w-3.5 h-3.5 text-rose-600" />
                            <span>{lang === 'hi' ? 'बग फिक्स एवं स्टेबिलिटी (Bug Fixes)' : 'Bug Fixes & Stability'}</span>
                          </div>
                          <ul className="space-y-1 text-slate-700 pl-4 list-disc marker:text-rose-500">
                            {release.bugfixes.map((item, i) => (
                              <li key={i} className="leading-relaxed">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">
              Intregated Central Hub Indore • Continuous Deployment Architecture
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            {lang === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
