import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { FieldsPanel } from './components/FieldsPanel';
import { PivotGrid } from './components/PivotGrid';
import { PivotChart } from './components/PivotChart';
import { DashboardCombinedView } from './components/DashboardCombinedView';
import { DataSourceModal } from './components/DataSourceModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { CalculatedMeasureModal } from './components/CalculatedMeasureModal';
import { ConditionalFormatModal } from './components/ConditionalFormatModal';
import { DimensionFilterModal } from './components/DimensionFilterModal';
import { SavedReportsModal } from './components/SavedReportsModal';
import { LoginScreen } from './components/LoginScreen';
import { MultiTableTabBar } from './components/MultiTableTabBar';
import { MultiChartTabBar } from './components/MultiChartTabBar';
import {
  fetchSupportedSources,
  connectSource,
  computePivot,
  uploadDataFile,
  fetchBranding,
  fetchCatalogStyles
} from './services/api';

function createSmartDefaultSlice(fields = []) {
  const numFields = fields.filter(f => f.type === 'number');
  const strFields = fields.filter(f => f.type !== 'number');

  // Filter out ID/code columns like codigo, barras, nit, etc. for meaningful default metrics
  const isIdField = f => /^(cod|id|nit|numero|num|tipo_doc|despacho|barras)/i.test(f.name);
  const isMetricField = f => /valor|venta|sales|profit|total|costo|revenue|monto|precio|importe|peso/i.test(f.name);

  const nonIdNumbers = numFields.filter(f => !isIdField(f));
  const priorityNumbers = nonIdNumbers.filter(isMetricField);
  const chosenNumbers = priorityNumbers.length > 0 ? priorityNumbers : (nonIdNumbers.length > 0 ? nonIdNumbers : numFields);

  // For dimensions, prioritize business categories: grupo, categoria, ciudad, region, cliente, vendedor
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

export default function App() {
  // Session & Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    id: 'usr-1',
    username: 'admin',
    name: 'Juan Pérez (Administrador)',
    role: 'admin',
    allowedSources: ['*'],
    allowedChartStyles: ['*'],
    allowedTableStyles: ['*']
  });

  // Visual Styles Catalog and active user selection
  const [catalogStyles, setCatalogStyles] = useState({ chartStyles: [], tableStyles: [] });
  const [chartStyle, setChartStyle] = useState('bar_vertical');

  // Company Branding state
  const [branding, setBranding] = useState({
    companyName: 'flex_analytics',
    subtitle: 'Plataforma Analítica Multidimensional & Tablas Dinámicas',
    logoUrl: null
  });

  const [availableSources, setAvailableSources] = useState([]);
  const [activeSourceId, setActiveSourceId] = useState('demo');
  const [sessionId, setSessionId] = useState('session-' + Date.now());
  const [sourceName, setSourceName] = useState('Demo Ventas Globales');
  const [fields, setFields] = useState([]);
  const [recordCount, setRecordCount] = useState(0);

  // ----------------------------------------------------
  // MULTI-TABLE STATE (Supports multiple dynamic tables & blank tables)
  // ----------------------------------------------------
  const [tables, setTables] = useState([
    {
      id: 'table-1',
      title: 'Tabla Dinámica Principal',
      slice: {
        rows: ['grupo'],
        columns: ['nomcategoria'],
        measures: [
          { field: 'valor_documento', aggregation: 'sum', caption: 'Valor Documento' },
          { field: 'costo_de_venta', aggregation: 'sum', caption: 'Costo de Venta' }
        ],
        filters: []
      },
      tableStyle: 'classic_grid',
      currencyFormat: true,
      result: null,
      loading: false
    }
  ]);
  const [activeTableId, setActiveTableId] = useState('table-1');
  const [tableLayoutView, setTableLayoutView] = useState('single'); // 'single' | 'grid'

  // ----------------------------------------------------
  // MULTI-CHART STATE (Supports multiple dynamic charts & blank charts in a panel)
  // ----------------------------------------------------
  const [charts, setCharts] = useState([
    {
      id: 'chart-1',
      title: 'Gráfico 1: Ventas por Grupo',
      chartType: 'bar_vertical',
      slice: {
        rows: ['grupo'],
        columns: [],
        measures: [
          { field: 'valor_documento', aggregation: 'sum', caption: 'Valor Documento' }
        ],
        filters: []
      },
      currencyFormat: true,
      result: null,
      loading: false
    }
  ]);
  const [activeChartId, setActiveChartId] = useState('chart-1');
  const [chartLayoutView, setChartLayoutView] = useState('grid'); // 'single' | 'grid'

  // Conditional Formatting Rules
  const [conditionalRules, setConditionalRules] = useState([
    { id: 'rule-demo-1', measureField: 'profit', operator: 'lt', value: 3000, bgColor: '#fee2e2', textColor: '#991b1b' },
    { id: 'rule-demo-2', measureField: 'sales', operator: 'gt', value: 35000, bgColor: '#dcfce7', textColor: '#166534' }
  ]);

  const [currentView, setCurrentView] = useState('grid'); // 'combined' | 'grid' | 'chart'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals state
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isCalculatedModalOpen, setIsCalculatedModalOpen] = useState(false);
  const [isConditionalModalOpen, setIsConditionalModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [filterModalField, setFilterModalField] = useState(null);

  const [loading, setLoading] = useState(false);

  // Get current active table object safely
  const activeTable = tables.find(t => t.id === activeTableId) || tables[0] || {
    id: 'table-default',
    title: 'Tabla Dinámica',
    slice: { rows: [], columns: [], measures: [], filters: [] },
    tableStyle: 'classic_grid',
    currencyFormat: true,
    result: null,
    loading: false
  };

  // Get current active chart object safely
  const activeChart = charts.find(c => c.id === activeChartId) || charts[0] || {
    id: 'chart-default',
    title: 'Gráfico Analítico',
    chartType: 'bar_vertical',
    slice: { rows: [], columns: [], measures: [], filters: [] },
    currencyFormat: true,
    result: null,
    loading: false
  };

  const slice = activeTable.slice;
  const pivotResult = activeTable.result;
  const tableStyle = activeTable.tableStyle;
  const currencyFormat = activeTable.currencyFormat;

  // Load Branding and Catalog Styles on mount
  useEffect(() => {
    Promise.all([fetchBranding(), fetchCatalogStyles()])
      .then(([brandRes, stylesRes]) => {
        if (brandRes.success && brandRes.branding) setBranding(brandRes.branding);
        if (stylesRes.success) {
          setCatalogStyles({
            chartStyles: stylesRes.chartStyles || [],
            tableStyles: stylesRes.tableStyles || []
          });
        }
      })
      .catch(err => console.error('Error cargando configuración inicial:', err));
  }, []);

  // ----------------------------------------------------
  // MULTI-TABLE OPERATIONS & CALCULATION
  // ----------------------------------------------------
  const handleSliceChangeForTable = useCallback(async (tableId, newSlice) => {
    // 1. Immediately update slice in table state
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, slice: newSlice, loading: true };
      }
      return t;
    }));

    // 2. Check if table is blank
    const isBlank = (!newSlice.rows || newSlice.rows.length === 0) &&
                    (!newSlice.columns || newSlice.columns.length === 0) &&
                    (!newSlice.measures || newSlice.measures.length === 0);

    if (isBlank) {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, result: null, loading: false } : t));
      return;
    }

    // 3. Compute pivot for this table
    try {
      const res = await computePivot(newSlice, sessionId);
      if (res.success) {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, result: res.result, loading: false } : t));
      }
    } catch (err) {
      console.error(`Error calculando tabla ${tableId}:`, err);
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, loading: false } : t));
    }
  }, [sessionId]);

  const handleAddTable = (type = 'blank') => {
    const newId = `table-${Date.now()}`;
    const isBlank = type === 'blank';
    const newSlice = isBlank ? { rows: [], columns: [], measures: [], filters: [] } : createSmartDefaultSlice(fields);
    const newTable = {
      id: newId,
      title: `Tabla Dinámica ${tables.length + 1}${isBlank ? ' (En Blanco)' : ''}`,
      slice: newSlice,
      tableStyle: 'classic_grid',
      currencyFormat: true,
      result: null,
      loading: false
    };

    setTables(prev => [...prev, newTable]);
    setActiveTableId(newId);

    if (!isBlank) {
      handleSliceChangeForTable(newId, newSlice);
    }
  };

  const handleClearTable = (tableId) => {
    const blankSlice = { rows: [], columns: [], measures: [], filters: [] };
    handleSliceChangeForTable(tableId, blankSlice);
  };

  const handleDuplicateTable = (tableId) => {
    const sourceTable = tables.find(t => t.id === tableId) || activeTable;
    const newId = `table-${Date.now()}`;
    const clonedSlice = JSON.parse(JSON.stringify(sourceTable.slice));
    const duplicated = {
      ...sourceTable,
      id: newId,
      title: `Copia de ${sourceTable.title}`,
      slice: clonedSlice,
      result: sourceTable.result ? JSON.parse(JSON.stringify(sourceTable.result)) : null,
      loading: false
    };

    setTables(prev => [...prev, duplicated]);
    setActiveTableId(newId);
  };

  const handleDeleteTable = (tableId) => {
    if (tables.length <= 1) return;
    const remaining = tables.filter(t => t.id !== tableId);
    setTables(remaining);
    if (activeTableId === tableId) {
      setActiveTableId(remaining[0].id);
    }
  };

  const handleRenameTable = (tableId, newTitle) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, title: newTitle } : t));
  };

  const handleTableStyleChangeForTable = (tableId, newStyle) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, tableStyle: newStyle } : t));
  };

  const handleToggleCurrencyForTable = (tableId) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, currencyFormat: !t.currencyFormat } : t));
  };

  // Recompute active table when session changes or first loaded
  useEffect(() => {
    if (activeTable && !activeTable.result && !activeTable.loading) {
      const isBlank = (!activeTable.slice.rows || activeTable.slice.rows.length === 0) &&
                      (!activeTable.slice.columns || activeTable.slice.columns.length === 0) &&
                      (!activeTable.slice.measures || activeTable.slice.measures.length === 0);
      if (!isBlank) {
        handleSliceChangeForTable(activeTable.id, activeTable.slice);
      }
    }
  }, [activeTable, sessionId, handleSliceChangeForTable]);

  // ----------------------------------------------------
  // MULTI-CHART OPERATIONS & CALCULATION (Exact same logic as tables)
  // ----------------------------------------------------
  const handleSliceChangeForChart = useCallback(async (chartId, newSlice) => {
    // 1. Immediately update slice in chart state
    setCharts(prev => prev.map(c => {
      if (c.id === chartId) {
        return { ...c, slice: newSlice, loading: true };
      }
      return c;
    }));

    // 2. Check if chart is blank (no dimensions and no measures)
    const isBlank = (!newSlice.rows || newSlice.rows.length === 0) &&
                    (!newSlice.measures || newSlice.measures.length === 0);

    if (isBlank) {
      setCharts(prev => prev.map(c => c.id === chartId ? { ...c, result: null, loading: false } : c));
      return;
    }

    // 3. Compute pivot for this chart
    try {
      const res = await computePivot(newSlice, sessionId);
      if (res.success) {
        setCharts(prev => prev.map(c => c.id === chartId ? { ...c, result: res.result, loading: false } : c));
      }
    } catch (err) {
      console.error(`Error calculando gráfico ${chartId}:`, err);
      setCharts(prev => prev.map(c => c.id === chartId ? { ...c, loading: false } : c));
    }
  }, [sessionId]);

  const handleAddChart = (type = 'blank') => {
    const newId = `chart-${Date.now()}`;
    const isBlank = type === 'blank';
    const newSlice = isBlank ? { rows: [], columns: [], measures: [], filters: [] } : createSmartChartSlice(fields);
    const newChart = {
      id: newId,
      title: `Gráfico ${charts.length + 1}${isBlank ? ' (En Blanco)' : ''}`,
      chartType: 'bar_vertical',
      slice: newSlice,
      currencyFormat: true,
      result: null,
      loading: false
    };

    setCharts(prev => [...prev, newChart]);
    setActiveChartId(newId);

    if (!isBlank) {
      handleSliceChangeForChart(newId, newSlice);
    }
  };

  const handleClearChart = (chartId) => {
    const blankSlice = { rows: [], columns: [], measures: [], filters: [] };
    handleSliceChangeForChart(chartId, blankSlice);
  };

  const handleDuplicateChart = (chartId) => {
    const sourceChart = charts.find(c => c.id === chartId) || activeChart;
    const newId = `chart-${Date.now()}`;
    const clonedSlice = JSON.parse(JSON.stringify(sourceChart.slice));
    const duplicated = {
      ...sourceChart,
      id: newId,
      title: `Copia de ${sourceChart.title}`,
      slice: clonedSlice,
      result: sourceChart.result ? JSON.parse(JSON.stringify(sourceChart.result)) : null,
      loading: false
    };

    setCharts(prev => [...prev, duplicated]);
    setActiveChartId(newId);
  };

  const handleDeleteChart = (chartId) => {
    if (charts.length <= 1) return;
    const remaining = charts.filter(c => c.id !== chartId);
    setCharts(remaining);
    if (activeChartId === chartId) {
      setActiveChartId(remaining[0].id);
    }
  };

  const handleRenameChart = (chartId, newTitle) => {
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, title: newTitle } : c));
  };

  const handleChartTypeChangeForChart = (chartId, newType) => {
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, chartType: newType } : c));
  };

  const handleToggleCurrencyForChart = (chartId) => {
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, currencyFormat: !c.currencyFormat } : c));
  };

  // Recompute active chart when session changes or first loaded
  useEffect(() => {
    if (activeChart && !activeChart.result && !activeChart.loading) {
      const isBlank = (!activeChart.slice.rows || activeChart.slice.rows.length === 0) &&
                      (!activeChart.slice.measures || activeChart.slice.measures.length === 0);
      if (!isBlank) {
        handleSliceChangeForChart(activeChart.id, activeChart.slice);
      }
    }
  }, [activeChart, sessionId, handleSliceChangeForChart]);

  // Connect to an assigned source (Seamless for Analysts)
  const connectToSource = useCallback(async (sourceId, user, preserveSlice = false) => {
    try {
      setLoading(true);
      const res = await connectSource(sourceId, {}, sessionId, user.username);
      if (res.success) {
        setActiveSourceId(sourceId);
        setFields(res.schema.fields || []);
        setRecordCount(res.recordCount || 0);
        setSourceName(
          sourceId === 'demo' ? 'Demo Empresarial (Ventas Globales)' :
          sourceId === 'file-sales' ? 'Ventas Históricas CSV' :
          sourceId === 'olap-ssas' ? 'Cubo SSAS - AdventureWorks' :
          sourceId === 'sql-db' ? 'PostgreSQL - Data Warehouse' :
          sourceId === 'nosql-events' ? 'Elasticsearch - Logs & Telemetría' :
          `Fuente: ${sourceId}`
        );

        if (!preserveSlice) {
          const defaultSlice = createSmartDefaultSlice(res.schema.fields || []);
          setTables([
            {
              id: 'table-1',
              title: 'Tabla Dinámica Principal',
              slice: defaultSlice,
              tableStyle: 'classic_grid',
              currencyFormat: true,
              result: null,
              loading: false
            }
          ]);
          setActiveTableId('table-1');
          handleSliceChangeForTable('table-1', defaultSlice);

          const defaultChartSlice = createSmartChartSlice(res.schema.fields || []);
          setCharts([
            {
              id: 'chart-1',
              title: 'Gráfico 1: Ventas por Grupo',
              chartType: 'bar_vertical',
              slice: defaultChartSlice,
              currencyFormat: true,
              result: null,
              loading: false
            }
          ]);
          setActiveChartId('chart-1');
          handleSliceChangeForChart('chart-1', defaultChartSlice);
        }
      }
    } catch (err) {
      console.error('Error al acceder a la fuente:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, handleSliceChangeForTable, handleSliceChangeForChart]);

  // Load catalog of sources for user and enforce source permissions
  const loadUserSources = useCallback(async (user) => {
    try {
      const res = await fetchSupportedSources(user.username);
      const sources = res.sources || [];
      setAvailableSources(sources);

      if (user.role !== 'admin' && user.allowedSources && !user.allowedSources.includes('*')) {
        const isCurrentAllowed = user.allowedSources.includes(activeSourceId);
        if (!isCurrentAllowed) {
          const firstAllowed = user.allowedSources[0] || 'demo';
          connectToSource(firstAllowed, user);
        }
      }
    } catch (err) {
      console.error('Error cargando fuentes autorizadas:', err);
    }
  }, [activeSourceId, connectToSource]);

  // Verify and adjust active styles if user lacks permission
  const enforceUserStylePermissions = useCallback((user) => {
    if (!user || user.role === 'admin') return;

    if (user.allowedTableStyles && !user.allowedTableStyles.includes('*')) {
      if (!user.allowedTableStyles.includes(tableStyle)) {
        handleTableStyleChangeForTable(activeTable.id, user.allowedTableStyles[0] || 'classic_grid');
      }
    }

    if (user.allowedChartStyles && !user.allowedChartStyles.includes('*')) {
      if (!user.allowedChartStyles.includes(chartStyle)) {
        setChartStyle(user.allowedChartStyles[0] || 'bar_vertical');
      }
    }
  }, [tableStyle, chartStyle, activeTable.id]);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    loadUserSources(user);
    enforceUserStylePermissions(user);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleSwitchAssignedSource = (sourceId) => {
    connectToSource(sourceId, currentUser);
  };

  const handleChartStyleChange = (newStyle) => {
    setChartStyle(newStyle);
    if (currentView === 'grid') {
      setCurrentView('combined');
    }
  };

  // Admin Connect to custom source via Technical Modal
  const handleSelectSource = async (sourceType, config) => {
    setLoading(true);
    try {
      const res = await connectSource(sourceType, config, sessionId, currentUser.username);
      if (res.success) {
        setActiveSourceId(sourceType);
        setFields(res.schema.fields || []);
        setRecordCount(res.recordCount || 0);
        setSourceName(
          sourceType === 'olap' ? `OLAP (${config.cubeName || 'Cubo'})` :
          sourceType === 'sql' ? `SQL (${config.dialect || 'DB'})` :
          sourceType === 'nosql' ? `NoSQL (${config.engine || 'Doc'})` :
          'Dataset'
        );

        const defaultSlice = createSmartDefaultSlice(res.schema.fields || []);
        setTables([
          {
            id: 'table-1',
            title: 'Tabla Dinámica Principal',
            slice: defaultSlice,
            tableStyle: 'classic_grid',
            currencyFormat: true,
            result: null,
            loading: false
          }
        ]);
        setActiveTableId('table-1');
        handleSliceChangeForTable('table-1', defaultSlice);

        const defaultChartSlice = createSmartChartSlice(res.schema.fields || []);
        setCharts([
          {
            id: 'chart-1',
            title: 'Gráfico 1: Resumen',
            chartType: 'bar_vertical',
            slice: defaultChartSlice,
            currencyFormat: true,
            result: null,
            loading: false
          }
        ]);
        setActiveChartId('chart-1');
        handleSliceChangeForChart('chart-1', defaultChartSlice);
      }
    } finally {
      setLoading(false);
    }
  };

  // Admin Upload file handler
  const handleFileUpload = async (file) => {
    setLoading(true);
    try {
      const res = await uploadDataFile(file);
      if (res.success) {
        setSessionId(res.sessionId);
        setFields(res.schema.fields || []);
        setRecordCount(res.recordCount || 0);
        setSourceName(`Archivo: ${res.fileName}`);

        const defaultSlice = createSmartDefaultSlice(res.schema.fields || []);
        setTables([
          {
            id: 'table-1',
            title: `Tabla: ${res.fileName.replace(/\.[^/.]+$/, '')}`,
            slice: defaultSlice,
            tableStyle: 'classic_grid',
            currencyFormat: true,
            result: null,
            loading: false
          }
        ]);
        setActiveTableId('table-1');
        handleSliceChangeForTable('table-1', defaultSlice);

        const defaultChartSlice = createSmartChartSlice(res.schema.fields || []);
        setCharts([
          {
            id: 'chart-1',
            title: `Gráfico: ${res.fileName.replace(/\.[^/.]+$/, '')}`,
            chartType: 'bar_vertical',
            slice: defaultChartSlice,
            currencyFormat: true,
            result: null,
            loading: false
          }
        ]);
        setActiveChartId('chart-1');
        handleSliceChangeForChart('chart-1', defaultChartSlice);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add calculated measure
  const handleAddCalculatedMeasure = (newMeasure) => {
    const existingKeys = new Set(activeTable.slice.measures.map(m => m.field));
    let uniqueField = newMeasure.field;
    let counter = 1;
    while (existingKeys.has(uniqueField)) {
      uniqueField = `${newMeasure.field}_${counter++}`;
    }
    const nextMeasures = [...activeTable.slice.measures, { ...newMeasure, field: uniqueField }];
    handleSliceChangeForTable(activeTable.id, {
      ...activeTable.slice,
      measures: nextMeasures
    });
  };

  // Filter application
  const handleApplyFilter = (field, selectedValues) => {
    const nextFilters = (activeTable.slice.filters || []).filter(f => f.field !== field);
    if (selectedValues && selectedValues.length > 0) {
      nextFilters.push({ field, selectedValues });
    }
    handleSliceChangeForTable(activeTable.id, { ...activeTable.slice, filters: nextFilters });
  };

  // Load a saved report
  const handleLoadReport = (savedReport) => {
    if (savedReport.slice) {
      handleSliceChangeForTable(activeTable.id, savedReport.slice);
    }
    if (savedReport.conditionalRules) setConditionalRules(savedReport.conditionalRules);
    if (savedReport.tableStyle) handleTableStyleChangeForTable(activeTable.id, savedReport.tableStyle);
    if (savedReport.chartStyle) setChartStyle(savedReport.chartStyle);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!pivotResult || !pivotResult.matrix) return;
    const { rows, columnDefinitions, matrix } = pivotResult;
    const headers = [...rows, ...columnDefinitions.map(c => c.headerLabel)];
    const csvRows = [headers.join(',')];
    matrix.forEach(row => {
      const line = [...row.rowParts, ...row.values];
      csvRows.push(line.map(v => `"${v}"`).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${branding.companyName.toLowerCase().replace(/\s+/g, '_')}_${activeTable.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`;
    link.click();
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!pivotResult) return;
    const blob = new Blob([JSON.stringify(pivotResult, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${branding.companyName.toLowerCase().replace(/\s+/g, '_')}_${activeTable.title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    link.click();
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadUserSources(currentUser);
      enforceUserStylePermissions(currentUser);
      connectToSource(activeSourceId || 'demo', currentUser, true);
    }
  }, [isAuthenticated, currentUser]);

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} branding={branding} />;
  }

  return (
    <div className="app-container">
      {/* Top Application Toolbar */}
      <Toolbar
        branding={branding}
        currentUser={currentUser}
        catalogStyles={catalogStyles}
        availableSources={availableSources}
        activeSourceId={activeSourceId}
        onSwitchAssignedSource={handleSwitchAssignedSource}
        onLogout={handleLogout}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenSourceModal={() => setIsSourceModalOpen(true)}
        onOpenConditionalModal={() => setIsConditionalModalOpen(true)}
        onOpenReportsModal={() => setIsReportsModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentView={currentView}
        onViewChange={setCurrentView}
        tableStyle={tableStyle}
        onTableStyleChange={(s) => handleTableStyleChangeForTable(activeTable.id, s)}
        chartStyle={currentView === 'chart' ? activeChart.chartType : chartStyle}
        onChartStyleChange={(s) => {
          if (currentView === 'chart') {
            handleChartTypeChangeForChart(activeChart.id, s);
          } else {
            handleChartStyleChange(s);
          }
        }}
        currencyFormat={currentView === 'chart' ? activeChart.currencyFormat : currencyFormat}
        onToggleCurrency={() => {
          if (currentView === 'chart') {
            handleToggleCurrencyForChart(activeChart.id);
          } else {
            handleToggleCurrencyForTable(activeTable.id);
          }
        }}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onPrint={() => window.print()}
      />

      {/* Main Workspace */}
      <div className="workspace">
        {/* Fields Panel & Drop Zones */}
        {isSidebarOpen && (
          <FieldsPanel
            fields={fields}
            targetMode={currentView === 'chart' ? 'chart' : 'table'}
            slice={currentView === 'chart' ? activeChart.slice : activeTable.slice}
            onSliceChange={(newSlice) => {
              if (currentView === 'chart') {
                handleSliceChangeForChart(activeChart.id, newSlice);
              } else {
                handleSliceChangeForTable(activeTable.id, newSlice);
              }
            }}
            onOpenCalculatedModal={() => setIsCalculatedModalOpen(true)}
            onOpenFilterModal={(fieldName) => setFilterModalField(fieldName)}
            activeTableName={currentView === 'chart' ? activeChart.title : activeTable.title}
            onClearActiveTable={() => {
              if (currentView === 'chart') {
                handleClearChart(activeChart.id);
              } else {
                handleClearTable(activeTable.id);
              }
            }}
          />
        )}

        {/* Dynamic Content View Area */}
        <main className="content-area">
          {/* Status Header */}
          <div className="info-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>
                <strong>Fuente Activa:</strong> <span style={{ color: '#2563eb' }}>{sourceName}</span>
              </span>
              <span>•</span>
              <span>
                <strong>Filas analizadas:</strong> {recordCount}
              </span>
              {currentView === 'chart' ? (
                <>
                  <span>•</span>
                  <span><strong>Gráficos en panel:</strong> {charts.length}</span>
                  {activeChart.loading && <span style={{ color: '#f59e0b', fontWeight: 600 }}>• Graficando...</span>}
                </>
              ) : (
                <>
                  {activeTable.slice.filters?.length > 0 && (
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>
                      • {activeTable.slice.filters.length} filtro(s) activo(s)
                    </span>
                  )}
                  {conditionalRules.length > 0 && (
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      • {conditionalRules.length} regla(s) de semáforo
                    </span>
                  )}
                  {activeTable.loading && <span style={{ color: '#f59e0b', fontWeight: 600 }}>• Recalculando...</span>}
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {currentView === 'chart' ? (
                  <>Tipo de gráfico: <strong>{activeChart.chartType.replace('_', ' ').toUpperCase()}</strong></>
                ) : (
                  <>Estilo de tabla: <strong>{tableStyle.replace('_', ' ').toUpperCase()}</strong></>
                )}
              </span>
            </div>
          </div>

          {/* MULTI-TABLE TAB BAR (Tabs for tables + "Agregar Tabla" button + Single vs Grid toggle) */}
          {currentView === 'grid' && (
            <MultiTableTabBar
              tables={tables}
              activeTableId={activeTableId}
              onSelectTable={setActiveTableId}
              onAddTable={handleAddTable}
              onDuplicateTable={handleDuplicateTable}
              onDeleteTable={handleDeleteTable}
              onRenameTable={handleRenameTable}
              viewLayout={tableLayoutView}
              onViewLayoutChange={setTableLayoutView}
            />
          )}

          {/* MULTI-CHART TAB BAR (Tabs for charts + "Agregar Gráfico" button + Single vs Grid panel toggle) */}
          {currentView === 'chart' && (
            <MultiChartTabBar
              charts={charts}
              activeChartId={activeChartId}
              onSelectChart={setActiveChartId}
              onAddChart={handleAddChart}
              onDuplicateChart={handleDuplicateChart}
              onDeleteChart={handleDeleteChart}
              onRenameChart={handleRenameChart}
              viewLayout={chartLayoutView}
              onViewLayoutChange={setChartLayoutView}
            />
          )}

          {/* 1. Combined View: Dashboard 360° */}
          {currentView === 'combined' && (
            <DashboardCombinedView
              pivotResult={activeTable.result}
              currencyFormat={activeTable.currencyFormat}
              conditionalRules={conditionalRules}
              tableStyle={activeTable.tableStyle}
              chartStyle={chartStyle}
              onChartStyleChange={handleChartStyleChange}
              slice={activeTable.slice}
              onSliceChange={(newSlice) => handleSliceChangeForTable(activeTable.id, newSlice)}
              fields={fields}
              tableTitle={activeTable.title}
              onClearTable={() => handleClearTable(activeTable.id)}
              onDuplicateTable={() => handleDuplicateTable(activeTable.id)}
            />
          )}

          {/* 2. Standalone Table View: Single Focused Table OR Multi-Grid Comparison */}
          {currentView === 'grid' && (
            tableLayoutView === 'single' ? (
              <div style={{ padding: '12px' }}>
                <PivotGrid
                  tableId={activeTable.id}
                  title={activeTable.title}
                  onTitleChange={(title) => handleRenameTable(activeTable.id, title)}
                  slice={activeTable.slice}
                  onSliceChange={(newSlice) => handleSliceChangeForTable(activeTable.id, newSlice)}
                  pivotResult={activeTable.result}
                  currencyFormat={activeTable.currencyFormat}
                  onToggleCurrency={() => handleToggleCurrencyForTable(activeTable.id)}
                  conditionalRules={conditionalRules}
                  tableStyle={activeTable.tableStyle}
                  onTableStyleChange={(s) => handleTableStyleChangeForTable(activeTable.id, s)}
                  onClearTable={() => handleClearTable(activeTable.id)}
                  onDuplicateTable={() => handleDuplicateTable(activeTable.id)}
                  onDeleteTable={() => handleDeleteTable(activeTable.id)}
                  canDelete={tables.length > 1}
                  fields={fields}
                  onOpenFilterModal={setFilterModalField}
                  onOpenCalculatedModal={() => setIsCalculatedModalOpen(true)}
                  loading={activeTable.loading}
                />
              </div>
            ) : (
              <div className="multi-table-grid">
                {tables.map(t => (
                  <PivotGrid
                    key={t.id}
                    tableId={t.id}
                    title={t.title}
                    onTitleChange={(title) => handleRenameTable(t.id, title)}
                    slice={t.slice}
                    onSliceChange={(newSlice) => handleSliceChangeForTable(t.id, newSlice)}
                    pivotResult={t.result}
                    currencyFormat={t.currencyFormat}
                    onToggleCurrency={() => handleToggleCurrencyForTable(t.id)}
                    conditionalRules={conditionalRules}
                    tableStyle={t.tableStyle}
                    onTableStyleChange={(s) => handleTableStyleChangeForTable(t.id, s)}
                    onClearTable={() => handleClearTable(t.id)}
                    onDuplicateTable={() => handleDuplicateTable(t.id)}
                    onDeleteTable={() => handleDeleteTable(t.id)}
                    canDelete={tables.length > 1}
                    fields={fields}
                    onOpenFilterModal={setFilterModalField}
                    onOpenCalculatedModal={() => setIsCalculatedModalOpen(true)}
                    loading={t.loading}
                  />
                ))}
              </div>
            )
          )}

          {/* 3. Standalone Chart View (Single Chart or Multi-Chart Panel Grid) */}
          {currentView === 'chart' && (
            chartLayoutView === 'single' ? (
              <div style={{ padding: '12px' }}>
                <PivotChart
                  chartId={activeChart.id}
                  title={activeChart.title}
                  onTitleChange={(title) => handleRenameChart(activeChart.id, title)}
                  slice={activeChart.slice}
                  onSliceChange={(newSlice) => handleSliceChangeForChart(activeChart.id, newSlice)}
                  chartType={activeChart.chartType}
                  onChartTypeChange={(newType) => handleChartTypeChangeForChart(activeChart.id, newType)}
                  pivotResult={activeChart.result}
                  currencyFormat={activeChart.currencyFormat}
                  onToggleCurrency={() => handleToggleCurrencyForChart(activeChart.id)}
                  onClearChart={() => handleClearChart(activeChart.id)}
                  onDuplicateChart={() => handleDuplicateChart(activeChart.id)}
                  onDeleteChart={() => handleDeleteChart(activeChart.id)}
                  canDelete={charts.length > 1}
                  fields={fields}
                  loading={activeChart.loading}
                />
              </div>
            ) : (
              <div className="multi-chart-grid">
                {charts.map(c => (
                  <PivotChart
                    key={c.id}
                    chartId={c.id}
                    title={c.title}
                    onTitleChange={(title) => handleRenameChart(c.id, title)}
                    slice={c.slice}
                    onSliceChange={(newSlice) => handleSliceChangeForChart(c.id, newSlice)}
                    chartType={c.chartType}
                    onChartTypeChange={(newType) => handleChartTypeChangeForChart(c.id, newType)}
                    pivotResult={c.result}
                    currencyFormat={c.currencyFormat}
                    onToggleCurrency={() => handleToggleCurrencyForChart(c.id)}
                    onClearChart={() => handleClearChart(c.id)}
                    onDuplicateChart={() => handleDuplicateChart(c.id)}
                    onDeleteChart={() => handleDeleteChart(c.id)}
                    canDelete={charts.length > 1}
                    fields={fields}
                    loading={c.loading}
                  />
                ))}
              </div>
            )
          )}
        </main>
      </div>

      {/* Technical Data Source Modal (ADMIN ONLY) */}
      <DataSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onSelectSource={handleSelectSource}
        onFileUpload={handleFileUpload}
        currentUser={currentUser}
      />

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        allSources={availableSources}
        onSourcesUpdated={() => loadUserSources(currentUser)}
        branding={branding}
        onBrandingUpdated={setBranding}
      />

      <CalculatedMeasureModal
        isOpen={isCalculatedModalOpen}
        onClose={() => setIsCalculatedModalOpen(false)}
        availableFields={fields}
        onAddCalculatedMeasure={handleAddCalculatedMeasure}
        activeSlice={activeTable.slice}
        activeSourceId={activeSourceId}
      />

      <ConditionalFormatModal
        isOpen={isConditionalModalOpen}
        onClose={() => setIsConditionalModalOpen(false)}
        activeMeasures={activeTable.slice.measures}
        rules={conditionalRules}
        onUpdateRules={setConditionalRules}
      />

      <DimensionFilterModal
        isOpen={Boolean(filterModalField)}
        onClose={() => setFilterModalField(null)}
        fieldName={filterModalField}
        currentFilterValues={activeTable.slice.filters?.find(f => f.field === filterModalField)?.selectedValues}
        onApplyFilter={handleApplyFilter}
        sessionId={sessionId}
      />

      <SavedReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        currentSlice={activeTable.slice}
        currentRules={conditionalRules}
        currentUser={currentUser}
        onLoadReport={handleLoadReport}
      />
    </div>
  );
}
