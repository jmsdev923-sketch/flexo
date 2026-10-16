/**
 * ReportService - Manages saved analytics views, slices and reports
 */

let savedReports = [
  {
    id: 'rep-1',
    name: 'Resumen Ejecutivo por Región y Categoría',
    createdBy: 'admin',
    createdAt: '2026-03-15T10:00:00Z',
    sourceType: 'demo',
    slice: {
      rows: ['region', 'country'],
      columns: ['category'],
      measures: [
        { field: 'sales', aggregation: 'sum', caption: 'Ventas Totales' },
        { field: 'profit', aggregation: 'sum', caption: 'Utilidad Neta' }
      ],
      filters: []
    },
    conditionalRules: [
      { measureField: 'profit', operator: 'lt', value: 2000, bgColor: '#fee2e2', textColor: '#991b1b' },
      { measureField: 'sales', operator: 'gt', value: 40000, bgColor: '#dcfce7', textColor: '#166534' }
    ]
  },
  {
    id: 'rep-2',
    name: 'Análisis Trimestral de Rentabilidad',
    createdBy: 'analista_ventas',
    createdAt: '2026-03-20T14:30:00Z',
    sourceType: 'demo',
    slice: {
      rows: ['year', 'quarter'],
      columns: ['region'],
      measures: [
        { field: 'sales', aggregation: 'sum', caption: 'Ventas' },
        { field: 'margin_pct', aggregation: 'calc', caption: 'Margen %', formula: '([profit] / [sales]) * 100' }
      ],
      filters: []
    },
    conditionalRules: []
  }
];

class ReportService {
  static getReports(username = 'admin') {
    return savedReports;
  }

  static getReportById(reportId) {
    return savedReports.find(r => r.id === reportId);
  }

  static saveReport({ name, slice, conditionalRules = [], sourceType = 'demo', username = 'admin' }) {
    const newReport = {
      id: `rep-${Date.now()}`,
      name,
      createdBy: username,
      createdAt: new Date().toISOString(),
      sourceType,
      slice,
      conditionalRules
    };
    savedReports.push(newReport);
    return newReport;
  }

  static deleteReport(reportId) {
    savedReports = savedReports.filter(r => r.id !== reportId);
    return true;
  }
}

module.exports = ReportService;
