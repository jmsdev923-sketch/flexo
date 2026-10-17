import React, { useState } from 'react';

const CHART_OPTIONS = [
  { id: 'bar_vertical', label: '📊 Columnas' },
  { id: 'bar_horizontal', label: '📊 Barras H.' },
  { id: 'line_curve', label: '📈 Líneas' },
  { id: 'area_stacked', label: '🌊 Área' },
  { id: 'donut_pie', label: '🍩 Donut' },
  { id: 'radar_polar', label: '🕸️ Radar' }
];

const AGG_OPTIONS = [
  { id: 'sum', label: '∑ Suma' },
  { id: 'avg', label: 'AVG Promedio' },
  { id: 'count', label: '123 Conteo' },
  { id: 'min', label: 'MIN Mínimo' },
  { id: 'max', label: 'MAX Máximo' },
  { id: 'distinct_count', label: '≠ Únicos' }
];

export function PivotChart({
  chartId,
  title = 'Gráfico Analítico',
  onTitleChange,
  slice = { rows: [], columns: [], measures: [], filters: [] },
  onSliceChange,
  chartType = 'bar_vertical',
  onChartTypeChange,
  pivotResult,
  currencyFormat = true,
  onToggleCurrency,
  onClearChart,
  onDuplicateChart,
  onDeleteChart,
  canDelete = false,
  fields = [],
  loading = false
}) {
  const [dragOverZone, setDragOverZone] = useState(null); // 'rows' | 'columns' | 'measures'
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  // ----------------------------------------------------
  // Drag & Drop Handlers for Chart
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

    if (sourceZone === 'rows') nextRows = nextRows.filter(r => r !== name);
    if (sourceZone === 'columns') nextColumns = nextColumns.filter(c => c !== name);
    if (sourceZone === 'measures') nextMeasures = nextMeasures.filter(m => m.field !== name);

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
    }

    if (onSliceChange) {
      onSliceChange({
        ...slice,
        rows: nextRows,
        columns: nextColumns,
        measures: nextMeasures
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
  // Value formatting and Tick labels
  // ----------------------------------------------------
  const formatTick = (val) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1000000000) return `${sign}${(abs / 1000000000).toFixed(1)}B`;
    if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(0)}k`;
    return `${sign}${abs}`;
  };

  const formatChartVal = (val) => {
    const isNeg = val < 0;
    const abs = Math.abs(val);
    const formatted = formatTick(abs);
    if (!currencyFormat) return isNeg ? `-${formatted}` : formatted;
    return isNeg ? `-$${formatted}` : `$${formatted}`;
  };

  const hasSlice = (slice.rows && slice.rows.length > 0) || (slice.measures && slice.measures.length > 0);
  const hasMatrix = Boolean(pivotResult?.matrix && pivotResult.matrix.length > 0);
  const isBlank = !hasSlice && !hasMatrix;

  const { matrix = [], columnDefinitions = [] } = pivotResult || {};
  const chartRows = matrix.slice(0, 10);
  const labels = chartRows.map(r => r.rowParts?.join(' / ') || r.rowKey || 'Item');

  const seriesCount = Math.min(columnDefinitions.length || 1, 4);
  const seriesLabels = columnDefinitions.slice(0, seriesCount).map(c => c.headerLabel || c.measure?.caption || 'Valor');

  let maxVal = 0;
  chartRows.forEach(r => {
    for (let i = 0; i < seriesCount; i++) {
      const v = r.values?.[i];
      if (typeof v === 'number' && v > maxVal) {
        maxVal = v;
      }
    }
  });
  if (maxVal === 0) maxVal = 100;

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Pie / Donut calculation
  const pieData = chartRows.map((r, i) => ({
    label: labels[i] || `Item ${i}`,
    val: typeof r.values?.[0] === 'number' ? r.values[0] : 0,
    color: colors[i % colors.length]
  }));
  const totalPieVal = pieData.reduce((acc, curr) => acc + curr.val, 0) || 1;

  const stringFields = fields.filter(f => f.type !== 'number');
  const numericFields = fields.filter(f => f.type === 'number');

  return (
    <div className="chart-container" style={{ padding: '8px', width: '100%', marginBottom: '16px' }}>
      <div className="chart-card" style={{ width: '100%', padding: '16px' }}>
        {/* 1. Interactive Chart Header & Builder Toolbar */}
        <div className="chart-builder-card" style={{ marginBottom: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
          <div className="builder-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📈</span>
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
                  title="Haz clic para renombrar este gráfico"
                  style={{ cursor: 'pointer' }}
                >
                  {title} ✏️
                </span>
              )}
              {loading && <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>• Graficando...</span>}
            </div>

            {/* Quick Chart Type Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {CHART_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`btn ${chartType === opt.id ? 'btn-primary' : 'btn-light'}`}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    height: '24px',
                    borderRadius: '12px',
                    fontWeight: chartType === opt.id ? 700 : 500,
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => onChartTypeChange && onChartTypeChange(opt.id)}
                >
                  {opt.label}
                </button>
              ))}

              <div style={{ height: '18px', width: '1px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />

              {onToggleCurrency && (
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ fontSize: '10.5px', padding: '2px 7px', height: '24px' }}
                  onClick={onToggleCurrency}
                  title="Alternar formato: Peso Colombiano ($) / Numérico"
                >
                  {currencyFormat ? '💵 COP' : '🔢 Num'}
                </button>
              )}

              {onClearChart && (
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ fontSize: '10.5px', padding: '2px 7px', height: '24px', color: '#64748b' }}
                  onClick={onClearChart}
                  title="Vaciar gráfico y dejarlo en blanco"
                >
                  🧹 Vaciar
                </button>
              )}

              {onDuplicateChart && (
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ fontSize: '10.5px', padding: '2px 7px', height: '24px' }}
                  onClick={onDuplicateChart}
                  title="Duplicar este gráfico"
                >
                  📋 Duplicar
                </button>
              )}

              {canDelete && onDeleteChart && (
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ fontSize: '10.5px', padding: '2px 7px', height: '24px', color: '#ef4444' }}
                  onClick={onDeleteChart}
                  title="Eliminar este gráfico"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          </div>

          {/* Drop Zones Strip for Chart (Eje X, Series, Valores) */}
          <div className="builder-drop-zones-strip" style={{ marginTop: '8px' }}>
            {/* ZONE 1: EJE X / CATEGORIAS */}
            <div
              className={`builder-zone-box ${dragOverZone === 'rows' ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, 'rows')}
              onDragLeave={e => handleDragLeave(e, 'rows')}
              onDrop={e => handleDrop(e, 'rows')}
              title="Arrastra dimensiones aquí para el eje horizontal / categorías"
            >
              <div className="builder-zone-header">
                <span>🏷️ Eje X / Categorías ({slice.rows?.length || 0})</span>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>Dimensiones</span>
              </div>
              <div className="builder-chips-wrap">
                {slice.rows?.map(rName => (
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
                {(!slice.rows || slice.rows.length === 0) && (
                  <span className="builder-placeholder">Suelta dimensión aquí</span>
                )}
              </div>
            </div>

            {/* ZONE 2: DESGLOSE / SERIES SECUNDARIAS */}
            <div
              className={`builder-zone-box ${dragOverZone === 'columns' ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, 'columns')}
              onDragLeave={e => handleDragLeave(e, 'columns')}
              onDrop={e => handleDrop(e, 'columns')}
              title="Arrastra dimensiones aquí para desglosar en series múltiples"
            >
              <div className="builder-zone-header">
                <span>↔ Desglose / Series ({slice.columns?.length || 0})</span>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>Opcional</span>
              </div>
              <div className="builder-chips-wrap">
                {slice.columns?.map(cName => (
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
                {(!slice.columns || slice.columns.length === 0) && (
                  <span className="builder-placeholder">Opcional</span>
                )}
              </div>
            </div>

            {/* ZONE 3: VALORES / METRICAS Y CALCULOS */}
            <div
              className={`builder-zone-box ${dragOverZone === 'measures' ? 'drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, 'measures')}
              onDragLeave={e => handleDragLeave(e, 'measures')}
              onDrop={e => handleDrop(e, 'measures')}
              title="Arrastra métricas numéricas aquí y decide el cálculo a graficar"
            >
              <div className="builder-zone-header">
                <span>∑ Métrica / Valores ({slice.measures?.length || 0})</span>
                <span style={{ fontSize: '9px', color: '#166534', fontWeight: 600 }}>Cálculo</span>
              </div>
              <div className="builder-chips-wrap">
                {slice.measures?.map((m, mIdx) => (
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
                      title="Selecciona la función de cálculo"
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
                {(!slice.measures || slice.measures.length === 0) && (
                  <span className="builder-placeholder">Suelta métrica aquí</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Blank Chart Interactive Canvas OR Rendered Visual Chart */}
        {isBlank ? (
          <div className="blank-chart-canvas">
            <div className="blank-canvas-icon">📈</div>
            <div className="blank-canvas-title">Gráfico Analítico en Blanco</div>
            <div className="blank-canvas-desc">
              Arrastra los campos desde el panel <strong>Campos Disponibles</strong> para configurar este gráfico:
            </div>

            <div className="blank-cards-grid" style={{ maxWidth: '650px' }}>
              {/* Eje X Drop Card */}
              <div
                className={`blank-drop-card ${dragOverZone === 'rows' ? 'drag-over' : ''}`}
                onDragOver={e => handleDragOver(e, 'rows')}
                onDragLeave={e => handleDragLeave(e, 'rows')}
                onDrop={e => handleDrop(e, 'rows')}
              >
                <div className="blank-drop-card-icon">🏷️</div>
                <div className="blank-drop-card-title">1. Eje X / Categorías</div>
                <div className="blank-drop-card-hint">Suelta aquí dimensiones para las barras o curvas</div>
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

              {/* Valores Drop Card */}
              <div
                className={`blank-drop-card ${dragOverZone === 'measures' ? 'drag-over' : ''}`}
                onDragOver={e => handleDragOver(e, 'measures')}
                onDragLeave={e => handleDragLeave(e, 'measures')}
                onDrop={e => handleDrop(e, 'measures')}
              >
                <div className="blank-drop-card-icon">∑</div>
                <div className="blank-drop-card-title">2. Valores y Cálculos</div>
                <div className="blank-drop-card-hint">Suelta aquí métricas numéricas para graficar</div>
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
          <div className="blank-chart-canvas" style={{ minHeight: '220px' }}>
            <div className="blank-canvas-icon">⏳</div>
            <div className="blank-canvas-title">Esperando Datos / Métricas</div>
            <div className="blank-canvas-desc">
              {slice.measures?.length === 0
                ? 'Agrega al menos una métrica a "Métrica / Valores" para calcular y graficar las alturas.'
                : 'No se encontraron datos que coincidan con la dimensión seleccionada.'}
            </div>
          </div>
        ) : (
          <div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', width: '100%' }}>
              {seriesLabels.map((sLabel, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: colors[idx % colors.length] }} />
                  <span style={{ fontWeight: 500, color: '#334155' }}>{sLabel}</span>
                </div>
              ))}
            </div>

            {/* 1. BARRAS VERTICALES */}
            {chartType === 'bar_vertical' && (
              <div style={{ width: '100%', height: '340px' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 320" preserveAspectRatio="none">
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                    const y = 280 - pct * 240;
                    const val = Math.round(maxVal * pct);
                    return (
                      <g key={i}>
                        <line x1="60" y1={y} x2="780" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                        <text x="50" y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                          {formatChartVal(val)}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="60" y1="280" x2="780" y2="280" stroke="#cbd5e1" strokeWidth="1.5" />
                  {chartRows.map((r, rIdx) => {
                    const groupWidth = 720 / chartRows.length;
                    const barWidth = Math.max((groupWidth - 20) / seriesCount, 6);
                    const groupX = 60 + rIdx * groupWidth + 10;
                    return (
                      <g key={rIdx}>
                        <text x={groupX + (groupWidth - 20) / 2} y="300" fill="#475569" fontSize="11" textAnchor="middle" fontWeight="500">
                          {labels[rIdx].length > 14 ? `${labels[rIdx].slice(0, 12)}...` : labels[rIdx]}
                        </text>
                        {Array.from({ length: seriesCount }).map((_, sIdx) => {
                          const val = r.values?.[sIdx] || 0;
                          const barHeight = Math.max((val / maxVal) * 240, 2);
                          const barX = groupX + sIdx * barWidth;
                          const barY = 280 - barHeight;
                          return (
                            <rect key={sIdx} x={barX} y={barY} width={barWidth - 2} height={barHeight} fill={colors[sIdx % colors.length]} rx="2">
                              <title>{`${seriesLabels[sIdx]}: ${val}`}</title>
                            </rect>
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* 2. BARRAS HORIZONTALES */}
            {chartType === 'bar_horizontal' && (
              <div style={{ width: '100%', height: '360px' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 340">
                  <line x1="160" y1="20" x2="160" y2="310" stroke="#cbd5e1" strokeWidth="1.5" />
                  {chartRows.map((r, rIdx) => {
                    const rowHeight = 280 / chartRows.length;
                    const barH = Math.max((rowHeight - 10) / seriesCount, 6);
                    const startY = 25 + rIdx * rowHeight;

                    return (
                      <g key={rIdx}>
                        <text x="150" y={startY + rowHeight / 2} fill="#475569" fontSize="11" textAnchor="end" fontWeight="500">
                          {labels[rIdx].length > 16 ? `${labels[rIdx].slice(0, 14)}...` : labels[rIdx]}
                        </text>
                        {Array.from({ length: seriesCount }).map((_, sIdx) => {
                          const val = r.values?.[sIdx] || 0;
                          const barW = Math.max((val / maxVal) * 580, 3);
                          const barY = startY + sIdx * barH;
                          return (
                            <g key={sIdx}>
                              <rect x="160" y={barY} width={barW} height={barH - 2} fill={colors[sIdx % colors.length]} rx="2">
                                <title>{`${seriesLabels[sIdx]} (${labels[rIdx]}): ${val}`}</title>
                              </rect>
                              <text x={166 + barW} y={barY + barH - 3} fill="#64748b" fontSize="9.5" fontWeight="600">
                                {formatChartVal(val)}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* 3. LÍNEAS / TENDENCIA */}
            {chartType === 'line_curve' && (
              <div style={{ width: '100%', height: '340px' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 320" preserveAspectRatio="none">
                  <line x1="60" y1="280" x2="780" y2="280" stroke="#cbd5e1" strokeWidth="1.5" />
                  {Array.from({ length: seriesCount }).map((_, sIdx) => {
                    const groupWidth = 720 / (chartRows.length || 1);
                    const points = chartRows.map((r, rIdx) => {
                      const val = r.values?.[sIdx] || 0;
                      const x = 60 + rIdx * groupWidth + groupWidth / 2;
                      const y = 280 - (val / maxVal) * 240;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <g key={sIdx}>
                        <polyline fill="none" stroke={colors[sIdx % colors.length]} strokeWidth="3" points={points} />
                        {chartRows.map((r, rIdx) => {
                          const val = r.values?.[sIdx] || 0;
                          const cx = 60 + rIdx * groupWidth + groupWidth / 2;
                          const cy = 280 - (val / maxVal) * 240;
                          return (
                            <circle key={rIdx} cx={cx} cy={cy} r="4" fill={colors[sIdx % colors.length]} stroke="#fff" strokeWidth="2">
                              <title>{`${labels[rIdx]}: ${val}`}</title>
                            </circle>
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* 4. ÁREA APILADA / SOMBREADA */}
            {chartType === 'area_stacked' && (
              <div style={{ width: '100%', height: '340px' }}>
                <svg width="100%" height="100%" viewBox="0 0 800 320" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <line x1="60" y1="280" x2="780" y2="280" stroke="#cbd5e1" strokeWidth="1.5" />
                  {(() => {
                    const groupWidth = 720 / (chartRows.length || 1);
                    const points = chartRows.map((r, rIdx) => {
                      const val = r.values?.[0] || 0;
                      const x = 60 + rIdx * groupWidth + groupWidth / 2;
                      const y = 280 - (val / maxVal) * 240;
                      return `${x},${y}`;
                    });
                    const firstX = 60 + groupWidth / 2;
                    const lastX = 60 + (chartRows.length - 1) * groupWidth + groupWidth / 2;
                    const areaPath = `M ${firstX},280 L ${points.join(' L ')} L ${lastX},280 Z`;

                    return (
                      <g>
                        <path d={areaPath} fill="url(#areaGradient)" />
                        <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={points.join(' ')} />
                      </g>
                    );
                  })()}
                </svg>
              </div>
            )}

            {/* 5. DONUT / CIRCULAR */}
            {chartType === 'donut_pie' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '20px' }}>
                <div style={{ position: 'relative', width: '260px', height: '260px' }}>
                  <svg width="260" height="260" viewBox="0 0 260 260">
                    {(() => {
                      const radius = 90;
                      const strokeWidth = 36;
                      const circumference = 2 * Math.PI * radius;
                      let accumulatedOffset = 0;

                      return pieData.map((sliceItem, idx) => {
                        const ratio = sliceItem.val / (totalPieVal || 1);
                        const strokeDasharray = `${ratio * circumference} ${circumference}`;
                        const strokeDashoffset = -accumulatedOffset;
                        accumulatedOffset += ratio * circumference;

                        return (
                          <circle
                            key={idx}
                            cx="130"
                            cy="130"
                            r={radius}
                            fill="transparent"
                            stroke={sliceItem.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'all 0.3s ease' }}
                          >
                            <title>{`${sliceItem.label}: ${sliceItem.val} (${Math.round(ratio * 100)}%)`}</title>
                          </circle>
                        );
                      });
                    })()}
                  </svg>
                  {/* Center Total */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL</div>
                    <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>
                      {formatChartVal(totalPieVal)}
                    </div>
                  </div>
                </div>

                {/* Legend Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', width: '100%' }}>
                  {pieData.map((sliceItem, idx) => {
                    const pct = Math.round((sliceItem.val / totalPieVal) * 100);
                    return (
                      <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: sliceItem.color }} />
                          <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '12px' }}>{sliceItem.label}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{pct}%</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>{formatChartVal(sliceItem.val)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. RADAR / SPIDER PLOT */}
            {chartType === 'radar_polar' && (
              <div style={{ width: '100%', height: '340px', display: 'flex', justifyContent: 'center' }}>
                <svg width="340" height="340" viewBox="0 0 340 340">
                  {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                    <circle key={i} cx="170" cy="170" r={130 * scale} fill="none" stroke="#e2e8f0" strokeDasharray="3 3" />
                  ))}
                  {chartRows.map((r, idx) => {
                    const angle = (idx / chartRows.length) * 2 * Math.PI - Math.PI / 2;
                    const x = 170 + Math.cos(angle) * 130;
                    const y = 170 + Math.sin(angle) * 130;
                    const labelX = 170 + Math.cos(angle) * 150;
                    const labelY = 170 + Math.sin(angle) * 150;

                    return (
                      <g key={idx}>
                        <line x1="170" y1="170" x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1" />
                        <text x={labelX} y={labelY + 4} fill="#475569" fontSize="10" textAnchor="middle" fontWeight="600">
                          {labels[idx]?.slice(0, 7)}
                        </text>
                      </g>
                    );
                  })}
                  {(() => {
                    const radarPoints = chartRows.map((r, idx) => {
                      const angle = (idx / chartRows.length) * 2 * Math.PI - Math.PI / 2;
                      const val = r.values?.[0] || 0;
                      const dist = Math.max((val / maxVal) * 130, 8);
                      return `${170 + Math.cos(angle) * dist},${170 + Math.sin(angle) * dist}`;
                    }).join(' ');

                    return (
                      <polygon points={radarPoints} fill="rgba(37, 99, 235, 0.25)" stroke="#2563eb" strokeWidth="2.5" />
                    );
                  })()}
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
