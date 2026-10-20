import React, { useState, useRef, useMemo } from 'react';

// Default fallback fields in case connection is initializing
const DEFAULT_FALLBACK_FIELDS = [
  { name: 'sales', type: 'number' },
  { name: 'profit', type: 'number' },
  { name: 'quantity', type: 'number' },
  { name: 'id', type: 'number' },
  { name: 'year', type: 'number' },
  { name: 'region', type: 'string' },
  { name: 'country', type: 'string' },
  { name: 'category', type: 'string' },
  { name: 'subCategory', type: 'string' },
  { name: 'quarter', type: 'string' }
];

export function CalculatedMeasureModal({
  isOpen,
  onClose,
  availableFields = [],
  onAddCalculatedMeasure,
  activeSlice = null
}) {
  const [caption, setCaption] = useState('');
  const [formula, setFormula] = useState('');
  const [searchField, setSearchField] = useState('');
  const [fieldFilterTab, setFieldFilterTab] = useState('all'); // 'all' | 'numeric' | 'dimension'
  const [selectedDropdownField, setSelectedDropdownField] = useState('');
  const formulaInputRef = useRef(null);

  // Normalize fields from props, active slice or fallbacks
  const normalizedFields = useMemo(() => {
    let rawList = availableFields;

    // If availableFields is empty, extract from activeSlice or fallback
    if (!rawList || rawList.length === 0) {
      if (activeSlice) {
        const sliceFields = [];
        (activeSlice.measures || []).forEach(m => {
          if (m.field) sliceFields.push({ name: m.field, type: 'number' });
        });
        (activeSlice.rows || []).forEach(r => {
          if (typeof r === 'string') sliceFields.push({ name: r, type: 'string' });
        });
        (activeSlice.columns || []).forEach(c => {
          if (typeof c === 'string') sliceFields.push({ name: c, type: 'string' });
        });

        if (sliceFields.length > 0) {
          rawList = sliceFields;
        }
      }
    }

    if (!rawList || rawList.length === 0) {
      rawList = DEFAULT_FALLBACK_FIELDS;
    }

    // De-duplicate by name and format objects
    const seen = new Set();
    const result = [];
    rawList.forEach(item => {
      const name = typeof item === 'string' ? item : item.name;
      if (!name || seen.has(name)) return;
      seen.add(name);

      let type = typeof item === 'object' && item.type ? String(item.type).toLowerCase() : 'string';
      const isKnownNumeric = [
        'sales', 'profit', 'quantity', 'cost', 'margin', 'discount', 
        'units', 'revenue', 'price', 'id', 'year', 'cart_value', 
        'latency_ms', 'conversion_rate'
      ].includes(name.toLowerCase());

      if (['number', 'numeric', 'int', 'integer', 'float', 'double', 'decimal'].includes(type) || isKnownNumeric) {
        type = 'number';
      }

      result.push({ name, type });
    });

    return result;
  }, [availableFields, activeSlice]);

  // Separate into numeric metrics and dimensions
  const numericFields = useMemo(() => normalizedFields.filter(f => f.type === 'number'), [normalizedFields]);
  const dimensionFields = useMemo(() => normalizedFields.filter(f => f.type !== 'number'), [normalizedFields]);

  // Filtered fields based on search input and active tab
  const displayedFields = useMemo(() => {
    return normalizedFields.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchField.toLowerCase().trim());
      if (!matchesSearch) return false;
      if (fieldFilterTab === 'numeric') return f.type === 'number';
      if (fieldFilterTab === 'dimension') return f.type !== 'number';
      return true;
    });
  }, [normalizedFields, searchField, fieldFilterTab]);

  // Insert token at the exact text cursor position inside formulaInputRef
  const insertToken = (token) => {
    const input = formulaInputRef.current;
    if (!input) {
      setFormula(prev => prev + token);
      return;
    }

    const start = input.selectionStart ?? formula.length;
    const end = input.selectionEnd ?? formula.length;
    const nextFormula = formula.substring(0, start) + token + formula.substring(end);
    setFormula(nextFormula);

    setTimeout(() => {
      input.focus();
      const nextPos = start + token.length;
      input.setSelectionRange(nextPos, nextPos);
    }, 15);
  };

  // Delete last character or token
  const handleBackspace = () => {
    const input = formulaInputRef.current;
    if (!input || formula.length === 0) return;

    const start = input.selectionStart ?? formula.length;
    const end = input.selectionEnd ?? formula.length;

    if (start !== end) {
      // Delete selection
      const nextFormula = formula.substring(0, start) + formula.substring(end);
      setFormula(nextFormula);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start, start);
      }, 15);
    } else if (start > 0) {
      // Check if deleting right after a closing bracket like [profit]
      const beforeCursor = formula.substring(0, start);
      const bracketMatch = beforeCursor.match(/\[[^\]]+\]$/);
      let deleteCount = 1;
      if (bracketMatch) {
        deleteCount = bracketMatch[0].length;
      }
      const nextFormula = formula.substring(0, start - deleteCount) + formula.substring(start);
      setFormula(nextFormula);
      setTimeout(() => {
        input.focus();
        const nextPos = Math.max(0, start - deleteCount);
        input.setSelectionRange(nextPos, nextPos);
      }, 15);
    }
  };

  // Quick preset template applicator
  const applyTemplate = (tmplCaption, tmplFormula) => {
    setCaption(tmplCaption);
    setFormula(tmplFormula);
  };

  // Real-time formula evaluator preview with sample data
  const formulaEvaluation = useMemo(() => {
    if (!formula.trim()) {
      return { status: 'idle', message: 'Escribe o inserta campos para ver la vista previa.' };
    }

    // Check parentheses balance
    let openCount = 0;
    for (const char of formula) {
      if (char === '(') openCount++;
      if (char === ')') openCount--;
      if (openCount < 0) {
        return { status: 'warning', message: '⚠️ Hay paréntesis de cierre ")" sin su correspondiente apertura "("' };
      }
    }
    if (openCount > 0) {
      return { status: 'warning', message: `⚠️ Falta cerrar ${openCount} paréntesis ")"` };
    }

    // Extract referenced fields
    const tokens = formula.match(/\[([^\]]+)\]/g) || [];
    const referencedFields = tokens.map(t => t.replace(/^\[|\]$/g, '').trim());

    if (referencedFields.length === 0 && !/[0-9]/.test(formula)) {
      return { status: 'idle', message: '💡 Inserta al menos un campo numérico [campo] en la fórmula.' };
    }

    // Sample mock record for preview calculation
    const sampleRecord = {
      sales: 15400,
      profit: 3200,
      quantity: 12,
      cost: 9500,
      margin: 3200,
      discount: 0.1,
      price: 1283
    };

    let evalString = formula;
    const previewSteps = [];
    referencedFields.forEach(f => {
      const val = sampleRecord[f.toLowerCase()] !== undefined ? sampleRecord[f.toLowerCase()] : 100;
      previewSteps.push(`${f}: ${val}`);
      const escapedF = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\[${escapedF}\\]`, 'g');
      evalString = evalString.replace(regex, val);
    });

    try {
      const sanitized = evalString.replace(/[^0-9+\-*/().\s]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === 'number' && isFinite(result)) {
        const rounded = Math.round(result * 100) / 100;
        return {
          status: 'valid',
          result: rounded,
          referenced: referencedFields,
          message: `✓ Fórmula válida. Muestra estimada: ${rounded}`
        };
      }
      return { status: 'warning', message: 'Verifica la sintaxis de los operadores.' };
    } catch {
      return { status: 'warning', message: 'Sintaxis incompleta (esperando operandos o campos).' };
    }
  }, [formula]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!caption.trim() || !formula.trim()) {
      alert('Por favor ingresa un nombre y una fórmula válida para la métrica.');
      return;
    }

    if (formulaEvaluation.status === 'warning') {
      const confirmAdd = window.confirm(
        'La fórmula parece tener un detalle de sintaxis o paréntesis pendientes. ¿Deseas agregarla de todas formas?'
      );
      if (!confirmAdd) return;
    }

    onAddCalculatedMeasure({
      field: caption.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
      caption,
      aggregation: 'calc',
      formula: formula.trim()
    });

    setCaption('');
    setFormula('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '640px', maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3>➕ Crear Métrica Calculada (Fórmula)</h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Define operaciones aritméticas personalizadas con los campos disponibles de la fuente activa
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ gap: '14px' }}>
          {/* Nombre de la Métrica */}
          <div className="input-group">
            <label style={{ fontWeight: 600, fontSize: '12.5px' }}>
              Nombre de la Nueva Métrica:
            </label>
            <input
              type="text"
              placeholder="ej. Margen Porcentual (%), Ticket Promedio, IVA 19%"
              className="input-control"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Fórmula de Cálculo */}
          <div className="input-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontWeight: 600, fontSize: '12.5px' }}>
                Fórmula de Cálculo:
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ fontSize: '10.5px', padding: '2px 8px', height: '22px' }}
                  onClick={handleBackspace}
                  title="Borrar último término o carácter"
                >
                  ⌫ Borrar
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  style={{ fontSize: '10.5px', padding: '2px 8px', height: '22px', color: '#ef4444' }}
                  onClick={() => setFormula('')}
                  title="Limpiar fórmula completa"
                >
                  Limpiar
                </button>
              </div>
            </div>
            <input
              ref={formulaInputRef}
              type="text"
              placeholder="ej. ([profit] / [sales]) * 100"
              className="input-control"
              style={{
                fontFamily: "'JetBrains Mono', Consolas, monospace",
                fontWeight: 600,
                fontSize: '13.5px',
                color: '#0f172a',
                background: '#fafafa',
                borderColor: formulaEvaluation.status === 'valid' ? '#22c55e' : formulaEvaluation.status === 'warning' ? '#f59e0b' : '#cbd5e1'
              }}
              value={formula}
              onChange={e => setFormula(e.target.value)}
              required
            />
          </div>

          {/* ---------------------------------------------------- */}
          {/* SECCIÓN PRINCIPAL: CAMPOS DISPONIBLES PARA CÁLCULOS   */}
          {/* ---------------------------------------------------- */}
          <div className="calc-fields-explorer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                  📊 Campos Disponibles para los Cálculos ({displayedFields.length})
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  (Haz clic para insertar en la fórmula)
                </span>
              </div>

              {/* Filtro por tipo (# Numéricos / Aa Dimensiones) */}
              <div style={{ display: 'flex', gap: '3px' }}>
                <button
                  type="button"
                  className={`btn ${fieldFilterTab === 'all' ? 'btn-primary' : 'btn-light'}`}
                  style={{ fontSize: '10px', padding: '2px 7px', height: '22px' }}
                  onClick={() => setFieldFilterTab('all')}
                >
                  Todos ({normalizedFields.length})
                </button>
                <button
                  type="button"
                  className={`btn ${fieldFilterTab === 'numeric' ? 'btn-primary' : 'btn-light'}`}
                  style={{ fontSize: '10px', padding: '2px 7px', height: '22px' }}
                  onClick={() => setFieldFilterTab('numeric')}
                >
                  # Numéricos ({numericFields.length})
                </button>
                <button
                  type="button"
                  className={`btn ${fieldFilterTab === 'dimension' ? 'btn-primary' : 'btn-light'}`}
                  style={{ fontSize: '10px', padding: '2px 7px', height: '22px' }}
                  onClick={() => setFieldFilterTab('dimension')}
                >
                  Aa Dimensiones ({dimensionFields.length})
                </button>
              </div>
            </div>

            {/* Quick Field Selector Dropdown & Search Input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px' }}>
              <input
                type="text"
                placeholder="🔍 Buscar campo..."
                className="input-control"
                style={{ fontSize: '11.5px', padding: '4px 8px' }}
                value={searchField}
                onChange={e => setSearchField(e.target.value)}
              />

              <select
                className="input-control"
                style={{ fontSize: '11.5px', padding: '4px 8px' }}
                value={selectedDropdownField}
                onChange={e => setSelectedDropdownField(e.target.value)}
              >
                <option value="">-- Seleccionar campo de la lista --</option>
                {numericFields.length > 0 && (
                  <optgroup label="Campos Numéricos (# Recomendados)">
                    {numericFields.map(f => (
                      <option key={f.name} value={f.name}>#{f.name}</option>
                    ))}
                  </optgroup>
                )}
                {dimensionFields.length > 0 && (
                  <optgroup label="Dimensiones / Atributos (Aa)">
                    {dimensionFields.map(f => (
                      <option key={f.name} value={f.name}>Aa {f.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                disabled={!selectedDropdownField}
                onClick={() => {
                  if (selectedDropdownField) {
                    insertToken(`[${selectedDropdownField}]`);
                    setSelectedDropdownField('');
                  }
                }}
              >
                + Insertar
              </button>
            </div>

            {/* Chips List of Available Fields */}
            <div className="calc-chips-container">
              {displayedFields.map(f => (
                <button
                  key={f.name}
                  type="button"
                  className={`calc-field-chip ${f.type === 'number' ? 'numeric' : 'dimension'}`}
                  onClick={() => insertToken(`[${f.name}]`)}
                  title={`Haz clic para insertar [${f.name}] en la posición del cursor`}
                >
                  <span className="chip-type-tag">
                    {f.type === 'number' ? '#' : 'Aa'}
                  </span>
                  <span>{f.name}</span>
                  <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700 }}>+</span>
                </button>
              ))}

              {displayedFields.length === 0 && (
                <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', padding: '6px' }}>
                  No se encontraron campos con el término "{searchField}".
                </div>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* OPERADORES MATEMÁTICOS                                */}
          {/* ---------------------------------------------------- */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>
              Operadores Aritméticos y Valores Rápidos:
            </div>
            <div className="calc-operators-bar">
              {[
                { label: '+', token: ' + ' },
                { label: '-', token: ' - ' },
                { label: '×', token: ' * ' },
                { label: '÷', token: ' / ' },
                { label: '(', token: '(' },
                { label: ')', token: ')' },
                { label: '100', token: '100' },
                { label: '0.19', token: '0.19' },
                { label: '0.05', token: '0.05' },
                { label: '.', token: '.' }
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  className="calc-op-btn"
                  onClick={() => insertToken(item.token)}
                  title={`Insertar ${item.label}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* PLANTILLAS RÁPIDAS DE FÓRMULAS                        */}
          {/* ---------------------------------------------------- */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '5px' }}>
              ⚡ Plantillas de Fórmulas Habituales (1 Clic):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                className="calc-template-btn"
                onClick={() => applyTemplate('Margen de Ganancia (%)', '([profit] / [sales]) * 100')}
              >
                📊 % Margen: <code>([profit] / [sales]) * 100</code>
              </button>
              <button
                type="button"
                className="calc-template-btn"
                onClick={() => applyTemplate('Ticket Promedio por Cantidad', '[sales] / [quantity]')}
              >
                🏷️ Ticket Promedio: <code>[sales] / [quantity]</code>
              </button>
              <button
                type="button"
                className="calc-template-btn"
                onClick={() => applyTemplate('IVA Estimado (19%)', '[sales] * 0.19')}
              >
                🧾 IVA (19%): <code>[sales] * 0.19</code>
              </button>
              <button
                type="button"
                className="calc-template-btn"
                onClick={() => applyTemplate('Utilidad Deducida', '[sales] - [profit]')}
              >
                💰 Costo Deducido: <code>[sales] - [profit]</code>
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* VISTA PREVIA EN TIEMPO REAL & VALIDADOR               */}
          {/* ---------------------------------------------------- */}
          <div className={`calc-preview-card ${formulaEvaluation.status}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>
                {formulaEvaluation.status === 'valid' ? '✅ Vista Previa de Cálculo' : '💡 Estado de la Fórmula'}
              </span>
              {formulaEvaluation.referenced && formulaEvaluation.referenced.length > 0 && (
                <span style={{ fontSize: '10.5px', color: '#475569' }}>
                  Campos detectados: <strong>{formulaEvaluation.referenced.map(r => `[${r}]`).join(', ')}</strong>
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px' }}>
              {formulaEvaluation.message}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ margin: '0 -20px -20px -20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
              <span>➕ Agregar Métrica al Reporte</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
