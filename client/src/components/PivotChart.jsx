import React from 'react';

const CHART_OPTIONS = [
  { id: 'bar_vertical', label: '📊 Columnas' },
  { id: 'bar_horizontal', label: '📊 Barras Horiz.' },
  { id: 'line_curve', label: '📈 Líneas & Tendencia' },
  { id: 'area_stacked', label: '🌊 Área Sombreada' },
  { id: 'donut_pie', label: '🍩 Donut / Circular' },
  { id: 'radar_polar', label: '🕸️ Radar' }
];

const CHART_TYPE_LABELS = {
  bar_vertical: 'Columnas / Barras Verticales',
  bar_horizontal: 'Barras Horizontales',
  line_curve: 'Líneas & Tendencia',
  area_stacked: 'Área Sombreada',
  donut_pie: 'Circular / Donut',
  radar_polar: 'Radar / Spider Plot'
};

export function PivotChart({ pivotResult, chartType = 'bar_vertical', currencyFormat, onChartTypeChange }) {
  if (!pivotResult || !pivotResult.matrix || pivotResult.matrix.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
        No hay datos para graficar. Agrega dimensiones a filas y métricas a valores.
      </div>
    );
  }

  const { matrix, columnDefinitions } = pivotResult;
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

  const formatTick = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val;
  };

  // Pie / Donut calculation
  const pieData = chartRows.map((r, i) => ({
    label: labels[i] || `Item ${i}`,
    val: typeof r.values[0] === 'number' ? r.values[0] : 0,
    color: colors[i % colors.length]
  }));
  const totalPieVal = pieData.reduce((acc, curr) => acc + curr.val, 0) || 1;

  return (
    <div className="chart-container" style={{ padding: '12px', width: '100%' }}>
      <div className="chart-card" style={{ width: '100%', padding: '18px' }}>
        {/* Top Control Bar with Quick Chart Type Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
              📈 Vista: {CHART_TYPE_LABELS[chartType] || chartType}
            </span>
          </div>

          {/* Quick Chart Type Buttons */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {CHART_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                className={`btn ${chartType === opt.id ? 'btn-primary' : 'btn-light'}`}
                style={{
                  fontSize: '11px',
                  padding: '3px 9px',
                  height: '26px',
                  borderRadius: '14px',
                  fontWeight: chartType === opt.id ? 700 : 500,
                  transition: 'all 0.15s ease'
                }}
                onClick={() => onChartTypeChange && onChartTypeChange(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', width: '100%' }}>
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
                      {currencyFormat ? `$${formatTick(val)}` : formatTick(val)}
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
                      const val = r.values[sIdx] || 0;
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

        {/* 2. BARRAS HORIZONTALES (Multi-series) */}
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
                      const val = r.values[sIdx] || 0;
                      const barW = Math.max((val / maxVal) * 580, 3);
                      const barY = startY + sIdx * barH;
                      return (
                        <g key={sIdx}>
                          <rect x="160" y={barY} width={barW} height={barH - 2} fill={colors[sIdx % colors.length]} rx="2">
                            <title>{`${seriesLabels[sIdx]} (${labels[rIdx]}): ${val}`}</title>
                          </rect>
                          <text x={166 + barW} y={barY + barH - 3} fill="#64748b" fontSize="9.5" fontWeight="600">
                            {currencyFormat ? `$${formatTick(val)}` : formatTick(val)}
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
                  const val = r.values[sIdx] || 0;
                  const x = 60 + rIdx * groupWidth + groupWidth / 2;
                  const y = 280 - (val / maxVal) * 240;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <g key={sIdx}>
                    <polyline fill="none" stroke={colors[sIdx % colors.length]} strokeWidth="3" points={points} />
                    {chartRows.map((r, rIdx) => {
                      const val = r.values[sIdx] || 0;
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
                  const val = r.values[0] || 0;
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

        {/* 5. DONUT / CIRCULAR (True SVG Arcs + Legend) */}
        {chartType === 'donut_pie' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '20px' }}>
            <div style={{ position: 'relative', width: '260px', height: '260px' }}>
              <svg width="260" height="260" viewBox="0 0 260 260">
                {(() => {
                  const radius = 90;
                  const strokeWidth = 36;
                  const circumference = 2 * Math.PI * radius;
                  let accumulatedOffset = 0;

                  return pieData.map((slice, idx) => {
                    const ratio = slice.val / (totalPieVal || 1);
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
                        stroke={slice.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        <title>{`${slice.label}: ${slice.val} (${Math.round(ratio * 100)}%)`}</title>
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
                  {currencyFormat ? `$${formatTick(totalPieVal)}` : formatTick(totalPieVal)}
                </div>
              </div>
            </div>

            {/* Legend Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', width: '100%' }}>
              {pieData.map((slice, idx) => {
                const pct = Math.round((slice.val / totalPieVal) * 100);
                return (
                  <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: slice.color }} />
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '12px' }}>{slice.label}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{pct}%</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{currencyFormat ? `$${formatTick(slice.val)}` : formatTick(slice.val)}</span>
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
              {/* Concentric Polygons */}
              {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                <circle key={i} cx="170" cy="170" r={130 * scale} fill="none" stroke="#e2e8f0" strokeDasharray="3 3" />
              ))}
              {/* Radial Spiders */}
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
                      {labels[idx].slice(0, 7)}
                    </text>
                  </g>
                );
              })}
              {/* Radar Area Polygon */}
              {(() => {
                const radarPoints = chartRows.map((r, idx) => {
                  const angle = (idx / chartRows.length) * 2 * Math.PI - Math.PI / 2;
                  const val = r.values[0] || 0;
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
    </div>
  );
}
