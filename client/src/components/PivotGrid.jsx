import React, { useState } from 'react';

const AGG_OPTIONS = [
  { id: 'sum', label: '∑ Suma' },
  { id: 'avg', label: 'AVG Promedio' },
  { id: 'count', label: '123 Conteo' },
  { id: 'min', label: 'MIN Mínimo' },
  { id: 'max', label: 'MAX Máximo' },
  { id: 'distinct_count', label: '≠ Únicos' }
];

export function PivotGrid({
  tableId,
  title = 'Tabla Dinámica',
  onTitleChange,
  slice = { rows: [], columns: [], measures: [], filters: [] },
  onSliceChange,
  pivotResult,
  currencyFormat = true,
  onToggleCurrency,
  conditionalRules = [],
  tableStyle = 'classic_grid',
  onTableStyleChange,
  onClearTable,
  onDuplicateTable,
  onDeleteTable,
  canDelete = false,
  fields = [],
  onOpenFilterModal,
  onOpenCalculatedModal,
  loading = false
}) {
  const [dragOverZone, setDragOverZone] = useState(null); // 'rows' | 'columns' | 'measures' | 'filters'
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  // Hierarchy Tree, Grouping, Pagination & Search State
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'tabular'
  const [collapsedKeys, setCollapsedKeys] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // ----------------------------------------------------
  // Drag & Drop Handlers
  // ----------------------------------------------------
  const handleDragStart = (e, itemData) => {
    e.dataTransfer.setData('application/json', JSON.stringify(itemData));
    e.dataTransfer.setData('text/plain', itemData.name);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, zoneName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverZone !== zoneName) {
      setDragOverZone(zoneName);
    }
  };

  const handleDragLeave = (e, zoneName) => {
    if (dragOverZone === zoneName) {
      setDragOverZone(null);
    }
  };

  const handleDrop = (e, targetZone) => {
    e.preventDefault();
    setDragOverZone(null);

    let item = null;
    const rawJson = e.dataTransfer.getData('application/json');
    if (rawJson) {
      try {
        item = JSON.parse(rawJson);
      } catch {
        item = null;
      }
    }
    if (!item) {
      const text = e.dataTransfer.getData('text/plain');
      if (text) {
        const foundField = fields.find(f => f.name === text);
        item = { name: text, type: foundField?.type || 'string', sourceZone: 'available' };
      }
    }
    if (!item || !item.name) return;

    const { name, type, sourceZone } = item;
    let nextRows = [...slice.rows];
    let nextColumns = [...slice.columns];
    let nextMeasures = [...slice.measures];
    let nextFilters = slice.filters ? [...slice.filters] : [];

    // If dragged from another zone within this table, clean from old zone
    if (sourceZone === 'rows') nextRows = nextRows.filter(r => r !== name);
    if (sourceZone === 'columns') nextColumns = nextColumns.filter(c => c !== name);
    if (sourceZone === 'measures') nextMeasures = nextMeasures.filter(m => m.field !== name);
    if (sourceZone === 'filters') nextFilters = nextFilters.filter(f => f.field !== name);

    // Add to target zone
    if (targetZone === 'rows') {
      if (!nextRows.includes(name)) nextRows.push(name);
    } else if (targetZone === 'columns') {
      if (!nextColumns.includes(name)) nextColumns.push(name);
    } else if (targetZone === 'measures') {
      if (!nextMeasures.some(m => m.field === name)) {
        nextMeasures.push({
          field: name,
          aggregation: type === 'number' ? 'sum' : 'count',
          caption: name.replace(/_/g, ' ')
        });
      }
    } else if (targetZone === 'filters') {
      if (!nextFilters.some(f => f.field === name)) {
        nextFilters.push({ field: name, selectedValues: [] });
      }
    }

    if (onSliceChange) {
      onSliceChange({
        ...slice,
        rows: nextRows,
        columns: nextColumns,
        measures: nextMeasures,
        filters: nextFilters
      });
    }
  };

  const removeFieldFromZone = (zoneName, fieldIdentifier) => {
    if (!onSliceChange) return;
    if (zoneName === 'rows') {
      onSliceChange({ ...slice, rows: slice.rows.filter(r => r !== fieldIdentifier) });
    } else if (zoneName === 'columns') {
      onSliceChange({ ...slice, columns: slice.columns.filter(c => c !== fieldIdentifier) });
    } else if (zoneName === 'measures') {
      onSliceChange({ ...slice, measures: slice.measures.filter(m => m.field !== fieldIdentifier) });
    } else if (zoneName === 'filters') {
      onSliceChange({ ...slice, filters: slice.filters.filter(f => f.field !== fieldIdentifier) });
    }
  };

  const updateMeasureAggregation = (mIndex, newAgg) => {
    if (!onSliceChange) return;
    const next = [...slice.measures];
    next[mIndex] = { ...next[mIndex], aggregation: newAgg };
    onSliceChange({ ...slice, measures: next });
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (onTitleChange && tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    }
  };

  // ----------------------------------------------------
  // Value formatting and cell styles
  // ----------------------------------------------------
  const formatValue = (val, measure) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      if (measure?.caption?.includes('%') || measure?.field?.includes('pct')) {
        return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(val)}%`;
      }
      if (currencyFormat) {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: val % 1 === 0 ? 0 : 2
        }).format(val);
      }
      return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val);
    }
    return val;
  };

  // Max value in matrix for heatmap intensity calculations
  let maxCellVal = 0;
  if (pivotResult?.matrix && tableStyle === 'heatmap_intensity') {
    pivotResult.matrix.forEach(row => {
      row.values.forEach(v => {
        if (typeof v === 'number' && v > maxCellVal) maxCellVal = v;
      });
    });
    if (maxCellVal === 0) maxCellVal = 1;
  }

  const getCellStyle = (val, measureField) => {
    if (typeof val === 'number' && conditionalRules && conditionalRules.length > 0) {
      for (const rule of conditionalRules) {
        if (rule.measureField === measureField) {
          let match = false;
          if (rule.operator === 'lt' && val < rule.value) match = true;
          if (rule.operator === 'gt' && val > rule.value) match = true;
          if (rule.operator === 'lte' && val <= rule.value) match = true;
          if (rule.operator === 'gte' && val >= rule.value) match = true;

          if (match) {
            return {
              backgroundColor: rule.bgColor,
              color: rule.textColor,
              fontWeight: 600
            };
          }
        }
      }
    }

    if (tableStyle === 'heatmap_intensity' && typeof val === 'number' && val > 0) {
      const intensity = Math.min(Math.max(val / maxCellVal, 0.08), 0.85);
      return {
        backgroundColor: `rgba(37, 99, 235, ${intensity})`,
        color: intensity > 0.5 ? '#ffffff' : '#0f172a',
        fontWeight: intensity > 0.4 ? 600 : 400
      };
    }

    return {};
  };

  const hasSliceConfig = (slice.rows && slice.rows.length > 0) ||
                         (slice.columns && slice.columns.length > 0) ||
                         (slice.measures && slice.measures.length > 0);
  const hasMatrixData = Boolean(pivotResult?.matrix && pivotResult.matrix.length > 0);
  const isBlank = !hasSliceConfig && !hasMatrixData;

  const {
    rows = [],
    columns = [],
    measures = [],
    columnDefinitions = [],
    matrix = [],
    tree = [],
    grandTotals = [],
    grandGrandTotals = []
  } = pivotResult || {};

  const rowDimensionsCount = Math.max(rows.length, 1);

  // Quick field suggestions for empty canvas
  const stringFields = fields.filter(f => f.type !== 'number');
  const numericFields = fields.filter(f => f.type === 'number');

  // ----------------------------------------------------
  // TREE & HIERARCHICAL GROUPING CONTROLS
  // ----------------------------------------------------
  const toggleCollapse = (key) => {
    setCollapsedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedKeys(new Set());

  const collapseAll = () => {
    const parentKeys = (tree || []).filter(n => n.hasChildren).map(n => n.key);
    setCollapsedKeys(new Set(parentKeys));
  };

  // ----------------------------------------------------
  // HIERARCHICAL TREE PAGINATION & VISIBILITY
  // ----------------------------------------------------
  const treeNodes = tree || [];
  const level0Nodes = treeNodes.filter(n => n.level === 0);

  // Search filter applied to roots and children
  const filteredRoots = searchQuery.trim()
    ? level0Nodes.filter(r => {
        const query = searchQuery.toLowerCase();
        if (r.label.toLowerCase().includes(query)) return true;
        return treeNodes.some(n => n.key.startsWith(r.key + ' >>>> ') && n.label.toLowerCase().includes(query));
      })
    : level0Nodes;

  const totalTreeRoots = filteredRoots.length;
  const totalTreePages = Math.ceil(totalTreeRoots / pageSize) || 1;
  const startRootIdx = (currentPage - 1) * pageSize;
  const currentRoots = filteredRoots.slice(startRootIdx, startRootIdx + pageSize);
  const currentRootKeys = new Set(currentRoots.map(r => r.key));

  // Collect visible nodes for tree mode (only show un-collapsed branches)
  const visibleTreeNodes = [];
  const collapsedPrefixes = new Set();

  for (const node of treeNodes) {
    const rootKey = node.rowParts[0];
    if (!currentRootKeys.has(rootKey)) continue;

    let isHiddenByAncestor = false;
    if (node.parentKey) {
      if (collapsedKeys.has(node.parentKey) || collapsedPrefixes.has(node.parentKey)) {
        isHiddenByAncestor = true;
        collapsedPrefixes.add(node.key);
      }
    }

    if (!isHiddenByAncestor) {
      visibleTreeNodes.push(node);
    }
  }

  // ----------------------------------------------------
  // TABULAR MODE PAGINATION & SUPPRESSION
  // ----------------------------------------------------
  const filteredMatrix = searchQuery.trim()
    ? matrix.filter(r => r.rowParts.some(p => String(p).toLowerCase().includes(searchQuery.toLowerCase())))
    : matrix;
  const totalMatrixRows = filteredMatrix.length;
  const totalMatrixPages = Math.ceil(totalMatrixRows / pageSize) || 1;
  const startMatrixIdx = (currentPage - 1) * pageSize;
  const currentMatrixRows = filteredMatrix.slice(startMatrixIdx, startMatrixIdx + pageSize);

  const isDuplicateTabular = (rIdx, pIdx) => {
    if (rIdx === 0) return false;
    const prevParts = currentMatrixRows[rIdx - 1].rowParts;
    const currParts = currentMatrixRows[rIdx].rowParts;
    for (let i = 0; i <= pIdx; i++) {
      if (prevParts[i] !== currParts[i]) return false;
    }
    return true;
  };

  const isTreeEffective = viewMode === 'tree' && rows.length > 1;
  const totalItems = isTreeEffective ? totalTreeRoots : totalMatrixRows;
  const totalPages = isTreeEffective ? totalTreePages : totalMatrixPages;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`table-container style-${tableStyle}`} style={{ marginBottom: '24px' }}>
      {/* 1. Interactive Table Header & Builder Toolbar */}
      <div className="table-builder-card">
        <div className="builder-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            {isEditingTitle ? (
              <input
                type="text"
                className="builder-title-input"
                style={{ border: '1px solid #3b82f6', background: 'white' }}
                value={tempTitle}
                autoFocus
                onChange={e => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
              />
            ) : (
              <span
                className="builder-title-input"
                onClick={() => { setIsEditingTitle(true); setTempTitle(title); }}
                title="Haz clic para renombrar esta tabla"
                style={{ cursor: 'pointer' }}
              >
                {title} ✏️
              </span>
            )}
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              ({rows.length} Filas × {columns.length} Cols | {measures.length} Métricas)
            </span>
            {loading && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>• Calculando...</span>}
          </div>

          {/* Table Actions Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {onToggleCurrency && (
              <button
                type="button"
                className="btn btn-light"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={onToggleCurrency}
                title="Alternar formato: Peso Colombiano ($) / Numérico"
              >
                {currencyFormat ? '💵 COP ($)' : '🔢 Num'}
              </button>
            )}

            {onTableStyleChange && (
              <select
                className="input-control"
                style={{ fontSize: '11px', padding: '2px 6px', height: '26px' }}
                value={tableStyle}
                onChange={e => onTableStyleChange(e.target.value)}
                title="Estilo visual de esta tabla"
              >
                <option value="classic_grid">Cuadrícula Clásica</option>
                <option value="striped_zebra">Filas Cebradas</option>
                <option value="clean_minimal">Minimalista</option>
                <option value="heatmap_intensity">Mapa de Calor</option>
                <option value="dark_contrast">Modo Oscuro</option>
              </select>
            )}

            {onClearTable && (
              <button
                type="button"
                className="btn btn-light"
                style={{ fontSize: '11px', padding: '3px 8px', color: '#64748b' }}
                onClick={onClearTable}
                title="Vaciar tabla y empezar desde cero con tabla en blanco"
              >
                🧹 Vaciar (En Blanco)
              </button>
            )}

            {onDuplicateTable && (
              <button
                type="button"
                className="btn btn-light"
                style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={onDuplicateTable}
                title="Duplicar esta tabla dinámica"
              >
                📋 Duplicar
              </button>
            )}

            {canDelete && onDeleteTable && (
              <button
                type="button"
                className="btn btn-light"
                style={{ fontSize: '11px', padding: '3px 8px', color: '#ef4444' }}
                onClick={onDeleteTable}
                title="Eliminar esta tabla dinámica"
              >
                🗑️ Eliminar
              </button>
            )}
          </div>
        </div>

        {/* 2. Interactive Drop Zones Strip right above table */}
        <div className="builder-drop-zones-strip">
          {/* ZONE 1: FILAS */}
          <div
            className={`builder-zone-box ${dragOverZone === 'rows' ? 'drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, 'rows')}
            onDragLeave={e => handleDragLeave(e, 'rows')}
            onDrop={e => handleDrop(e, 'rows')}
            title="Arrastra campos aquí para agrupar verticalmente en filas"
          >
            <div className="builder-zone-header">
              <span>↕ Filas ({slice.rows.length})</span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>Arrastra campos</span>
            </div>
            <div className="builder-chips-wrap">
              {slice.rows.map(rName => (
                <div
                  key={rName}
                  className="builder-chip draggable-chip"
                  draggable="true"
                  onDragStart={e => handleDragStart(e, { name: rName, sourceZone: 'rows' })}
                >
                  <span style={{ cursor: 'grab', color: '#94a3b8' }}>⠿</span>
                  <span>{rName}</span>
                  <button
                    type="button"
                    className="builder-chip-remove"
                    onClick={() => removeFieldFromZone('rows', rName)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {slice.rows.length === 0 && (
                <span className="builder-placeholder">Suelta dimensiones aquí</span>
              )}
            </div>
          </div>

          {/* ZONE 2: COLUMNAS */}
          <div
            className={`builder-zone-box ${dragOverZone === 'columns' ? 'drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, 'columns')}
            onDragLeave={e => handleDragLeave(e, 'columns')}
            onDrop={e => handleDrop(e, 'columns')}
            title="Arrastra campos aquí para cruzar horizontalmente en columnas"
          >
            <div className="builder-zone-header">
              <span>↔ Columnas ({slice.columns.length})</span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>Arrastra campos</span>
            </div>
            <div className="builder-chips-wrap">
              {slice.columns.map(cName => (
                <div
                  key={cName}
                  className="builder-chip draggable-chip"
                  draggable="true"
                  onDragStart={e => handleDragStart(e, { name: cName, sourceZone: 'columns' })}
                >
                  <span style={{ cursor: 'grab', color: '#94a3b8' }}>⠿</span>
                  <span>{cName}</span>
                  <button
                    type="button"
                    className="builder-chip-remove"
                    onClick={() => removeFieldFromZone('columns', cName)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {slice.columns.length === 0 && (
                <span className="builder-placeholder">Suelta dimensiones aquí</span>
              )}
            </div>
          </div>

          {/* ZONE 3: VALORES / METRICAS Y CALCULOS */}
          <div
            className={`builder-zone-box ${dragOverZone === 'measures' ? 'drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, 'measures')}
            onDragLeave={e => handleDragLeave(e, 'measures')}
            onDrop={e => handleDrop(e, 'measures')}
            title="Arrastra campos aquí y elige el cálculo a realizar (Suma, Promedio, Conteo, etc.)"
          >
            <div className="builder-zone-header">
              <span>∑ Valores / Cálculos ({slice.measures.length})</span>
              <span style={{ fontSize: '9px', color: '#166534', fontWeight: 600 }}>Cálculo activo</span>
            </div>
            <div className="builder-chips-wrap">
              {slice.measures.map((m, mIdx) => (
                <div
                  key={`${m.field}-${mIdx}`}
                  className="builder-chip measure draggable-chip"
                  draggable="true"
                  onDragStart={e => handleDragStart(e, { name: m.field, sourceZone: 'measures' })}
                >
                  <span style={{ cursor: 'grab', color: '#86efac' }}>⠿</span>
                  <span style={{ fontWeight: 600 }}>{m.caption || m.field}</span>
                  <select
                    className="measure-agg-select"
                    value={m.aggregation || 'sum'}
                    onChange={e => updateMeasureAggregation(mIdx, e.target.value)}
                    title="Selecciona la función de agregación o cálculo"
                  >
                    {AGG_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="builder-chip-remove"
                    onClick={() => removeFieldFromZone('measures', m.field)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {slice.measures.length === 0 && (
                <span className="builder-placeholder">Suelta métricas aquí</span>
              )}
            </div>
          </div>

          {/* ZONE 4: FILTROS */}
          <div
            className={`builder-zone-box ${dragOverZone === 'filters' ? 'drag-over' : ''}`}
            onDragOver={e => handleDragOver(e, 'filters')}
            onDragLeave={e => handleDragLeave(e, 'filters')}
            onDrop={e => handleDrop(e, 'filters')}
            title="Arrastra campos aquí para filtrar miembros específicos"
          >
            <div className="builder-zone-header">
              <span>🔍 Filtros ({slice.filters ? slice.filters.length : 0})</span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>Filtra datos</span>
            </div>
            <div className="builder-chips-wrap">
              {slice.filters && slice.filters.map(f => (
                <div
                  key={f.field}
                  className="builder-chip"
                  style={{ background: '#fef3c7', borderColor: '#fde047', color: '#854d0e', cursor: 'pointer' }}
                  onClick={() => onOpenFilterModal && onOpenFilterModal(f.field)}
                  title="Haz clic para configurar filtro"
                >
                  <span>{f.field}</span>
                  {f.selectedValues?.length > 0 && (
                    <span style={{ fontSize: '9px', fontWeight: 700 }}>({f.selectedValues.length})</span>
                  )}
                  <button
                    type="button"
                    className="builder-chip-remove"
                    onClick={(e) => { e.stopPropagation(); removeFieldFromZone('filters', f.field); }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {(!slice.filters || slice.filters.length === 0) && (
                <span className="builder-placeholder">Filtros opcionales</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Empty Blank Table Canvas OR Populated Multidimensional Grid */}
      {isBlank ? (
        <div className="blank-table-canvas">
          <div className="blank-canvas-icon">✨</div>
          <div className="blank-canvas-title">Tabla Dinámica en Blanco</div>
          <div className="blank-canvas-desc">
            Arrastra los campos desde el panel <strong>Campos Disponibles</strong> de la izquierda hacia cualquiera de las tres áreas para comenzar a armar tu análisis:
          </div>

          <div className="blank-cards-grid">
            {/* Filas Card */}
            <div
              className={`blank-drop-card ${dragOverZone === 'rows' ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, 'rows')}
              onDragLeave={e => handleDragLeave(e, 'rows')}
              onDrop={e => handleDrop(e, 'rows')}
            >
              <div className="blank-drop-card-icon">↕</div>
              <div className="blank-drop-card-title">1. Zona Filas</div>
              <div className="blank-drop-card-hint">Suelta aquí dimensiones para agrupar verticalmente</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', justifyContent: 'center' }}>
                {stringFields.slice(0, 3).map(f => (
                  <button
                    key={f.name}
                    type="button"
                    className="btn btn-light"
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                    onClick={() => onSliceChange && onSliceChange({ ...slice, rows: [...slice.rows, f.name] })}
                  >
                    + {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Columnas Card */}
            <div
              className={`blank-drop-card ${dragOverZone === 'columns' ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, 'columns')}
              onDragLeave={e => handleDragLeave(e, 'columns')}
              onDrop={e => handleDrop(e, 'columns')}
            >
              <div className="blank-drop-card-icon">↔</div>
              <div className="blank-drop-card-title">2. Zona Columnas</div>
              <div className="blank-drop-card-hint">Suelta aquí dimensiones para cruzar horizontalmente</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', justifyContent: 'center' }}>
                {stringFields.slice(3, 5).map(f => (
                  <button
                    key={f.name}
                    type="button"
                    className="btn btn-light"
                    style={{ fontSize: '10px', padding: '2px 6px' }}
                    onClick={() => onSliceChange && onSliceChange({ ...slice, columns: [...slice.columns, f.name] })}
                  >
                    + {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Valores Card */}
            <div
              className={`blank-drop-card ${dragOverZone === 'measures' ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, 'measures')}
              onDragLeave={e => handleDragLeave(e, 'measures')}
              onDrop={e => handleDrop(e, 'measures')}
            >
              <div className="blank-drop-card-icon">∑</div>
              <div className="blank-drop-card-title">3. Zona Valores y Cálculos</div>
              <div className="blank-drop-card-hint">Suelta aquí métricas numéricas y elige Suma, Conteo, etc.</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', justifyContent: 'center' }}>
                {numericFields.filter(f => !/^(cod|id|nit|num)/i.test(f.name)).slice(0, 3).map(f => (
                  <button
                    key={f.name}
                    type="button"
                    className="btn btn-light"
                    style={{ fontSize: '10px', padding: '2px 6px', color: '#166534', fontWeight: 600 }}
                    onClick={() => onSliceChange && onSliceChange({
                      ...slice,
                      measures: [...slice.measures, { field: f.name, aggregation: 'sum', caption: f.name.replace(/_/g, ' ') }]
                    })}
                  >
                    + {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : matrix.length === 0 ? (
        <div className="blank-table-canvas" style={{ minHeight: '260px' }}>
          <div className="blank-canvas-icon">⏳</div>
          <div className="blank-canvas-title">Calculando / Esperando Métricas</div>
          <div className="blank-canvas-desc">
            {measures.length === 0
              ? 'Has definido filas o columnas pero falta agregar al menos una métrica a "Valores / Cálculos" para computar los totales.'
              : 'No se encontraron registros que coincidan con los filtros actuales.'}
          </div>
        </div>
      ) : (
        <div className={`pivot-table-card style-${tableStyle}`}>
          {/* 1. Grid View Navigation & Hierarchical Controls Bar */}
          <div className="table-nav-controls-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* View Mode Switcher: Tree vs Tabular */}
              {rows.length > 1 && (
                <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'tree' ? 'btn-primary' : 'btn-light'}`}
                    style={{ fontSize: '11px', padding: '2px 8px', height: '24px' }}
                    onClick={() => { setViewMode('tree'); setCurrentPage(1); }}
                    title="Vista Jerárquica: Agrupa los códigos y dimensiones en árbol con expandir/colapsar (Estilo Flexmonster)"
                  >
                    🌲 Árbol Jerárquico
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'tabular' ? 'btn-primary' : 'btn-light'}`}
                    style={{ fontSize: '11px', padding: '2px 8px', height: '24px' }}
                    onClick={() => { setViewMode('tabular'); setCurrentPage(1); }}
                    title="Vista Tabular: Columnas separadas con celdas agrupadas (Estilo Excel)"
                  >
                    📋 Tabular Agrupado
                  </button>
                </div>
              )}

              {/* Expand / Collapse All buttons */}
              {rows.length > 1 && viewMode === 'tree' && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-light"
                    style={{ fontSize: '10.5px', padding: '2px 7px', height: '24px' }}
                    onClick={expandAll}
                    title="Expandir todas las ramas y niveles de la jerarquía"
                  >
                    ➕ Expandir Todo
                  </button>
                  <button
                    type="button"
                    className="btn btn-light"
                    style={{ fontSize: '10.5px', padding: '2px 7px', height: '24px' }}
                    onClick={collapseAll}
                    title="Colapsar todo a nivel principal (mostrar solo códigos/grupos únicos)"
                  >
                    ➖ Colapsar Todo
                  </button>
                </div>
              )}

              {/* Quick Search Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Filtrar en tabla..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="input-control"
                  style={{ fontSize: '11px', padding: '2px 8px', height: '25px', width: '150px' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px' }}
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Paginator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#475569', flexWrap: 'wrap' }}>
              <span>
                Mostrando <strong>{startItem}-{endItem}</strong> de <strong>{totalItems}</strong> {isTreeEffective && rows[0] ? rows[0] + 's' : 'filas'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ padding: '1px 6px', height: '24px', fontSize: '11px' }}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  title="Página anterior"
                >
                  ←
                </button>
                <span style={{ fontSize: '11px', padding: '0 4px' }}>
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ padding: '1px 6px', height: '24px', fontSize: '11px' }}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  title="Página siguiente"
                >
                  →
                </button>
              </div>
              <select
                className="input-control"
                style={{ fontSize: '11px', padding: '1px 4px', height: '24px' }}
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={25}>25 / pág</option>
                <option value={50}>50 / pág</option>
                <option value={100}>100 / pág</option>
                <option value={250}>250 / pág</option>
              </select>
            </div>
          </div>

          <table className={`pivot-table style-${tableStyle}`}>
            <thead>
              <tr>
                {isTreeEffective ? (
                  <th className="col-dim-header" style={{ textAlign: 'left', minWidth: '260px' }}>
                    {rows.join('  ➔  ')}
                  </th>
                ) : (
                  rows.length > 0 ? (
                    rows.map(r => (
                      <th key={r} className="col-dim-header" style={{ textAlign: 'left' }}>
                        {r}
                      </th>
                    ))
                  ) : (
                    <th className="col-dim-header" style={{ textAlign: 'left' }}>
                      Total
                    </th>
                  )
                )}

                {columnDefinitions.map((colDef, idx) => (
                  <th key={idx} className="measure-header" title={colDef.colKey}>
                    {colDef.headerLabel}
                  </th>
                ))}

                {measures.map((m, mIdx) => (
                  <th key={`total-${mIdx}`} className="measure-header row-total-header">
                    TOTAL ({m.caption || `${m.aggregation.toUpperCase()} ${m.field}`})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* OPTION A: HIERARCHICAL TREE VIEW (Grouped code/dimension with expand/collapse) */}
              {isTreeEffective ? (
                visibleTreeNodes.map((node) => {
                  const isCollapsed = collapsedKeys.has(node.key);
                  const isRoot = node.level === 0;

                  return (
                    <tr
                      key={node.key}
                      className={`tree-row level-${node.level} ${isRoot ? 'tree-row-root' : 'tree-row-sub'}`}
                    >
                      <td
                        className="row-dim-cell"
                        style={{
                          paddingLeft: `${14 + node.level * 22}px`,
                          fontWeight: isRoot ? 700 : (node.hasChildren ? 600 : 400),
                          color: isRoot ? '#0f172a' : '#334155'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {node.hasChildren ? (
                            <button
                              type="button"
                              className="tree-chevron-btn"
                              onClick={() => toggleCollapse(node.key)}
                              title={isCollapsed ? `Expandir ${node.label}` : `Colapsar ${node.label}`}
                            >
                              {isCollapsed ? '▶' : '▼'}
                            </button>
                          ) : (
                            <span style={{ display: 'inline-block', width: '18px', textAlign: 'center', color: '#94a3b8' }}>•</span>
                          )}

                          <span style={{ userSelect: 'text' }}>{node.label}</span>

                          {node.hasChildren && (
                            <span className="tree-badge">
                              {node.childrenCount} {node.level === 0 && rows[1] ? rows[1] : 'ítems'}
                            </span>
                          )}

                          {isRoot && rows.length > 1 && (
                            <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.3px', marginLeft: 'auto' }}>
                              {node.dimension}
                            </span>
                          )}
                        </div>
                      </td>

                      {node.values.map((val, cIdx) => {
                        const colDef = columnDefinitions[cIdx];
                        const style = getCellStyle(val, colDef?.measure?.field);
                        return (
                          <td
                            key={cIdx}
                            className={`data-cell ${isRoot ? 'cell-root' : ''}`}
                            style={{ ...style, fontWeight: isRoot ? 700 : (node.hasChildren ? 600 : 400) }}
                          >
                            {formatValue(val, colDef?.measure)}
                          </td>
                        );
                      })}

                      {node.rowTotals && node.rowTotals.map((rTotal, mIdx) => {
                        const m = measures[mIdx];
                        const style = getCellStyle(rTotal, m?.field);
                        return (
                          <td
                            key={`rtotal-${mIdx}`}
                            className={`data-cell total-cell ${isRoot ? 'cell-root' : ''}`}
                            style={{ ...style, fontWeight: 700 }}
                          >
                            {formatValue(rTotal, m)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                /* OPTION B: TABULAR GROUPED VIEW (Consecutive duplicate parent dimension cells suppressed) */
                currentMatrixRows.map((rowItem, rIdx) => (
                  <tr key={rowItem.rowKey || rIdx} className={rIdx % 2 === 0 ? 'row-even' : 'row-odd'}>
                    {rowItem.rowParts.map((part, pIdx) => {
                      const isDup = isDuplicateTabular(rIdx, pIdx);
                      return (
                        <td
                          key={pIdx}
                          className={`row-dim-cell ${isDup ? 'row-dim-duplicate' : ''}`}
                          style={{
                            paddingLeft: `${14 + pIdx * 10}px`,
                            borderTop: !isDup && rIdx > 0 && pIdx === 0 ? '1px solid #cbd5e1' : undefined,
                            fontWeight: !isDup && pIdx === 0 ? 600 : 400
                          }}
                        >
                          {isDup ? '' : part}
                        </td>
                      );
                    })}

                    {rowItem.values.map((val, cIdx) => {
                      const colDef = columnDefinitions[cIdx];
                      const style = getCellStyle(val, colDef?.measure?.field);
                      return (
                        <td key={cIdx} className="data-cell" style={style}>
                          {formatValue(val, colDef?.measure)}
                        </td>
                      );
                    })}

                    {rowItem.rowTotals && rowItem.rowTotals.map((rTotal, mIdx) => {
                      const m = measures[mIdx];
                      const style = getCellStyle(rTotal, m?.field);
                      return (
                        <td key={`rtotal-${mIdx}`} className="data-cell total-cell" style={style}>
                          {formatValue(rTotal, m)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}

              {/* Grand Total Row */}
              <tr className="grand-total-row">
                <td
                  colSpan={isTreeEffective ? 1 : rowDimensionsCount}
                  style={{ fontWeight: 800, paddingLeft: '14px', fontSize: '12px' }}
                >
                  TOTAL GENERAL
                </td>
                {grandTotals.map((gVal, idx) => {
                  const colDef = columnDefinitions[idx];
                  return (
                    <td key={idx} className="data-cell total-cell" style={{ fontWeight: 800 }}>
                      {formatValue(gVal, colDef?.measure)}
                    </td>
                  );
                })}
                {grandGrandTotals.map((ggVal, idx) => {
                  const m = measures[idx];
                  return (
                    <td key={`gg-${idx}`} className="data-cell total-cell grand-grand-cell" style={{ fontWeight: 800 }}>
                      {formatValue(ggVal, m)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
