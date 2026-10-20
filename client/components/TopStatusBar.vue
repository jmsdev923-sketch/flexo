<template>
  <header class="top-status-bar">
    <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
      <!-- Toggle fields panel button -->
      <button
        type="button"
        class="btn-toggle-fields"
        :class="{ active: store.isSidebarOpen }"
        @click="store.isSidebarOpen = !store.isSidebarOpen"
        title="Mostrar u ocultar el panel de campos y zonas pivot"
      >
        <span>📑</span>
        <span>Campos</span>
      </button>

      <div style="height: 18px; width: 1px; background-color: #e2e8f0;" />

      <!-- Breadcrumb / Active view title -->
      <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
        <span style="font-size: 13px; font-weight: 700; color: #0f172a;">
          {{ currentViewTitle }}
        </span>
        <span style="font-size: 11px; color: #64748b;">•</span>
        <span style="font-size: 11.5px; color: #2563eb; font-weight: 600;">
          {{ store.sourceName }}
        </span>
        <span style="font-size: 11px; color: #64748b;">
          ({{ new Intl.NumberFormat('es-CO').format(store.recordCount) }} filas)
        </span>
      </div>

      <!-- Active Loaded Report Banner -->
      <div
        v-if="store.currentLoadedReport"
        style="display: flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 2px 8px; border-radius: 6px; max-width: 320px;"
      >
        <span style="font-size: 11px;">📌</span>
        <span
          style="font-size: 11px; font-weight: 700; color: #166534; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
          :title="store.currentLoadedReport.name"
        >
          {{ store.currentLoadedReport.name }}
        </span>

        <span
          v-if="store.currentLoadedReport.isPreliminary"
          style="background: #dbeafe; color: #1e40af; font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 3px;"
          title="Informe preliminar oficial configurado por el Administrador"
        >
          PRELIMINAR
        </span>

        <span
          style="font-size: 9.5px; font-weight: 700; padding: 1px 5px; border-radius: 3px;"
          :style="{
            background: store.canEditLoadedReport ? '#dcfce7' : '#fef3c7',
            color: store.canEditLoadedReport ? '#166534' : '#92400e'
          }"
        >
          {{ store.canEditLoadedReport ? '✏️ Edición' : '🔒 Solo Lectura' }}
        </span>

        <button
          v-if="store.canEditLoadedReport"
          type="button"
          class="btn btn-primary"
          style="font-size: 10px; padding: 1px 6px; height: 20px; line-height: 1;"
          :disabled="isSaving"
          @click="handleQuickSave"
          title="Guardar modificaciones hechas sobre este informe"
        >
          {{ isSaving ? '⏳' : '💾' }}
        </button>

        <button
          type="button"
          style="background: none; border: none; font-size: 10px; color: #94a3b8; cursor: pointer; padding: 0 2px;"
          @click="store.clearLoadedReport()"
          title="Cerrar informe activo"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Quick Creator Buttons Bar in Header -->
    <div class="top-creator-buttons">
      <button
        type="button"
        class="top-creator-btn btn-table"
        @click="store.addTable('blank'); store.currentView = 'grid';"
        title="Crear una nueva tabla dinámica desde cero"
      >
        <span>📊</span>
        <span>+ Tabla</span>
      </button>

      <button
        type="button"
        class="top-creator-btn btn-kpi"
        @click="store.preselectedKpiField = null; store.isCreateKpiModalOpen = true;"
        title="Crear una nueva tarjeta KPI"
      >
        <span>🎯</span>
        <span>+ KPI</span>
      </button>

      <button
        type="button"
        class="top-creator-btn btn-chart"
        @click="store.addChart('blank'); store.currentView = 'chart';"
        title="Crear un nuevo gráfico analítico desde cero"
      >
        <span>📈</span>
        <span>+ Gráfico</span>
      </button>
    </div>

    <!-- Actions to Save Progress & View Saved Boards with RBAC -->
    <div class="top-progress-actions">
      <button
        type="button"
        class="top-progress-btn btn-save-progress"
        @click="handleSaveProgress"
        title="Guardar los avances actuales de este tablero para verlos luego"
      >
        <span>💾</span>
        <span>Guardar Avance</span>
      </button>

      <button
        type="button"
        class="top-progress-btn btn-open-reports"
        @click="store.isReportsModalOpen = true"
        title="Abrir tableros e informes guardados (según permisos)"
      >
        <span>📂</span>
        <span>Tableros Guardados</span>
      </button>
    </div>

    <div style="display: flex; align-items: center; gap: 10px;">
      <!-- Active filters and rules count -->
      <span
        v-if="store.activeTable.slice?.filters?.length > 0"
        style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #eff6ff; color: #1e40af; font-weight: 600; border: 1px solid #bfdbfe;"
      >
        🔍 {{ store.activeTable.slice.filters.length }} filtro(s)
      </span>

      <span
        v-if="store.conditionalRules.length > 0"
        style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #f0fdf4; color: #166534; font-weight: 600; border: 1px solid #bbf7d0;"
      >
        🎨 {{ store.conditionalRules.length }} regla(s)
      </span>

      <!-- Calculating spinner indicator -->
      <div v-if="store.activeTable.loading || store.activeChart.loading" style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #d97706; font-weight: 600;">
        <span class="spin-icon">⏳</span>
        <span>Procesando...</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();
const isSaving = ref(false);

const currentViewTitle = computed(() => {
  if (store.currentView === 'combined') return '🖥️ Dashboard 360°';
  if (store.currentView === 'chart') return '📈 Gráficos Analíticos';
  return '📊 Tablas Dinámicas Multidimensionales';
});

async function handleQuickSave() {
  try {
    isSaving.value = true;
    const rep = await store.saveLoadedReportChanges();
    alert(`¡Modificaciones guardadas en "${rep.name}" con éxito!`);
  } catch (err) {
    alert(err.message);
  } finally {
    isSaving.value = false;
  }
}

function handleSaveProgress() {
  if (store.currentLoadedReport && store.canEditLoadedReport) {
    handleQuickSave();
  } else {
    store.isReportsModalOpen = true;
  }
}
</script>

<style scoped>
.top-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  gap: 16px;
  flex-shrink: 0;
}

.btn-toggle-fields {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-toggle-fields:hover,
.btn-toggle-fields.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.top-creator-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-creator-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s ease;
}

.top-creator-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-table:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.btn-kpi:hover {
  background: #ecfdf5;
  border-color: #10b981;
  color: #047857;
}

.btn-chart:hover {
  background: #f5f3ff;
  border-color: #8b5cf6;
  color: #6d28d9;
}

.top-progress-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-progress-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-save-progress {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.btn-save-progress:hover {
  background: #10b981;
  color: white;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
}

.btn-open-reports {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn-open-reports:hover {
  background: #e2e8f0;
  color: #0f172a;
  border-color: #94a3b8;
  transform: translateY(-1px);
}
</style>
