import React, { useState } from 'react';

export function MultiTableTabBar({
  tables = [],
  activeTableId,
  onSelectTable,
  onAddTable,
  onDuplicateTable,
  onDeleteTable,
  onRenameTable,
  viewLayout = 'single', // 'single' | 'grid'
  onViewLayoutChange
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startRename = (t, e) => {
    e.stopPropagation();
    setEditingId(t.id);
    setEditingTitle(t.title);
  };

  const finishRename = (id) => {
    if (editingTitle.trim() && onRenameTable) {
      onRenameTable(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="multi-table-nav-bar">
      {/* Table Tabs List */}
      <div className="table-tabs-list">
        {tables.map(t => {
          const isActive = t.id === activeTableId;
          const rowsCount = t.slice?.rows?.length || 0;
          const colsCount = t.slice?.columns?.length || 0;
          const measCount = t.slice?.measures?.length || 0;
          const isBlank = rowsCount === 0 && colsCount === 0 && measCount === 0;

          return (
            <div
              key={t.id}
              className={`table-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTable(t.id)}
              title="Haz clic para seleccionar y editar esta tabla"
            >
              <span style={{ fontSize: '13px' }}>📊</span>

              {editingId === t.id ? (
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
                  onBlur={() => finishRename(t.id)}
                  onKeyDown={e => e.key === 'Enter' && finishRename(t.id)}
                />
              ) : (
                <span
                  onDoubleClick={e => startRename(t, e)}
                  style={{ userSelect: 'none' }}
                >
                  {t.title}
                </span>
              )}

              <span className="table-tab-badge">
                {isBlank ? 'En Blanco' : `${rowsCount}F × ${colsCount}C | ${measCount}V`}
              </span>

              {tables.length > 1 && (
                <button
                  type="button"
                  className="table-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`¿Eliminar la tabla "${t.title}"?`)) {
                      onDeleteTable(t.id);
                    }
                  }}
                  title="Eliminar esta tabla"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {/* Add Table Button */}
        <button
          type="button"
          className="btn-add-table"
          onClick={() => onAddTable('blank')}
          title="Crear una nueva tabla dinámica en blanco"
        >
          <span>➕ Agregar Tabla</span>
        </button>
      </div>

      {/* Multi-Table View Switcher (Single Table vs All in Grid) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '2px', background: '#1e293b', padding: '2px', borderRadius: '6px', border: '1px solid #334155' }}>
          <button
            type="button"
            className={`btn ${viewLayout === 'single' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => onViewLayoutChange('single')}
            title="Ver tabla activa seleccionada"
          >
            📑 Tabla Activa
          </button>
          <button
            type="button"
            className={`btn ${viewLayout === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => onViewLayoutChange('grid')}
            title="Ver todas las tablas simultáneamente en cuadrícula comparativa"
          >
            🔲 Comparar ({tables.length})
          </button>
        </div>
      </div>
    </div>
  );
}
