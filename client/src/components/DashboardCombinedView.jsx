import React, { useState, useEffect } from 'react';
import { PivotGrid } from './PivotGrid';
import { PivotChart } from './PivotChart';

const CHART_TITLES = {
  bar_vertical: 'Columnas / Barras Verticales',
  bar_horizontal: 'Barras Horizontales',
  line_curve: 'Líneas & Tendencia',
  area_stacked: 'Área Sombreada',
  donut_pie: 'Circular / Donut',
  radar_polar: 'Radar / Spider Plot'
};

export function DashboardCombinedView({
  pivotResult,
  currencyFormat,
  conditionalRules = [],
  tableStyle = 'classic_grid',
  chartStyle = 'bar_vertical',
  onChartStyleChange
}) {
  if (!pivotResult || !pivotResult.matrix || pivotResult.matrix.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '8px' }}>
        <div style={{ fontSize: '32px' }}>📊</div>
        <div style={{ fontWeight: 600 }}>No hay datos suficientes para el Dashboard</div>
        <div style={{ fontSize: '12px' }}>Selecciona al menos una dimensión y una métrica en el panel de campos.</div>
      </div>
    );
  }

  const { matrix, columnDefinitions, grandGrandTotals, measures, rowCount } = pivotResult;
  const chartRows = matrix.slice(0, 8);
  const labels = chartRows.map(r => r.rowParts.join(' / '));

  const seriesCount = Math.min(columnDefinitions.length, 4);
  const seriesLabels = columnDefinitions.slice(0, seriesCount).map(c => c.headerLabel);

  let maxVal = 0;
  chartRows.forEach(r => {
    for (let i = 0; i < seriesCount; i++) {
      const v = r.values[i];
      if (typeof v === 'number' && v > maxVal) {
        maxVal = v;
      }
    }
  });
  if (maxVal === 0) maxVal = 100;

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const formatNumber = (val, measure) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      if (measure?.caption?.includes('%') || measure?.field?.includes('pct')) {
        return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(val)}%`;
      }
      if (currencyFormat) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
      }
      return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(val);
    }
    return val;
  };

  // Pie chart calculation
  const pieData = chartRows.map((r, i) => ({
    label: labels[i] || `Item ${i}`,
    val: typeof r.values[0] === 'number' ? r.values[0] : 0,
    color: colors[i % colors.length]
  }));
  const totalPieVal = pieData.reduce((acc, curr) => acc + curr.val, 0) || 1;
  const pieSlices = pieData.map(slice => ({
    ...slice,
    percentage: Math.round((slice.val / totalPieVal) * 100)
  }));

  // Widgets configuration in the 12-column grid
  const initialWidgets = [
    { id: 'kpis', title: '📈 Resumen Ejecutivo de Métricas (KPIs)', colSpan: 'span 12' },
    { id: 'table', title: '📋 Tabla Dinámica Multidimensional', colSpan: 'span 12' },
    { id: 'main_chart', title: `📊 Gráfico Principal (${CHART_TITLES[chartStyle] || 'Gráfico'})`, colSpan: 'span 12' },
    { id: 'donut', title: '🍩 Participación Porcentual (%)', colSpan: 'span 6' },
    { id: 'line', title: '📈 Curva de Tendencia / Evolución', colSpan: 'span 6' }
  ];

  const [widgets, setWidgets] = useState(initialWidgets);

  // Sync main chart title whenever chartStyle changes
  useEffect(() => {
    setWidgets(prev => prev.map(w => {
      if (w.id === 'main_chart' || w.id === 'bar') {
        return {
          ...w,
          id: 'main_chart',
          title: `📊 Gráfico Principal (${CHART_TITLES[chartStyle] || 'Gráfico'})`
        };
      }
      return w;
    }));
  }, [chartStyle]);

  const [draggedWidgetIndex, setDraggedWidgetIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleWidgetDragStart = (e, index) => {
    setDraggedWidgetIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleWidgetDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleWidgetDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleWidgetDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedWidgetIndex === null || draggedWidgetIndex === targetIndex) return;

    const updated = [...widgets];
    const [movedItem] = updated.splice(draggedWidgetIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setWidgets(updated);
    setDraggedWidgetIndex(null);
  };

  const toggleWidgetSpan = (id) => {
    setWidgets(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          colSpan: w.colSpan === 'span 12' ? 'span 6' : 'span 12'
        };
      }
      return w;
    }));
  };

  const resetLayout = () => {
    setWidgets(initialWidgets);
  };

  const renderWidgetContent = (widgetId) => {
    switch (widgetId) {
      case 'kpis':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div className="kpi-subcard">
              <div className="kpi-label">{measures[0] ? `Total ${measures[0].caption || measures[0].field}` : 'Métrica 1'}</div>
              <div className="kpi-value" style={{ color: '#1e293b' }}>
                {formatNumber(grandGrandTotals[0] || 0, measures[0])}
              </div>
            </div>
            {measures[1] && (
              <div className="kpi-subcard">
                <div className="kpi-label">{`Total ${measures[1].caption || measures[1].field}`}</div>
                <div className="kpi-value" style={{ color: '#10b981' }}>
                  {formatNumber(grandGrandTotals[1] || 0, measures[1])}
                </div>
              </div>
            )}
            <div className="kpi-subcard">
              <div className="kpi-label">Registros Analizados</div>
              <div className="kpi-value" style={{ color: '#2563eb' }}>{rowCount}</div>
            </div>
            <div className="kpi-subcard">
              <div className="kpi-label">Matriz Activa</div>
              <div className="kpi-value" style={{ color: '#8b5cf6' }}>
                {matrix.length} filas × {columnDefinitions.length} cols
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            <PivotGrid
              pivotResult={pivotResult}
              currencyFormat={currencyFormat}
              conditionalRules={conditionalRules}
              tableStyle={tableStyle}
            />
          </div>
        );

      case 'main_chart':
      case 'bar':
        return (
          <div style={{ width: '100%' }}>
            <PivotChart
              pivotResult={pivotResult}
              chartType={chartStyle}
              currencyFormat={currencyFormat}
              onChartTypeChange={onChartStyleChange}
            />
          </div>
        );

      case 'line':
        return (
          <div style={{ width: '100%', height: '220px' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 220" preserveAspectRatio="none">
              <line x1="40" y1="180" x2="480" y2="180" stroke="#cbd5e1" strokeWidth="1" />
              {(() => {
                const groupWidth = 440 / (chartRows.length || 1);
                const points = chartRows.map((r, rIdx) => {
                  const val = r.values[0] || 0;
                  const x = 40 + rIdx * groupWidth + groupWidth / 2;
                  const y = 180 - (val / maxVal) * 150;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g>
                    <polyline fill="none" stroke="#10b981" strokeWidth="3" points={points} />
                    {chartRows.map((r, rIdx) => {
                      const val = r.values[0] || 0;
                      const cx = 40 + rIdx * groupWidth + groupWidth / 2;
                      const cy = 180 - (val / maxVal) * 150;
                      return (
                        <circle key={rIdx} cx={cx} cy={cy} r="4" fill="#10b981" stroke="#fff" strokeWidth="2">
                          <title>{`${labels[rIdx]}: ${val}`}</title>
                        </circle>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>
        );

      case 'donut':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {pieSlices.slice(0, 6).map((slice, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: slice.color }} />
                  <span style={{ color: '#334155', fontWeight: 500 }}>{slice.label}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                  {slice.percentage}%
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-scrollable-container">
      <div className="dashboard-control-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
            🖥️ Lienzo Dashboard 360° Personalizable
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            (Arrastra cualquier tarjeta desde el tirador <strong>⠿</strong> para cambiar su posición)
          </span>
        </div>
        <button
          type="button"
          className="btn btn-light"
          style={{ fontSize: '11px', padding: '3px 8px' }}
          onClick={resetLayout}
          title="Restaurar orden predeterminado de los widgets"
        >
          🔄 Restablecer Orden
        </button>
      </div>

      <div className="dashboard-grid-12">
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            className={`dashboard-card-wrapper ${dragOverIndex === index ? 'widget-drag-over' : ''}`}
            style={{ gridColumn: widget.colSpan }}
            onDragOver={(e) => handleWidgetDragOver(e, index)}
            onDragLeave={handleWidgetDragLeave}
            onDrop={(e) => handleWidgetDrop(e, index)}
          >
            <div
              className="dashboard-card-header"
              draggable="true"
              onDragStart={(e) => handleWidgetDragStart(e, index)}
              title="Haz clic y arrastra para reubicar este widget en el dashboard"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="widget-drag-handle" title="Arrastra para mover">⠿</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                  {widget.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="widget-size-btn"
                  onClick={() => toggleWidgetSpan(widget.id)}
                  title={widget.colSpan === 'span 12' ? 'Cambiar a media pantalla' : 'Expandir a pantalla completa'}
                >
                  {widget.colSpan === 'span 12' ? '⤡ Mitad' : '⤢ Completo'}
                </button>
              </div>
            </div>

            <div className="dashboard-card-body">
              {renderWidgetContent(widget.id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
