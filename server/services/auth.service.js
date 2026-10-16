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

let users = [
  {
    id: 'usr-1',
    username: 'admin',
    name: 'Juan Pérez (Administrador)',
    role: 'admin',
    assignedSource: 'demo',
    allowedSources: ['*'],
    allowedChartStyles: ['*'], // Can access all chart styles
    allowedTableStyles: ['*']  // Can access all table styles
  },
  {
    id: 'usr-2',
    username: 'analista_ventas',
    name: 'Laura Gómez (Analista Ventas)',
    role: 'analyst',
    assignedSource: 'file-sales', // Single locked source assigned by administrator
    allowedSources: ['file-sales'],
    // Restricted to standard visual styles (cannot access advanced radar or heatmap)
    allowedChartStyles: ['bar_vertical', 'bar_horizontal', 'line_curve', 'donut_pie'],
    allowedTableStyles: ['classic_grid', 'striped_zebra', 'clean_minimal']
  },
  {
    id: 'usr-3',
    username: 'analista_bi',
    name: 'Carlos Ruiz (Analista BI)',
    role: 'analyst',
    assignedSource: 'olap-ssas', // Single locked source assigned by administrator
    allowedSources: ['olap-ssas'],
    // Allowed all chart styles including advanced radar, but limited table styles
    allowedChartStyles: ['bar_vertical', 'line_curve', 'area_stacked', 'radar_polar'],
    allowedTableStyles: ['classic_grid', 'heatmap_intensity', 'dark_contrast']
  }
];

let dataSources = [
  {
    id: 'demo',
    name: 'Demo Empresarial (Ventas Globales)',
    category: 'Demo',
    type: 'demo',
    description: 'Dataset transaccional listo para análisis de ventas y rentabilidad'
  },
  {
    id: 'file-sales',
    name: 'Ventas Históricas CSV',
    category: 'Archivos',
    type: 'file',
    description: 'Archivo local de transacciones retail consolidado'
  },
  {
    id: 'olap-ssas',
    name: 'Cubo SSAS - AdventureWorks',
    category: 'OLAP',
    type: 'olap',
    description: 'Cubo multidimensional de ventas con jerarquías de tiempo y producto'
  },
  {
    id: 'sql-db',
    name: 'PostgreSQL - Data Warehouse',
    category: 'Relacional',
    type: 'sql',
    description: 'Base de datos transaccional con esquemas de facturación'
  },
  {
    id: 'nosql-events',
    name: 'Elasticsearch - Logs & Telemetría',
    category: 'NoSQL',
    type: 'nosql',
    description: 'Índices analíticos de eventos y conversiones de usuarios'
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
      return dataSources;
    }
    const assigned = user.assignedSource || (user.allowedSources && user.allowedSources[0]) || 'demo';
    return dataSources.filter(s => s.id === assigned);
  }

  static addDataSource(source) {
    const newSource = {
      id: source.id || `src-${Date.now()}`,
      name: source.name,
      category: source.category || 'Personalizada',
      type: source.type || 'sql',
      description: source.description || 'Fuente registrada por el administrador',
      config: source.config || {}
    };
    dataSources.push(newSource);
    return newSource;
  }

  static deleteDataSource(sourceId) {
    dataSources = dataSources.filter(s => s.id !== sourceId);
    return true;
  }
}

module.exports = AuthService;
