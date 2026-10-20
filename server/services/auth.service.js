/**
 * Authentication and Role-Based Access Control (RBAC) Service
 * Includes source permissions, permitted chart styles and permitted table styles
 */

const ALL_CHART_STYLES = [
  { id: 'bar_vertical', name: '📊 Columnas / Barras Verticales', tier: 'standard' },
  { id: 'bar_horizontal', name: '📊 Barras Horizontales', tier: 'standard' },
  { id: 'line_curve', name: '📈 Líneas & Tendencia', tier: 'standard' },
  { id: 'donut_pie', name: '🍩 Circular / Donut', tier: 'standard' },
  { id: 'area_stacked', name: '🌊 Área Sombreada', tier: 'advanced' },
  { id: 'radar_polar', name: '🕸️ Radar / Spider Plot', tier: 'advanced' }
];

const ALL_TABLE_STYLES = [
  { id: 'classic_grid', name: '🏢 Cuadrícula Clásica Corporativa', tier: 'standard' },
  { id: 'striped_zebra', name: '🦓 Filas Cebradas (Financiera)', tier: 'standard' },
  { id: 'clean_minimal', name: '✨ Minimalista Moderna', tier: 'standard' },
  { id: 'heatmap_intensity', name: '🔥 Mapa de Calor (Heatmap)', tier: 'advanced' },
  { id: 'dark_contrast', name: '🌙 Modo Oscuro Ejecutivo', tier: 'advanced' }
];

const fs = require('fs');
const path = require('path');

const SOURCES_FILE = path.join(__dirname, '..', 'data', 'sources.json');

function loadSourcesFromDisk() {
  try {
    if (fs.existsSync(SOURCES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf-8'));
      if (Array.isArray(parsed)) {
        return parsed.filter(s => s && s.id !== 'demo');
      }
    }
  } catch (err) {
    console.error('Error loading sources from disk:', err);
  }
  return [];
}

let dataSources = loadSourcesFromDisk();

function saveSourcesToDisk() {
  try {
    const dataDir = path.dirname(SOURCES_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(dataSources, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving sources to disk:', err);
  }
}

let users = [
  {
    id: 'usr-1',
    username: 'admin',
    name: 'Juan Pérez (Administrador)',
    role: 'admin',
    assignedSource: null,
    allowedSources: ['*'],
    allowedChartStyles: ['*'],
    allowedTableStyles: ['*']
  },
  {
    id: 'usr-2',
    username: 'analista_ventas',
    name: 'Laura Gómez (Analista Ventas)',
    role: 'analyst',
    assignedSource: null,
    allowedSources: ['*'],
    allowedChartStyles: ['bar_vertical', 'bar_horizontal', 'line_curve', 'donut_pie'],
    allowedTableStyles: ['classic_grid', 'striped_zebra', 'clean_minimal']
  },
  {
    id: 'usr-3',
    username: 'analista_bi',
    name: 'Carlos Ruiz (Analista BI)',
    role: 'analyst',
    assignedSource: null,
    allowedSources: ['*'],
    allowedChartStyles: ['bar_vertical', 'line_curve', 'area_stacked', 'radar_polar'],
    allowedTableStyles: ['classic_grid', 'heatmap_intensity', 'dark_contrast']
  }
];

class AuthService {
  static login(username) {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error(`Usuario '${username}' no encontrado`);
    }
    return user;
  }

  static getUsers() {
    return users;
  }

  static getCatalogStyles() {
    return {
      chartStyles: ALL_CHART_STYLES,
      tableStyles: ALL_TABLE_STYLES
    };
  }

  static createUser({
    username,
    name,
    role = 'analyst',
    assignedSource = 'demo',
    allowedSources = ['demo'],
    allowedChartStyles = ['bar_vertical', 'line_curve', 'donut_pie'],
    allowedTableStyles = ['classic_grid', 'striped_zebra']
  }) {
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error(`El usuario '${username}' ya existe`);
    }
    const finalAssigned = role === 'admin' ? 'demo' : (assignedSource || allowedSources[0] || 'demo');
    const newUser = {
      id: `usr-${Date.now()}`,
      username,
      name,
      role,
      assignedSource: finalAssigned,
      allowedSources: role === 'admin' ? ['*'] : [finalAssigned],
      allowedChartStyles: role === 'admin' ? ['*'] : allowedChartStyles,
      allowedTableStyles: role === 'admin' ? ['*'] : allowedTableStyles
    };
    users.push(newUser);
    return newUser;
  }

  static updateUserPermissions(userId, { role, assignedSource, allowedSources, allowedChartStyles, allowedTableStyles, name }) {
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Usuario no encontrado');
    if (name) user.name = name;
    if (role) user.role = role;
    if (assignedSource) {
      user.assignedSource = assignedSource;
      user.allowedSources = [assignedSource];
    } else if (allowedSources) {
      user.allowedSources = role === 'admin' ? ['*'] : allowedSources;
      if (role !== 'admin' && allowedSources.length > 0) {
        user.assignedSource = allowedSources[0];
      }
    }
    if (allowedChartStyles) user.allowedChartStyles = role === 'admin' ? ['*'] : allowedChartStyles;
    if (allowedTableStyles) user.allowedTableStyles = role === 'admin' ? ['*'] : allowedTableStyles;
    return user;
  }

  static deleteUser(userId) {
    if (userId === 'usr-1') throw new Error('No se puede eliminar el superadministrador principal');
    users = users.filter(u => u.id !== userId);
    return true;
  }

  static getDataSources(user) {
    if (!user || user.role === 'admin' || (user.allowedSources && user.allowedSources.includes('*'))) {
      return dataSources.filter(s => s && s.id !== 'demo');
    }
    const assigned = user.assignedSource || (user.allowedSources && user.allowedSources[0]);
    if (!assigned) return dataSources.filter(s => s && s.id !== 'demo');
    return dataSources.filter(s => s && s.id === assigned && s.id !== 'demo');
  }

  static addDataSource(source) {
    const newSource = {
      id: source.id || `src-${Date.now()}`,
      name: source.name,
      category: source.category || 'Archivos',
      type: source.type || 'file',
      description: source.description || 'Fuente registrada por el usuario',
      config: source.config || {}
    };
    dataSources.push(newSource);
    saveSourcesToDisk();
    return newSource;
  }

  static deleteDataSource(sourceId) {
    dataSources = dataSources.filter(s => s.id !== sourceId);
    saveSourcesToDisk();
    return true;
  }
}

module.exports = AuthService;
