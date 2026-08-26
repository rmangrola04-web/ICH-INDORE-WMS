import { ChangelogRelease } from '../types';

export const CURRENT_APP_VERSION = 'v2.4.0';

export const CHANGELOG_DATA: ChangelogRelease[] = [
  {
    version: 'v2.4.0',
    releaseDate: 'August 2026',
    type: 'major',
    typeLabel: 'Major Operational Release',
    highlight:
      'Executive Hub Dashboard with Excel parity, Combined AHPL & AIL load support, and Version History system.',
    isCurrentLive: true,
    features: [
      'Brand new Executive Hub Dashboard (Central Operations Overview) featuring live clock, KPI matrix, vehicle & transporter fleet utilization widgets, and daily inward/dispatch breakdown tables.',
      'AHPL & AIL Historical Trend Analysis with dual-axis multi-bar charts for Plan Counts, Placements, Unloading volume, and Placement Compliance % across the month.',
      'Combined "Both (AHPL & AIL)" shipment architecture enabling single-vehicle consolidated dispatches with dual-bay dock allocation (Dock 01–09).',
      'Integrated Version History & Changelog module with vertical milestone timeline and interactive What\'s New notification banner.',
    ],
    improvements: [
      'Removed legacy Warehouse Management Log in favor of the full-stack Executive Hub Dashboard.',
      'Strict dock bay segregation: Dock 01–04 for AHPL, Dock 05–09 for AIL, and flexible dual bays for Both.',
      'Live dynamic plan calculation with zero mock data fallback (sums and percentages calculated strictly from live Google Sheets).',
      'Enhanced vehicle type filters: SMV, 24 Ft, 32 Ft SXL, 32 Ft MXL, 16 MT, 18 MT, Air & Surface courier breakdowns.',
    ],
    bugfixes: [
      'Eradicated 154 ghost cached records with automatic storage flush on initialization.',
      'Fixed Google Apps Script doPost plan execution sync for multi-unit selection.',
      'Added Select All and Bulk Delete confirmation directly synchronized to live Google Sheets.',
    ],
  },
  {
    version: 'v2.3.0',
    releaseDate: 'August 2026',
    type: 'feature',
    typeLabel: 'Feature Release',
    highlight: 'Daily Plan Execution intake engine with custom destinations and live sheet sync.',
    features: [
      'Daily Plan Execution module with Master Checkbox, Select All, and Bulk Delete.',
      'Place of Plan destination dropdown with customizable entry.',
      'Dynamic CFT & Weight tracking with instant execution status toggle.',
    ],
    improvements: [
      'Streamlined intake modal with instant supervisor validation.',
      'Configured Google Apps Script to auto-append rows into "Daily Plans" tab.',
    ],
    bugfixes: [
      'Resolved CSV import parsing discrepancies for date formats.',
      'Fixed gate pass printable slip generation for dual-axle vehicles.',
    ],
  },
  {
    version: 'v2.2.0',
    releaseDate: 'August 2026',
    type: 'feature',
    typeLabel: 'Feature Release',
    highlight: 'Gate & Supervisor Movement Tracker with Loading/Unloading live pipelines.',
    features: [
      'Guard & Supervisor Tracker with real-time Gate-In and Bay Assignment.',
      'Two-way sync with Google Sheets for dock turnaround logs.',
      'Bilingual Hindi & English toggle across all operations screens.',
    ],
    improvements: [
      'Indore Central Hub supervisor roster integration.',
      'Live Turnaround time (TAT) calculation with color-coded threshold alerts.',
    ],
    bugfixes: [
      'Prevented accidental status overwrites during concurrent supervisor entries.',
    ],
  },
  {
    version: 'v2.1.0',
    releaseDate: 'August 2026',
    type: 'patch',
    typeLabel: 'Patch & Enhancements',
    highlight: 'Docks 01 to 09 layout refinement and live activity view.',
    features: [
      'Visual dock bay status cards with live vehicle assignment tags.',
      'Stock Inventory quick view modal with SKU category breakdown.',
    ],
    improvements: [
      'Optimized re-render performance for live clock and refresh timers.',
      'Enhanced Tailwind responsive grid for mobile tablets and widescreen monitors.',
    ],
    bugfixes: [
      'Fixed NaN display on empty weight fields in reports view.',
    ],
  },
  {
    version: 'v2.0.0',
    releaseDate: 'August 2026',
    type: 'major',
    typeLabel: 'Base Platform Release',
    highlight: 'Initial launch of Integrated Central Hub Indore dock management system.',
    features: [
      'Dock loading & unloading log with turnaround time tracking.',
      'Google Apps Script Web App live synchronization.',
      'Reports & POD status tracking with CSV export.',
    ],
    improvements: [
      'Modern high-contrast UI tailored for warehouse floor lighting.',
    ],
    bugfixes: [
      'Initial release baseline.',
    ],
  },
];
