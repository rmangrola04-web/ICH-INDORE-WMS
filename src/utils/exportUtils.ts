import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DockRecord } from '../types';

/**
 * 1. Single CSV File Export
 * Generates and downloads a clean, standard CSV file of Dock and Transport Operations.
 */
export const exportToCSV = (records: DockRecord[], filename?: string) => {
  const actualFilename =
    filename || `AHPL_AIL_Dock_Operations_Report_${new Date().toISOString().slice(0, 10)}.csv`;

  const headers = [
    'S.No',
    'Record ID',
    'Date',
    'Operating Unit',
    'Assigned Dock',
    'Operation',
    'Vehicle Number',
    'Vehicle Type',
    'Seal Number',
    'Invoice Number',
    'LR Number',
    'POD Status',
    'Transporter',
    'Supervisor',
    'Start Time',
    'Exit Time',
    'Status',
    'Remarks',
  ];

  const rows = records.map((r, idx) => [
    idx + 1,
    `"${r.id}"`,
    `"${r.date}"`,
    `"${r.unit}"`,
    `"${r.gateNo}"`,
    `"${r.operation}"`,
    `"${r.vehicleNo}"`,
    `"${r.vehicleType || ''}"`,
    `"${r.sealNo || ''}"`,
    `"${r.invoiceNo || ''}"`,
    `"${r.lrNo || ''}"`,
    `"${r.podStatus || 'POD Clean'}"`,
    `"${r.transporterName || ''}"`,
    `"${r.supervisorName}"`,
    `"${r.startTime}"`,
    `"${r.exitTime || '--'}"`,
    `"${r.status}"`,
    `"${(r.remarks || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', actualFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 2. Single PDF File Export
 * Generates and downloads a formatted PDF report of Dock and Transport Operations.
 */
export const exportToPDF = (records: DockRecord[], filename?: string) => {
  const actualFilename =
    filename || `AHPL_AIL_Operations_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('AHPL & AIL - Dock, Transport & POD Operations Report', 40, 40);

  // Subtitle & Meta
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated on: ${new Date().toLocaleString()} | Total Records: ${records.length} | Units: AHPL (Docks 1-4) & AIL (Docks 5-9)`,
    40,
    58
  );

  const tableHead = [
    [
      'ID',
      'Date',
      'Unit',
      'Dock',
      'Operation',
      'Vehicle No',
      'Seal No',
      'Inv / LR',
      'POD Status',
      'Transporter',
      'Supervisor',
      'Timings',
      'Status',
    ],
  ];

  const tableBody = records.map((r) => [
    r.id,
    r.date,
    r.unit,
    r.gateNo,
    r.operation,
    r.vehicleNo,
    r.sealNo || '--',
    r.invoiceNo ? `Inv: ${r.invoiceNo}` : r.lrNo ? `LR: ${r.lrNo}` : '--',
    r.podStatus || 'POD Clean',
    r.transporterName || 'ICRL',
    r.supervisorName,
    `${r.startTime} - ${r.exitTime || 'In-Dock'}`,
    r.status,
  ]);

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 75,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 55 },
      2: { cellWidth: 45 },
      3: { cellWidth: 45 },
      4: { cellWidth: 50 },
      5: { cellWidth: 70 },
      6: { cellWidth: 55 },
      7: { cellWidth: 65 },
      8: { cellWidth: 75 },
      9: { cellWidth: 60 },
      10: { cellWidth: 65 },
      11: { cellWidth: 65 },
      12: { cellWidth: 55 },
    },
    margin: { left: 40, right: 40 },
  });

  doc.save(actualFilename);
};
