import React, { useState, useEffect } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser, createDataSource, deleteDataSource, updateBranding, fetchCatalogStyles } from '../services/api';

export function AdminPanelModal({ isOpen, onClose, allSources = [], onSourcesUpdated, branding, onBrandingUpdated }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'sources' | 'branding'
  const [users, setUsers] = useState([]);
  const [catalogStyles, setCatalogStyles] = useState({ chartStyles: [], tableStyles: [] });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Branding state
  const [brandingForm, setBrandingForm] = useState({
    companyName: branding?.companyName || 'flex_analytics',
    subtitle: branding?.subtitle || 'Plataforma Analítica Multidimensional',
    logoUrl: branding?.logoUrl || ''
  });

  // Form for new user
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    role: 'analyst',
    allowedSources: ['demo'],
    allowedChartStyles: ['bar_vertical', 'bar_horizontal', 'line_curve', 'donut_pie'],
    allowedTableStyles: ['classic_grid', 'striped_zebra', 'clean_minimal']
  });

  const [newSource, setNewSource] = useState({
    id: '',
    name: '',
    category: 'Relacional',
    type: 'sql',
    description: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, stylesRes] = await Promise.all([
        fetchUsers(),
        fetchCatalogStyles()
      ]);
      if (usersRes.success) setUsers(usersRes.users);
      if (stylesRes.success) {
        setCatalogStyles({
          chartStyles: stylesRes.chartStyles || [],
          tableStyles: stylesRes.tableStyles || []
        });
      }
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFeedback('');
      if (branding) {
        setBrandingForm({
          companyName: branding.companyName || '',
          subtitle: branding.subtitle || '',
          logoUrl: branding.logoUrl || ''
        });
      }
    }
  }, [isOpen, branding]);

  if (!isOpen) return null;

  const handleLogoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandingForm(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await updateBranding(brandingForm);
      if (res.success) {
        setFeedback('¡Identidad y logotipo de la empresa actualizados correctamente!');
        if (onBrandingUpdated) onBrandingUpdated(res.branding);
      }
    } catch (err) {
      alert(`Error al guardar marca: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.name) {
      alert('Por favor ingresa usuario y nombre');
      return;
    }
    try {
      setLoading(true);
      await createUser(newUser);
      setNewUser({
        username: '',
        name: '',
        role: 'analyst',
        allowedSources: ['demo'],
        allowedChartStyles: ['bar_vertical', 'bar_horizontal', 'line_curve', 'donut_pie'],
        allowedTableStyles: ['classic_grid', 'striped_zebra', 'clean_minimal']
      });
      setFeedback('Usuario creado exitosamente');
      await loadData();
    } catch (err) {
      alert(`Error al crear usuario: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSourcePermission = async (user, sourceId) => {
    if (user.role === 'admin') return;
    let nextAllowed = [...(user.allowedSources || [])];
    if (nextAllowed.includes(sourceId)) {
      nextAllowed = nextAllowed.filter(s => s !== sourceId);
    } else {
      nextAllowed.push(sourceId);
    }
    try {
      await updateUser(user.id, { allowedSources: nextAllowed });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStylePermission = async (user, styleType, styleId) => {
    if (user.role === 'admin') return;
    const key = styleType === 'chart' ? 'allowedChartStyles' : 'allowedTableStyles';
    let current = [...(user[key] || [])];
    if (current.includes(styleId)) {
      current = current.filter(id => id !== styleId);
    } else {
      current.push(styleId);
    }
    try {
      await updateUser(user.id, { [key]: current });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await deleteUser(userId);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSource = async (e) => {
    e.preventDefault();
    if (!newSource.name) {
      alert('Por favor especifica el nombre de la fuente');
      return;
    }
    try {
      setLoading(true);
      await createDataSource({
        ...newSource,
        id: newSource.id || `src-${Date.now()}`
      });
      setNewSource({ id: '', name: '', category: 'Relacional', type: 'sql', description: '' });
      setFeedback('Fuente registrada en el catálogo');
      if (onSourcesUpdated) onSourcesUpdated();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!window.confirm('¿Eliminar esta fuente del catálogo corporativo?')) return;
    try {
      await deleteDataSource(sourceId);
      if (onSourcesUpdated) onSourcesUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '880px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Panel de Administración (Roles, Permisos Visuales & Marca)</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Control de acceso basado en roles para fuentes de datos, estilos de gráficos y tablas
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 20px' }}>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-light'}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'users' ? '2px solid #2563eb' : 'none' }}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuarios y Permisos Visuales
          </button>
          <button
            className={`btn ${activeTab === 'sources' ? 'btn-primary' : 'btn-light'}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'sources' ? '2px solid #2563eb' : 'none' }}
            onClick={() => setActiveTab('sources')}
          >
            🗄️ Catálogo de Fuentes
          </button>
          <button
            className={`btn ${activeTab === 'branding' ? 'btn-primary' : 'btn-light'}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'branding' ? '2px solid #2563eb' : 'none' }}
            onClick={() => setActiveTab('branding')}
          >
            🏢 Logo & Marca de la Empresa
          </button>
        </div>

        <div className="modal-body">
          {feedback && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
              ✓ {feedback}
            </div>
          )}

          {/* TAB 1: USERS & PERMISSIONS (SOURCES + VISUAL STYLES) */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleCreateUser} style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#1e293b' }}>
                  + Crear Nuevo Usuario y Definir Permisos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div className="input-group">
                    <label>Nombre Completo:</label>
                    <input
                      type="text"
                      placeholder="ej. Mateo Morales"
                      className="input-control"
                      value={newUser.name}
                      onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Nombre de Usuario (Login):</label>
                    <input
                      type="text"
                      placeholder="mmorales"
                      className="input-control"
                      value={newUser.username}
                      onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Rol de Acceso:</label>
                    <select
                      className="input-control"
                      value={newUser.role}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="analyst">Analista (Solo opciones permitidas)</option>
                      <option value="admin">Administrador (Acceso total & Gestión)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    Guardar Usuario
                  </button>
                </div>
              </form>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#1e293b' }}>
                  Matriz de Permisos por Usuario (Fuentes, Gráficos y Tablas):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {users.map(u => (
                    <div
                      key={u.id}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong>{u.name}</strong> <span style={{ color: '#64748b', fontSize: '11px' }}>@{u.username}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: u.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                            color: u.role === 'admin' ? '#92400e' : '#3730a3'
                          }}>
                            {u.role === 'admin' ? '🛡️ Administrador' : '📊 Analista'}
                          </span>
                          {u.id !== 'usr-1' && (
                            <button
                              className="zone-remove-btn"
                              title="Eliminar usuario"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>

                      {u.role === 'admin' ? (
                        <div style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>
                          ✓ Acceso total e irrestricto a todas las fuentes, tipos de gráficos y estilos de tablas.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '8px', fontSize: '11px' }}>
                          {/* 1. Sources */}
                          <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                              Fuentes Autorizadas:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {allSources.map(s => {
                                const isChecked = u.allowedSources && u.allowedSources.includes(s.id);
                                return (
                                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleSourcePermission(u, s.id)}
                                    />
                                    <span>{s.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Chart Styles */}
                          <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                              Estilos de Gráficos Permitidos:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {catalogStyles.chartStyles.map(cs => {
                                const isChecked = (u.allowedChartStyles && u.allowedChartStyles.includes('*')) ||
                                  (u.allowedChartStyles && u.allowedChartStyles.includes(cs.id));
                                return (
                                  <label key={cs.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleStylePermission(u, 'chart', cs.id)}
                                    />
                                    <span>{cs.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. Table Styles */}
                          <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                              Estilos de Tablas Permitidos:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {catalogStyles.tableStyles.map(ts => {
                                const isChecked = (u.allowedTableStyles && u.allowedTableStyles.includes('*')) ||
                                  (u.allowedTableStyles && u.allowedTableStyles.includes(ts.id));
                                return (
                                  <label key={ts.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleStylePermission(u, 'table', ts.id)}
                                    />
                                    <span>{ts.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA SOURCES CATALOG */}
          {activeTab === 'sources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleCreateSource} style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#1e293b' }}>
                  + Registrar Nueva Fuente en el Catálogo
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                  <div className="input-group">
                    <label>Nombre de la Fuente:</label>
                    <input
                      type="text"
                      placeholder="ej. Oracle ERP Contabilidad"
                      className="input-control"
                      value={newSource.name}
                      onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Categoría:</label>
                    <select
                      className="input-control"
                      value={newSource.category}
                      onChange={e => setNewSource({ ...newSource, category: e.target.value })}
                    >
                      <option value="Relacional">Relacional</option>
                      <option value="OLAP">Cubo OLAP</option>
                      <option value="NoSQL">NoSQL / Búsqueda</option>
                      <option value="Archivos">Archivos / APIs</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Tipo Conector:</label>
                    <select
                      className="input-control"
                      value={newSource.type}
                      onChange={e => setNewSource({ ...newSource, type: e.target.value })}
                    >
                      <option value="sql">SQL Relacional</option>
                      <option value="olap">OLAP XMLA</option>
                      <option value="nosql">NoSQL (Mongo/Elastic)</option>
                      <option value="file">CSV / JSON</option>
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '10px' }}>
                  <label>Descripción:</label>
                  <input
                    type="text"
                    placeholder="Detalles sobre tablas, vistas o cubos analíticos disponibles"
                    className="input-control"
                    value={newSource.description}
                    onChange={e => setNewSource({ ...newSource, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    Registrar Fuente
                  </button>
                </div>
              </form>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#1e293b' }}>
                  Fuentes Disponibles en la Organización:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {allSources.map(s => (
                    <div key={s.id} className="source-card" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="source-card-title">{s.name}</div>
                        <span style={{ fontSize: '10px', background: '#e2e8f0', padding: '2px 5px', borderRadius: '4px' }}>
                          {s.category}
                        </span>
                      </div>
                      <div className="source-card-desc">{s.description}</div>
                      {s.id !== 'demo' && (
                        <button
                          style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', marginTop: '6px' }}
                          onClick={() => handleDeleteSource(s.id)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & COMPANY LOGO */}
          {activeTab === 'branding' && (
            <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                  Personalización Visual de la Plataforma (Marca Blanca)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label>Nombre de la Compañía:</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="ej. Grupo Éxito / Bancolombia / Acme Corp"
                      value={brandingForm.companyName}
                      onChange={e => setBrandingForm({ ...brandingForm, companyName: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label>Subtítulo / Lema:</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="ej. Inteligencia de Negocios y Analítica"
                      value={brandingForm.subtitle}
                      onChange={e => setBrandingForm({ ...brandingForm, subtitle: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'center' }}>
                  <div className="input-group">
                    <label>Subir Logotipo de la Empresa (PNG, JPG, SVG):</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input-control"
                      onChange={handleLogoFileUpload}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      O introduce la URL directa de la imagen:
                    </span>
                    <input
                      type="url"
                      placeholder="https://empresa.com/assets/logo.png"
                      className="input-control"
                      style={{ marginTop: '4px' }}
                      value={brandingForm.logoUrl}
                      onChange={e => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                    />
                  </div>

                  <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px', background: '#ffffff' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
                      VISTA PREVIA DEL LOGO:
                    </span>
                    {brandingForm.logoUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <img
                          src={brandingForm.logoUrl}
                          alt="Logo Preview"
                          style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain' }}
                        />
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                          onClick={() => setBrandingForm({ ...brandingForm, logoUrl: '' })}
                        >
                          Eliminar Logo
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                        Sin logo personalizado (Se usará el isotipo FA por defecto)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Guardar y Aplicar Logotipo
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
