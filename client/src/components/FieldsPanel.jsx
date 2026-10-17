import React, { useState } from 'react';

export function FieldsPanel({
  fields = [],
  slice = { rows: [], columns: [], measures: [], filters: [] },
  onSliceChange,
  onOpenCalculatedModal,
  onOpenFilterModal,
  activeTableName,
  onClearActiveTable,
  targetMode = 'table' // 'table' | 'chart'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dragOverZone, setDragOverZone] = useState(null); // 'rows' | 'columns' | 'measures' | 'filters'

  const filteredFields = fields.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ----------------------------------------------------
  // Drag & Drop Handlers (HTML5 Drag and Drop API)
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

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const item = JSON.parse(rawData);
      const { name, type, sourceZone } = item;

      // Clean from old zone if moving between zones
      let nextRows = [...slice.rows];
      let nextColumns = [...slice.columns];
      let nextMeasures = [...slice.measures];

      if (sourceZone === 'rows') {
        nextRows = nextRows.filter(r => r !== name);
      } else if (sourceZone === 'columns') {
        nextColumns = nextColumns.filter(c => c !== name);
      } else if (sourceZone === 'measures') {
        nextMeasures = nextMeasures.filter(m => m.field !== name);
      }

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
            caption: name
          });
        }
      }

      onSliceChange({
        ...slice,
        rows: nextRows,
        columns: nextColumns,
        measures: nextMeasures
      });
    } catch (err) {
      console.error('Drag and drop error:', err);
    }
  };

  // Click-based helpers
  const addFieldToZone = (zoneName, field) => {
    if (zoneName === 'rows' && !slice.rows.includes(field.name)) {
      onSliceChange({ ...slice, rows: [...slice.rows, field.name] });
    } else if (zoneName === 'columns' && !slice.columns.includes(field.name)) {
      onSliceChange({ ...slice, columns: [...slice.columns, field.name] });
    } else if (zoneName === 'measures') {
      const exists = slice.measures.some(m => m.field === field.name);
      if (!exists) {
        onSliceChange({
          ...slice,
          measures: [...slice.measures, { field: field.name, aggregation: field.type === 'number' ? 'sum' : 'count', caption: field.name }]
        });
      }
    }
  };

  const removeRow = (index) => {
    const next = [...slice.rows];
    next.splice(index, 1);
    onSliceChange({ ...slice, rows: next });
  };

  const removeColumn = (index) => {
    const next = [...slice.columns];
    next.splice(index, 1);
    onSliceChange({ ...slice, columns: next });
  };

  const removeMeasure = (index) => {
    const next = [...slice.measures];
    next.splice(index, 1);
    onSliceChange({ ...slice, measures: next });
  };

  const updateAggregation = (index, newAgg) => {
    const next = [...slice.measures];
    next[index] = { ...next[index], aggregation: newAgg };
    onSliceChange({ ...slice, measures: next });
  };

  const getFilterBadge = (fieldName) => {
    const activeFilter = slice.filters?.find(f => f.field === fieldName);
    if (activeFilter && activeFilter.selectedValues?.length > 0) {
      return `(${activeFilter.selectedValues.length})`;
    }
    return '';
  };

  return (
    <aside className="fields-sidebar">
      {/* Active Table / Chart Indicator Badge */}
      <div style={{ padding: '8px 12px', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', color: targetMode === 'chart' ? '#a855f7' : '#38bdf8', fontWeight: 700, letterSpacing: '0.4px' }}>
            {targetMode === 'chart' ? '📈 CONFIGURANDO GRÁFICO:' : '📋 EDITANDO TABLA:'}
          </span>
          <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 600 }}>{activeTableName || (targetMode === 'chart' ? 'Gráfico 1' : 'Tabla 1')}</span>
        </div>
        {onClearActiveTable && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '10px', padding: '2px 6px', color: '#f87171' }}
            onClick={onClearActiveTable}
            title={targetMode === 'chart' ? "Vaciar este gráfico y dejarlo en blanco" : "Vaciar esta tabla y dejarla en blanco"}
          >
            🧹 Vaciar
          </button>
        )}
      </div>

      {/* Search and Available Fields */}
      <div className="sidebar-section">
        <div className="sidebar-title">
          <span>Campos Disponibles</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{fields.length} campos</span>
        </div>
        <input
          type="text"
          placeholder="Buscar campo..."
          className="input-control"
          style={{ width: '100%', marginBottom: '8px', fontSize: '12px', padding: '5px 8px' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontStyle: 'italic' }}>
          💡 Arrastra los campos a las zonas inferiores:
        </div>

        <div className="fields-available-list">
          {filteredFields.map(f => (
            <div
              key={f.name}
              className="field-chip draggable-chip"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, { name: f.name, type: f.type, sourceZone: 'available' })}
              title={targetMode === 'chart' ? "Arrastra este campo al Eje X, Series o Valores" : "Arrastra este campo a Filas, Columnas o Valores"}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ cursor: 'grab', color: '#94a3b8' }}>⠿</span>
                <span style={{ fontWeight: 500 }}>{f.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className={`field-tag-type ${f.type === 'number' ? 'number' : ''}`}>
                  {f.type === 'number' ? '#' : 'Aa'}
                </span>
                <button
                  type="button"
                  title={targetMode === 'chart' ? "Agregar al Eje X (Categorías)" : "Agregar a Filas"}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#64748b' }}
                  onClick={() => addFieldToZone('rows', f)}
                >
                  {targetMode === 'chart' ? '+Eje X' : '+Fila'}
                </button>
                <button
                  type="button"
                  title={targetMode === 'chart' ? "Agregar a Desglose (Series Secundarias)" : "Agregar a Columnas"}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#64748b' }}
                  onClick={() => addFieldToZone('columns', f)}
                >
                  {targetMode === 'chart' ? '+Serie' : '+Col'}
                </button>
                <button
                  type="button"
                  title="Agregar a Valores / Métricas"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#2563eb', fontWeight: 600 }}
                  onClick={() => addFieldToZone('measures', f)}
                >
                  +Val
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-light"
          style={{ width: '100%', marginTop: '8px', fontSize: '11px', justifyContent: 'center' }}
          onClick={onOpenCalculatedModal}
        >
          ➕ Crear Métrica Calculada (Fórmula)
        </button>
      </div>

      {/* 4 Pivot Drop Zones with Active Drag-and-Drop */}
      <div className="drop-zones-grid">
        {/* Columnas Zone */}
        <div
          className={`drop-zone ${dragOverZone === 'columns' ? 'drag-over-active' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'columns')}
          onDragLeave={(e) => handleDragLeave(e, 'columns')}
          onDrop={(e) => handleDrop(e, 'columns')}
        >
          <div className="zone-header">
            <span>{targetMode === 'chart' ? `↔ Desglose / Series (${slice.columns.length})` : `↔ Columnas (${slice.columns.length})`}</span>
            {dragOverZone === 'columns' && <span style={{ fontSize: '10px', color: '#2563eb' }}>Suelta aquí</span>}
          </div>
          <div className="zone-items-container">
            {slice.columns.map((colName, idx) => (
              <div
                key={colName}
                className="zone-item draggable-chip"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, { name: colName, sourceZone: 'columns' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ cursor: 'grab', color: '#94a3b8', fontSize: '10px' }}>⠿</span>
                  <span className="item-title">{colName}</span>
                </div>
                <div className="zone-item-actions">
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#2563eb' }}
                    title="Filtrar valores de esta columna"
                    onClick={() => onOpenFilterModal(colName)}
                  >
                    🔍 {getFilterBadge(colName)}
                  </button>
                  <button className="zone-remove-btn" onClick={() => removeColumn(idx)}>×</button>
                </div>
              </div>
            ))}
            {slice.columns.length === 0 && (
              <div className="drop-zone-placeholder">
                {targetMode === 'chart' ? 'Arrastra series secundarias' : 'Arrastra columnas aquí'}
              </div>
            )}
          </div>
        </div>

        {/* Filas Zone */}
        <div
          className={`drop-zone ${dragOverZone === 'rows' ? 'drag-over-active' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'rows')}
          onDragLeave={(e) => handleDragLeave(e, 'rows')}
          onDrop={(e) => handleDrop(e, 'rows')}
        >
          <div className="zone-header">
            <span>{targetMode === 'chart' ? `↕ Eje X / Categorías (${slice.rows.length})` : `↕ Filas (${slice.rows.length})`}</span>
            {dragOverZone === 'rows' && <span style={{ fontSize: '10px', color: '#2563eb' }}>Suelta aquí</span>}
          </div>
          <div className="zone-items-container">
            {slice.rows.map((rowName, idx) => (
              <div
                key={rowName}
                className="zone-item draggable-chip"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, { name: rowName, sourceZone: 'rows' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ cursor: 'grab', color: '#94a3b8', fontSize: '10px' }}>⠿</span>
                  <span className="item-title">{rowName}</span>
                </div>
                <div className="zone-item-actions">
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#2563eb' }}
                    title="Filtrar valores de esta fila"
                    onClick={() => onOpenFilterModal(rowName)}
                  >
                    🔍 {getFilterBadge(rowName)}
                  </button>
                  <button className="zone-remove-btn" onClick={() => removeRow(idx)}>×</button>
                </div>
              </div>
            ))}
            {slice.rows.length === 0 && (
              <div className="drop-zone-placeholder">
                {targetMode === 'chart' ? 'Arrastra eje X / categorías' : 'Arrastra filas aquí'}
              </div>
            )}
          </div>
        </div>

        {/* Valores / Measures Zone */}
        <div
          className={`drop-zone ${dragOverZone === 'measures' ? 'drag-over-active' : ''}`}
          style={{ gridColumn: 'span 2' }}
          onDragOver={(e) => handleDragOver(e, 'measures')}
          onDragLeave={(e) => handleDragLeave(e, 'measures')}
          onDrop={(e) => handleDrop(e, 'measures')}
        >
          <div className="zone-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{targetMode === 'chart' ? `∑ Valores a Graficar (${slice.measures.length})` : `∑ Valores / Métricas (${slice.measures.length})`}</span>
            <button
              type="button"
              className="btn btn-light"
              style={{ fontSize: '10.5px', padding: '2px 7px', height: '22px', lineHeight: 1, borderColor: '#cbd5e1', color: '#2563eb', fontWeight: 600 }}
              onClick={onOpenCalculatedModal}
              title="Crear nueva métrica calculada con fórmula personalizada"
            >
              + Nueva Métrica
            </button>
            {dragOverZone === 'measures' && <span style={{ fontSize: '10px', color: '#2563eb' }}>Suelta aquí</span>}
          </div>
          <div className="zone-items-container">
            {slice.measures.map((m, idx) => (
              <div
                key={`${m.field}-${idx}`}
                className="zone-item draggable-chip"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, { name: m.field, type: 'number', sourceZone: 'measures' })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ cursor: 'grab', color: '#94a3b8', fontSize: '10px' }}>⠿</span>
                  <span className="item-title" title={m.formula ? `Fórmula: ${m.formula}` : m.field}>
                    {m.caption || m.field}
                  </span>
                </div>
                <div className="zone-item-actions">
                  {m.aggregation === 'calc' ? (
                    <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                      CALC
                    </span>
                  ) : (
                    <select
                      className="agg-select"
                      value={m.aggregation}
                      onChange={e => updateAggregation(idx, e.target.value)}
                    >
                      <option value="sum">SUM</option>
                      <option value="avg">AVG</option>
                      <option value="count">COUNT</option>
                      <option value="min">MIN</option>
                      <option value="max">MAX</option>
                      <option value="distinct_count">DISTINCT</option>
                    </select>
                  )}
                  <button className="zone-remove-btn" onClick={() => removeMeasure(idx)}>×</button>
                </div>
              </div>
            ))}
            {slice.measures.length === 0 && (
              <div className="drop-zone-placeholder">
                Arrastra métricas numéricas aquí
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
