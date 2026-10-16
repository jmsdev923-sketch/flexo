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
import {
  fetchSupportedSources,
  connectSource,
  computePivot,
  uploadDataFile,
  fetchBranding,
  fetchCatalogStyles
} from './services/api';

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
  const [tableStyle, setTableStyle] = useState('classic_grid');
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

  // Active Slice configuration
  const [slice, setSlice] = useState({
    rows: ['region', 'country'],
    columns: ['category'],
    measures: [
      { field: 'sales', aggregation: 'sum', caption: 'Ventas' },
      { field: 'profit', aggregation: 'sum', caption: 'Utilidad' }
    ],
    filters: []
  });

  // Conditional Formatting Rules
  const [conditionalRules, setConditionalRules] = useState([
    { id: 'rule-demo-1', measureField: 'profit', operator: 'lt', value: 3000, bgColor: '#fee2e2', textColor: '#991b1b' },
    { id: 'rule-demo-2', measureField: 'sales', operator: 'gt', value: 35000, bgColor: '#dcfce7', textColor: '#166534' }
  ]);

  const [pivotResult, setPivotResult] = useState(null);
  const [currentView, setCurrentView] = useState('combined'); // 'combined' | 'grid' | 'chart'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currencyFormat, setCurrencyFormat] = useState(true);

  // Modals state
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isCalculatedModalOpen, setIsCalculatedModalOpen] = useState(false);
  const [isConditionalModalOpen, setIsConditionalModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [filterModalField, setFilterModalField] = useState(null);

  const [loading, setLoading] = useState(false);

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
          const allFields = res.schema.fields || [];
          const numFields = allFields.filter(f => f.type === 'number');
          const strFields = allFields.filter(f => f.type !== 'number');

          setSlice({
            rows: strFields.slice(0, 2).map(f => f.name),
            columns: strFields.slice(2, 3).map(f => f.name),
            measures: numFields.slice(0, 2).map(f => ({ field: f.name, aggregation: 'sum', caption: f.name })),
            filters: []
          });
        }
      }
    } catch (err) {
      console.error('Error al acceder a la fuente:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Load catalog of sources for user and enforce source permissions
  const loadUserSources = useCallback(async (user) => {
    try {
      const res = await fetchSupportedSources(user.username);
      const sources = res.sources || [];
      setAvailableSources(sources);

      // If user is not admin and their current active source is not permitted, auto-switch to their first permitted source!
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

  // Verify and adjust active styles if user lacks permission for currently selected style
  const enforceUserStylePermissions = useCallback((user) => {
    if (!user || user.role === 'admin') return;

    if (user.allowedTableStyles && !user.allowedTableStyles.includes('*')) {
      if (!user.allowedTableStyles.includes(tableStyle)) {
        setTableStyle(user.allowedTableStyles[0] || 'classic_grid');
      }
    }

    if (user.allowedChartStyles && !user.allowedChartStyles.includes('*')) {
      if (!user.allowedChartStyles.includes(chartStyle)) {
        setChartStyle(user.allowedChartStyles[0] || 'bar_vertical');
      }
    }
  }, [tableStyle, chartStyle]);

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

  // Switch assigned source for non-admin users
  const handleSwitchAssignedSource = (sourceId) => {
    connectToSource(sourceId, currentUser);
  };

  // Change chart style and ensure chart is visible
  const handleChartStyleChange = (newStyle) => {
    setChartStyle(newStyle);
    if (currentView === 'grid') {
      setCurrentView('combined');
    }
  };

  // Recalculate pivot
  const runPivot = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await computePivot(slice, sessionId);
      if (res.success) {
        setPivotResult(res.result);
      }
    } catch (err) {
      console.error('Error procesando pivot:', err);
    } finally {
      setLoading(false);
    }
  }, [slice, sessionId, isAuthenticated]);

  useEffect(() => {
    runPivot();
  }, [runPivot]);

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

        const allFields = res.schema.fields || [];
        const numFields = allFields.filter(f => f.type === 'number');
        const strFields = allFields.filter(f => f.type !== 'number');

        setSlice({
          rows: strFields.slice(0, 2).map(f => f.name),
          columns: strFields.slice(2, 3).map(f => f.name),
          measures: numFields.slice(0, 2).map(f => ({ field: f.name, aggregation: 'sum', caption: f.name })),
          filters: []
        });
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

        const allFields = res.schema.fields || [];
        const numFields = allFields.filter(f => f.type === 'number');
        const strFields = allFields.filter(f => f.type !== 'number');

        setSlice({
          rows: strFields.slice(0, 2).map(f => f.name),
          columns: strFields.slice(2, 3).map(f => f.name),
          measures: numFields.slice(0, 2).map(f => ({ field: f.name, aggregation: 'sum', caption: f.name })),
          filters: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Add calculated measure
  const handleAddCalculatedMeasure = (newMeasure) => {
    setSlice(prevSlice => {
      const existingKeys = new Set(prevSlice.measures.map(m => m.field));
      let uniqueField = newMeasure.field;
      let counter = 1;
      while (existingKeys.has(uniqueField)) {
        uniqueField = `${newMeasure.field}_${counter++}`;
      }
      return {
        ...prevSlice,
        measures: [...prevSlice.measures, { ...newMeasure, field: uniqueField }]
      };
    });
  };

  // Apply member filter
  const handleApplyFilter = (field, selectedValues) => {
    const nextFilters = slice.filters.filter(f => f.field !== field);
    if (selectedValues && selectedValues.length > 0) {
      nextFilters.push({ field, selectedValues });
    }
    setSlice({ ...slice, filters: nextFilters });
  };

  // Load a saved report
  const handleLoadReport = (savedReport) => {
    if (savedReport.slice) setSlice(savedReport.slice);
    if (savedReport.conditionalRules) setConditionalRules(savedReport.conditionalRules);
    if (savedReport.tableStyle) setTableStyle(savedReport.tableStyle);
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
    link.download = `${branding.companyName.toLowerCase().replace(/\s+/g, '_')}_report_${Date.now()}.csv`;
    link.click();
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!pivotResult) return;
    const blob = new Blob([JSON.stringify(pivotResult, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${branding.companyName.toLowerCase().replace(/\s+/g, '_')}_report_${Date.now()}.json`;
    link.click();
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadUserSources(currentUser);
      enforceUserStylePermissions(currentUser);
      // Auto-connect to active source if fields have not been loaded yet
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
        onTableStyleChange={setTableStyle}
        chartStyle={chartStyle}
        onChartStyleChange={handleChartStyleChange}
        currencyFormat={currencyFormat}
        onToggleCurrency={() => setCurrencyFormat(!currencyFormat)}
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
            slice={slice}
            onSliceChange={setSlice}
            onOpenCalculatedModal={() => setIsCalculatedModalOpen(true)}
            onOpenFilterModal={(fieldName) => setFilterModalField(fieldName)}
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
              {slice.filters?.length > 0 && (
                <span style={{ color: '#2563eb', fontWeight: 600 }}>
                  • {slice.filters.length} filtro(s) activo(s)
                </span>
              )}
              {conditionalRules.length > 0 && (
                <span style={{ color: '#059669', fontWeight: 600 }}>
                  • {conditionalRules.length} regla(s) de semáforo
                </span>
              )}
              {loading && <span style={{ color: '#f59e0b', fontWeight: 600 }}>• Recalculando...</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Estilo: <strong>{tableStyle.replace('_', ' ').toUpperCase()}</strong>
              </span>
            </div>
          </div>

          {/* 1. Combined View: Table AND Multiple Synchronized Charts together */}
          {currentView === 'combined' && (
            <DashboardCombinedView
              pivotResult={pivotResult}
              currencyFormat={currencyFormat}
              conditionalRules={conditionalRules}
              tableStyle={tableStyle}
              chartStyle={chartStyle}
              onChartStyleChange={handleChartStyleChange}
            />
          )}

          {/* 2. Standalone Table View */}
          {currentView === 'grid' && (
            <PivotGrid
              pivotResult={pivotResult}
              currencyFormat={currencyFormat}
              conditionalRules={conditionalRules}
              tableStyle={tableStyle}
            />
          )}

          {/* 3. Standalone Single Chart View */}
          {currentView === 'chart' && (
            <PivotChart
              pivotResult={pivotResult}
              chartType={chartStyle}
              currencyFormat={currencyFormat}
              onChartTypeChange={handleChartStyleChange}
            />
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
        activeSlice={slice}
        activeSourceId={activeSourceId}
      />

      <ConditionalFormatModal
        isOpen={isConditionalModalOpen}
        onClose={() => setIsConditionalModalOpen(false)}
        activeMeasures={slice.measures}
        rules={conditionalRules}
        onUpdateRules={setConditionalRules}
      />

      <DimensionFilterModal
        isOpen={Boolean(filterModalField)}
        onClose={() => setFilterModalField(null)}
        fieldName={filterModalField}
        currentFilterValues={slice.filters?.find(f => f.field === filterModalField)?.selectedValues}
        onApplyFilter={handleApplyFilter}
        sessionId={sessionId}
      />

      <SavedReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        currentSlice={slice}
        currentRules={conditionalRules}
        currentUser={currentUser}
        onLoadReport={handleLoadReport}
      />
    </div>
  );
}
