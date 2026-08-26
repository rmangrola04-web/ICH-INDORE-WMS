import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, GitCommit } from 'lucide-react';
import { CURRENT_APP_VERSION, CHANGELOG_DATA } from '../data/changelogData';
import { Language } from '../types';

interface WhatsNewBannerProps {
  onOpenChangelog: () => void;
  lang: Language;
}

export const WhatsNewBanner: React.FC<WhatsNewBannerProps> = ({ onOpenChangelog, lang }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const dismissedVersion = localStorage.getItem('ahpl_changelog_dismissed_version');
      if (dismissedVersion !== CURRENT_APP_VERSION) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('ahpl_changelog_dismissed_version', CURRENT_APP_VERSION);
    } catch (e) {
      console.warn(e);
    }
  };

  if (!isVisible) return null;

  const currentRelease = CHANGELOG_DATA.find((r) => r.version === CURRENT_APP_VERSION) || CHANGELOG_DATA[0];

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white px-4 py-2.5 shadow-md border-b border-indigo-700 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-indigo-500/30 text-amber-300 shrink-0 border border-indigo-400/40">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold bg-white/15 px-2 py-0.5 rounded text-xs text-indigo-100 border border-white/20 tracking-wider">
              {CURRENT_APP_VERSION} Live
            </span>
            <span className="font-semibold text-slate-100">
              {lang === 'hi'
                ? 'नया अपडेट जारी: एग्जीक्यूटिव हब डैशबोर्ड, संयुक्त AHPL व AIL लोड और वर्जन हिस्ट्री!'
                : `What's New: ${currentRelease.highlight}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenChangelog}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            <span>{lang === 'hi' ? 'पूरा चेंजलॉग देखें' : 'View Full Changelog'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-md text-indigo-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
