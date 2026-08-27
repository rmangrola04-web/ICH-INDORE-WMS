import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Shield,
  Truck,
  Camera,
  Layers,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose, lang }) => {
  const [activeManualTab, setActiveManualTab] = useState<'overview' | 'roles' | 'docks' | 'ocr' | 'sync'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {lang === 'hi' ? 'सिस्टम उपयोगकर्ता नियमावली एवं संचालन गाइड' : 'AHPL & AIL Operations Manual & Guide'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'hi' ? 'इंदौर हब लॉजिस्टिक्स एवं डॉक प्रबंधन पोर्टल' : 'Indore Hub Logistics & Dock Management Portal SOP'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveManualTab('overview')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeManualTab === 'overview'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'hi' ? 'सिस्टम परिचय' : 'System Overview'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveManualTab('roles')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeManualTab === 'roles'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'hi' ? 'भूमिकाएं एवं अनुमतियां' : 'Roles & Access'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveManualTab('docks')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeManualTab === 'docks'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'hi' ? 'डॉक 1–9 विभाजन' : 'Dock 1–9 Partition'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveManualTab('ocr')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeManualTab === 'ocr'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-purple-600" />
            <span>{lang === 'hi' ? 'फोटो OCR स्कैनर' : 'Photo OCR Scanner'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveManualTab('sync')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeManualTab === 'sync'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-sky-600" />
            <span>{lang === 'hi' ? 'गूगल शीट सिंक' : 'Google Sheets Sync'}</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {activeManualTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <h3 className="font-bold text-sm text-blue-900 mb-1">
                  {lang === 'hi' ? 'इंदौर सेंट्रल हब संचालन उद्देश्य' : 'Indore Central Hub Logistics Portal'}
                </h3>
                <p className="text-slate-700">
                  {lang === 'hi'
                    ? 'यह पोर्टल AHPL एवं AIL के माल लोडिंग, अनलोडिंग, वाहन गेट-इन/आउट, डिस्पैच प्लानिंग एवं गूगल शीट सिंक का संपूर्ण प्रबंधन प्रदान करता है।'
                    : 'This portal provides end-to-end unified management for AHPL and AIL cargo loading, unloading, vehicle gate in/out turnaround tracking, daily plan execution, and real-time Google Sheets synchronization.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>100% Live Google Sheets Backend</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {lang === 'hi'
                      ? 'प्रत्येक गेट एंट्री, लोडिंग एवं प्लान सीधे गूगल स्प्रेडशीट में बिना किसी डेटा नुकसान के रिकॉर्ड होता है।'
                      : 'All records, status updates, and photo OCR entries write immediately to your connected Google Sheet.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Real-time Dock Bay Monitoring</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {lang === 'hi'
                      ? 'डॉक 1 से 9 की स्थिति, टर्नअराउंड समय (TAT) एवं वाहन विवरण वास्तविक समय में दिखाई देते हैं।'
                      : 'Track bays 1 to 9 occupancy, active supervisor, duration timer, and auto-TAT calculations.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeManualTab === 'roles' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shrink-0">
                  AD
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Admin (Full Control)</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {lang === 'hi'
                      ? 'सभी मॉड्यूल, रिपोर्ट्स एक्सपोर्ट, स्प्रेडशीट कॉन्फ़िगरेशन, डेटा रीसेट एवं उपयोगकर्ता प्रबंधन।'
                      : 'Full administrative privileges across all modules, analytics, CSV/XLSX exports, API keys, and sheet reset.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold shrink-0">
                  SU
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Supervisor (Loading, Plan Scan & Log)</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {lang === 'hi'
                      ? 'डिस्पैच प्लान इनपुट, चालान फोटो OCR स्कैनिंग, डॉक लोडिंग/अनलोडिंग समय दर्ज करना एवं गेट पास।'
                      : 'Create daily plans, take photo OCR scans of paper challans, log dock bays in-progress, and generate gate passes.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">
                  SG
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Security Guard (Gate In / Gate Out)</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {lang === 'hi'
                      ? 'गेट पर वाहन आगमन, सील नंबर, चालक का विवरण, इन-टाइम एवं अंतिम गेट आउट सत्यापन।'
                      : 'Log incoming trucks at physical gate, record seal numbers, driver details, and verify gate out clearance.'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold shrink-0">
                  OP
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Operator (Live Docks Overview)</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {lang === 'hi'
                      ? 'लाइव डॉक ग्रिड 1-9 देखना, ऑक्युपेंसी चेक करना एवं डिस्पैच मॉनिटरिंग।'
                      : 'Monitor live dock grid 1–9 occupancy, check ongoing loading times, and view dispatch boards.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeManualTab === 'docks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase">
                    AHPL Partition
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">Docks 01 to 04 (4 Bays)</h4>
                  <p className="text-slate-600 text-[11px]">
                    {lang === 'hi'
                      ? 'AHPL कंपनी के सभी इनबाउंड एवं आउटबाउंड माल के लिए विशेष रूप से आरक्षित।'
                      : 'Dedicated exclusively to AHPL inbound raw materials & outbound finished dispatches.'}
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white uppercase">
                    AIL Partition
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">Docks 05 to 09 (5 Bays)</h4>
                  <p className="text-slate-600 text-[11px]">
                    {lang === 'hi'
                      ? 'AIL कंपनी के सभी इनबाउंड एवं आउटबाउंड माल के लिए विशेष रूप से आरक्षित।'
                      : 'Dedicated exclusively to AIL inbound supplier goods & regional distribution vehicles.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeManualTab === 'ocr' && (
            <div className="space-y-3">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-sm text-purple-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-700" />
                  <span>{lang === 'hi' ? 'चालान फोटो OCR स्कैनर गाइड' : 'Photo OCR Scanner Workflow'}</span>
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 text-[11px]">
                  <li>
                    {lang === 'hi'
                      ? 'साइडबार से "Daily Plan (Photo Scan)" या "फोटो लें / अपलोड करें" पर क्लिक करें।'
                      : 'Open "Daily Plan (Photo Scan)" and click "Take Photo / Upload Plan".'}
                  </li>
                  <li>
                    {lang === 'hi'
                      ? 'कागजी डिस्पैच शेड्यूल या ट्रांसपोर्ट चालान की स्पष्ट फोटो खींचें या गैलरी से चुनें।'
                      : 'Snap a clear photo of your paper dispatch schedule or transport challan.'}
                  </li>
                  <li>
                    {lang === 'hi'
                      ? 'सिस्टम स्वचालित रूप से डेस्टिनेशन, ट्रांसपोर्टर, वजन (KG) और वाहन का प्रकार निकालता है।'
                      : 'The built-in OCR scans the text, extracts Destination, Transporter, Weight and Mode.'}
                  </li>
                  <li>
                    {lang === 'hi'
                      ? 'यह तुरंत दैनिक योजना में जुड़ जाता है और गूगल शीट में लाइव सिंक हो जाता है।'
                      : 'The plan record is instantly saved and synced to your live Google Sheet.'}
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeManualTab === 'sync' && (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-700" />
                  <span>Google Apps Script Web App Integration</span>
                </h4>
                <p className="text-slate-700 text-[11px]">
                  {lang === 'hi'
                    ? 'नीचे दिए गए साइडबार में "Google Sheet Sync" पर क्लिक करके अपना Google Apps Script Web App URL दर्ज करें। यह हर बदलाव को आपकी मुख्य गूगल स्प्रेडशीट में सहेजता है।'
                    : 'Click "Google Sheet Sync" in the sidebar to configure or update your Google Apps Script Web App Deployment URL for zero-data-loss multi-user synchronization.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            {lang === 'hi' ? 'समझ गया / बंद करें' : 'Got it / Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};
