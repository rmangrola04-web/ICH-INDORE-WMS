import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DockRecord } from '../types';

export const exportToExcel = (records: DockRecord[], filename: string = 'AHPL_AIL_Operations_Log.xlsx') => {
  const data = records.map((r, idx) => ({
    'S.No': idx + 1,
    'Record ID': r.id,
    'Date': r.date,
    'Operating Unit': r.unit,
    'Assigned Dock': r.gateNo,
    'Operation': r.operation,
    'Vehicle Number': r.vehicleNo,
    'Vehicle Type': r.vehicleType || '32 Ft SXL',
    'Seal Number': r.sealNo || 'N/A',
    'Invoice Number': r.invoiceNo || 'N/A',
    'LR Number': r.lrNo || 'N/A',
    'POD Status': r.podStatus || 'POD Clean',
    'Transporter': r.transporterName || 'ICRL',
    'Supervisor': r.supervisorName,
    'Start Time': r.startTime,
    'Exit Time': r.exitTime || '--',
    'Status': r.status,
    'Attached Doc': r.attachedDoc ? r.attachedDoc.name : 'None',
    'Remarks': r.remarks || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dock & POD Log');

  // Auto-width columns
  const maxProps = Object.keys(data[0] || {});
  const colWidths = maxProps.map((key) => ({
    wch: Math.max(key.length, 14),
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = (records: DockRecord[], filename: string = 'AHPL_AIL_Operations_Report.pdf') => {
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

  doc.save(filename);
};

export const generateHTMLReport = (records: DockRecord[]): string => {
  const rowsHtml = records
    .map(
      (r, idx) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${idx + 1}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${r.id}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${r.date}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${r.unit}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #4338ca;">${r.gateNo}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${r.operation}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; font-family: monospace;">${r.vehicleNo}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${r.sealNo || '--'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${r.invoiceNo || '--'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${r.lrNo || '--'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; color: ${
        r.podStatus === 'POD Clean' ? '#047857' : '#b91c1c'
      }; font-weight: bold;">${r.podStatus || 'POD Clean'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${r.transporterName || 'ICRL'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${r.supervisorName}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">${r.startTime} → ${r.exitTime || '--:--'}</td>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${r.status}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AHPL & AIL - Dock & Transport Operations Export Log</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #1e293b; background: #f8fafc; }
    h1 { color: #0f172a; margin-bottom: 4px; font-size: 20px; }
    p.meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; background: #ffffff; font-size: 12px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 8px; border: 1px solid #0f172a; font-size: 11px; text-transform: uppercase; }
    tr:nth-child(even) { background-color: #f1f5f9; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>AHPL & AIL - Dock, Transport & POD Operations Hub</h1>
  <p class="meta">Export Generated: ${new Date().toLocaleString()} | Total Records: ${records.length} | Docks: AHPL (1-4) & AIL (5-9)</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>ID</th>
        <th>Date</th>
        <th>Unit</th>
        <th>Dock</th>
        <th>Operation</th>
        <th>Vehicle No</th>
        <th>Seal No</th>
        <th>Invoice</th>
        <th>LR No</th>
        <th>POD Status</th>
        <th>Transporter</th>
        <th>Supervisor</th>
        <th>Timing</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;
};

export const downloadHTMLReport = (records: DockRecord[], filename: string = 'AHPL_AIL_Operations_Report.html') => {
  const html = generateHTMLReport(records);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadStandaloneAppHTML = async (filename: string = 'index.html') => {
  try {
    const res = await fetch('/standalone.html');
    if (res.ok) {
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }
  } catch (err) {
    console.error('Fetch failed, falling back to direct open', err);
  }
  window.open('/standalone.html', '_blank');
};

