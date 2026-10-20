import React, { useState } from 'react';

const CHART_ICONS = {
  bar_vertical: '📊',
  bar_horizontal: '📊',
  line_curve: '📈',
  area_stacked: '🌊',
  donut_pie: '🍩',
  radar_polar: '🕸️'
};

export function MultiChartTabBar({
  charts = [],
  activeChartId,
  onSelectChart,
  onAddChart,
  onDuplicateChart,
  onDeleteChart,
  onRenameChart,
  viewLayout = 'grid', // 'single' | 'grid'
  onViewLayoutChange
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startRename = (c, e) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const finishRename = (id) => {
    if (editingTitle.trim() && onRenameChart) {
      onRenameChart(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="multi-table-nav-bar">
      {/* Chart Tabs List */}
      <div className="table-tabs-list">
        {charts.map(c => {
          const isActive = c.id === activeChartId;
          const rowsCount = c.slice?.rows?.length || 0;
          const measCount = c.slice?.measures?.length || 0;
          const isBlank = rowsCount === 0 && measCount === 0;
          const icon = CHART_ICONS[c.chartType] || '📈';

          return (
            <div
              key={c.id}
              className={`table-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectChart(c.id)}
              title="Haz clic para seleccionar y configurar este gráfico"
            >
              <span style={{ fontSize: '13px' }}>{icon}</span>

              {editingId === c.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  style={{
                    background: 'white',
                    color: '#0f172a',
                    border: '1px solid #3b82f6',
                    borderRadius: '3px',
                    fontSize: '11.5px',
                    padding: '1px 4px',
                    outline: 'none',
                    maxWidth: '140px'
                  }}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={() => finishRename(c.id)}
                  onKeyDown={e => e.key === 'Enter' && finishRename(c.id)}
                />
              ) : (
                <span
                  onDoubleClick={e => startRename(c, e)}
                  style={{ userSelect: 'none' }}
                >
                  {c.title}
                </span>
              )}

              <span className="table-tab-badge">
                {isBlank ? 'En Blanco' : (c.slice?.rows?.[0] ? `${c.slice.rows[0]}` : 'Activo')}
              </span>

              {charts.length > 1 && (
                <button
                  type="button"
                  className="table-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`¿Eliminar el gráfico "${c.title}"?`)) {
                      onDeleteChart(c.id);
                    }
                  }}
                  title="Eliminar este gráfico"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* Add Chart Button */}
        <button
          type="button"
          className="btn-add-table"
          onClick={() => onAddChart('blank')}
          title="Crear un nuevo gráfico analítico en blanco"
        >
          <span>➕ Agregar Gráfico</span>
        </button>
      </div>

      {/* Multi-Chart View Switcher (Single Chart vs All in Grid Panel) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '2px', background: '#1e293b', padding: '2px', borderRadius: '6px', border: '1px solid #334155' }}>
          <button
            type="button"
            className={`btn ${viewLayout === 'single' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => onViewLayoutChange('single')}
            title="Ver solo el gráfico activo seleccionado"
          >
            📈 Gráfico Activo
          </button>
          <button
            type="button"
            className={`btn ${viewLayout === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => onViewLayoutChange('grid')}
            title="Ver todos los gráficos simultáneamente en un panel analítico"
          >
            🔲 Panel de Gráficos ({charts.length})
          </button>
        </div>
      </div>
    </div>
  );
}
