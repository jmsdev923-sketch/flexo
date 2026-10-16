import React from 'react';

export function PivotGrid({
  pivotResult,
  currencyFormat,
  conditionalRules = [],
  tableStyle = 'classic_grid'
}) {
  if (!pivotResult || !pivotResult.matrix || pivotResult.matrix.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '8px' }}>
        <div style={{ fontSize: '32px' }}>📊</div>
        <div style={{ fontWeight: 600 }}>No hay datos para mostrar</div>
        <div style={{ fontSize: '12px' }}>Agrega al menos una dimensión a Filas y una métrica a Valores en el panel lateral.</div>
      </div>
    );
  }

  const {
    rows = [],
    columns = [],
    measures = [],
    columnDefinitions = [],
    matrix = [],
    grandTotals = [],
    grandGrandTotals = []
  } = pivotResult;

  // Find max value in matrix for heatmap intensity calculations
  let maxCellVal = 0;
  if (tableStyle === 'heatmap_intensity') {
    matrix.forEach(row => {
      row.values.forEach(v => {
        if (typeof v === 'number' && v > maxCellVal) maxCellVal = v;
      });
    });
    if (maxCellVal === 0) maxCellVal = 1;
  }

  const formatValue = (val, measure) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      if (measure?.caption?.includes('%') || measure?.field?.includes('pct')) {
        return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(val)}%`;
      }
      if (currencyFormat) {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(val);
      }
      return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val);
    }
    return val;
  };

  const getCellStyle = (val, measureField) => {
    // 1. Check explicit conditional formatting rules first
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

    // 2. Heatmap style calculation if selected
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

  const rowDimensionsCount = Math.max(rows.length, 1);

  return (
    <div className={`table-container style-${tableStyle}`}>
      <div className={`pivot-table-card style-${tableStyle}`}>
        <table className={`pivot-table style-${tableStyle}`}>
          <thead>
            <tr>
              {rows.length > 0 ? (
                rows.map(r => (
                  <th key={r} className="col-dim-header" style={{ textAlign: 'left' }}>
                    {r}
                  </th>
                ))
              ) : (
                <th className="col-dim-header" style={{ textAlign: 'left' }}>
                  Total
                </th>
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
            {matrix.map((rowItem, rIdx) => (
              <tr key={rowItem.rowKey || rIdx} className={rIdx % 2 === 0 ? 'row-even' : 'row-odd'}>
                {rowItem.rowParts.map((part, pIdx) => (
                  <td key={pIdx} className="row-dim-cell" style={{ paddingLeft: `${14 + pIdx * 12}px` }}>
                    {part}
                  </td>
                ))}

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
            ))}

            <tr className="grand-total-row">
              <td colSpan={rowDimensionsCount} style={{ fontWeight: 700, paddingLeft: '14px' }}>
                TOTAL GENERAL
              </td>
              {grandTotals.map((gVal, idx) => {
                const colDef = columnDefinitions[idx];
                return (
                  <td key={idx} className="data-cell total-cell">
                    {formatValue(gVal, colDef?.measure)}
                  </td>
                );
              })}
              {grandGrandTotals.map((ggVal, idx) => {
                const m = measures[idx];
                return (
                  <td key={`gg-${idx}`} className="data-cell total-cell grand-grand-cell">
                    {formatValue(ggVal, m)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
