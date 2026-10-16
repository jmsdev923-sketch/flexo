import React, { useState } from 'react';
import { loginUser } from '../services/api';

export function LoginScreen({ onLoginSuccess, branding }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor ingresa tu usuario');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await loginUser(username.trim());
      if (res.success) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname) => {
    setUsername(uname);
    loginUser(uname)
      .then(res => {
        if (res.success) onLoginSuccess(res.user);
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Brand / Company Logo Header */}
        <div className="login-brand">
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              style={{ maxHeight: '55px', maxWidth: '200px', objectFit: 'contain', marginBottom: '8px' }}
            />
          ) : (
            <div className="login-logo-badge">FA</div>
          )}
          <h2 className="login-title">{branding?.companyName || 'flex_analytics'}</h2>
          <p className="login-subtitle">
            {branding?.subtitle || 'Plataforma Analítica Multidimensional & Tablas Dinámicas'}
          </p>
        </div>

        {error && (
          <div className="login-error-alert">
            ⚠️ {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group">
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Usuario o Correo:</label>
            <input
              type="text"
              className="input-control"
              placeholder="ej. admin o mmorales"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Contraseña:</label>
            <input
              type="password"
              className="input-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '14px', justifyContent: 'center', marginTop: '6px' }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Acceso Rápido para Pruebas:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <button
              type="button"
              className="quick-login-btn"
              onClick={() => handleQuickLogin('admin')}
            >
              <div>
                <strong>🛡️ Juan Pérez</strong> <span style={{ fontSize: '10px', color: '#92400e' }}>(Admin Total)</span>
              </div>
              <span style={{ fontSize: '11px', color: '#2563eb' }}>Entrar →</span>
            </button>

            <button
              type="button"
              className="quick-login-btn"
              onClick={() => handleQuickLogin('analista_ventas')}
            >
              <div>
                <strong>📊 Laura Gómez</strong> <span style={{ fontSize: '10px', color: '#3730a3' }}>(Analista Ventas)</span>
              </div>
              <span style={{ fontSize: '11px', color: '#2563eb' }}>Entrar →</span>
            </button>

            <button
              type="button"
              className="quick-login-btn"
              onClick={() => handleQuickLogin('analista_bi')}
            >
              <div>
                <strong>📊 Carlos Ruiz</strong> <span style={{ fontSize: '10px', color: '#3730a3' }}>(Analista BI)</span>
              </div>
              <span style={{ fontSize: '11px', color: '#2563eb' }}>Entrar →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
