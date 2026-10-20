import React, { useState } from 'react';

export function ConditionalFormatModal({ isOpen, onClose, activeMeasures = [], rules = [], onUpdateRules }) {
  const [selectedField, setSelectedField] = useState(activeMeasures[0]?.field || '');
  const [operator, setOperator] = useState('lt'); // 'lt' | 'gt' | 'lte' | 'gte'
  const [thresholdValue, setThresholdValue] = useState(5000);
  const [colorPreset, setColorPreset] = useState('red');

  if (!isOpen) return null;

  const colorPresets = {
    red: { name: '🔴 Alerta (Rojo suave)', bg: '#fee2e2', text: '#991b1b' },
    green: { name: '🟢 Éxito (Verde suave)', bg: '#dcfce7', text: '#166534' },
    yellow: { name: '🟡 Precaución (Amarillo)', bg: '#fef3c7', text: '#92400e' },
    blue: { name: '🔵 Destacado (Azul)', bg: '#dbeafe', text: '#1e40af' }
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!selectedField) return;

    const chosenColors = colorPresets[colorPreset];
    const newRule = {
      id: `rule-${Date.now()}`,
      measureField: selectedField,
      operator,
      value: Number(thresholdValue),
      bgColor: chosenColors.bg,
      textColor: chosenColors.text
    };

    onUpdateRules([...rules, newRule]);
  };

  const handleRemoveRule = (ruleId) => {
    onUpdateRules(rules.filter(r => r.id !== ruleId));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>🎨 Reglas de Formato Condicional (Semáforos)</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Resalta valores críticos en la tabla según metas y umbrales
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* New Rule Form */}
          <form onSubmit={handleAddRule} style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#1e293b' }}>
              + Agregar Nueva Condición de Color
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '10px' }}>
              <div className="input-group">
                <label>Métrica:</label>
                <select
                  className="input-control"
                  value={selectedField}
                  onChange={e => setSelectedField(e.target.value)}
                >
                  {activeMeasures.map(m => (
                    <option key={m.field} value={m.field}>
                      {m.caption || `${m.aggregation.toUpperCase()} ${m.field}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Condición:</label>
                <select
                  className="input-control"
                  value={operator}
                  onChange={e => setOperator(e.target.value)}
                >
                  <option value="lt">Menor que (&lt;)</option>
                  <option value="gt">Mayor que (&gt;)</option>
                  <option value="lte">Menor o igual (&le;)</option>
                  <option value="gte">Mayor o igual (&ge;)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Valor Umbral:</label>
                <input
                  type="number"
                  className="input-control"
                  value={thresholdValue}
                  onChange={e => setThresholdValue(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Color de resalte:</span>
                <select
                  className="input-control"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                  value={colorPreset}
                  onChange={e => setColorPreset(e.target.value)}
                >
                  <option value="red">🔴 Alerta (Rojo)</option>
                  <option value="green">🟢 Éxito (Verde)</option>
                  <option value="yellow">🟡 Advertencia (Amarillo)</option>
                  <option value="blue">🔵 Destacado (Azul)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                Guardar Regla
              </button>
            </div>
          </form>

          {/* Active Rules List */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
              Reglas Activas ({rules.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {rules.map(r => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: r.bgColor,
                    color: r.textColor,
                    fontWeight: 600,
                    fontSize: '12px'
                  }}
                >
                  <div>
                    {r.measureField} {r.operator === 'lt' ? '<' : r.operator === 'gt' ? '>' : r.operator === 'lte' ? '<=' : '>='} {r.value}
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.textColor, fontSize: '14px' }}
                    onClick={() => handleRemoveRule(r.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {rules.length === 0 && (
                <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                  No hay reglas de formato condicional configuradas.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Aplicar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
