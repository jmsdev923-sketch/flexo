import React, { useState, useEffect } from 'react';
import { fetchReports, saveReport, deleteReport } from '../services/api';

export function SavedReportsModal({ isOpen, onClose, currentSlice, currentRules, currentUser, onLoadReport }) {
  const [reports, setReports] = useState([]);
  const [reportName, setReportName] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetchReports(currentUser?.username || 'admin');
      if (res.success) setReports(res.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReports();
      setFeedback('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reportName.trim()) {
      alert('Ingresa un nombre para el reporte');
      return;
    }

    try {
      setLoading(true);
      await saveReport({
        name: reportName,
        slice: currentSlice,
        conditionalRules: currentRules,
        sourceType: 'demo',
        username: currentUser?.username || 'admin'
      });
      setReportName('');
      setFeedback('¡Reporte guardado con éxito!');
      await loadReports();
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('¿Eliminar este reporte guardado?')) return;
    try {
      await deleteReport(reportId);
      await loadReports();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>📁 Gestor de Reportes y Vistas Guardadas</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Guarda tus configuraciones de tabla dinámica, fórmulas y reglas para reutilizarlas
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {feedback && (
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
              ✓ {feedback}
            </div>
          )}

          {/* Save Current Slice Form */}
          <form onSubmit={handleSave} style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              💾 Guardar Vista Actual como Nuevo Reporte:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Nombre del reporte (ej. Resumen Q2 Ventas vs Costos)"
                className="input-control"
                style={{ flex: 1 }}
                value={reportName}
                onChange={e => setReportName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Guardar
              </button>
            </div>
          </form>

          {/* List of Saved Reports */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '10px' }}>
              Reportes Disponibles ({reports.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {reports.map(rep => (
                <div
                  key={rep.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: 'white'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{rep.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Creado por: <strong>{rep.createdBy}</strong> • Filas: {rep.slice?.rows?.join(', ') || 'Total'} • Columnas: {rep.slice?.columns?.join(', ') || 'Total'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => {
                        onLoadReport(rep);
                        onClose();
                      }}
                    >
                      Cargar Vista
                    </button>
                    <button
                      type="button"
                      className="btn btn-light"
                      style={{ fontSize: '11px', color: '#ef4444', padding: '4px 8px' }}
                      onClick={() => handleDelete(rep.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {reports.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
                  No hay reportes guardados aún.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
