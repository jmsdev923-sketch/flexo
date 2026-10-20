import { defineStore } from 'pinia';
import {
  fetchCatalogStyles,
  loginUser,
  fetchBranding,
  fetchSupportedSources,
  connectSource,
  computePivot,
  uploadDataFile,
  updateReport
} from '../services/api';

function createSmartDefaultSlice(fields = []) {
  const numFields = fields.filter(f => f.type === 'number');
  const strFields = fields.filter(f => f.type !== 'number');

  const isIdField = f => /^(cod|id|nit|numero|num|tipo_doc|despacho|barras)/i.test(f.name);
  const isMetricField = f => /valor|venta|sales|profit|total|costo|revenue|monto|precio|importe|peso/i.test(f.name);

  const nonIdNumbers = numFields.filter(f => !isIdField(f));
  const priorityNumbers = nonIdNumbers.filter(isMetricField);
  const chosenNumbers = priorityNumbers.length > 0 ? priorityNumbers : (nonIdNumbers.length > 0 ? nonIdNumbers : numFields);

  const isPriorityDimension = f => /grupo|categoria|nomcategoria|ciudad|region|departamento|vendedor|cliente/i.test(f.name);
  const priorityStr = strFields.filter(isPriorityDimension);
  const chosenStr = priorityStr.length > 0 ? [...priorityStr, ...strFields.filter(f => !isPriorityDimension(f))] : strFields;

  return {
    rows: chosenStr.slice(0, 2).map(f => f.name),
    columns: chosenStr.slice(2, 3).map(f => f.name),
    measures: chosenNumbers.slice(0, 2).map(f => ({
      field: f.name,
      aggregation: 'sum',
      caption: f.name.replace(/_/g, ' ')
    })),
    filters: []
  };
}

function createSmartChartSlice(fields = []) {
  const numFields = fields.filter(f => f.type === 'number');
  const strFields = fields.filter(f => f.type !== 'number');

  const isIdField = f => /^(cod|id|nit|numero|num|tipo_doc|despacho|barras)/i.test(f.name);
  const isMetricField = f => /valor|venta|sales|profit|total|costo|revenue|monto|precio|importe|peso/i.test(f.name);

  const nonIdNumbers = numFields.filter(f => !isIdField(f));
  const priorityNumbers = nonIdNumbers.filter(isMetricField);
  const chosenMetric = (priorityNumbers.length > 0 ? priorityNumbers[0] : (nonIdNumbers.length > 0 ? nonIdNumbers[0] : numFields[0]))?.name || 'valor_documento';

  const isPriorityDimension = f => /grupo|categoria|nomcategoria|ciudad|region|departamento|vendedor|cliente/i.test(f.name);
  const priorityStr = strFields.filter(isPriorityDimension);
  const chosenDim = (priorityStr.length > 0 ? priorityStr[0] : strFields[0])?.name || 'grupo';

  return {
    rows: chosenDim ? [chosenDim] : [],
    columns: [],
    measures: chosenMetric ? [{ field: chosenMetric, aggregation: 'sum', caption: chosenMetric.replace(/_/g, ' ') }] : [],
    filters: []
  };
}

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    // Auth & User Profile
    isAuthenticated: true,
    currentUser: {
      id: 'usr-1',
      username: 'admin',
      name: 'Juan Pérez (Administrador)',
      role: 'admin',
      allowedSources: ['*'],
      allowedChartStyles: ['*'],
      allowedTableStyles: ['*']
    },

    // Visual styles catalog & defaults
    catalogStyles: { chartStyles: [], tableStyles: [] },
    chartStyle: 'bar_vertical',

    // Branding
    branding: {
      companyName: 'flex_analytics',
      subtitle: 'Plataforma Analítica Multidimensional & Tablas Dinámicas',
      logoUrl: null
    },

    // Data Sources & Session
    availableSources: [],
    activeSourceId: null,
    sessionId: 'session-' + Date.now(),
    sourceName: '',
    fields: [],
    recordCount: 0,

    // Tables
    tables: [
      {
        id: 'table-1',
        title: 'Tabla Dinámica Principal',
        slice: {
          rows: [],
          columns: [],
          measures: [],
          filters: []
        },
        tableStyle: 'classic_grid',
        currencyFormat: true,
        result: null,
        loading: false
      }
    ],
    activeTableId: 'table-1',
    tableLayoutView: 'single',

    // Charts
    charts: [
      {
        id: 'chart-1',
        title: 'Gráfico Analítico',
        chartType: 'bar_vertical',
        slice: {
          rows: [],
          columns: [],
          measures: [],
          filters: []
        },
        currencyFormat: true,
        result: null,
        loading: false
      }
    ],
    activeChartId: 'chart-1',
    chartLayoutView: 'grid',

    // Conditional Rules
    conditionalRules: [],

    // Global layout & active view
    currentView: 'grid', // 'grid' | 'chart' | 'combined'
    isSidebarOpen: true,

    // Modals
    isSourceModalOpen: false,
    isAdminPanelOpen: false,
    isCalculatedModalOpen: false,
    isConditionalModalOpen: false,
    isReportsModalOpen: false,
    isCreateKpiModalOpen: false,
    preselectedKpiField: null,
    filterModalField: null,

    // KPI Cards
    kpis: [],

    // Current Loaded Report (Preliminary or Saved View)
    currentLoadedReport: null,

    loading: false
  }),

  getters: {
    isAdmin: (state) => state.currentUser?.role === 'admin',

    canEditLoadedReport: (state) => {
      if (!state.currentLoadedReport) return false;
      if (state.currentUser?.role === 'admin') return true;
      return Boolean(state.currentLoadedReport.canEdit);
    },

    isLoadedReportPreliminary: (state) => {
      return Boolean(state.currentLoadedReport?.isPreliminary);
    },

    activeTable: (state) => {
      return state.tables.find(t => t.id === state.activeTableId) || state.tables[0] || {
        id: 'table-default',
        title: 'Tabla Dinámica',
        slice: { rows: [], columns: [], measures: [], filters: [] },
        tableStyle: 'classic_grid',
        currencyFormat: true,
        result: null,
        loading: false
      };
    },

    activeChart: (state) => {
      return state.charts.find(c => c.id === state.activeChartId) || state.charts[0] || {
        id: 'chart-default',
        title: 'Gráfico Analítico',
        chartType: 'bar_vertical',
        slice: { rows: [], columns: [], measures: [], filters: [] },
        currencyFormat: true,
        result: null,
        loading: false
      };
    },

    userPermittedSources: (state) => {
      if (state.currentUser?.role === 'admin') return state.availableSources;
      if (state.currentUser?.allowedSources?.includes('*')) return state.availableSources;
      return state.availableSources.filter(s => state.currentUser?.allowedSources?.includes(s.id));
    },

    permittedTableStyles: (state) => {
      const styles = state.catalogStyles?.tableStyles || [];
      if (state.currentUser?.role === 'admin') return styles;
      if (state.currentUser?.allowedTableStyles?.includes('*')) return styles;
      return styles.filter(ts => state.currentUser?.allowedTableStyles?.includes(ts.id));
    },

    permittedChartStyles: (state) => {
      const styles = state.catalogStyles?.chartStyles || [];
      if (state.currentUser?.role === 'admin') return styles;
      if (state.currentUser?.allowedChartStyles?.includes('*')) return styles;
      return styles.filter(cs => state.currentUser?.allowedChartStyles?.includes(cs.id));
    },

    numberFields: (state) => (Array.isArray(state.fields) ? state.fields.filter(f => f.type === 'number') : []),
    dimensionFields: (state) => (Array.isArray(state.fields) ? state.fields.filter(f => f.type !== 'number') : [])
  },

  actions: {
    async init() {
      try {
        const [brandRes, stylesRes, sourcesRes] = await Promise.all([
          fetchBranding().catch(() => ({})),
          fetchCatalogStyles().catch(() => ({})),
          fetchSupportedSources(this.currentUser?.username || 'admin').catch(() => ({}))
        ]);

        if (brandRes?.success && brandRes.branding) this.branding = brandRes.branding;
        if (stylesRes?.success) {
          this.catalogStyles = {
            chartStyles: stylesRes.chartStyles || [],
            tableStyles: stylesRes.tableStyles || []
          };
        }
        if (sourcesRes?.success) {
          this.availableSources = sourcesRes.sources || [];
        }

        // If saved sources exist, connect the first saved real source
        if (this.availableSources.length > 0) {
          const first = this.availableSources[0];
          await this.connectToSource(first.type, first.config || {});
          this.activeSourceId = first.id;
          this.sourceName = first.name;
        }

        // Always start with the connection modal open requesting a connection and listing existing ones
        this.isSourceModalOpen = true;
      } catch (err) {
        console.error('Error during analytics store init:', err);
      }
    },

    async login(user) {
      this.currentUser = user;
      this.isAuthenticated = true;
      try {
        const sourcesRes = await fetchSupportedSources(user.username);
        if (sourcesRes.success) {
          this.availableSources = sourcesRes.sources;
          const allowed = this.userPermittedSources;
          if (allowed.length > 0 && !allowed.some(s => s.id === this.activeSourceId)) {
            await this.switchAssignedSource(allowed[0].id);
          }
        }
      } catch (err) {
        console.error('Error post-login:', err);
      }
    },

    logout() {
      this.isAuthenticated = false;
      this.currentUser = null;
    },

    async switchAssignedSource(sourceId) {
      const targetSource = this.availableSources.find(s => s.id === sourceId);
      if (!targetSource) return;

      this.activeSourceId = sourceId;
      this.sourceName = targetSource.name;
      await this.connectToSource(targetSource.type, targetSource.config || {});
    },

    async connectToSource(sourceType, config = {}) {
      try {
        this.loading = true;
        const res = await connectSource(sourceType, config, this.sessionId, this.currentUser?.username || 'admin');
        if (res.success) {
          const rawFields = Array.isArray(res.schema) ? res.schema : (res.schema?.fields || []);
          this.fields = rawFields;
          this.recordCount = res.recordCount || 0;
          this.sourceName = res.sourceName || this.sourceName;
          this.activeSourceId = res.sourceId || this.activeSourceId;

          // DO NOT auto-create tables or charts! User builds from scratch.
          for (const tbl of this.tables) {
            tbl.slice = { rows: [], columns: [], measures: [], filters: [] };
            tbl.result = null;
            tbl.loading = false;
          }

          for (const chr of this.charts) {
            chr.slice = { rows: [], columns: [], measures: [], filters: [] };
            chr.result = null;
            chr.loading = false;
          }

          // Recompute KPIs for the newly connected source if any exist
          await this.computeAllKpis();
        }
      } catch (err) {
        console.error('Error connecting to source:', err);
      } finally {
        this.loading = false;
      }
    },

    async handleFileUpload(file) {
      try {
        this.loading = true;
        const uploadRes = await uploadDataFile(file);
        if (uploadRes.success) {
          await this.connectToSource('file', {
            filePath: uploadRes.filePath,
            originalName: uploadRes.fileName
          });
          this.isSourceModalOpen = false;
        }
      } catch (err) {
        alert(`Error al subir archivo: ${err.message}`);
      } finally {
        this.loading = false;
      }
    },

    async computePivotForTable(tableId, slice) {
      const targetTable = this.tables.find(t => t.id === tableId);
      if (!targetTable) return;

      targetTable.slice = slice;
      targetTable.loading = true;

      const isBlank = (!slice.rows || slice.rows.length === 0) &&
                      (!slice.columns || slice.columns.length === 0) &&
                      (!slice.measures || slice.measures.length === 0);

      if (isBlank) {
        targetTable.result = null;
        targetTable.loading = false;
        return;
      }

      try {
        const res = await computePivot(slice, this.sessionId);
        if (res.success) {
          targetTable.result = res.result;
        }
      } catch (err) {
        console.error(`Error calculating table ${tableId}:`, err);
      } finally {
        targetTable.loading = false;
      }
    },

    async computePivotForChart(chartId, slice) {
      const targetChart = this.charts.find(c => c.id === chartId);
      if (!targetChart) return;

      targetChart.slice = slice;
      targetChart.loading = true;

      const isBlank = (!slice.rows || slice.rows.length === 0) &&
                      (!slice.measures || slice.measures.length === 0);

      if (isBlank) {
        targetChart.result = null;
        targetChart.loading = false;
        return;
      }

      try {
        const res = await computePivot(slice, this.sessionId);
        if (res.success) {
          targetChart.result = res.result;
        }
      } catch (err) {
        console.error(`Error calculating chart ${chartId}:`, err);
      } finally {
        targetChart.loading = false;
      }
    },

    addTable(type = 'blank') {
      const newId = `table-${Date.now()}`;
      const isBlank = type === 'blank';
      const newSlice = isBlank ? { rows: [], columns: [], measures: [], filters: [] } : createSmartDefaultSlice(this.fields);
      const newTable = {
        id: newId,
        title: `Tabla Dinámica ${this.tables.length + 1}`,
        slice: newSlice,
        tableStyle: 'classic_grid',
        currencyFormat: true,
        result: null,
        loading: false
      };

      this.tables.push(newTable);
      this.activeTableId = newId;

      if (!isBlank) {
        this.computePivotForTable(newId, newSlice);
      }
    },

    clearTable(tableId) {
      const blankSlice = { rows: [], columns: [], measures: [], filters: [] };
      this.computePivotForTable(tableId, blankSlice);
    },

    duplicateTable(tableId) {
      const sourceTable = this.tables.find(t => t.id === tableId) || this.activeTable;
      const newId = `table-${Date.now()}`;
      const duplicated = {
        ...sourceTable,
        id: newId,
        title: `Copia de ${sourceTable.title}`,
        slice: JSON.parse(JSON.stringify(sourceTable.slice)),
        result: sourceTable.result ? JSON.parse(JSON.stringify(sourceTable.result)) : null,
        loading: false
      };

      this.tables.push(duplicated);
      this.activeTableId = newId;
    },

    deleteTable(tableId) {
      if (this.tables.length <= 1) return;
      this.tables = this.tables.filter(t => t.id !== tableId);
      if (this.activeTableId === tableId) {
        this.activeTableId = this.tables[0].id;
      }
    },

    renameTable(tableId, newTitle) {
      const t = this.tables.find(item => item.id === tableId);
      if (t) t.title = newTitle;
    },

    addChart(type = 'blank') {
      const newId = `chart-${Date.now()}`;
      const isBlank = type === 'blank';
      const newSlice = isBlank ? { rows: [], columns: [], measures: [], filters: [] } : createSmartChartSlice(this.fields);
      const newChart = {
        id: newId,
        title: `Gráfico ${this.charts.length + 1}`,
        chartType: 'bar_vertical',
        slice: newSlice,
        currencyFormat: true,
        result: null,
        loading: false
      };

      this.charts.push(newChart);
      this.activeChartId = newId;

      if (!isBlank) {
        this.computePivotForChart(newId, newSlice);
      }
    },

    clearChart(chartId) {
      const blankSlice = { rows: [], columns: [], measures: [], filters: [] };
      this.computePivotForChart(chartId, blankSlice);
    },

    duplicateChart(chartId) {
      const sourceChart = this.charts.find(c => c.id === chartId) || this.activeChart;
      const newId = `chart-${Date.now()}`;
      const duplicated = {
        ...sourceChart,
        id: newId,
        title: `Copia de ${sourceChart.title}`,
        slice: JSON.parse(JSON.stringify(sourceChart.slice)),
        result: sourceChart.result ? JSON.parse(JSON.stringify(sourceChart.result)) : null,
        loading: false
      };

      this.charts.push(duplicated);
      this.activeChartId = newId;
    },

    deleteChart(chartId) {
      if (this.charts.length <= 1) return;
      this.charts = this.charts.filter(c => c.id !== chartId);
      if (this.activeChartId === chartId) {
        this.activeChartId = this.charts[0].id;
      }
    },

    renameChart(chartId, newTitle) {
      const c = this.charts.find(item => item.id === chartId);
      if (c) c.title = newTitle;
    },

    async addKpi({ title, field, aggregation = 'sum', format = 'currency', color = '#2563eb', icon = '🎯', subtitle = '' }) {
      const newId = `kpi-${Date.now()}`;
      const newKpi = {
        id: newId,
        title: title || `${aggregation.toUpperCase()} de ${field}`,
        field,
        aggregation,
        format,
        color,
        icon,
        subtitle: subtitle || `${aggregation.toUpperCase()} de ${field}`,
        value: 0,
        loading: false
      };
      this.kpis.push(newKpi);
      await this.computeKpi(newId);
      return newKpi;
    },

    deleteKpi(kpiId) {
      this.kpis = this.kpis.filter(k => k.id !== kpiId);
    },

    async computeKpi(kpiId) {
      const kpi = this.kpis.find(k => k.id === kpiId);
      if (!kpi || !kpi.field) return;

      kpi.loading = true;
      try {
        const slice = {
          rows: [],
          columns: [],
          measures: [{ field: kpi.field, aggregation: kpi.aggregation, caption: 'kpi_val' }],
          filters: []
        };
        const res = await computePivot(slice, this.sessionId);
        if (res.success && res.result) {
          const val = res.result.grandGrandTotals?.[0] ?? res.result.grandTotals?.[0] ?? 0;
          kpi.value = val;
        }
      } catch (err) {
        console.error(`Error computing KPI ${kpiId}:`, err);
      } finally {
        kpi.loading = false;
      }
    },

    async computeAllKpis() {
      for (const kpi of this.kpis) {
        await this.computeKpi(kpi.id);
      }
    },

    addCalculatedMeasure(measure) {
      // Add to fields list
      if (!this.fields.some(f => f.name === measure.name)) {
        this.fields.push({ name: measure.name, type: 'number', isCalculated: true });
      }

      // Add to active table slice
      const targetTable = this.activeTable;
      const nextSlice = {
        ...targetTable.slice,
        measures: [
          ...targetTable.slice.measures,
          {
            field: measure.name,
            aggregation: measure.aggregation || (measure.formula ? 'calc' : 'sum'),
            caption: measure.caption,
            formula: measure.formula
          }
        ]
      };
      this.computePivotForTable(targetTable.id, nextSlice);
    },

    applyFilter(fieldName, selectedValues) {
      const targetTable = this.activeTable;
      let nextFilters = [...(targetTable.slice.filters || [])];
      nextFilters = nextFilters.filter(f => f.field !== fieldName);

      if (selectedValues && selectedValues.length > 0) {
        nextFilters.push({ field: fieldName, include: selectedValues });
      }

      this.computePivotForTable(targetTable.id, {
        ...targetTable.slice,
        filters: nextFilters
      });
    },

    async loadReport(report) {
      if (!report) return;
      this.currentLoadedReport = report;

      // If report is tied to a specific data source and it differs from active
      if (report.sourceId && report.sourceId !== this.activeSourceId) {
        const canAccessSource = this.currentUser?.role === 'admin' ||
          this.userPermittedSources.some(s => s.id === report.sourceId);
        if (canAccessSource) {
          await this.switchAssignedSource(report.sourceId);
        }
      }

      // Configure active table
      const targetTable = this.activeTable;
      if (report.name) targetTable.title = report.name;
      if (report.tableStyle) targetTable.tableStyle = report.tableStyle;
      if (report.slice) {
        await this.computePivotForTable(targetTable.id, report.slice);
      }

      // Configure chart
      if (report.chartType) {
        this.chartStyle = report.chartType;
        this.activeChart.chartType = report.chartType;
      }
      if (report.slice) {
        await this.computePivotForChart(this.activeChart.id, {
          rows: report.slice.rows || [],
          columns: [],
          measures: report.slice.measures || [],
          filters: report.slice.filters || []
        });
      }

      // Configure conditional rules
      if (report.conditionalRules) {
        this.conditionalRules = JSON.parse(JSON.stringify(report.conditionalRules));
      }

      // Restore KPIs
      if (Array.isArray(report.kpis)) {
        this.kpis = JSON.parse(JSON.stringify(report.kpis));
        await this.computeAllKpis();
      }
    },

    clearLoadedReport() {
      this.currentLoadedReport = null;
    },

    async saveLoadedReportChanges() {
      if (!this.currentLoadedReport) {
        throw new Error('No hay ningún informe cargado actualmente.');
      }
      if (!this.canEditLoadedReport) {
        throw new Error('Acceso denegado: Tu rol solo tiene permiso de lectura sobre este informe.');
      }

      const payload = {
        name: this.currentLoadedReport.name,
        slice: this.activeTable.slice,
        tableStyle: this.activeTable.tableStyle,
        chartType: this.activeChart.chartType || this.chartStyle,
        conditionalRules: this.conditionalRules,
        kpis: this.kpis,
        username: this.currentUser?.username || 'admin'
      };

      const res = await updateReport(this.currentLoadedReport.id, payload);
      if (res.success && res.report) {
        this.currentLoadedReport = res.report;
        return res.report;
      }
      throw new Error(res?.error || 'Error al guardar cambios del informe');
    },

    exportCSV() {
      const activeResult = this.activeTable.result;
      if (!activeResult || !activeResult.matrix) {
        alert('No hay datos procesados para exportar');
        return;
      }

      const headers = [
        activeResult.rows.join(' / ') || 'Filas',
        ...activeResult.columnDefinitions.map(c => `"${c.headerLabel}"`)
      ].join(',');

      const rows = activeResult.matrix.map(r => {
        const rowLabel = `"${r.rowParts.join(' - ')}"`;
        const vals = r.values.map(v => (v !== null && v !== undefined ? v : ''));
        return [rowLabel, ...vals].join(',');
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `flex_analytics_${this.activeTable.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    exportJSON() {
      const activeResult = this.activeTable.result;
      if (!activeResult) {
        alert('No hay datos disponibles para exportar');
        return;
      }

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeResult, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `flex_analytics_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    },

    printView() {
      window.print();
    }
  }
});
