import { DockRecord, CompanyUnit, DailyPlanRecord, PlanExecutionStatus } from '../types';

/**
 * 100% Live Google Sheets Synchronization Configuration
 * 
 * You can set your default Web App URL here or configure it directly
 * through the in-app Webhook / Live Sync settings panel.
 */
export const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";

const LOCAL_STORAGE_URL_KEY = 'ahpl_apps_script_url';

export function getActiveGoogleScriptUrl(): string {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_URL_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch (e) {
    console.warn('Could not read saved script URL', e);
  }
  return GOOGLE_SCRIPT_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL" ? GOOGLE_SCRIPT_URL : "";
}

export function setActiveGoogleScriptUrl(url: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_URL_KEY, url.trim());
  } catch (e) {
    console.warn('Could not save script URL', e);
  }
}

/**
 * Helper to map raw Google Sheet row or object to DailyPlanRecord
 */
export function mapSheetRowToDailyPlan(item: any, idx: number): DailyPlanRecord {
  const rawComp = (item.company || item.Company || item.unit || item.Unit || 'AHPL').toString().trim();
  let company: 'AHPL' | 'AIL' | 'Both (AHPL & AIL)' = 'AHPL';
  if (
    rawComp.toUpperCase().includes('BOTH') ||
    (rawComp.toUpperCase().includes('AHPL') && rawComp.toUpperCase().includes('AIL')) ||
    rawComp === 'Both' ||
    rawComp === 'AHPL & AIL'
  ) {
    company = 'Both (AHPL & AIL)';
  } else if (rawComp.toUpperCase().includes('AIL')) {
    company = 'AIL';
  } else {
    company = 'AHPL';
  }

  const defaultDock = company === 'Both (AHPL & AIL)' ? 'Dock 01 & Dock 05' : company === 'AIL' ? 'Dock 05' : 'Dock 01';

  let rawStatus = item.status || item.Status || 'Pending';
  const validStatuses: PlanExecutionStatus[] = [
    'Pending',
    'Vehicle Placed',
    'In-Progress',
    'Executed / Dispatched',
    'Cancelled / Hold',
  ];
  let status: PlanExecutionStatus = 'Pending';
  for (const vs of validStatuses) {
    if (rawStatus.toLowerCase().includes(vs.toLowerCase()) || vs.toLowerCase().includes(rawStatus.toLowerCase())) {
      status = vs;
      break;
    }
  }

  return {
    id: item.id || item.planId || item.PlanId || `PLAN-${idx + 1001}`,
    planDate: item.planDate || item.date || item.PlanDate || item.Date || new Date().toISOString().slice(0, 10),
    company: company,
    destination: item.destination || item.place || item.location || item.Destination || item.Place || '',
    transporterName: item.transporterName || item.transporter || item.Transporter || '',
    dispatchMode: item.dispatchMode || item.vehicleType || item.mode || item.DispatchMode || '',
    totalWeight: item.totalWeight || item.weight || item.Weight || '',
    totalCft: item.totalCft || item.cft || item.CFT || item.TotalCft || '',
    status: status,
    assignedDock: item.assignedDock || item.dock || item.Dock || defaultDock,
    totalInvoices: item.totalInvoices || item.invoices || item.Invoices || '',
    totalBoxes: item.totalBoxes || item.boxes || item.Boxes || '',
    awbOrDocketNo: item.awbOrDocketNo || item.awb || item.docketNo || item.AWB || item.DocketNo || '',
    remarks: item.remarks || item.Remarks || '',
    vehicleNo: item.vehicleNo || item.VehicleNo || '',
    driverName: item.driverName || item.DriverName || '',
    driverMobile: item.driverMobile || item.DriverMobile || '',
    createdAt: item.createdAt || item.timestamp || '',
    updatedAt: item.updatedAt || '',
  };
}

/**
 * FETCH all daily plans from Google Sheet
 */
export async function fetchLiveDailyPlans(customUrl?: string): Promise<{ success: boolean; plans: DailyPlanRecord[]; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, plans: [], error: 'Google Apps Script Web App URL is not configured.' };
  }

  try {
    const fetchUrl = url.includes('?') 
      ? `${url}&action=DAILY_PLAN_FETCH&t=${Date.now()}` 
      : `${url}?action=DAILY_PLAN_FETCH&t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    let rawList: any[] = [];

    if (json && Array.isArray(json.plans)) {
      rawList = json.plans;
    } else if (json && Array.isArray(json.data)) {
      rawList = json.data;
    } else if (Array.isArray(json)) {
      rawList = json;
    }

    const plans = rawList.map((item, idx) => mapSheetRowToDailyPlan(item, idx));
    return { success: true, plans };
  } catch (err: any) {
    console.error('Fetch Daily Plans failed:', err);
    return { success: false, plans: [], error: err.message || 'Failed to fetch daily plans from Google Sheet.' };
  }
}

/**
 * ADD a new Daily Plan directly to Google Sheets
 */
export async function addLiveDailyPlan(plan: DailyPlanRecord, customUrl?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  const payload = {
    action: 'DAILY_PLAN_ADD',
    plan: plan,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true, id: plan.id };
  } catch (err: any) {
    console.error('Add Daily Plan to Google Sheet failed:', err);
    return { success: false, error: err.message || 'Failed to send Daily Plan to Google Sheet.' };
  }
}

/**
 * BATCH ADD Daily Plans from CSV upload to Google Sheets
 */
export async function batchAddLiveDailyPlans(
  plans: DailyPlanRecord[],
  customUrl?: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  if (!plans || plans.length === 0) {
    return { success: true, count: 0 };
  }

  const payload = {
    action: 'DAILY_PLAN_BATCH_ADD',
    plans: plans,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true, count: plans.length };
  } catch (err: any) {
    console.error('Batch Add Daily Plans to Google Sheet failed:', err);
    return { success: false, error: err.message || 'Failed to send Batch Daily Plans to Google Sheet.' };
  }
}

/**
 * UPDATE an existing Daily Plan in Google Sheets
 */
export async function updateLiveDailyPlan(plan: DailyPlanRecord, customUrl?: string): Promise<{ success: boolean; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  const payload = {
    action: 'DAILY_PLAN_UPDATE',
    id: plan.id,
    plan: plan,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (err: any) {
    console.error('Update Daily Plan in Google Sheet failed:', err);
    return { success: false, error: err.message || 'Failed to update Daily Plan in Google Sheet.' };
  }
}

/**
 * DELETE a Daily Plan from Google Sheets
 */
export async function deleteLiveDailyPlan(id: string, customUrl?: string): Promise<{ success: boolean; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  const payload = {
    action: 'DAILY_PLAN_DELETE',
    id: id,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (err: any) {
    console.error('Delete Daily Plan from Google Sheet failed:', err);
    return { success: false, error: err.message || 'Failed to delete Daily Plan from Google Sheet.' };
  }
}

/**
 * BULK DELETE Daily Plans permanently from Google Sheets
 */
export async function bulkDeleteLiveDailyPlans(ids: string[], customUrl?: string): Promise<{ success: boolean; count?: number; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  if (!ids || ids.length === 0) {
    return { success: true, count: 0 };
  }

  const payload = {
    action: 'BULK_DELETE',
    target: 'DAILY_PLAN',
    sheet: 'Daily_Plan_Execution',
    ids: ids,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true, count: ids.length };
  } catch (err: any) {
    console.error('Bulk delete Daily Plans from Google Sheet failed:', err);
    return { success: false, error: err.message || 'Failed to bulk delete Daily Plans from Google Sheet.' };
  }
}

/**
 * Helper to map raw Google Sheet row or object to standard DockRecord
 */
export function mapSheetRowToDockRecord(item: any, idx: number): DockRecord {
  const rawStatus = (item.status || item.Status || '').trim();
  const isDone = rawStatus === 'Loaded' || rawStatus === 'Unloaded' || rawStatus === 'Completed';
  const isInProgress = rawStatus.includes('In Progress') || rawStatus.includes('Started') || rawStatus === 'In-Progress';

  const rawAct = item.activityType || item.purpose || item.operation || item.ActivityType || item.Purpose || '';
  const resolvedActivity: 'Loading' | 'Unloading' = 
    (rawAct === 'Unloading' || rawStatus.includes('Unloaded') || rawStatus.includes('Unloading')) 
      ? 'Unloading' 
      : 'Loading';

  let resolvedStatus = 'Dock Assigned';
  if (rawStatus === 'Loaded' || rawStatus === 'Unloaded' || rawStatus === 'Completed') {
    resolvedStatus = rawStatus === 'Completed' ? (resolvedActivity === 'Loading' ? 'Loaded' : 'Unloaded') : rawStatus;
  } else if (isDone) {
    resolvedStatus = resolvedActivity === 'Loading' ? 'Loaded' : 'Unloaded';
  } else if (isInProgress) {
    resolvedStatus = 'In Progress (In Dock)';
  } else if (rawStatus === 'Dock Assigned' || rawStatus === 'Gate-In Waiting') {
    resolvedStatus = rawStatus;
  } else {
    resolvedStatus = 'Dock Assigned';
  }

  const rawUnit = (item.unit || item.Unit || item.company || '').toUpperCase();
  const resolvedUnit: CompanyUnit = rawUnit.includes('AIL') ? 'AIL' : 'AHPL';

  const inTimeStr = item.inTime || item.InTime || item.timestamp || item.Timestamp || '';
  const dateStr = inTimeStr ? inTimeStr.split(' ')[0] : (item.date || new Date().toISOString().slice(0, 10));

  return {
    id: item.id || `SHEET-${item.tokenId || item.TokenId || idx + 100}`,
    tokenId: item.tokenId || item.TokenId || item.token || `TKN-${idx + 1000}`,
    unit: resolvedUnit,
    gateNo: item.binNo || item.dock || item.gateNo || item.Dock || (resolvedUnit === 'AIL' ? 'Dock 05' : 'Dock 01'),
    binNo: item.binNo || item.dock || item.Dock || '',
    operation: resolvedActivity,
    activityType: resolvedActivity,
    vehicleNo: (item.vehicleNo || item.vehicle || item.VehicleNo || '').toUpperCase(),
    driverName: item.driverName || item.driver || item.DriverName || '',
    driverMobile: item.driverMobile || item.mobile || item.DriverMobile || '',
    transporterName: item.transporter || item.transporterName || item.Transporter || 'MATA',
    locationType: item.locationType || item.LocationType || 'LL',
    cfaLocation: item.cfaLocation || item.location || item.CFALocation || '',
    location: item.location || item.cfaLocation || '',
    sealNo: item.sealNo || item.seal || item.SealNo || '',
    invoiceNo: item.invoiceNo || item.invoice || item.InvoiceNo || '',
    lrNo: item.lrNo || item.lr || item.LRNo || '',
    supervisorName: item.supervisor || item.supervisorName || item.Supervisor || 'Suman Singh',
    inTime: inTimeStr,
    startTime: item.startTime || item.inDockTime || item.InDockTime || '',
    exitTime: item.closeTime || item.exitTime || item.outTime || item.ExitTime || '',
    status: resolvedStatus as any,
    date: dateStr,
    podStatus: item.podStatus || item.PodStatus || 'POD Clean',
    remarks: item.remarks || item.Remarks || `Synced from Google Sheet (${rawStatus || 'Active'})`,
  };
}

/**
 * FETCH all live records from Google Sheet
 */
export async function fetchLiveSheetRecords(customUrl?: string): Promise<{ success: boolean; records: DockRecord[]; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, records: [], error: 'Google Apps Script Web App URL is not configured.' };
  }

  try {
    const fetchUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    let rawList: any[] = [];

    if (Array.isArray(json)) {
      rawList = json;
    } else if (json && Array.isArray(json.data)) {
      rawList = json.data;
    } else if (json && Array.isArray(json.records)) {
      rawList = json.records;
    }

    const records = rawList.map((item, idx) => mapSheetRowToDockRecord(item, idx));
    return { success: true, records };
  } catch (err: any) {
    console.error('Fetch Google Sheets failed:', err);
    return { success: false, records: [], error: err.message || 'Failed to fetch live data from Google Sheet.' };
  }
}

/**
 * ADD a new vehicle entry directly to Google Sheets
 */
export async function addLiveSheetRecord(record: Partial<DockRecord>, customUrl?: string): Promise<{ success: boolean; tokenId?: string; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateToday = now.toLocaleDateString('en-IN');
  const fullTimestamp = `${dateToday} ${timeStr}`;

  const defaultDock = record.unit === 'AIL' ? 'Dock 05' : 'Dock 01';

  const payload = {
    action: 'ADD',
    tokenId: record.tokenId || `TKN-${Math.floor(1000 + Math.random() * 9000)}`,
    inTime: record.inTime || fullTimestamp,
    vehicleNo: (record.vehicleNo || '').toUpperCase(),
    driverName: record.driverName || '',
    driverMobile: record.driverMobile || '',
    activityType: record.activityType || record.operation || 'Loading',
    purpose: record.activityType || record.operation || 'Loading',
    transporter: record.transporterName || 'MATA',
    locationType: record.locationType || 'LL',
    cfaLocation: record.cfaLocation || record.location || '',
    binNo: record.binNo || record.gateNo || defaultDock,
    dock: record.binNo || record.gateNo || defaultDock,
    supervisor: record.supervisorName || 'Suman Singh',
    unit: record.unit || 'AHPL',
    sealNo: record.sealNo || '',
    invoiceNo: record.invoiceNo || '',
    lrNo: record.lrNo || '',
    remarks: record.remarks || '',
    status: record.status || 'Dock Assigned',
    timestamp: fullTimestamp,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true, tokenId: payload.tokenId };
  } catch (err: any) {
    console.error('Add Google Sheets record failed:', err);
    return { success: false, error: err.message || 'Failed to submit record to Google Sheet.' };
  }
}

/**
 * UPDATE an existing row in Google Sheets
 */
export async function updateLiveSheetRecord(record: DockRecord, customUrl?: string): Promise<{ success: boolean; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  const payload = {
    action: 'UPDATE',
    id: record.id,
    tokenId: record.tokenId || record.id,
    record: {
      id: record.id,
      tokenId: record.tokenId,
      vehicleNo: record.vehicleNo,
      driverName: record.driverName,
      driverMobile: record.driverMobile,
      activityType: record.activityType || record.operation,
      transporter: record.transporterName,
      locationType: record.locationType,
      cfaLocation: record.cfaLocation || record.location,
      binNo: record.binNo || record.gateNo,
      supervisor: record.supervisorName,
      inTime: record.inTime,
      startTime: record.startTime,
      exitTime: record.exitTime,
      status: record.status,
      unit: record.unit,
      sealNo: record.sealNo,
      invoiceNo: record.invoiceNo,
      lrNo: record.lrNo,
      remarks: record.remarks,
    },
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (err: any) {
    console.error('Update Google Sheets record failed:', err);
    return { success: false, error: err.message || 'Failed to update record in Google Sheet.' };
  }
}

/**
 * DELETE a record permanently from Google Sheets
 */
export async function deleteLiveSheetRecord(id: string, tokenId?: string, customUrl?: string): Promise<{ success: boolean; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  const payload = {
    action: 'DELETE',
    id: id,
    tokenId: tokenId || id,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (err: any) {
    console.error('Delete Google Sheets record failed:', err);
    return { success: false, error: err.message || 'Failed to delete record from Google Sheet.' };
  }
}

/**
 * BULK DELETE records permanently from Google Sheets
 */
export async function bulkDeleteLiveSheetRecords(ids: string[], tokenIds?: string[], customUrl?: string): Promise<{ success: boolean; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  const payload = {
    action: 'BULK_DELETE',
    ids: ids,
    tokenIds: tokenIds || ids,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true };
  } catch (err: any) {
    console.error('Bulk delete Google Sheets records failed:', err);
    return { success: false, error: err.message || 'Failed to bulk delete from Google Sheet.' };
  }
}

/**
 * RESET_TO_EMPTY: Master Backend Action to wipe all data rows from Google Sheets
 * Preserves Row 1 headers intact and resets data row counts cleanly to 0.
 */
export async function resetSheetToEmpty(customUrl?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const url = (customUrl || getActiveGoogleScriptUrl()).trim();
  if (!url) {
    return { success: false, error: 'Google Apps Script Web App URL is not configured.' };
  }

  const payload = {
    action: 'RESET_TO_EMPTY',
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { success: true, message: 'Google Sheets wiped cleanly. Table count reset to 0.' };
  } catch (err: any) {
    console.error('Reset sheet to empty failed:', err);
    return { success: false, error: err.message || 'Failed to wipe data rows from Google Sheet.' };
  }
}

/**
 * Full Complete Google Apps Script (Code.gs) for deployment
 */
export const COMPLETE_GOOGLE_APPS_SCRIPT_CODE_GS = `/**
 * Google Apps Script for Logistics & Dock Operations Dashboard
 * Supports 100% Live Synchronization:
 * 1. Gate & Dock Operations (Sheet: Dock_Operations / Active)
 * 2. Daily Plan Execution (Sheet: Daily_Plan_Execution)
 * Deployed as Web App with access set to "Anyone".
 */

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dockSheet = getOrCreateSheet(ss, "Dock_Operations");
    var planSheet = getOrCreateSheet(ss, "Daily_Plan_Execution");
    ensureHeaders(dockSheet);
    ensurePlanHeaders(planSheet);

    var action = "FETCH";
    var payload = {};

    if (method === "POST" && e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
        action = payload.action || "FETCH";
      } catch (parseErr) {
        action = "FETCH";
      }
    } else if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action;
      payload = e.parameter;
    }

    // ==========================================
    // 0. MASTER RESET / WIPE TO EMPTY (Keeps Row 1 Headers Intact)
    // ==========================================
    if (action === "RESET_TO_EMPTY" || action === "WIPE_SHEET" || action === "CLEAR_ALL") {
      var dockLastRow = dockSheet.getLastRow();
      if (dockLastRow > 1) {
        dockSheet.deleteRows(2, dockLastRow - 1);
      }
      var planLastRow = planSheet.getLastRow();
      if (planLastRow > 1) {
        planSheet.deleteRows(2, planLastRow - 1);
      }
      ensureHeaders(dockSheet);
      ensurePlanHeaders(planSheet);
      return createJsonResponse({
        status: "success",
        message: "Google Sheets reset to clean empty state (Row 1 headers preserved).",
        count: 0
      });
    }

    // ==========================================
    // DAILY PLAN EXECUTION ACTIONS
    // ==========================================
    if (action === "DAILY_PLAN_FETCH" || action === "GET_DAILY_PLANS") {
      var plans = getAllDailyPlans(planSheet);
      return createJsonResponse({ status: "success", count: plans.length, plans: plans, data: plans });
    }

    if (action === "DAILY_PLAN_ADD") {
      var newPlan = insertDailyPlan(planSheet, payload.plan || payload);
      return createJsonResponse({ status: "success", message: "Daily Plan added successfully", id: newPlan.id, plan: newPlan });
    }

    if (action === "DAILY_PLAN_BATCH_ADD") {
      var batchPlans = payload.plans || [];
      var addedList = [];
      for (var b = 0; b < batchPlans.length; b++) {
        var added = insertDailyPlan(planSheet, batchPlans[b]);
        addedList.push(added);
      }
      return createJsonResponse({ status: "success", count: addedList.length, message: addedList.length + " daily plans added successfully", data: addedList });
    }

    if (action === "DAILY_PLAN_UPDATE") {
      var updatedPlan = updateDailyPlan(planSheet, payload);
      return createJsonResponse({ status: updatedPlan ? "success" : "not_found", message: updatedPlan ? "Plan updated" : "Plan not found" });
    }

    if (action === "DAILY_PLAN_DELETE") {
      var deletedPlan = deleteDailyPlan(planSheet, payload.id || payload.planId);
      return createJsonResponse({ status: deletedPlan ? "success" : "not_found", message: deletedPlan ? "Plan deleted" : "Plan not found" });
    }

    if (action === "DAILY_PLAN_BULK_DELETE") {
      var deletedCount = bulkDelete(planSheet, payload.ids || []);
      return createJsonResponse({ status: "success", count: deletedCount, message: deletedCount + " daily plans deleted" });
    }

    // ==========================================
    // DOCK OPERATIONS ACTIONS
    // ==========================================
    // 1. FETCH ALL DOCK RECORDS
    if (action === "FETCH" || action === "GET_ALL" || method === "GET") {
      var records = getAllRecords(dockSheet);
      return createJsonResponse({ status: "success", count: records.length, data: records });
    }

    // 2. ADD RECORD / SECURITY ENTRY
    if (action === "ADD" || action === "SECURITY_ENTRY" || action === "ADD_RECORD") {
      var newRecord = insertRecord(dockSheet, payload);
      return createJsonResponse({ status: "success", message: "Record added successfully", tokenId: newRecord.tokenId, data: newRecord });
    }

    // 3. UPDATE RECORD
    if (action === "UPDATE") {
      var updated = updateRecord(dockSheet, payload);
      return createJsonResponse({ status: updated ? "success" : "not_found", message: updated ? "Record updated successfully" : "Record not found" });
    }

    // 4. START IN-DOCK ACTIVITY (Time 2)
    if (action === "START_ACTIVITY") {
      var started = startActivity(dockSheet, payload);
      return createJsonResponse({ status: started ? "success" : "not_found", message: "Activity started in dock" });
    }

    // 5. CLOSE ACTIVITY (Time 3)
    if (action === "CLOSE_ACTIVITY") {
      var closed = closeActivity(dockSheet, payload);
      return createJsonResponse({ status: closed ? "success" : "not_found", message: "Activity closed successfully" });
    }

    // 6. DELETE RECORD (Permanent)
    if (action === "DELETE") {
      var deleted = deleteRecord(dockSheet, payload.id || payload.tokenId);
      return createJsonResponse({ status: deleted ? "success" : "not_found", message: deleted ? "Record deleted permanently" : "Record not found" });
    }

    // 7. BULK DELETE (Handles Dock and/or Daily Plan sheets)
    if (action === "BULK_DELETE") {
      var targetIds = payload.ids || payload.tokenIds || [];
      if (payload.sheet === "Daily_Plan_Execution" || payload.target === "DAILY_PLAN" || payload.type === "DAILY_PLAN") {
        var planDeletedCount = bulkDelete(planSheet, targetIds);
        return createJsonResponse({ status: "success", count: planDeletedCount, message: planDeletedCount + " daily plans deleted" });
      }
      var deletedDockCount = bulkDelete(dockSheet, targetIds);
      var deletedPlanCount = bulkDelete(planSheet, targetIds);
      var totalDeleted = deletedDockCount + deletedPlanCount;
      return createJsonResponse({ status: "success", count: totalDeleted, message: totalDeleted + " records deleted" });
    }

    // Default fallback
    var allData = getAllRecords(dockSheet);
    return createJsonResponse({ status: "success", data: allData });

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    if (sheetName === "Dock_Operations" && ss.getSheets().length > 0) {
      sheet = ss.getActiveSheet();
      sheet.setName("Dock_Operations");
    } else {
      sheet = ss.insertSheet(sheetName);
    }
  }
  return sheet;
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Token ID",
      "Date & In Time",
      "Vehicle No",
      "Driver Name",
      "Driver Mobile",
      "Purpose / Activity",
      "Transporter Name",
      "Location Type",
      "CFA / Destination",
      "Dock / Bay",
      "Supervisor Name",
      "In Dock Time (T2)",
      "Exit Time (T3)",
      "Status",
      "Seal No",
      "Invoice / LR No",
      "Remarks",
      "Unit"
    ]);
    sheet.getRange(1, 1, 1, 18).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
}

function ensurePlanHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Plan ID",
      "Plan Date",
      "Company",
      "Destination Location",
      "Transporter Name",
      "Vehicle Type / Feet",
      "Total Weight (KG)",
      "Total CFT",
      "Execution Status",
      "Assigned Dock",
      "Total Invoices",
      "Total Boxes",
      "AWB / Remarks",
      "Vehicle No",
      "Updated At"
    ]);
    sheet.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#1e3a8a").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
}

function getAllDailyPlans(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[3]) continue;

    list.push({
      id: String(r[0] || ""),
      planDate: String(r[1] || ""),
      company: String(r[2] || "AHPL"),
      destination: String(r[3] || ""),
      transporterName: String(r[4] || ""),
      dispatchMode: String(r[5] || ""),
      totalWeight: String(r[6] || ""),
      totalCft: String(r[7] || ""),
      status: String(r[8] || "Pending"),
      assignedDock: String(r[9] || "Dock 01"),
      totalInvoices: String(r[10] || ""),
      totalBoxes: String(r[11] || ""),
      awbOrDocketNo: String(r[12] || ""),
      remarks: String(r[12] || ""),
      vehicleNo: String(r[13] || ""),
      updatedAt: String(r[14] || "")
    });
  }
  return list;
}

function insertDailyPlan(sheet, data) {
  var now = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  var dateToday = new Date().toLocaleDateString("en-IN");
  var fullTimestamp = dateToday + " " + now;

  var planId = data.id || ("PLAN-" + Math.floor(1000 + Math.random() * 9000));
  var company = data.company || "AHPL";
  var defaultDock = company === "AIL" ? "Dock 05" : (company === "Both (AHPL & AIL)" ? "Dock 01 & Dock 05" : "Dock 01");

  sheet.appendRow([
    planId,
    data.planDate || dateToday,
    company,
    data.destination || "",
    data.transporterName || "",
    data.dispatchMode || "",
    data.totalWeight || "",
    data.totalCft || "",
    data.status || "Pending",
    data.assignedDock || defaultDock,
    data.totalInvoices || "",
    data.totalBoxes || "",
    data.awbOrDocketNo || data.remarks || "",
    data.vehicleNo || "",
    fullTimestamp
  ]);

  return {
    id: planId,
    planDate: data.planDate || dateToday,
    company: company,
    destination: data.destination || "",
    status: data.status || "Pending"
  };
}

function updateDailyPlan(sheet, payload) {
  var target = payload.id || (payload.plan && payload.plan.id);
  var plan = payload.plan || payload;
  var rows = sheet.getDataRange().getValues();
  var now = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  var fullTimestamp = new Date().toLocaleDateString("en-IN") + " " + now;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(target)) {
      var rowIdx = i + 1;
      if (plan.planDate) sheet.getRange(rowIdx, 2).setValue(plan.planDate);
      if (plan.company) sheet.getRange(rowIdx, 3).setValue(plan.company);
      if (plan.destination) sheet.getRange(rowIdx, 4).setValue(plan.destination);
      if (plan.transporterName !== undefined) sheet.getRange(rowIdx, 5).setValue(plan.transporterName);
      if (plan.dispatchMode !== undefined) sheet.getRange(rowIdx, 6).setValue(plan.dispatchMode);
      if (plan.totalWeight !== undefined) sheet.getRange(rowIdx, 7).setValue(plan.totalWeight);
      if (plan.totalCft !== undefined) sheet.getRange(rowIdx, 8).setValue(plan.totalCft);
      if (plan.status) sheet.getRange(rowIdx, 9).setValue(plan.status);
      if (plan.assignedDock) sheet.getRange(rowIdx, 10).setValue(plan.assignedDock);
      if (plan.totalInvoices !== undefined) sheet.getRange(rowIdx, 11).setValue(plan.totalInvoices);
      if (plan.totalBoxes !== undefined) sheet.getRange(rowIdx, 12).setValue(plan.totalBoxes);
      if (plan.awbOrDocketNo !== undefined || plan.remarks !== undefined) {
        sheet.getRange(rowIdx, 13).setValue(plan.awbOrDocketNo || plan.remarks || "");
      }
      if (plan.vehicleNo !== undefined) sheet.getRange(rowIdx, 14).setValue(plan.vehicleNo);
      sheet.getRange(rowIdx, 15).setValue(fullTimestamp);
      return true;
    }
  }
  return false;
}

function deleteDailyPlan(sheet, targetId) {
  if (!targetId) return false;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(targetId)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Token ID",
      "Date & In Time",
      "Vehicle No",
      "Driver Name",
      "Driver Mobile",
      "Purpose / Activity",
      "Transporter Name",
      "Location Type",
      "CFA / Destination",
      "Dock / Bay",
      "Supervisor Name",
      "In Dock Time (T2)",
      "Exit Time (T3)",
      "Status",
      "Seal No",
      "Invoice / LR No",
      "Remarks",
      "Unit"
    ]);
    sheet.getRange(1, 1, 1, 18).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
}

function getAllRecords(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[2]) continue; // Skip empty rows

    list.push({
      tokenId: String(r[0] || ""),
      inTime: String(r[1] || ""),
      vehicleNo: String(r[2] || ""),
      driverName: String(r[3] || ""),
      driverMobile: String(r[4] || ""),
      activityType: String(r[5] || "Loading"),
      transporter: String(r[6] || "MATA"),
      locationType: String(r[7] || "LL"),
      cfaLocation: String(r[8] || ""),
      binNo: String(r[9] || "Dock-01"),
      supervisor: String(r[10] || "Suman Singh"),
      startTime: String(r[11] || ""),
      closeTime: String(r[12] || ""),
      status: String(r[13] || "Dock Assigned"),
      sealNo: String(r[14] || ""),
      invoiceNo: String(r[15] || ""),
      remarks: String(r[16] || ""),
      unit: String(r[17] || "AHPL")
    });
  }
  return list;
}

function insertRecord(sheet, data) {
  var now = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  var dateToday = new Date().toLocaleDateString("en-IN");
  var fullTimestamp = dateToday + " " + now;

  var tokenId = data.tokenId || ("TKN-" + Math.floor(1000 + Math.random() * 9000));
  var vehicleNo = (data.vehicleNo || "").toUpperCase();
  var act = data.activityType || data.purpose || "Loading";
  var status = data.status || "Dock Assigned";

  sheet.appendRow([
    tokenId,
    data.inTime || fullTimestamp,
    vehicleNo,
    data.driverName || "",
    data.driverMobile || "",
    act,
    data.transporter || "MATA",
    data.locationType || "LL",
    data.cfaLocation || data.location || "",
    data.binNo || data.dock || "Dock-01",
    data.supervisor || "Suman Singh",
    data.startTime || "",
    data.exitTime || "",
    status,
    data.sealNo || "",
    data.invoiceNo || data.lrNo || "",
    data.remarks || "",
    data.unit || "AHPL"
  ]);

  return {
    tokenId: tokenId,
    vehicleNo: vehicleNo,
    inTime: data.inTime || fullTimestamp,
    status: status
  };
}

function updateRecord(sheet, payload) {
  var target = payload.tokenId || payload.id;
  var rec = payload.record || payload;
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(target) || String(rows[i][2]).toUpperCase() === String(rec.vehicleNo || "").toUpperCase()) {
      var rowIdx = i + 1;
      if (rec.vehicleNo) sheet.getRange(rowIdx, 3).setValue(rec.vehicleNo.toUpperCase());
      if (rec.driverName) sheet.getRange(rowIdx, 4).setValue(rec.driverName);
      if (rec.driverMobile) sheet.getRange(rowIdx, 5).setValue(rec.driverMobile);
      if (rec.activityType || rec.operation) sheet.getRange(rowIdx, 6).setValue(rec.activityType || rec.operation);
      if (rec.transporter || rec.transporterName) sheet.getRange(rowIdx, 7).setValue(rec.transporter || rec.transporterName);
      if (rec.locationType) sheet.getRange(rowIdx, 8).setValue(rec.locationType);
      if (rec.cfaLocation || rec.location) sheet.getRange(rowIdx, 9).setValue(rec.cfaLocation || rec.location);
      if (rec.binNo || rec.gateNo) sheet.getRange(rowIdx, 10).setValue(rec.binNo || rec.gateNo);
      if (rec.supervisor || rec.supervisorName) sheet.getRange(rowIdx, 11).setValue(rec.supervisor || rec.supervisorName);
      if (rec.startTime || rec.inDockTime) sheet.getRange(rowIdx, 12).setValue(rec.startTime || rec.inDockTime);
      if (rec.exitTime || rec.closeTime) sheet.getRange(rowIdx, 13).setValue(rec.exitTime || rec.closeTime);
      if (rec.status) sheet.getRange(rowIdx, 14).setValue(rec.status);
      if (rec.sealNo) sheet.getRange(rowIdx, 15).setValue(rec.sealNo);
      if (rec.invoiceNo || rec.lrNo) sheet.getRange(rowIdx, 16).setValue(rec.invoiceNo || rec.lrNo);
      if (rec.remarks) sheet.getRange(rowIdx, 17).setValue(rec.remarks);
      if (rec.unit) sheet.getRange(rowIdx, 18).setValue(rec.unit);
      return true;
    }
  }
  return false;
}

function startActivity(sheet, payload) {
  var target = payload.tokenId || payload.id;
  var now = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  var dateToday = new Date().toLocaleDateString("en-IN");
  var fullTimestamp = dateToday + " " + now;

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(target)) {
      var rowIdx = i + 1;
      sheet.getRange(rowIdx, 12).setValue(payload.startTime || fullTimestamp);
      sheet.getRange(rowIdx, 14).setValue("In Progress (In Dock)");
      if (payload.binNo || payload.gateNo) sheet.getRange(rowIdx, 10).setValue(payload.binNo || payload.gateNo);
      if (payload.supervisor) sheet.getRange(rowIdx, 11).setValue(payload.supervisor);
      return true;
    }
  }
  return false;
}

function closeActivity(sheet, payload) {
  var target = payload.tokenId || payload.id;
  var now = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  var dateToday = new Date().toLocaleDateString("en-IN");
  var fullTimestamp = dateToday + " " + now;

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(target)) {
      var rowIdx = i + 1;
      var act = rows[i][5] || "Loading";
      var finalStatus = payload.status || (act === "Loading" ? "Loaded" : "Unloaded");
      sheet.getRange(rowIdx, 13).setValue(payload.exitTime || fullTimestamp);
      sheet.getRange(rowIdx, 14).setValue(finalStatus);
      return true;
    }
  }
  return false;
}

function deleteRecord(sheet, targetId) {
  if (!targetId) return false;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(targetId) || String(rows[i][0]).indexOf(String(targetId)) !== -1) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function bulkDelete(sheet, targetIds) {
  if (!targetIds || !targetIds.length) return 0;
  var rows = sheet.getDataRange().getValues();
  var count = 0;

  // Loop backwards to keep indices valid when deleting rows
  for (var i = rows.length - 1; i >= 1; i--) {
    var rowToken = String(rows[i][0]);
    if (targetIds.indexOf(rowToken) !== -1) {
      sheet.deleteRow(i + 1);
      count++;
    }
  }
  return count;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
