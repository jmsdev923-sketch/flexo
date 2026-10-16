import React, { useState } from 'react';

export function DataSourceModal({ isOpen, onClose, onSelectSource, onFileUpload, currentUser }) {
  const [selectedType, setSelectedType] = useState('demo');
  const [fileMode, setFileMode] = useState('local');
  const [file, setFile] = useState(null);

  const [apiConfig, setApiConfig] = useState({
    url: '',
    type: 'json',
    authType: 'none',
    token: '',
    apiKeyHeader: 'X-API-Key',
    apiKeyValue: '',
    username: '',
    password: ''
  });

  const [olapConfig, setOlapConfig] = useState({
    engine: 'ssas',
    xmlaUrl: 'http://localhost/olap/msmdpump.dll',
    catalog: 'AdventureWorksDW',
    cubeName: 'SalesCube',
    authType: 'basic',
    username: '',
    password: '',
    domain: '',
    token: ''
  });

  const [sqlConfig, setSqlConfig] = useState({
    dialect: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'analytics_db',
    authMode: 'sql',
    user: '',
    password: '',
    domain: '',
    ssl: true,
    connectionString: '',
    query: 'SELECT * FROM sales_facts LIMIT 1000'
  });

  const [noSqlConfig, setNoSqlConfig] = useState({
    engine: 'mongodb',
    uri: 'mongodb://localhost:27017',
    collection: 'telemetry_events',
    authType: 'user_pass',
    username: '',
    password: '',
    authSource: 'admin',
    apiKey: '',
    tls: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // STRICT GUARD: If user is not an administrator, this modal cannot be opened
  if (!isOpen) return null;

  if (currentUser?.role !== 'admin') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" style={{ width: '450px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>🔒 Acceso Restringido</h3>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
            <p style={{ fontWeight: 600, color: '#991b1b' }}>Función Exclusiva del Administrador</p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              La configuración técnica de servidores, credenciales y conexión de bases de datos solo puede ser realizada por el Administrador del Sistema.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose}>Entendido</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (selectedType === 'file') {
        if (fileMode === 'local' && file) {
          await onFileUpload(file);
        } else if (fileMode === 'remote_api') {
          await onSelectSource('file', apiConfig);
        }
      } else if (selectedType === 'olap') {
        await onSelectSource('olap', olapConfig);
      } else if (selectedType === 'sql') {
        await onSelectSource('sql', sqlConfig);
      } else if (selectedType === 'nosql') {
        await onSelectSource('nosql', noSqlConfig);
      } else {
        await onSelectSource('demo', {});
      }
      onClose();
    } catch (err) {
      alert(`Error al conectar: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>🔌 Configurar y Conectar Fuentes (Exclusivo Administrador)</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Configuración de conexiones de datos corporativos, servidores y credenciales
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="source-options-grid">
            <div
              className={`source-card ${selectedType === 'demo' ? 'selected' : ''}`}
              onClick={() => setSelectedType('demo')}
            >
              <div className="source-card-title">🏢 Demo de Ventas Globales</div>
              <div className="source-card-desc">Dataset transaccional listo para análisis y pruebas.</div>
            </div>

            <div
              className={`source-card ${selectedType === 'file' ? 'selected' : ''}`}
              onClick={() => setSelectedType('file')}
            >
              <div className="source-card-title">📁 Subir Archivo / API REST</div>
              <div className="source-card-desc">Carga local de archivos CSV/JSON o APIs autenticadas.</div>
            </div>

            <div
              className={`source-card ${selectedType === 'olap' ? 'selected' : ''}`}
              onClick={() => setSelectedType('olap')}
            >
              <div className="source-card-title">🧊 Cubos OLAP (SSAS / Mondrian)</div>
              <div className="source-card-desc">Conexión XMLA con autenticación Basic, NTLM o Azure.</div>
            </div>

            <div
              className={`source-card ${selectedType === 'sql' ? 'selected' : ''}`}
              onClick={() => setSelectedType('sql')}
            >
              <div className="source-card-title">🗄️ SQL (SQL Server, Postgres, MySQL)</div>
              <div className="source-card-desc">Conexión a bases relacionales con SSL/TLS y Windows Auth.</div>
            </div>

            <div
              className={`source-card ${selectedType === 'nosql' ? 'selected' : ''}`}
              onClick={() => setSelectedType('nosql')}
            >
              <div className="source-card-title">⚡ NoSQL (MongoDB, Elasticsearch)</div>
              <div className="source-card-desc">Colecciones e índices de búsqueda analítica con TLS.</div>
            </div>
          </div>

          {/* Form details for Admin */}
          {selectedType === 'file' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${fileMode === 'local' ? 'btn-primary' : 'btn-light'}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setFileMode('local')}
                >
                  Carga Local
                </button>
                <button
                  type="button"
                  className={`btn ${fileMode === 'remote_api' ? 'btn-primary' : 'btn-light'}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setFileMode('remote_api')}
                >
                  API Remota (con Auth)
                </button>
              </div>

              {fileMode === 'local' ? (
                <div className="input-group">
                  <label>Selecciona un archivo CSV o JSON:</label>
                  <input
                    type="file"
                    accept=".csv,.json"
                    className="input-control"
                    onChange={e => setFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="input-group">
                    <label>URL del Endpoint API:</label>
                    <input
                      type="url"
                      placeholder="https://api.empresa.com/v1/analytics/ventas"
                      className="input-control"
                      value={apiConfig.url}
                      onChange={e => setApiConfig({ ...apiConfig, url: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="input-group">
                      <label>Tipo de Autenticación:</label>
                      <select
                        className="input-control"
                        value={apiConfig.authType}
                        onChange={e => setApiConfig({ ...apiConfig, authType: e.target.value })}
                      >
                        <option value="none">Sin Autenticación</option>
                        <option value="bearer">Bearer Token (JWT)</option>
                        <option value="api_key">API Key (Header)</option>
                      </select>
                    </div>
                    {apiConfig.authType === 'bearer' && (
                      <div className="input-group">
                        <label>Bearer Token:</label>
                        <input
                          type="password"
                          className="input-control"
                          value={apiConfig.token}
                          onChange={e => setApiConfig({ ...apiConfig, token: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedType === 'olap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div className="input-group">
                  <label>Motor OLAP:</label>
                  <select
                    className="input-control"
                    value={olapConfig.engine}
                    onChange={e => setOlapConfig({ ...olapConfig, engine: e.target.value })}
                  >
                    <option value="ssas">SSAS (Analysis Services)</option>
                    <option value="mondrian">Pentaho Mondrian XMLA</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Endpoint XMLA:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={olapConfig.xmlaUrl}
                    onChange={e => setOlapConfig({ ...olapConfig, xmlaUrl: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label>Catálogo / BD:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={olapConfig.catalog}
                    onChange={e => setOlapConfig({ ...olapConfig, catalog: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Cubo:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={olapConfig.cubeName}
                    onChange={e => setOlapConfig({ ...olapConfig, cubeName: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Autenticación:</label>
                  <select
                    className="input-control"
                    value={olapConfig.authType}
                    onChange={e => setOlapConfig({ ...olapConfig, authType: e.target.value })}
                  >
                    <option value="basic">Básica (Usuario/Clave)</option>
                    <option value="ntlm">Windows / NTLM</option>
                    <option value="bearer">Bearer Token (Azure)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'sql' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label>Motor:</label>
                  <select
                    className="input-control"
                    value={sqlConfig.dialect}
                    onChange={e => setSqlConfig({ ...sqlConfig, dialect: e.target.value })}
                  >
                    <option value="postgres">PostgreSQL</option>
                    <option value="mssql">SQL Server</option>
                    <option value="mysql">MySQL</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Host:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={sqlConfig.host}
                    onChange={e => setSqlConfig({ ...sqlConfig, host: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Puerto:</label>
                  <input
                    type="number"
                    className="input-control"
                    value={sqlConfig.port}
                    onChange={e => setSqlConfig({ ...sqlConfig, port: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label>Base de Datos:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={sqlConfig.database}
                    onChange={e => setSqlConfig({ ...sqlConfig, database: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Usuario:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={sqlConfig.user}
                    onChange={e => setSqlConfig({ ...sqlConfig, user: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Contraseña:</label>
                  <input
                    type="password"
                    className="input-control"
                    value={sqlConfig.password}
                    onChange={e => setSqlConfig({ ...sqlConfig, password: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedType === 'nosql' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div className="input-group">
                  <label>Motor:</label>
                  <select
                    className="input-control"
                    value={noSqlConfig.engine}
                    onChange={e => setNoSqlConfig({ ...noSqlConfig, engine: e.target.value })}
                  >
                    <option value="mongodb">MongoDB</option>
                    <option value="elasticsearch">Elasticsearch</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>URI de Conexión:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={noSqlConfig.uri}
                    onChange={e => setNoSqlConfig({ ...noSqlConfig, uri: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Conectando...' : 'Guardar y Conectar Fuente'}
          </button>
        </div>
      </div>
    </div>
  );
}
