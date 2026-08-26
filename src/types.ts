export type CompanyUnit = 'AHPL' | 'AIL' | 'AHPL & AIL';
export type MovementType = 'Inbound' | 'Outbound';
export type MovementStatus = 'Completed' | 'In-Progress' | 'Pending';

export type AppTab = 'loading' | 'live' | 'tracker' | 'plan' | 'reports' | 'analytics' | 'movement';

export type DockStatus = 'Completed' | 'In-Progress' | 'Gate-In Waiting' | 'Dock Assigned' | 'In Progress (In Dock)' | 'Loaded' | 'Unloaded';
export type DockOperation = 'Loading' | 'Unloading';

export type PlanExecutionStatus =
  | 'Pending'
  | 'Vehicle Placed'
  | 'In-Progress'
  | 'Executed / Dispatched'
  | 'Cancelled / Hold';

export type DispatchMode =
  | '32 Ft SXL'
  | '32 Ft MXL'
  | '24 Ft'
  | '20 Ft'
  | '14 Ft'
  | 'Tata Ace / Bolero'
  | 'Air Courier'
  | 'Surface Courier'
  | 'Part Load (PTL)'
  | string;

export interface DailyPlanRecord {
  id: string;
  planDate: string; // YYYY-MM-DD or DD/MM/YYYY
  company: 'AHPL' | 'AIL';
  destination: string; // Place of Plan Location / Destination (Dropdown)
  transporterName?: string; // Assigned Transport / Transporter Name (Optional)
  dispatchMode?: DispatchMode; // Vehicle Type / Feet (Optional)
  totalWeight: number | string; // Total Weight (KG) [Required]
  totalCft?: number | string; // Total CFT (Cubic Feet) [Optional]
  // Compatibility fields if present in existing records
  status?: PlanExecutionStatus;
  assignedDock?: string;
  totalInvoices?: number | string;
  totalBoxes?: number | string;
  awbOrDocketNo?: string;
  remarks?: string;
  vehicleNo?: string;
  driverName?: string;
  driverMobile?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type VehicleType =
  | '32 Ft Single Axle (SXL)'
  | '32 Ft Multi Axle (MXL)'
  | '32 Ft 15 MT'
  | '32 Ft 18 MT'
  | '24 Ft 9 MT'
  | 'PTL'
  | 'Local'
  | string;

export type TransporterName =
  | 'ICRL'
  | 'MATA'
  | 'OPM'
  | 'DHTC'
  | 'MCM'
  | 'FLY GREEN'
  | 'VARUNA'
  | 'JEET'
  | 'OTHER'
  | string;

export type PodStatus =
  | 'POD Clean'
  | 'POD Hold - Damage'
  | 'POD Hold - Insurance Claim'
  | 'POD Hold - Goods Not Unloaded / Shortage'
  | 'POD Hold - Goods Not Received'
  | 'POD Hold - Shortage'
  | string;

export const SUPERVISOR_ROSTER = [
  'Suman Singh',
  'Anup Pal',
  'Sandeep Brokar',
  'Kishore Sarlam',
  'R.K. Mishra',
  'Ankit Dayal',
  'Kanhaiya Patel',
  'Rahul Mangrola',
] as const;

export type SupervisorName = typeof SUPERVISOR_ROSTER[number] | string;

export const AHPL_DOCKS = ['Dock 01', 'Dock 02', 'Dock 03', 'Dock 04'] as const;
export const AIL_DOCKS = ['Dock 05', 'Dock 06', 'Dock 07', 'Dock 08', 'Dock 09'] as const;
export const ALL_DOCKS = ['Dock 01', 'Dock 02', 'Dock 03', 'Dock 04', 'Dock 05', 'Dock 06', 'Dock 07', 'Dock 08', 'Dock 09'] as const;

export function getDocksForCompany(company?: string): readonly string[] {
  if (!company) return [];
  const comp = company.toUpperCase();
  if (comp.includes('AIL')) {
    return AIL_DOCKS;
  }
  if (comp.includes('AHPL') || comp.includes('HPL')) {
    return AHPL_DOCKS;
  }
  return ALL_DOCKS;
}

export interface AttachedDocument {
  name: string;
  type: string;
  dataUrl?: string;
  size?: number;
}

export interface DockRecord {
  id: string;
  tokenId?: string;
  unit: CompanyUnit;
  gateNo: string;
  binNo?: string;
  operation: DockOperation;
  activityType?: DockOperation;
  vehicleType?: VehicleType;
  transporterName?: TransporterName;
  vehicleNo: string;
  driverName?: string;
  driverMobile?: string;
  locationType?: 'LL' | 'TP' | string;
  cfaLocation?: string;
  location?: string;
  sealNo?: string;
  invoiceNo?: string;
  lrNo?: string;
  podStatus?: PodStatus;
  attachedDoc?: AttachedDocument;
  supervisorName: string;
  inTime?: string; // Gate In / Security In-Time (Time 1)
  startTime: string; // In Dock Time (Time 2) or operation start
  exitTime?: string; // Loaded/Unloaded End Time (Time 3)
  status: DockStatus;
  date: string;
  remarks?: string;
}

export interface MovementRecord {
  id: string;
  timestamp: string;
  date: string;
  unit: CompanyUnit;
  type: MovementType;
  vehicleNo: string;
  skuDesc: string;
  qty: number;
  unitMeasure: string;
  status: MovementStatus;
  driverName?: string;
  driverPhone?: string;
  dockGate?: string;
  remarks?: string;
  challanNo?: string;
}

export interface StockSummary {
  ahplSkuCount: number;
  ahplAvailability: number;
  ailSkuCount: number;
  ailAvailability: number;
  todayInboundVehicles: number;
  inboundPendingCount: number;
  todayOutboundChallans: number;
  outboundCompletedCount: number;
}

export interface StockItem {
  id: string;
  code: string;
  name: string;
  company: 'AHPL' | 'AIL';
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  locationRack: string;
}

export type Language = 'hi' | 'en';
