/**
 * ReportService - Manages saved analytics views, preliminary reports & RBAC permissions
 */
const AuthService = require('./auth.service');

const fs = require('fs');
const path = require('path');

const REPORTS_FILE = path.join(__dirname, '..', 'data', 'reports.json');

function loadReportsFromDisk() {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
      if (Array.isArray(parsed)) {
        return parsed.filter(r => r && r.sourceId !== 'demo');
      }
    }
  } catch (err) {
    console.error('Error loading reports from disk:', err);
  }
  return [];
}

let savedReports = loadReportsFromDisk();

function saveReportsToDisk() {
  try {
    const dataDir = path.dirname(REPORTS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(savedReports, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving reports to disk:', err);
  }
}

class ReportService {
  static getReports(username = 'admin') {
    let user = null;
    try {
      user = AuthService.login(username);
    } catch {
      user = { username, role: 'analyst' };
    }

    const isAdmin = user.role === 'admin';

    return savedReports
      .filter(rep => {
        if (isAdmin) return true;
        if (rep.createdBy === user.username) return true;

        const viewRoles = rep.permissions?.viewRoles || ['*'];
        if (viewRoles.includes('*')) return true;
        if (viewRoles.includes(user.role)) return true;
        if (viewRoles.includes(user.username)) return true;

        return false;
      })
      .map(rep => {
        let userPermission = 'view'; // 'view' or 'edit'

        if (isAdmin || rep.createdBy === user.username) {
          userPermission = 'edit';
        } else {
          const editRoles = rep.permissions?.editRoles || ['admin'];
          if (editRoles.includes('*') || editRoles.includes(user.role) || editRoles.includes(user.username)) {
            userPermission = 'edit';
          }
        }

        return {
          ...rep,
          userPermission,
          canEdit: userPermission === 'edit',
          canDelete: isAdmin || rep.createdBy === user.username
        };
      });
  }

  static getReportById(reportId) {
    return savedReports.find(r => r.id === reportId);
  }

  static saveReport({
    name,
    description = '',
    isPreliminary = false,
    sourceId = 'demo',
    sourceName = 'Demo Ventas Globales',
    sourceType = 'demo',
    tableStyle = 'classic_grid',
    chartType = 'bar_vertical',
    slice,
    conditionalRules = [],
    kpis = [],
    viewRoles = ['*'],
    editRoles = ['admin'],
    username = 'admin'
  }) {
    let user = null;
    try {
      user = AuthService.login(username);
    } catch {
      user = { username, role: 'analyst' };
    }

    const isAdmin = user.role === 'admin';
    const effectiveIsPreliminary = isAdmin ? Boolean(isPreliminary) : false;

    const newReport = {
      id: effectiveIsPreliminary ? `rep-prelim-${Date.now()}` : `rep-${Date.now()}`,
      name,
      description,
      isPreliminary: effectiveIsPreliminary,
      createdBy: username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceId,
      sourceName,
      sourceType,
      tableStyle,
      chartType,
      slice,
      conditionalRules,
      kpis: Array.isArray(kpis) ? kpis : [],
      permissions: {
        viewRoles: Array.isArray(viewRoles) && viewRoles.length > 0 ? viewRoles : ['*'],
        editRoles: Array.isArray(editRoles) && editRoles.length > 0 ? editRoles : ['admin']
      }
    };

    savedReports.push(newReport);
    saveReportsToDisk();
    return {
      ...newReport,
      userPermission: 'edit',
      canEdit: true,
      canDelete: true
    };
  }

  static updateReport(reportId, updateData, username = 'admin') {
    const reportIndex = savedReports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) {
      throw new Error(`Informe con ID '${reportId}' no encontrado`);
    }

    const currentReport = savedReports[reportIndex];
    let user = null;
    try {
      user = AuthService.login(username);
    } catch {
      user = { username, role: 'analyst' };
    }

    const isAdmin = user.role === 'admin';
    const isOwner = currentReport.createdBy === user.username;
    const editRoles = currentReport.permissions?.editRoles || ['admin'];
    const hasEditPermission = isAdmin || isOwner || editRoles.includes('*') || editRoles.includes(user.role) || editRoles.includes(user.username);

    if (!hasEditPermission) {
      throw new Error(`Acceso denegado: Tu usuario (@${username}) solo tiene permiso de lectura sobre este informe preliminar.`);
    }

    // Merge updates
    const updated = {
      ...currentReport,
      name: updateData.name !== undefined ? updateData.name : currentReport.name,
      description: updateData.description !== undefined ? updateData.description : currentReport.description,
      slice: updateData.slice !== undefined ? updateData.slice : currentReport.slice,
      tableStyle: updateData.tableStyle !== undefined ? updateData.tableStyle : currentReport.tableStyle,
      chartType: updateData.chartType !== undefined ? updateData.chartType : currentReport.chartType,
      conditionalRules: updateData.conditionalRules !== undefined ? updateData.conditionalRules : currentReport.conditionalRules,
      kpis: updateData.kpis !== undefined ? updateData.kpis : (currentReport.kpis || []),
      updatedAt: new Date().toISOString()
    };

    // Only admin can change permissions or preliminary status
    if (isAdmin) {
      if (updateData.isPreliminary !== undefined) {
        updated.isPreliminary = Boolean(updateData.isPreliminary);
      }
      if (updateData.viewRoles || updateData.editRoles) {
        updated.permissions = {
          viewRoles: updateData.viewRoles || currentReport.permissions?.viewRoles || ['*'],
          editRoles: updateData.editRoles || currentReport.permissions?.editRoles || ['admin']
        };
      }
    }

    savedReports[reportIndex] = updated;
    saveReportsToDisk();
    return {
      ...updated,
      userPermission: 'edit',
      canEdit: true,
      canDelete: isAdmin || isOwner
    };
  }

  static deleteReport(reportId, username = 'admin') {
    const report = savedReports.find(r => r.id === reportId);
    if (!report) return true;

    let user = null;
    try {
      user = AuthService.login(username);
    } catch {
      user = { username, role: 'analyst' };
    }

    const isAdmin = user.role === 'admin';
    const isOwner = report.createdBy === user.username;

    if (report.isPreliminary && !isAdmin) {
      throw new Error('Solo el Administrador puede eliminar informes preliminares oficiales.');
    }

    if (!isAdmin && !isOwner) {
      throw new Error('No tienes permiso para eliminar este informe.');
    }

    savedReports = savedReports.filter(r => r.id !== reportId);
    saveReportsToDisk();
    return true;
  }
}

module.exports = ReportService;
