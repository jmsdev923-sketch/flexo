<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-card" style="width: 760px; max-height: 90vh; display: flex; flex-direction: column;" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h3>📁 Gestor de Informes & Vistas Guardadas</h3>
          <span style="font-size: 11px; color: #64748b;">
            Informes preliminares oficiales configurados por el Administrador y vistas personalizadas con control de acceso por rol
          </span>
        </div>
        <button class="modal-close-btn" @click="close">×</button>
      </div>

      <div class="modal-body" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px;">
        <!-- Feedback alert -->
        <div v-if="feedback" style="background: #ecfdf5; color: #065f46; padding: 8px 12px; border-radius: 6px; font-size: 12px; border: 1px solid #a7f3d0;">
          ✓ {{ feedback }}
        </div>
        <div v-if="errorMessage" style="background: #fef2f2; color: #991b1b; padding: 8px 12px; border-radius: 6px; font-size: 12px; border: 1px solid #fecaca;">
          ✕ {{ errorMessage }}
        </div>

        <!-- 1. Banner for Currently Loaded Report -->
        <div
          v-if="store.currentLoadedReport"
          style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between;"
        >
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 15px;">📌</span>
              <strong style="font-size: 13px; color: #1e3a8a;">
                Informe en Pantalla: {{ store.currentLoadedReport.name }}
              </strong>
              <span
                v-if="store.currentLoadedReport.isPreliminary"
                style="background: #dbeafe; color: #1d4ed8; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;"
              >
                PRELIMINAR OFICIAL
              </span>
              <span
                style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;"
                :style="{
                  background: store.canEditLoadedReport ? '#dcfce7' : '#fef3c7',
                  color: store.canEditLoadedReport ? '#166534' : '#92400e'
                }"
              >
                {{ store.canEditLoadedReport ? '✏️ Ver y Modificar' : '🔒 Solo Lectura' }}
              </span>
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">
              Fuente vinculada: <strong>{{ store.currentLoadedReport.sourceName || store.currentLoadedReport.sourceId }}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button
              v-if="store.canEditLoadedReport"
              type="button"
              class="btn btn-primary"
              style="font-size: 11px; padding: 4px 10px;"
              :disabled="loading"
              @click="handleSaveCurrentChanges"
            >
              💾 Guardar Cambios
            </button>
            <button
              type="button"
              class="btn btn-light"
              style="font-size: 11px; padding: 4px 8px; color: #64748b;"
              @click="store.clearLoadedReport()"
              title="Dejar de sincronizar este informe"
            >
              ✕ Desvincular
            </button>
          </div>
        </div>

        <!-- 2. Form to Save / Create Report -->
        <form @submit.prevent="handleSave" style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <div style="font-size: 13px; font-weight: 700; color: #0f172a;">
              💾 {{ store.isAdmin ? 'Guardar Configuración Actual como Informe' : 'Guardar Vista Personalizada' }}
            </div>
            <span style="font-size: 11px; color: #64748b;">
              Fuente activa: <strong>{{ store.sourceName }}</strong>
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="input-group">
              <label>Nombre del Reporte / Informe:</label>
              <input
                type="text"
                placeholder="ej. Informe Preliminar: Ventas vs Costos 2026"
                class="input-control"
                v-model="reportName"
              />
            </div>
            <div class="input-group">
              <label>Descripción / Observación:</label>
              <input
                type="text"
                placeholder="ej. Informe base mensual para análisis financiero..."
                class="input-control"
                v-model="reportDescription"
              />
            </div>
          </div>

          <!-- Permission & Access Controls -->
          <div style="margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;">
            <div v-if="store.isAdmin" style="margin-bottom: 8px;">
              <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 12.5px; color: #1e3a8a; cursor: pointer;">
                <input type="checkbox" v-model="isPreliminary" />
                <span>📌 Definir como Informe Preliminar Oficial</span>
              </label>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px; margin-left: 22px;">
                Los informes preliminares quedan registrados como base corporativa oficial.
              </div>
            </div>

            <!-- Granular Permissions Matrix for Dashboard Access -->
            <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <!-- 1. View Roles (Read-Only) -->
              <div>
                <div style="font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                  👁️ ¿Quién puede ver este tablero?:
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input
                      type="checkbox"
                      :checked="viewRoles.includes('*')"
                      @change="toggleRole('view', '*')"
                    />
                    <strong>* (Todos los usuarios con acceso)</strong>
                  </label>
                  <label v-for="r in availableRoles" :key="'view-' + r.id" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input
                      type="checkbox"
                      :disabled="viewRoles.includes('*')"
                      :checked="viewRoles.includes('*') || viewRoles.includes(r.id)"
                      @change="toggleRole('view', r.id)"
                    />
                    <span>{{ r.label }}</span>
                  </label>
                </div>
              </div>

              <!-- 2. Edit Roles (View and Modify) -->
              <div>
                <div style="font-size: 11.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                  ✏️ ¿Quién puede modificar / guardar cambios?:
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" checked disabled />
                    <strong>admin (Administrador - Siempre)</strong>
                  </label>
                  <label v-for="r in availableRoles.filter(x => x.id !== 'admin')" :key="'edit-' + r.id" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input
                      type="checkbox"
                      :checked="editRoles.includes(r.id)"
                      @change="toggleRole('edit', r.id)"
                    />
                    <span>{{ r.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
            <button type="submit" class="btn btn-primary" :disabled="loading" style="padding: 6px 18px; font-weight: 700;">
              {{ isPreliminary ? '📌 Guardar como Informe Preliminar Oficial' : '💾 Guardar Avance del Tablero' }}
            </button>
          </div>
        </form>

        <!-- 3. Navigation Tabs for Reports -->
        <div style="display: flex; gap: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
          <button
            type="button"
            class="btn"
            :class="activeReportsTab === 'preliminary' ? 'btn-primary' : 'btn-light'"
            style="font-size: 12px; padding: 6px 14px;"
            @click="activeReportsTab = 'preliminary'"
          >
            📌 Informes Preliminares Oficiales ({{ preliminaryReports.length }})
          </button>
          <button
            type="button"
            class="btn"
            :class="activeReportsTab === 'custom' ? 'btn-primary' : 'btn-light'"
            style="font-size: 12px; padding: 6px 14px;"
            @click="activeReportsTab = 'custom'"
          >
            📁 Otras Vistas Guardadas ({{ customReports.length }})
          </button>
        </div>

        <!-- 4. List of Filtered Reports -->
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div
            v-for="rep in displayedReports"
            :key="rep.id"
            style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"
          >
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <strong style="font-size: 13.5px; color: #0f172a;">{{ rep.name }}</strong>

                  <span
                    v-if="rep.isPreliminary"
                    style="background: #dbeafe; color: #1e40af; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;"
                  >
                    📌 PRELIMINAR
                  </span>

                  <span
                    style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;"
                    :style="{
                      background: rep.canEdit ? '#dcfce7' : '#fef3c7',
                      color: rep.canEdit ? '#166534' : '#92400e'
                    }"
                  >
                    {{ rep.canEdit ? '✏️ Ver y Modificar' : '🔒 Solo Lectura' }}
                  </span>

                  <span style="font-size: 10px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
                    Fuente: {{ rep.sourceName || rep.sourceId || 'demo' }}
                  </span>
                </div>

                <div v-if="rep.description" style="font-size: 11.5px; color: #475569; margin-top: 4px;">
                  {{ rep.description }}
                </div>

                <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
                  Configuración:
                  <strong>Filas:</strong> {{ rep.slice?.rows?.join(', ') || '(Ninguna)' }} •
                  <strong>Columnas:</strong> {{ rep.slice?.columns?.join(', ') || '(Ninguna)' }} •
                  <strong>Métricas:</strong> {{ rep.slice?.measures?.map(m => m.caption || m.field).join(', ') || '(Ninguna)' }}
                </div>

                <!-- Admin RBAC summary breakdown for preliminary reports -->
                <div
                  v-if="store.isAdmin && rep.isPreliminary && rep.permissions"
                  style="margin-top: 6px; font-size: 10.5px; color: #3b82f6; background: #f8fafc; padding: 4px 8px; border-radius: 4px; display: inline-flex; gap: 12px;"
                >
                  <span>👁️ Ver: <strong>{{ rep.permissions.viewRoles?.join(', ') || 'Todos' }}</strong></span>
                  <span>✏️ Modificar: <strong>{{ rep.permissions.editRoles?.join(', ') || 'admin' }}</strong></span>
                </div>

                <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
                  Creado por: <strong>@{{ rep.createdBy }}</strong> • Actualizado: {{ formatDate(rep.updatedAt) }}
                </div>
              </div>

              <!-- Action buttons -->
              <div style="display: flex; gap: 6px; align-items: center;">
                <button
                  type="button"
                  class="btn btn-primary"
                  style="font-size: 11px; padding: 5px 12px;"
                  @click="handleLoad(rep)"
                >
                  Cargar Informe
                </button>

                <button
                  v-if="rep.id === store.currentLoadedReport?.id && rep.canEdit"
                  type="button"
                  class="btn btn-light"
                  style="font-size: 11px; color: #059669; padding: 5px 10px; font-weight: 600;"
                  @click="handleSaveCurrentChanges"
                  title="Guardar cambios actuales en este reporte"
                >
                  💾 Guardar
                </button>

                <button
                  v-if="rep.canDelete"
                  type="button"
                  class="btn btn-light"
                  style="font-size: 11px; color: #ef4444; padding: 5px 8px;"
                  @click="handleDelete(rep.id)"
                  title="Eliminar reporte"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          <div v-if="displayedReports.length === 0 && !loading" style="text-align: center; padding: 30px; color: #94a3b8; font-size: 12px; background: #f8fafc; border-radius: 8px;">
            No se encontraron informes en esta sección.
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="close">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';
import { fetchReports, saveReport, deleteReport, updateReport, fetchUsers } from '~/services/api';

const store = useAnalyticsStore();

const isOpen = computed(() => store.isReportsModalOpen);

function close() {
  store.isReportsModalOpen = false;
}

const reports = ref([]);
const usersList = ref([]);
const activeReportsTab = ref('preliminary'); // 'preliminary' | 'custom'

const reportName = ref('');
const reportDescription = ref('');
const isPreliminary = ref(false);
const viewRoles = ref(['*']);
const editRoles = ref(['admin', 'analista_bi']);

const loading = ref(false);
const feedback = ref('');
const errorMessage = ref('');

const availableRoles = computed(() => {
  return [
    { id: 'admin', label: 'admin (Superadministrador)' },
    { id: 'analista_ventas', label: 'analista_ventas (Ventas Retail)' },
    { id: 'analista_bi', label: 'analista_bi (Business Intelligence)' }
  ];
});

const preliminaryReports = computed(() => {
  return reports.value.filter(r => r.isPreliminary);
});

const customReports = computed(() => {
  return reports.value.filter(r => !r.isPreliminary);
});

const displayedReports = computed(() => {
  return activeReportsTab.value === 'preliminary'
    ? preliminaryReports.value
    : customReports.value;
});

function toggleRole(type, roleId) {
  if (type === 'view') {
    if (roleId === '*') {
      viewRoles.value = viewRoles.value.includes('*') ? [] : ['*'];
    } else {
      if (viewRoles.value.includes('*')) {
        viewRoles.value = [roleId];
      } else if (viewRoles.value.includes(roleId)) {
        viewRoles.value = viewRoles.value.filter(r => r !== roleId);
      } else {
        viewRoles.value.push(roleId);
      }
    }
  } else if (type === 'edit') {
    if (roleId === 'admin') return; // Admin always permitted
    if (editRoles.value.includes(roleId)) {
      editRoles.value = editRoles.value.filter(r => r !== roleId);
    } else {
      editRoles.value.push(roleId);
    }
  }
}

function formatDate(isoStr) {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoStr;
  }
}

async function loadReports() {
  try {
    loading.value = true;
    errorMessage.value = '';
    const res = await fetchReports(store.currentUser?.username || 'admin');
    if (res.success) {
      reports.value = res.reports || [];
    }
  } catch (err) {
    errorMessage.value = `Error al cargar reportes: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) {
    loadReports();
    feedback.value = '';
    errorMessage.value = '';
    reportName.value = store.activeTable?.title ? `Informe: ${store.activeTable.title}` : '';
    reportDescription.value = '';
    isPreliminary.value = store.isAdmin;
  }
});

async function handleSave() {
  if (!reportName.value.trim()) {
    alert('Ingresa un nombre para el informe');
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = '';

    const payload = {
      name: reportName.value.trim(),
      description: reportDescription.value.trim(),
      isPreliminary: store.isAdmin ? isPreliminary.value : false,
      sourceId: store.activeSourceId || 'demo',
      sourceName: store.sourceName || 'Demo Ventas Globales',
      sourceType: 'demo',
      tableStyle: store.activeTable.tableStyle || 'classic_grid',
      chartType: store.activeChart.chartType || store.chartStyle || 'bar_vertical',
      slice: store.activeTable.slice,
      conditionalRules: store.conditionalRules,
      kpis: store.kpis || [],
      viewRoles: viewRoles.value.length > 0 ? viewRoles.value : ['*'],
      editRoles: editRoles.value.length > 0 ? editRoles.value : ['admin'],
      username: store.currentUser?.username || 'admin'
    };

    const res = await saveReport(payload);
    if (res.success) {
      feedback.value = isPreliminary.value
        ? '¡Informe Preliminar Oficial guardado con éxito con permisos RBAC configurados!'
        : '¡Vista guardada con éxito!';
      reportName.value = '';
      reportDescription.value = '';
      if (res.report) {
        store.currentLoadedReport = res.report;
      }
      await loadReports();
    }
  } catch (err) {
    errorMessage.value = `Error al guardar: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

async function handleSaveCurrentChanges() {
  try {
    loading.value = true;
    errorMessage.value = '';
    const updated = await store.saveLoadedReportChanges();
    feedback.value = `¡Cambios guardados en "${updated.name}" exitosamente!`;
    await loadReports();
  } catch (err) {
    errorMessage.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleDelete(reportId) {
  if (!window.confirm('¿Seguro que deseas eliminar este informe guardado?')) return;
  try {
    loading.value = true;
    errorMessage.value = '';
    await deleteReport(reportId, store.currentUser?.username || 'admin');
    if (store.currentLoadedReport?.id === reportId) {
      store.clearLoadedReport();
    }
    feedback.value = 'Informe eliminado correctamente.';
    await loadReports();
  } catch (err) {
    errorMessage.value = `Error al eliminar: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

function handleLoad(rep) {
  store.loadReport(rep);
  close();
}
</script>
