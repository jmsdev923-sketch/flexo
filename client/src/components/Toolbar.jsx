import React from 'react';

export function Toolbar({
  branding,
  currentUser,
  catalogStyles,
  availableSources = [],
  activeSourceId,
  onSwitchAssignedSource,
  onLogout,
  onOpenAdminPanel,
  onOpenSourceModal,
  onOpenConditionalModal,
  onOpenReportsModal,
  isSidebarOpen,
  onToggleSidebar,
  currentView,
  onViewChange,
  tableStyle,
  onTableStyleChange,
  chartStyle,
  onChartStyleChange,
  currencyFormat,
  onToggleCurrency,
  onExportCSV,
  onExportJSON,
  onPrint
}) {
  const isAdmin = currentUser?.role === 'admin';

  // Strict RBAC: filter assigned sources for non-admin users
  const userPermittedSources = availableSources.filter(s => {
    if (isAdmin) return true;
    if (currentUser?.allowedSources?.includes('*')) return true;
    return currentUser?.allowedSources?.includes(s.id);
  });

  // Filter table styles by user permissions
  const permittedTableStyles = (catalogStyles?.tableStyles || []).filter(ts => {
    if (isAdmin) return true;
    if (currentUser?.allowedTableStyles?.includes('*')) return true;
    return currentUser?.allowedTableStyles?.includes(ts.id);
  });

  // Filter chart styles by user permissions
  const permittedChartStyles = (catalogStyles?.chartStyles || []).filter(cs => {
    if (isAdmin) return true;
    if (currentUser?.allowedChartStyles?.includes('*')) return true;
    return currentUser?.allowedChartStyles?.includes(cs.id);
  });

  return (
    <header className="toolbar">
      {/* Brand & Identity with Custom Company Logo */}
      <div className="brand">
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.companyName || 'Company Logo'}
            style={{ maxHeight: '34px', maxWidth: '140px', objectFit: 'contain', borderRadius: '4px', background: 'white', padding: '2px 6px' }}
          />
        ) : (
          <div className="brand-logo">FA</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="brand-title">{branding?.companyName || 'flex_analytics'}</span>
            <span className="brand-badge">PRO v1.5</span>
          </div>
          {branding?.subtitle && (
            <span style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1 }}>
              {branding.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* User Session Profile & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 600 }}>
            {currentUser?.name || 'Usuario'}
          </span>
          <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            @{currentUser?.username || 'user'}
          </span>
        </div>

        <span style={{
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: 600,
          background: isAdmin ? '#fef3c7' : '#e0e7ff',
          color: isAdmin ? '#92400e' : '#3730a3'
        }}>
          {isAdmin ? 'ADMIN' : 'ANALISTA'}
        </span>

        {/* Admin Panel button - ONLY visible for Admin */}
        {isAdmin && (
          <button
            className="btn btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px', background: '#2563eb', color: 'white', borderColor: '#1d4ed8' }}
            onClick={onOpenAdminPanel}
            title="Administrar usuarios, asignar fuentes y configurar logo"
          >
            ⚙️ Panel Admin
          </button>
        )}

        <button
          className="btn btn-secondary"
          style={{ padding: '3px 8px', fontSize: '11px', color: '#f87171' }}
          onClick={onLogout}
          title="Cerrar sesión actual"
        >
          🚪 Salir
        </button>
      </div>

      {/* Main Actions */}
      <div className="toolbar-actions">
        {/* SOURCE ACCESS CONTROL */}
        {isAdmin ? (
          /* ONLY ADMIN CAN OPEN THE TECHNICAL CONNECTION & CONFIGURATION MODAL */
          <button
            className="btn btn-primary"
            style={{ background: '#059669', borderColor: '#047857' }}
            onClick={onOpenSourceModal}
            title="Configurar y conectar servidores y bases de datos (Exclusivo Administrador)"
          >
            <span>🔌 Configurar Fuentes</span>
          </button>
        ) : (
          /* NON-ADMIN ANALYSTS ONLY HAVE A SIMPLE SELECTOR WITH THEIR ASSIGNED SOURCES */
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0f172a', padding: '3px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>📊 Mis Fuentes:</span>
            <select
              className="input-control"
              style={{ background: '#1e293b', color: '#f8fafc', borderColor: '#475569', fontSize: '11.5px', padding: '3px 6px' }}
              value={activeSourceId}
              onChange={e => onSwitchAssignedSource(e.target.value)}
              title="Fuentes autorizadas por el administrador para tu cuenta"
            >
              {userPermittedSources.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              {userPermittedSources.length === 0 && (
                <option value="">Sin fuentes asignadas</option>
              )}
            </select>
          </div>
        )}

        {/* Table Style Selector (Filtered by RBAC) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Estilo:</span>
          <select
            className="input-control"
            style={{ background: '#1e293b', color: '#f8fafc', borderColor: '#334155', fontSize: '11.5px', padding: '4px 8px' }}
            value={tableStyle}
            onChange={e => onTableStyleChange(e.target.value)}
            title="Estilos de tabla permitidos para tu cuenta"
          >
            {permittedTableStyles.map(ts => (
              <option key={ts.id} value={ts.id}>{ts.name}</option>
            ))}
          </select>
        </div>

        {/* Chart Style Selector (Filtered by RBAC) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Gráfico:</span>
          <select
            className="input-control"
            style={{ background: '#1e293b', color: '#f8fafc', borderColor: '#334155', fontSize: '11.5px', padding: '4px 8px' }}
            value={chartStyle}
            onChange={e => onChartStyleChange(e.target.value)}
            title="Tipos de gráfico permitidos para tu cuenta"
          >
            {permittedChartStyles.map(cs => (
              <option key={cs.id} value={cs.id}>{cs.name}</option>
            ))}
          </select>
        </div>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#334155', margin: '0 4px' }} />

        {/* Reports & Modals */}
        <button className="btn btn-secondary" onClick={onOpenReportsModal} title="Guardar o cargar reportes y plantillas analíticas">
          <span>📁 Reportes</span>
        </button>
        <button className="btn btn-secondary" onClick={onOpenConditionalModal} title="Definir reglas de color y formato condicional">
          <span>🎨 Semáforos</span>
        </button>
        <button
          className={`btn ${isSidebarOpen ? 'btn-active' : 'btn-secondary'}`}
          onClick={onToggleSidebar}
          title="Mostrar / Ocultar panel de campos y zonas pivot"
        >
          <span>📑 Campos</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={onToggleCurrency}
          title="Alternar formato numérico / moneda ($)"
        >
          <span>{currencyFormat ? '💵 ($)' : '🔢 (Num)'}</span>
        </button>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#334155', margin: '0 4px' }} />

        {/* View Switcher: Combined Dashboard vs Table vs Single Chart */}
        <div style={{ display: 'flex', gap: '2px', background: '#1e293b', padding: '2px', borderRadius: '6px' }}>
          <button
            className={`btn ${currentView === 'combined' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 8px', fontSize: '11.5px' }}
            onClick={() => onViewChange('combined')}
          >
            🖥️ 360°
          </button>
          <button
            className={`btn ${currentView === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 8px', fontSize: '11.5px' }}
            onClick={() => onViewChange('grid')}
          >
            📊 Tabla
          </button>
          <button
            className={`btn ${currentView === 'chart' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '5px 8px', fontSize: '11.5px' }}
            onClick={() => onViewChange('chart')}
          >
            📈 Gráfico
          </button>
        </div>

        <div style={{ height: '20px', width: '1px', backgroundColor: '#334155', margin: '0 4px' }} />

        {/* Export Actions */}
        <button className="btn btn-secondary" onClick={onExportCSV} title="Exportar vista a CSV">
          <span>📥 CSV</span>
        </button>
        <button className="btn btn-secondary" onClick={onExportJSON} title="Exportar resultado a JSON">
          <span>💾 JSON</span>
        </button>
        <button className="btn btn-secondary" onClick={onPrint} title="Imprimir / Exportar a PDF">
          <span>🖨️ PDF</span>
        </button>
      </div>
    </header>
  );
}
