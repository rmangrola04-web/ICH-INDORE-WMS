export type CompanyUnit = 'AHPL' | 'AIL' | 'AHPL & AIL';
export type MovementType = 'Inbound' | 'Outbound';
export type MovementStatus = 'Completed' | 'In-Progress' | 'Pending';

export type AppTab = 'loading' | 'live' | 'tracker' | 'reports' | 'analytics' | 'movement';

export type DockStatus = 'Completed' | 'In-Progress' | 'Gate-In Waiting' | 'Dock Assigned' | 'In Progress (In Dock)' | 'Loaded' | 'Unloaded';
export type DockOperation = 'Loading' | 'Unloading';

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
  'Kishore Sarlam',
  'R.K. Mishra',
  'Sandeep Borkar',
  'Ankit Dayal',
  'Varun Swami',
  'Kanhaiya Patel',
  'Deepesh Sethi',
  'Rahul Prajapati',
] as const;

export type SupervisorName = typeof SUPERVISOR_ROSTER[number] | string;

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
