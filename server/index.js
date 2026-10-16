const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const FileConnector = require('./connectors/file.connector');
const SQLConnector = require('./connectors/sql.connector');
const NoSQLConnector = require('./connectors/nosql.connector');
const OLAPConnector = require('./connectors/olap.connector');
const PivotEngine = require('./engine/pivot.engine');
const AuthService = require('./services/auth.service');
const ReportService = require('./services/report.service');
const SettingsService = require('./services/settings.service');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'JSON malformado en la petición' });
  }
  next(err);
});

// Temp storage for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Active in-memory session connectors
const activeSessions = new Map();

function createConnector(sourceType, config = {}) {
  switch (sourceType.toLowerCase()) {
    case 'csv':
    case 'json':
    case 'file':
    case 'file-sales':
      return new FileConnector(config.filePath ? config : {
        filePath: path.join(__dirname, 'data', 'sales_demo.json'),
        type: 'json'
      });
    case 'sql':
    case 'sql-db':
    case 'mssql':
    case 'mysql':
    case 'postgres':
      return new SQLConnector(config);
    case 'mongodb':
    case 'elasticsearch':
    case 'nosql':
    case 'nosql-events':
      return new NoSQLConnector(config);
    case 'ssas':
    case 'mondrian':
    case 'olap':
    case 'olap-ssas':
      return new OLAPConnector(config);
    case 'demo':
    default:
      return new FileConnector({
        filePath: path.join(__dirname, 'data', 'sales_demo.json'),
        type: 'json'
      });
  }
}

// ----------------------------------------------------
// BRANDING & SETTINGS Endpoints
// ----------------------------------------------------
app.get('/api/settings/branding', (req, res) => {
  res.json({ success: true, branding: SettingsService.getBranding() });
});

app.post('/api/settings/branding', (req, res) => {
  try {
    const updated = SettingsService.updateBranding(req.body);
    res.json({ success: true, branding: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// AUTH, RBAC & VISUAL STYLES Endpoints
// ----------------------------------------------------
app.get('/api/catalog/styles', (req, res) => {
  res.json({ success: true, ...AuthService.getCatalogStyles() });
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username } = req.body;
    const user = AuthService.login(username || 'admin');
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

app.get('/api/users', (req, res) => {
  res.json({ success: true, users: AuthService.getUsers() });
});

app.post('/api/users', (req, res) => {
  try {
    const newUser = AuthService.createUser(req.body);
    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const updated = AuthService.updateUserPermissions(req.params.id, req.body);
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    AuthService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// SAVED REPORTS & TEMPLATES Endpoints
// ----------------------------------------------------
app.get('/api/reports', (req, res) => {
  const username = req.query.username || 'admin';
  const reports = ReportService.getReports(username);
  res.json({ success: true, reports });
});

app.post('/api/reports', (req, res) => {
  try {
    const newReport = ReportService.saveReport(req.body);
    res.json({ success: true, report: newReport });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/reports/:id', (req, res) => {
  try {
    ReportService.deleteReport(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// SOURCES, DISTINCT VALUES & PIVOT Endpoints
// ----------------------------------------------------
app.get('/api/sources', (req, res) => {
  const username = req.query.username || 'admin';
  try {
    const user = AuthService.login(username);
    res.json({
      currentUser: user,
      sources: AuthService.getDataSources(user)
    });
  } catch {
    res.json({
      currentUser: null,
      sources: AuthService.getDataSources(null)
    });
  }
});

app.post('/api/sources', (req, res) => {
  try {
    const newSource = AuthService.addDataSource(req.body);
    res.json({ success: true, source: newSource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/sources/:id', (req, res) => {
  try {
    AuthService.deleteDataSource(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/connect', async (req, res) => {
  try {
    const { sourceType, config = {}, sessionId = 'default', username = 'admin' } = req.body;
    const user = AuthService.login(username);

    // STRICT ACCESS CONTROL: Only administrator can choose or switch sources
    if (user.role !== 'admin') {
      const assigned = user.assignedSource || (user.allowedSources && user.allowedSources[0]) || 'demo';
      if (sourceType !== assigned) {
        return res.status(403).json({
          success: false,
          error: `Acceso denegado: Solo el Administrador puede elegir o cambiar fuentes de datos. Tu fuente asignada es '${assigned}'.`
        });
      }
    }

    const connector = createConnector(sourceType, config);
    await connector.connect();

    const schema = await connector.getSchema();
    const data = await connector.fetchData();

    activeSessions.set(sessionId, { connector, data });

    res.json({
      success: true,
      sessionId,
      sourceType,
      recordCount: data.length,
      schema,
      preview: data.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/distinct/:field', async (req, res) => {
  const { field } = req.params;
  const { sessionId = 'default' } = req.query;
  let session = activeSessions.get(sessionId);

  if (!session) {
    const demo = createConnector('demo');
    const data = await demo.fetchData();
    session = { connector: demo, data };
    activeSessions.set(sessionId, session);
  }

  const values = PivotEngine.getDistinctValues(session.data, field);
  res.json({ success: true, field, values });
});

app.post('/api/pivot', async (req, res) => {
  try {
    const { sessionId = 'default', slice = {} } = req.body;
    let session = activeSessions.get(sessionId);

    if (!session) {
      const demoConnector = createConnector('demo');
      const data = await demoConnector.fetchData();
      session = { connector: demoConnector, data };
      activeSessions.set(sessionId, session);
    }

    const pivotResult = PivotEngine.process(session.data, slice);
    res.json({
      success: true,
      result: pivotResult
    });
  } catch (error) {
    console.error('Pivot Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const connector = new FileConnector({
      filePath: req.file.path,
      type: ext === '.csv' ? 'csv' : 'json'
    });

    await connector.connect();
    const schema = await connector.getSchema();
    const data = await connector.fetchData();

    const sessionId = `upload-${Date.now()}`;
    activeSessions.set(sessionId, { connector, data });

    res.json({
      success: true,
      sessionId,
      fileName: req.file.originalname,
      recordCount: data.length,
      schema,
      preview: data.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[flex_analytics] Server running on http://localhost:${PORT}`);
});
