import * as XLSX from 'xlsx';
import { DockRecord, DockStatus, CompanyUnit } from '../types';

export interface CSVImportResult {
  records: DockRecord[];
  totalParsed: number;
  updatedCount: number;
  addedCount: number;
  updatedRows: {
    tokenId: string;
    vehicleNo: string;
    changes: { field: string; from: string; to: string }[];
  }[];
  newRows: {
    tokenId: string;
    vehicleNo: string;
  }[];
  errors: string[];
}

export type ImportMode = 'merge_update' | 'update_only' | 'overwrite';

/**
 * Generates and downloads a pre-formatted 14-column CSV template
 */
export const downloadSampleCSVTemplate = (filename: string = 'ICH_Dock_Operations_Template.csv') => {
  const headers = [
    'Token ID',
    'Date & Time (In Time)',
    'Vehicle Number',
    'Driver Name',
    'Driver Mobile',
    'Purpose / Activity',
    'Transporter Name',
    'Location Type',
    'CFA / Destination Location',
    'Assigned Dock',
    'Supervisor Name',
    'In Dock Time (T2)',
    'Exit Time (T3)',
    'Status',
    'Seal No',
    'Invoice / LR No',
    'Remarks'
  ];

  const sampleRows = [
    [
      'TKN-9021',
      new Date().toLocaleDateString('en-IN') + ' 09:30 AM',
      'MP09 HG 4521',
      'Ramesh Yadav',
      '9876543210',
      'Loading',
      'MATA',
      'LL',
      'Indore Central Hub',
      'Dock-01',
      'Ankit Dayal',
      '',
      '',
      'Dock Assigned',
      '',
      '',
      'Security Gate Entry'
    ],
    [
      'TKN-9022',
      new Date().toLocaleDateString('en-IN') + ' 09:45 AM',
      'DL01 AX 7890',
      'Satish Pal',
      '9812345678',
      'Unloading',
      'ICRL',
      'CFA',
      'Kolkata Hub',
      'Dock-03',
      'Sanjay Sharma',
      '10:05 AM',
      '',
      'In Progress',
      'SL-4412',
      'INV-9901',
      'In Dock unloading'
    ],
    [
      'TKN-9023',
      new Date().toLocaleDateString('en-IN') + ' 08:15 AM',
      'MH12 PK 3321',
      'Vikram Singh',
      '9765432109',
      'Loading',
      'DHTC',
      'LL',
      'Mumbai WH',
      'Dock-02',
      'Ankit Dayal',
      '08:30 AM',
      '10:00 AM',
      'Loaded',
      'SL-8871',
      'LR-7721',
      'Audit Approved'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Normalizes string keys for flexible header matching
 */
const normalizeKey = (key: string): string => {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Parses a File (CSV or Excel) into raw JavaScript objects
 */
export const parseCSVOrExcel = async (file: File): Promise<Record<string, any>[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    raw: false,
    defval: ''
  });
  return rawJson;
};

/**
 * Extracts and maps field values from a raw row object
 */
export const extractRowValues = (row: Record<string, any>) => {
  const normalized: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    normalized[normalizeKey(k)] = v !== undefined && v !== null ? String(v).trim() : '';
  }

  const findVal = (keys: string[]): string => {
    for (const k of keys) {
      const norm = normalizeKey(k);
      if (normalized[norm] !== undefined && normalized[norm] !== '') {
        return normalized[norm];
      }
    }
    return '';
  };

  const tokenId = findVal(['tokenid', 'token', 'tokenno', 'tkn', 'id', 'recordid', 'sno', 'srno']);
  const vehicleNo = findVal(['vehicleno', 'vehiclenumber', 'vehiclen', 'vehicle', 'truckno', 'trucknumber', 'car', 'van']).toUpperCase();
  const driverName = findVal(['drivername', 'driver', 'driverfullname', 'drivern']);
  const driverMobile = findVal(['drivermobile', 'driverphone', 'mobile', 'phone', 'contact', 'cell', 'mobileno']);
  const activityType = findVal(['activitytype', 'purpose', 'activity', 'operation', 'type', 'activitypurpose', 'loadingunloading']);
  const transporterName = findVal(['transportername', 'transporter', 'transportertype', 'transport', 'carrier', 'vendor']);
  const locationType = findVal(['locationtype', 'typeofrun', 'loctype', 'loccat']);
  const cfaLocation = findVal(['cfalocation', 'location', 'hub', 'destination', 'origin', 'city', 'warehouse', 'wh']);
  const binNo = findVal(['assigneddock', 'binno', 'dock', 'dockno', 'bay', 'bayno', 'gateno', 'gate']);
  const supervisorName = findVal(['supervisorname', 'supervisor', 'supname', 'incharge', 'officer']);
  const inTime = findVal(['datetime', 'datetimeintime', 'intime', 'time1', 'gateintime', 'entrytime', 'timestamp', 'date']);
  const inDockTime = findVal(['indocktime', 'indocktimet2', 'starttime', 'time2', 'docktime', 't2']);
  const exitTime = findVal(['exittime', 'exittimet3', 'outtime', 'time3', 'dispatchtime', 'completiontime', 't3']);
  const status = findVal(['status', 'currentstatus', 'dockstatus', 'state']);
  const sealNo = findVal(['sealno', 'sealnumber', 'seal']);
  const invoiceNo = findVal(['invoiceno', 'invoicenumber', 'invoice', 'invoicelr', 'invoicelrno']);
  const lrNo = findVal(['lrno', 'lrnumber', 'lr', 'bilty', 'biltyno']);
  const remarks = findVal(['remarks', 'remark', 'notes', 'comment', 'description']);
  const unitRaw = findVal(['operatingunit', 'unit', 'company', 'companyunit']).toUpperCase();
  const unit: CompanyUnit = unitRaw.includes('AIL') ? 'AIL' : 'AHPL';

  return {
    tokenId,
    vehicleNo,
    driverName,
    driverMobile,
    activityType: (activityType.toLowerCase().includes('unload') ? 'Unloading' : 'Loading') as 'Loading' | 'Unloading',
    transporterName: transporterName || 'MATA',
    locationType: (locationType || 'LL').toUpperCase(),
    cfaLocation: cfaLocation || '',
    binNo: binNo ? (binNo.startsWith('Dock') ? binNo : `Dock-${binNo.padStart(2, '0')}`) : 'Dock-01',
    supervisorName: supervisorName || 'Ankit Dayal',
    inTime,
    inDockTime,
    exitTime,
    status,
    sealNo,
    invoiceNo,
    lrNo,
    remarks,
    unit
  };
};

/**
 * Compares and merges imported rows with existing records
 */
export const processImportedData = (
  rawRows: Record<string, any>[],
  existingRecords: DockRecord[],
  mode: ImportMode
): CSVImportResult => {
  const resultRecords = [...existingRecords];
  const updatedRows: CSVImportResult['updatedRows'] = [];
  const newRows: CSVImportResult['newRows'] = [];
  const errors: string[] = [];

  let updatedCount = 0;
  let addedCount = 0;

  if (mode === 'overwrite') {
    const freshRecords: DockRecord[] = [];
    rawRows.forEach((row, index) => {
      const mapped = extractRowValues(row);
      if (!mapped.vehicleNo && !mapped.tokenId) {
        errors.push(`Row ${index + 1}: Skipped due to missing Vehicle Number or Token ID.`);
        return;
      }
      const newRec: DockRecord = {
        id: `DOCK-${Date.now().toString().slice(-4)}-${index + 1}`,
        tokenId: mapped.tokenId || `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
        unit: mapped.unit,
        gateNo: mapped.binNo,
        binNo: mapped.binNo,
        operation: mapped.activityType,
        activityType: mapped.activityType,
        vehicleNo: mapped.vehicleNo || 'UNKNOWN',
        driverName: mapped.driverName || 'Driver',
        driverMobile: mapped.driverMobile || '',
        transporterName: mapped.transporterName,
        locationType: mapped.locationType,
        cfaLocation: mapped.cfaLocation,
        supervisorName: mapped.supervisorName,
        inTime: mapped.inTime || new Date().toLocaleString('en-IN'),
        startTime: mapped.inDockTime || '',
        exitTime: mapped.exitTime || '',
        status: (mapped.status as DockStatus) || (mapped.exitTime ? (mapped.activityType === 'Unloading' ? 'Unloaded' : 'Loaded') : mapped.inDockTime ? 'In Progress (In Dock)' : 'Dock Assigned'),
        date: new Date().toLocaleDateString('en-IN'),
        podStatus: 'POD Clean',
        sealNo: mapped.sealNo || '',
        invoiceNo: mapped.invoiceNo || '',
        lrNo: mapped.lrNo || '',
        remarks: mapped.remarks || 'Imported via CSV/Excel'
      };
      freshRecords.push(newRec);
      newRows.push({ tokenId: newRec.tokenId || newRec.id, vehicleNo: newRec.vehicleNo });
      addedCount++;
    });

    return {
      records: freshRecords,
      totalParsed: rawRows.length,
      updatedCount: 0,
      addedCount,
      updatedRows: [],
      newRows,
      errors
    };
  }

  rawRows.forEach((row, index) => {
    const mapped = extractRowValues(row);
    if (!mapped.vehicleNo && !mapped.tokenId) {
      errors.push(`Row ${index + 1}: Skipped due to missing Vehicle Number and Token ID.`);
      return;
    }

    // Try matching by Token ID or Vehicle Number
    const existingIndex = resultRecords.findIndex((r) => {
      if (mapped.tokenId && r.tokenId && r.tokenId.trim().toLowerCase() === mapped.tokenId.trim().toLowerCase()) {
        return true;
      }
      if (mapped.tokenId && r.id && r.id.trim().toLowerCase() === mapped.tokenId.trim().toLowerCase()) {
        return true;
      }
      if (mapped.vehicleNo && r.vehicleNo) {
        const cleanA = r.vehicleNo.replace(/\s+/g, '').toUpperCase();
        const cleanB = mapped.vehicleNo.replace(/\s+/g, '').toUpperCase();
        if (cleanA === cleanB && cleanA.length >= 6) return true;
      }
      return false;
    });

    if (existingIndex >= 0) {
      const existing = resultRecords[existingIndex];
      const changes: { field: string; from: string; to: string }[] = [];

      // Check fields to update / correct
      if (mapped.transporterName && mapped.transporterName !== existing.transporterName) {
        changes.push({ field: 'Transporter', from: existing.transporterName || '', to: mapped.transporterName });
      }
      if (mapped.activityType && mapped.activityType !== (existing.activityType || existing.operation)) {
        changes.push({ field: 'Purpose / Activity', from: existing.activityType || existing.operation || '', to: mapped.activityType });
      }
      if (mapped.supervisorName && mapped.supervisorName !== existing.supervisorName) {
        changes.push({ field: 'Supervisor', from: existing.supervisorName || '', to: mapped.supervisorName });
      }
      if (mapped.binNo && mapped.binNo !== (existing.binNo || existing.gateNo)) {
        changes.push({ field: 'Assigned Dock', from: existing.binNo || existing.gateNo || '', to: mapped.binNo });
      }
      if (mapped.locationType && mapped.locationType !== existing.locationType) {
        changes.push({ field: 'Location Type', from: existing.locationType || '', to: mapped.locationType });
      }
      if (mapped.cfaLocation && mapped.cfaLocation !== existing.cfaLocation) {
        changes.push({ field: 'Location', from: existing.cfaLocation || '', to: mapped.cfaLocation });
      }
      if (mapped.driverName && mapped.driverName !== existing.driverName) {
        changes.push({ field: 'Driver Name', from: existing.driverName || '', to: mapped.driverName });
      }
      if (mapped.driverMobile && mapped.driverMobile !== existing.driverMobile) {
        changes.push({ field: 'Driver Mobile', from: existing.driverMobile || '', to: mapped.driverMobile });
      }
      if (mapped.inDockTime && mapped.inDockTime !== existing.startTime) {
        changes.push({ field: 'In Dock Time (T2)', from: existing.startTime || '', to: mapped.inDockTime });
      }
      if (mapped.exitTime && mapped.exitTime !== existing.exitTime) {
        changes.push({ field: 'Exit Time (T3)', from: existing.exitTime || '', to: mapped.exitTime });
      }
      if (mapped.status && mapped.status !== existing.status) {
        changes.push({ field: 'Status', from: existing.status || '', to: mapped.status });
      }
      if (mapped.sealNo && mapped.sealNo !== existing.sealNo) {
        changes.push({ field: 'Seal No', from: existing.sealNo || '', to: mapped.sealNo });
      }
      if (mapped.invoiceNo && mapped.invoiceNo !== existing.invoiceNo) {
        changes.push({ field: 'Invoice No', from: existing.invoiceNo || '', to: mapped.invoiceNo });
      }
      if (mapped.lrNo && mapped.lrNo !== existing.lrNo) {
        changes.push({ field: 'LR No', from: existing.lrNo || '', to: mapped.lrNo });
      }

      // Update record with corrected data
      resultRecords[existingIndex] = {
        ...existing,
        transporterName: mapped.transporterName || existing.transporterName,
        operation: mapped.activityType || existing.operation,
        activityType: mapped.activityType || existing.activityType,
        supervisorName: mapped.supervisorName || existing.supervisorName,
        binNo: mapped.binNo || existing.binNo,
        gateNo: mapped.binNo || existing.gateNo,
        locationType: mapped.locationType || existing.locationType,
        cfaLocation: mapped.cfaLocation !== '' ? mapped.cfaLocation : existing.cfaLocation,
        driverName: mapped.driverName || existing.driverName,
        driverMobile: mapped.driverMobile || existing.driverMobile,
        startTime: mapped.inDockTime || existing.startTime,
        exitTime: mapped.exitTime || existing.exitTime,
        status: (mapped.status as DockStatus) || existing.status,
        sealNo: mapped.sealNo || existing.sealNo,
        invoiceNo: mapped.invoiceNo || existing.invoiceNo,
        lrNo: mapped.lrNo || existing.lrNo,
        remarks: mapped.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}${mapped.remarks}` : existing.remarks
      };

      if (changes.length > 0) {
        updatedRows.push({
          tokenId: existing.tokenId || existing.id,
          vehicleNo: existing.vehicleNo,
          changes
        });
        updatedCount++;
      }
    } else if (mode === 'merge_update') {
      // Add new record
      const newRec: DockRecord = {
        id: `DOCK-${Date.now().toString().slice(-4)}-${index + 1}`,
        tokenId: mapped.tokenId || `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
        unit: mapped.unit,
        gateNo: mapped.binNo,
        binNo: mapped.binNo,
        operation: mapped.activityType,
        activityType: mapped.activityType,
        vehicleNo: mapped.vehicleNo || 'UNKNOWN',
        driverName: mapped.driverName || 'Driver',
        driverMobile: mapped.driverMobile || '',
        transporterName: mapped.transporterName,
        locationType: mapped.locationType,
        cfaLocation: mapped.cfaLocation,
        supervisorName: mapped.supervisorName,
        inTime: mapped.inTime || new Date().toLocaleString('en-IN'),
        startTime: mapped.inDockTime || '',
        exitTime: mapped.exitTime || '',
        status: (mapped.status as DockStatus) || (mapped.exitTime ? (mapped.activityType === 'Unloading' ? 'Unloaded' : 'Loaded') : mapped.inDockTime ? 'In Progress (In Dock)' : 'Dock Assigned'),
        date: new Date().toLocaleDateString('en-IN'),
        podStatus: 'POD Clean',
        sealNo: mapped.sealNo || '',
        invoiceNo: mapped.invoiceNo || '',
        lrNo: mapped.lrNo || '',
        remarks: mapped.remarks || 'Imported via CSV/Excel'
      };
      resultRecords.unshift(newRec);
      newRows.push({ tokenId: newRec.tokenId || newRec.id, vehicleNo: newRec.vehicleNo });
      addedCount++;
    }
  });

  return {
    records: resultRecords,
    totalParsed: rawRows.length,
    updatedCount,
    addedCount,
    updatedRows,
    newRows,
    errors
  };
};
