import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2
} from 'lucide-react';
import { DockRecord, Language } from '../types';
import {
  downloadSampleCSVTemplate,
  parseCSVOrExcel,
  processImportedData,
  ImportMode,
  CSVImportResult
} from '../utils/csvImportUtils';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingRecords: DockRecord[];
  onApplyImport: (updatedRecords: DockRecord[], summary: CSVImportResult) => void;
  lang?: Language;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  existingRecords,
  onApplyImport,
  lang = 'hi'
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, any>[] | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge_update');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setParseError(null);
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const rows = await parseCSVOrExcel(selectedFile);
      if (!rows || rows.length === 0) {
        setParseError('The uploaded file is empty or does not contain valid tabular data.');
        setRawRows(null);
        setImportResult(null);
        setIsProcessing(false);
        return;
      }

      setRawRows(rows);
      const result = processImportedData(rows, existingRecords, importMode);
      setImportResult(result);
    } catch (err: any) {
      console.error('CSV Parsing Error:', err);
      setParseError(err.message || 'Failed to read file. Please ensure it is a valid CSV or Excel file.');
      setRawRows(null);
      setImportResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModeChange = (mode: ImportMode) => {
    setImportMode(mode);
    if (rawRows) {
      const result = processImportedData(rawRows, existingRecords, mode);
      setImportResult(result);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmImport = () => {
    if (!importResult) return;
    onApplyImport(importResult.records, importResult);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setRawRows(null);
    setImportResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  CSV / Excel Data Upload & Bulk Correction
                </h2>
                <span className="bg-blue-500/20 text-blue-300 text-[11px] px-2 py-0.5 rounded border border-blue-400/30 font-semibold">
                  14-Col Support
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload CSV/Excel file to update wrong fields (Transporter, Location, Supervisor, Purpose, Dock, etc.)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Top Actions: Template Download Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-950">
                  Standard 14-Column Excel / CSV Template
                </h4>
                <p className="text-xs text-blue-800/80 mt-0.5">
                  Need the exact column format? Download our pre-filled CSV template to edit in Excel.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => downloadSampleCSVTemplate()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Click or drag and drop your CSV or Excel file here
                </p>
                <p className="text-xs text-slate-500">
                  Supports .csv, .xlsx, .xls files with Vehicle No, Token ID, Transporter, Supervisor, Location
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{file.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {rawRows ? `${rawRows.length} rows detected` : 'Processing...'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-red-600 hover:text-red-700 font-bold px-2.5 py-1.5 hover:bg-red-50 rounded-lg transition cursor-pointer"
              >
                Change File
              </button>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error reading file:</span> {parseError}
              </div>
            </div>
          )}

          {/* Import Modes & Results Preview */}
          {importResult && (
            <div className="space-y-4">
              
              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Select Update / Import Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleModeChange('merge_update')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      importMode === 'merge_update'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      Update & Add New
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Corrects wrong fields on existing vehicles & adds new rows. (Recommended)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange('update_only')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      importMode === 'update_only'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      Correct Existing Only
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Only updates matched records; skips any new vehicles.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange('overwrite')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      importMode === 'overwrite'
                        ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      Replace All Data
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Clears current state and replaces with this CSV dataset.
                    </p>
                  </button>
                </div>
              </div>

              {/* Stats Summary Pills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[11px] text-slate-500 font-semibold">Total Rows Parsed</div>
                  <div className="text-lg font-extrabold text-slate-900">{importResult.totalParsed}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
                  <div className="text-[11px] text-blue-700 font-semibold">Records to Correct/Update</div>
                  <div className="text-lg font-extrabold text-blue-800">{importResult.updatedCount}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                  <div className="text-[11px] text-emerald-700 font-semibold">New Records to Add</div>
                  <div className="text-lg font-extrabold text-emerald-800">{importResult.addedCount}</div>
                </div>
              </div>

              {/* Detailed Correction Changes List */}
              {importResult.updatedRows.length > 0 && (
                <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-2.5">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Identified Data Corrections ({importResult.updatedRows.length} Vehicles):</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {importResult.updatedRows.map((up, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-blue-100 text-xs shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 font-mono">
                          <span>{up.vehicleNo}</span>
                          <span className="text-blue-600">{up.tokenId}</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          {up.changes.map((ch, cIdx) => (
                            <div key={cIdx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                              <span className="font-semibold text-slate-700">{ch.field}:</span>
                              <span className="line-through text-red-500">{ch.from || '(empty)'}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 inline" />
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{ch.to}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings / Errors */}
              {importResult.errors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
                  <div className="font-bold">Warnings:</div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {importResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {importResult.errors.length > 5 && (
                      <li>...and {importResult.errors.length - 5} more skipped rows.</li>
                    )}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!importResult || (importResult.updatedCount === 0 && importResult.addedCount === 0 && importMode !== 'overwrite')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>
              {importMode === 'overwrite'
                ? `Confirm & Replace Dataset (${importResult?.addedCount || 0} Records)`
                : `Apply Data Updates (${(importResult?.updatedCount || 0) + (importResult?.addedCount || 0)} Records)`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
