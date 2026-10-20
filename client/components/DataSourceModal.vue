<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-card connection-modal-card" @click.stop>
      <!-- Modal Header -->
      <div class="connection-modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="header-icon-badge">🔌</div>
          <div>
            <h3 class="header-title">Conexión a Fuentes de Datos</h3>
            <span class="header-subtitle">
              Selecciona una conexión guardada o genera una nueva para cargar datos en la tabla dinámica
            </span>
          </div>
        </div>
        <button class="modal-close-btn" @click="close" title="Cerrar ventana">×</button>
      </div>

      <!-- Alerts / Feedback -->
      <div v-if="feedback" class="feedback-banner success">
        <span>✓</span> <span>{{ feedback }}</span>
      </div>
      <div v-if="errorMessage" class="feedback-banner error">
        <span>✕</span> <span>{{ errorMessage }}</span>
      </div>

      <!-- Main Widescreen Body: 2-Column Balanced Aspect Ratio -->
      <div class="connection-modal-body">
        <!-- LEFT COLUMN: EXISTING CONNECTIONS -->
        <section class="left-panel">
          <div class="panel-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="panel-title">📋 Conexiones Guardadas</span>
              <span class="count-pill">{{ filteredSources.length }}</span>
            </div>
            <!-- Search Filter for Connections -->
            <input
              type="text"
              placeholder="Buscar..."
              class="search-mini-input"
              v-model="sourceSearchQuery"
            />
          </div>

          <!-- Scrollable Cards List -->
          <div class="sources-scroll-list">
            <div
              v-for="s in filteredSources"
              :key="s.id"
              class="source-item-card"
              :class="{ active: s.id === store.activeSourceId }"
            >
              <div class="source-card-top">
                <div class="source-identity">
                  <span class="source-icon">{{ getSourceIcon(s.type) }}</span>
                  <div class="source-texts">
                    <strong class="source-name" :title="s.name">{{ s.name }}</strong>
                    <span class="source-meta">
                      {{ s.type?.toUpperCase() }} • {{ s.category || 'General' }}
                    </span>
                  </div>
                </div>

                <span v-if="s.id === store.activeSourceId" class="active-pill">
                  CONECTADA
                </span>
              </div>

              <div class="source-card-actions">
                <button
                  type="button"
                  class="btn btn-connect"
                  :class="s.id === store.activeSourceId ? 'btn-connected' : 'btn-primary-connect'"
                  :disabled="loading || s.id === store.activeSourceId"
                  @click="handleConnectToSavedSource(s)"
                >
                  {{ s.id === store.activeSourceId ? '🟢 En Uso' : '⚡ Conectar' }}
                </button>

                <button
                  type="button"
                  class="btn-delete-source"
                  title="Eliminar conexión guardada"
                  @click="handleDeleteSource(s.id)"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div v-if="filteredSources.length === 0" class="empty-sources-state">
              No hay conexiones que coincidan.
            </div>
          </div>
        </section>

        <!-- RIGHT COLUMN: GENERATE / CONFIGURE NEW CONNECTION -->
        <section class="right-panel">
          <div class="panel-header">
            <span class="panel-title">➕ Generar y Configurar Nueva Conexión</span>
            <span style="font-size: 11px; color: #64748b;">Archivos Excel (.xlsx/.xls), CSV o Bases de Datos</span>
          </div>

          <!-- Type Selector Tiles (3 Columns horizontal) -->
          <div class="type-selector-grid">
            <button
              type="button"
              class="type-tile"
              :class="{ selected: selectedType === 'file' }"
              @click="selectedType = 'file'"
            >
              <span class="tile-icon">📁</span>
              <span class="tile-label">Subir Archivo</span>
              <span class="tile-desc">Excel (.xlsx/.xls) o CSV</span>
            </button>

            <button
              type="button"
              class="type-tile"
              :class="{ selected: selectedType === 'sql' }"
              @click="selectedType = 'sql'"
            >
              <span class="tile-icon">🗄️</span>
              <span class="tile-label">Base de Datos SQL</span>
              <span class="tile-desc">Postgres, MySQL, SQL Server</span>
            </button>

            <button
              type="button"
              class="type-tile"
              :class="{ selected: selectedType === 'olap' }"
              @click="selectedType = 'olap'"
            >
              <span class="tile-icon">🧊</span>
              <span class="tile-label">Cubo OLAP</span>
              <span class="tile-desc">XMLA / SSAS / Pentaho</span>
            </button>
          </div>

          <!-- Form Fields Container -->
          <div class="form-fields-container">
            <!-- Connection Name & Category -->
            <div class="form-row-2">
              <div class="input-group">
                <label>Nombre de la Conexión:</label>
                <input
                  type="text"
                  placeholder="ej. BD Facturación Ventas 2026"
                  class="input-control"
                  v-model="newConn.name"
                />
              </div>
              <div class="input-group">
                <label>Categoría:</label>
                <input
                  type="text"
                  placeholder="ej. Finanzas / Ventas"
                  class="input-control"
                  v-model="newConn.category"
                />
              </div>
            </div>

            <!-- Mode A: SQL Database -->
            <div v-if="selectedType === 'sql'" class="config-subpanel">
              <div class="form-row-3">
                <div class="input-group">
                  <label>Motor:</label>
                  <select class="input-control" v-model="sqlConfig.dialect">
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="mssql">Microsoft SQL Server</option>
                    <option value="oracle">Oracle</option>
                  </select>
                </div>
                <div class="input-group" style="grid-column: span 2;">
                  <label>Servidor / Host:</label>
                  <input type="text" class="input-control" placeholder="localhost o IP del servidor" v-model="sqlConfig.host" />
                </div>
              </div>

              <div class="form-row-3">
                <div class="input-group">
                  <label>Puerto:</label>
                  <input type="number" class="input-control" v-model.number="sqlConfig.port" />
                </div>
                <div class="input-group">
                  <label>Base de Datos:</label>
                  <input type="text" class="input-control" placeholder="sales_dw" v-model="sqlConfig.database" />
                </div>
                <div class="input-group">
                  <label>Usuario:</label>
                  <input type="text" class="input-control" placeholder="postgres / sa" v-model="sqlConfig.user" />
                </div>
              </div>

              <div class="form-row-2">
                <div class="input-group">
                  <label>Contraseña:</label>
                  <input type="password" class="input-control" placeholder="••••••••" v-model="sqlConfig.password" />
                </div>
                <div class="input-group">
                  <label>Consulta SQL (o Tabla):</label>
                  <input type="text" class="input-control font-mono" placeholder="SELECT * FROM fact_ventas LIMIT 2000" v-model="sqlConfig.query" />
                </div>
              </div>
            </div>

            <!-- Mode B: File Upload -->
            <div v-else-if="selectedType === 'file'" class="config-subpanel file-drop-panel">
              <div class="file-picker-box">
                <span style="font-size: 26px;">📁</span>
                <div>
                  <label style="font-weight: 600; font-size: 13px; color: #1e293b; display: block; cursor: pointer;">
                    Selecciona tu archivo de datos (CSV o Excel)
                  </label>
                  <span style="font-size: 11px; color: #64748b;">
                    Formatos: .csv (delimitado por , o ;), .xlsx o .xls
                  </span>
                </div>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  class="file-input-native"
                  @change="onFileChange"
                />
              </div>

              <div v-if="file" class="file-selected-badge">
                <span>📄 <strong>{{ file.name }}</strong> ({{ Math.round(file.size / 1024) }} KB)</span>
              </div>
            </div>


            <!-- Mode D: OLAP -->
            <div v-else-if="selectedType === 'olap'" class="config-subpanel">
              <div class="input-group">
                <label>URL Endpoint XMLA (SSAS / Pentaho):</label>
                <input type="text" class="input-control" v-model="olapConfig.xmlaUrl" />
              </div>
              <div class="form-row-2">
                <div class="input-group">
                  <label>Catálogo:</label>
                  <input type="text" class="input-control" v-model="olapConfig.catalog" />
                </div>
                <div class="input-group">
                  <label>Nombre del Cubo:</label>
                  <input type="text" class="input-control" v-model="olapConfig.cubeName" />
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons in Right Panel -->
          <div class="right-panel-actions">
            <button
              type="button"
              class="btn btn-save-only"
              :disabled="loading"
              @click="handleSaveConnection(false)"
            >
              💾 Guardar en Lista
            </button>

            <button
              type="button"
              class="btn btn-save-and-connect"
              :disabled="loading"
              @click="handleSaveConnection(true)"
            >
              {{ loading ? 'Conectando...' : '⚡ Guardar y Conectar Ahora' }}
            </button>
          </div>
        </section>
      </div>

      <!-- Modal Footer -->
      <div class="connection-modal-footer">
        <div class="footer-info">
          <span class="status-indicator-dot" />
          <span>Fuente activa: <strong>{{ store.sourceName }}</strong></span>
          <span style="color: #94a3b8;">•</span>
          <span style="color: #64748b;">{{ new Intl.NumberFormat('es-CO').format(store.recordCount) }} registros</span>
        </div>

        <button type="button" class="btn btn-primary" style="padding: 6px 16px; font-weight: 600;" @click="close">
          Continuar al Lienzo ➔
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';
import { createDataSource, deleteDataSource, fetchSupportedSources, uploadDataFile } from '~/services/api';

const store = useAnalyticsStore();

const isOpen = computed(() => store.isSourceModalOpen);

function close() {
  store.isSourceModalOpen = false;
}

const sourceSearchQuery = ref('');
const selectedType = ref('file');
const file = ref(null);
const loading = ref(false);
const feedback = ref('');
const errorMessage = ref('');

const newConn = ref({
  name: '',
  category: 'Archivos'
});

const sqlConfig = ref({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'ventas_db',
  user: 'postgres',
  password: '',
  query: 'SELECT * FROM ventas LIMIT 2000'
});

const olapConfig = ref({
  engine: 'ssas',
  xmlaUrl: 'http://localhost/olap/msmdpump.dll',
  catalog: 'AdventureWorksDW',
  cubeName: 'SalesCube'
});

const filteredSources = computed(() => {
  const q = sourceSearchQuery.value.trim().toLowerCase();
  if (!q) return store.availableSources;
  return store.availableSources.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.type?.toLowerCase().includes(q) ||
    s.category?.toLowerCase().includes(q)
  );
});

function getSourceIcon(type) {
  switch (type) {
    case 'sql': return '🗄️';
    case 'file':
    case 'excel':
    case 'xlsx':
    case 'xls':
    case 'csv': return '📁';
    case 'olap': return '🧊';
    default: return '📊';
  }
}

function onFileChange(e) {
  const selected = (e.target.files && e.target.files[0]) ? e.target.files[0] : null;
  file.value = selected;
  if (selected && !newConn.value.name.trim()) {
    newConn.value.name = selected.name.replace(/\.[^/.]+$/, '');
  }
}

watch(isOpen, (open) => {
  if (open) {
    feedback.value = '';
    errorMessage.value = '';
    sourceSearchQuery.value = '';
    if (!newConn.value.name) {
      newConn.value.name = '';
    }
  }
});

async function handleConnectToSavedSource(source) {
  try {
    loading.value = true;
    errorMessage.value = '';
    await store.switchAssignedSource(source.id);
    feedback.value = `¡Conectado exitosamente a "${source.name}"!`;
    setTimeout(() => {
      close();
    }, 700);
  } catch (err) {
    errorMessage.value = `Error al conectar: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

async function handleSaveConnection(connectNow = false) {
  // If file selected but name empty, auto-populate from file
  if (selectedType.value === 'file' && file.value && !newConn.value.name.trim()) {
    newConn.value.name = file.value.name.replace(/\.[^/.]+$/, '');
  }

  if (!newConn.value.name.trim()) {
    errorMessage.value = 'Por favor ingresa un nombre para la nueva conexión';
    return;
  }

  if (selectedType.value === 'file' && !file.value) {
    errorMessage.value = 'Por favor selecciona un archivo (.xlsx, .xls o .csv) antes de guardar';
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = '';

    let fileConfig = {};

    // For file sources, upload the file first to obtain server filePath and schema
    if (selectedType.value === 'file' && file.value) {
      const uploadRes = await uploadDataFile(file.value);
      if (!uploadRes.success) {
        throw new Error(uploadRes.error || 'Error al procesar el archivo');
      }
      fileConfig = {
        filePath: uploadRes.filePath,
        fileName: uploadRes.fileName,
        fileType: uploadRes.fileType,
        originalName: file.value.name
      };
    }

    const sourcePayload = {
      id: `src-${Date.now()}`,
      name: newConn.value.name.trim(),
      category: newConn.value.category.trim() || (selectedType.value === 'file' ? 'Archivos' : 'General'),
      type: selectedType.value,
      description: selectedType.value === 'file' && file.value
        ? `Archivo: ${file.value.name}`
        : `Conexión guardada: ${selectedType.value.toUpperCase()}`,
      config: selectedType.value === 'file'
        ? fileConfig
        : (selectedType.value === 'sql' ? sqlConfig.value : (selectedType.value === 'olap' ? olapConfig.value : {})),
      username: store.currentUser?.username || 'admin'
    };

    const res = await createDataSource(sourcePayload);
    if (res.success) {
      feedback.value = `¡Conexión "${newConn.value.name}" guardada exitosamente!`;

      // Refresh sources list from backend so it immediately appears in the left panel
      const sRes = await fetchSupportedSources(store.currentUser?.username || 'admin');
      if (sRes.success) {
        store.availableSources = sRes.sources;
      } else {
        store.availableSources.push(res.source || sourcePayload);
      }

      if (connectNow) {
        if (selectedType.value === 'file') {
          await store.connectToSource('file', fileConfig);
        } else if (selectedType.value === 'sql') {
          await store.connectToSource('sql', sqlConfig.value);
        } else if (selectedType.value === 'olap') {
          await store.connectToSource('olap', olapConfig.value);
        }
        setTimeout(() => {
          close();
        }, 700);
      } else {
        newConn.value.name = '';
        file.value = null;
      }
    }
  } catch (err) {
    errorMessage.value = `Error: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

async function handleDeleteSource(sourceId) {
  if (!window.confirm('¿Seguro que deseas eliminar esta conexión guardada?')) return;
  try {
    loading.value = true;
    errorMessage.value = '';
    await deleteDataSource(sourceId);
    const sRes = await fetchSupportedSources(store.currentUser?.username || 'admin');
    if (sRes.success) {
      store.availableSources = sRes.sources;
    }
    feedback.value = 'Conexión eliminada correctamente.';
  } catch (err) {
    errorMessage.value = `Error al eliminar: ${err.message}`;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Widescreen 16:10 aspect ratio modal card */
.connection-modal-card {
  width: 1080px;
  max-width: 95vw;
  height: 640px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8);
  overflow: hidden;
  background: white;
}

.connection-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.header-icon-badge {
  width: 36px;
  height: 36px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: 1px solid #bfdbfe;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.header-subtitle {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
  display: block;
}

.feedback-banner {
  padding: 8px 18px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid transparent;
}

.feedback-banner.success {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.feedback-banner.error {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

/* 2-Column Balanced Body */
.connection-modal-body {
  flex: 1;
  display: grid;
  grid-template-columns: 370px 1fr;
  gap: 16px;
  padding: 16px 20px;
  overflow: hidden;
  background: #f8fafc;
}

/* Left Panel: Saved Sources */
.left-panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.count-pill {
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
  border: 1px solid #bfdbfe;
}

.search-mini-input {
  font-size: 11px;
  padding: 3px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  width: 100px;
  outline: none;
}

.search-mini-input:focus {
  border-color: #2563eb;
}

.sources-scroll-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}

.source-item-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.15s ease;
}

.source-item-card:hover {
  border-color: #94a3b8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.source-item-card.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}

.source-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.source-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.source-icon {
  font-size: 18px;
}

.source-texts {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.source-name {
  font-size: 12px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-meta {
  font-size: 10px;
  color: #64748b;
}

.active-pill {
  background: #dcfce7;
  color: #166534;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  border: 1px solid #bbf7d0;
}

.source-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.btn-connect {
  font-size: 11px;
  padding: 4px 8px;
  flex: 1;
  justify-content: center;
  border-radius: 4px;
  font-weight: 600;
}

.btn-primary-connect {
  background: #2563eb;
  color: white;
  border: 1px solid #2563eb;
}

.btn-primary-connect:hover {
  background: #1d4ed8;
}

.btn-connected {
  background: #f1f5f9;
  color: #059669;
  border: 1px solid #cbd5e1;
  cursor: default;
}

.btn-delete-source {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 11px;
  color: #ef4444;
  padding: 4px 6px;
  cursor: pointer;
}

.btn-delete-source:hover {
  background: #fef2f2;
}

.empty-sources-state {
  text-align: center;
  padding: 24px 12px;
  color: #94a3b8;
  font-size: 11.5px;
}

/* Right Panel: New Connection Generator */
.right-panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.type-selector-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.type-tile {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.type-tile:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.type-tile.selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}

.tile-icon {
  font-size: 18px;
}

.tile-label {
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
}

.tile-desc {
  font-size: 9px;
  color: #64748b;
  line-height: 1.2;
}

.form-fields-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 8px;
}

.form-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.config-subpanel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.font-mono {
  font-family: monospace;
  font-size: 11px;
}

.file-drop-panel {
  padding: 18px;
  text-align: center;
}

.file-picker-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.file-input-native {
  margin-top: 6px;
  font-size: 11px;
}

.file-selected-badge {
  margin-top: 8px;
  padding: 6px 10px;
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  border-radius: 4px;
  font-size: 11px;
}

.demo-info-panel {
  padding: 14px;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.right-panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.btn-save-only {
  background: #f1f5f9;
  color: #2563eb;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  font-size: 11.5px;
  padding: 6px 14px;
}

.btn-save-only:hover {
  background: #e2e8f0;
}

.btn-save-and-connect {
  background: #2563eb;
  color: white;
  border: 1px solid #2563eb;
  font-weight: 600;
  font-size: 11.5px;
  padding: 6px 16px;
}

.btn-save-and-connect:hover {
  background: #1d4ed8;
}

/* Modal Footer */
.connection-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 22px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #334155;
}

.status-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}
</style>
