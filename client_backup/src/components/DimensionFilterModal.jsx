import React, { useState, useEffect } from 'react';
import { fetchDistinctValues } from '../services/api';

export function DimensionFilterModal({ isOpen, onClose, fieldName, currentFilterValues, onApplyFilter, sessionId }) {
  const [values, setValues] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && fieldName) {
      setLoading(true);
      fetchDistinctValues(fieldName, sessionId)
        .then(res => {
          if (res.success) {
            setValues(res.values);
            // If already filtered, set selected, otherwise default to all checked
            if (currentFilterValues && currentFilterValues.length > 0) {
              setSelected(currentFilterValues);
            } else {
              setSelected(res.values);
            }
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, fieldName, currentFilterValues, sessionId]);

  if (!isOpen) return null;

  const filteredList = values.filter(v =>
    v.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleValue = (val) => {
    if (selected.includes(val)) {
      setSelected(selected.filter(item => item !== val));
    } else {
      setSelected([...selected, val]);
    }
  };

  const selectAll = () => setSelected([...values]);
  const clearAll = () => setSelected([]);

  const handleApply = () => {
    // If all are selected, we can clear the filter, otherwise pass selected
    if (selected.length === values.length) {
      onApplyFilter(fieldName, []);
    } else {
      onApplyFilter(fieldName, selected);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>🔍 Filtrar Miembros: {fieldName}</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Incluye o excluye valores individuales para esta dimensión
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <input
            type="text"
            placeholder="Buscar valor..."
            className="input-control"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
            <button type="button" className="btn btn-light" style={{ padding: '3px 8px' }} onClick={selectAll}>
              Seleccionar Todo
            </button>
            <button type="button" className="btn btn-light" style={{ padding: '3px 8px' }} onClick={clearAll}>
              Deseleccionar Todo
            </button>
            <span style={{ marginLeft: 'auto', color: '#64748b', alignSelf: 'center' }}>
              {selected.length} de {values.length} seleccionados
            </span>
          </div>

          <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {loading && <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Cargando valores...</div>}

            {!loading && filteredList.map(val => {
              const isChecked = selected.includes(val);
              return (
                <label
                  key={val}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: '4px',
                    background: isChecked ? '#f0fdf4' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '12.5px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleValue(val)}
                  />
                  <span>{val}</span>
                </label>
              );
            })}

            {!loading && filteredList.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '12px' }}>
                No se encontraron valores coincidentes
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleApply}>
            Aplicar Filtro
          </button>
        </div>
      </div>
    </div>
  );
}
