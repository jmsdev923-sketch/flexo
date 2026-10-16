/**
 * FlexAnalytics API Client with Auth, RBAC, Reports, Filters, Branding & Visual Styles
 */
const BASE_URL = '/api';

export async function fetchCatalogStyles() {
  const res = await fetch(`${BASE_URL}/catalog/styles`);
  if (!res.ok) throw new Error('Error al cargar catálogo de estilos');
  return res.json();
}

export async function loginUser(username) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al iniciar sesión');
  }
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${BASE_URL}/users`);
  if (!res.ok) throw new Error('Error al listar usuarios');
  return res.json();
}

export async function createUser(userData) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al crear usuario');
  }
  return res.json();
}

export async function updateUser(userId, userData) {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al actualizar usuario');
  }
  return res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al eliminar usuario');
  }
  return res.json();
}

export async function fetchBranding() {
  const res = await fetch(`${BASE_URL}/settings/branding`);
  if (!res.ok) throw new Error('Error al obtener configuración de marca');
  return res.json();
}

export async function updateBranding(brandingData) {
  const res = await fetch(`${BASE_URL}/settings/branding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(brandingData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al actualizar logotipo y marca');
  }
  return res.json();
}

export async function fetchSupportedSources(username = 'admin') {
  const res = await fetch(`${BASE_URL}/sources?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Error al cargar fuentes');
  return res.json();
}

export async function createDataSource(sourceData) {
  const res = await fetch(`${BASE_URL}/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sourceData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al registrar fuente');
  }
  return res.json();
}

export async function deleteDataSource(sourceId) {
  const res = await fetch(`${BASE_URL}/sources/${sourceId}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al eliminar fuente');
  }
  return res.json();
}

export async function fetchReports(username = 'admin') {
  const res = await fetch(`${BASE_URL}/reports?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Error al obtener reportes guardados');
  return res.json();
}

export async function saveReport(reportData) {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al guardar reporte');
  }
  return res.json();
}

export async function deleteReport(reportId) {
  const res = await fetch(`${BASE_URL}/reports/${reportId}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al eliminar reporte');
  }
  return res.json();
}

export async function fetchDistinctValues(field, sessionId = 'default') {
  const res = await fetch(`${BASE_URL}/distinct/${encodeURIComponent(field)}?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Error al obtener valores de la dimensión');
  return res.json();
}

export async function connectSource(sourceType, config = {}, sessionId = 'default', username = 'admin') {
  const res = await fetch(`${BASE_URL}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceType, config, sessionId, username })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Fallo en la conexión');
  }
  return res.json();
}

export async function computePivot(slice, sessionId = 'default') {
  const res = await fetch(`${BASE_URL}/pivot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slice, sessionId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al procesar la tabla dinámica');
  }
  return res.json();
}

export async function uploadDataFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al subir archivo');
  }
  return res.json();
}
