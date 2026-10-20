<template>
  <aside class="app-sidebar">
    <!-- 1. Brand & Platform Identity -->
    <div class="sidebar-brand-box">
      <div class="brand">
        <img
          v-if="store.branding?.logoUrl"
          :src="store.branding.logoUrl"
          :alt="store.branding.companyName || 'Company Logo'"
          style="max-height: 36px; max-width: 140px; object-fit: contain; border-radius: 4px; background: white; padding: 2px 6px;"
        />
        <div v-else class="brand-logo">FA</div>

        <div style="display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="brand-title">{{ store.branding?.companyName || 'flex_analytics' }}</span>
            <span class="brand-badge">PRO v1.5</span>
          </div>
          <span v-if="store.branding?.subtitle" style="font-size: 10px; color: #94a3b8; line-height: 1.2;">
            {{ store.branding.subtitle }}
          </span>
        </div>
      </div>
    </div>

    <!-- 2. DATOS DE LOGUEO A LA IZQUIERDA -->
    <div class="sidebar-user-card">
      <div style="display: flex; align-items: center; gap: 10px;">
        <!-- Avatar with online indicator -->
        <div class="user-avatar-circle">
          <span>{{ userInitials }}</span>
          <span class="user-status-dot" title="En línea" />
        </div>

        <div style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
          <span style="font-size: 12px; color: #f8fafc; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            {{ store.currentUser?.name || 'Usuario' }}
          </span>
          <span style="font-size: 10px; color: #94a3b8;">
            @{{ store.currentUser?.username || 'user' }}
          </span>
        </div>

        <span
          class="user-role-badge"
          :style="{
            background: store.isAdmin ? '#fef3c7' : '#e0e7ff',
            color: store.isAdmin ? '#92400e' : '#3730a3'
          }"
        >
          {{ store.isAdmin ? 'ADMIN' : 'ANALISTA' }}
        </span>
      </div>

      <!-- User action buttons -->
      <div style="display: flex; gap: 6px; margin-top: 10px;">
        <button
          v-if="store.isAdmin"
          type="button"
          class="btn-user-action btn-admin-action"
          @click="store.isAdminPanelOpen = true"
          title="Administrar usuarios, roles, catálogo y marca"
        >
          ⚙️ Panel Admin
        </button>

        <button
          type="button"
          class="btn-user-action btn-logout-action"
          @click="store.logout()"
          title="Cerrar sesión"
        >
          🚪 Salir
        </button>
      </div>
    </div>

    <!-- 3. MENÚ DE LAS OPCIONES (DEBAJO DEL LOGUEO) -->
    <div class="sidebar-nav-scroll">
      <!-- CATEGORY 1: VISTAS DEL LIENZO -->
      <div class="sidebar-nav-group">
        <div class="nav-group-title">Vistas de Análisis</div>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <button
            type="button"
            class="nav-item"
            :class="{ active: store.currentView === 'combined' }"
            @click="store.currentView = 'combined'"
          >
            <span class="nav-icon">🖥️</span>
            <span class="nav-label">Dashboard 360°</span>
            <span v-if="store.currentView === 'combined'" class="nav-active-pip" />
          </button>

          <button
            type="button"
            class="nav-item"
            :class="{ active: store.currentView === 'grid' }"
            @click="store.currentView = 'grid'"
          >
            <span class="nav-icon">📊</span>
            <span class="nav-label">Tablas Dinámicas</span>
            <span class="nav-count-badge">{{ store.tables.length }}</span>
          </button>

          <button
            type="button"
            class="nav-item"
            :class="{ active: store.currentView === 'chart' }"
            @click="store.currentView = 'chart'"
          >
            <span class="nav-icon">📈</span>
            <span class="nav-label">Gráficos Analíticos</span>
            <span class="nav-count-badge">{{ store.charts.length }}</span>
          </button>
        </div>
      </div>

      <!-- CATEGORY 2: HERRAMIENTAS & CONFIGURACIÓN -->
      <div class="sidebar-nav-group">
        <div class="nav-group-title">Herramientas Analíticas</div>
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <!-- Data Source Control -->
          <!-- Conexiones a Fuentes de Datos (Generar, Guardar y Conectar) -->
          <button
            type="button"
            class="nav-item"
            @click="store.isSourceModalOpen = true"
          >
            <span class="nav-icon">🔌</span>
            <span class="nav-label">Conexiones a Datos</span>
            <span class="nav-count-badge">{{ store.availableSources.length }}</span>
          </button>

          <!-- Quick Selector for active connection -->
          <div v-if="!store.isAdmin" class="nav-source-select-box">
            <span style="font-size: 10.5px; color: #38bdf8; font-weight: 600;">📊 Fuente Asignada:</span>
            <select
              class="input-control"
              style="background: #1e293b; color: #f8fafc; border-color: #475569; font-size: 11px; padding: 4px 6px; width: 100%; margin-top: 3px;"
              :value="store.activeSourceId"
              @change="store.switchAssignedSource($event.target.value)"
            >
              <option v-for="s in store.userPermittedSources" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
              <option v-if="store.userPermittedSources.length === 0" value="">
                Sin fuentes asignadas
              </option>
            </select>
          </div>

          <button
            type="button"
            class="nav-item"
            @click="store.isReportsModalOpen = true"
          >
            <span class="nav-icon">📁</span>
            <span class="nav-label">Gestor de Reportes</span>
          </button>

          <button
            type="button"
            class="nav-item"
            @click="store.isConditionalModalOpen = true"
          >
            <span class="nav-icon">🎨</span>
            <span class="nav-label">Semáforos / Alertas</span>
            <span v-if="store.conditionalRules.length > 0" class="nav-count-badge green">
              {{ store.conditionalRules.length }}
            </span>
          </button>

          <button
            type="button"
            class="nav-item"
            :class="{ 'nav-item-highlight': store.isSidebarOpen }"
            @click="store.isSidebarOpen = !store.isSidebarOpen"
          >
            <span class="nav-icon">📑</span>
            <span class="nav-label">Panel de Campos</span>
            <span style="font-size: 10px; color: #38bdf8;">
              {{ store.isSidebarOpen ? 'Visible ✓' : 'Oculto' }}
            </span>
          </button>

          <button
            type="button"
            class="nav-item"
            @click="toggleCurrency"
          >
            <span class="nav-icon">💵</span>
            <span class="nav-label">Formato de Moneda</span>
            <span style="font-size: 10px; font-weight: 600; color: #a5f3fc;">
              {{ store.activeTable.currencyFormat ? 'COP ($)' : 'Num' }}
            </span>
          </button>
        </div>
      </div>

      <!-- CATEGORY 3: ESTILOS VISUALES -->
      <div class="sidebar-nav-group">
        <div class="nav-group-title">Estilos & Personalización</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Table Style Dropdown -->
          <div class="nav-dropdown-item">
            <span class="dropdown-label">Estilo de Tabla:</span>
            <select
              class="input-control nav-select"
              :value="store.activeTable.tableStyle"
              @change="store.activeTable.tableStyle = $event.target.value"
            >
              <option v-for="ts in store.permittedTableStyles" :key="ts.id" :value="ts.id">
                {{ ts.name }}
              </option>
            </select>
          </div>

          <!-- Chart Style Dropdown -->
          <div class="nav-dropdown-item">
            <span class="dropdown-label">Tipo de Gráfico:</span>
            <select
              class="input-control nav-select"
              :value="store.chartStyle"
              @change="onChartStyleChange($event.target.value)"
            >
              <option v-for="cs in store.permittedChartStyles" :key="cs.id" :value="cs.id">
                {{ cs.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- CATEGORY 4: EXPORTACIÓN -->
      <div class="sidebar-nav-group">
        <div class="nav-group-title">Exportar Datos</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;">
          <button
            type="button"
            class="btn-export-mini"
            @click="store.exportCSV()"
            title="Exportar a CSV"
          >
            <span>📥 CSV</span>
          </button>
          <button
            type="button"
            class="btn-export-mini"
            @click="store.exportJSON()"
            title="Exportar a JSON"
          >
            <span>💾 JSON</span>
          </button>
          <button
            type="button"
            class="btn-export-mini"
            @click="store.printView()"
            title="Imprimir o exportar PDF"
          >
            <span>🖨️ PDF</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 4. Sidebar Status Footer -->
    <div class="sidebar-footer-box">
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94a3b8;">
        <span>Fuente:</span>
        <span style="color: #38bdf8; font-weight: 600; text-align: right; overflow: hidden; text-overflow: ellipsis; max-width: 150px; white-space: nowrap;">
          {{ store.sourceName }}
        </span>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94a3b8; margin-top: 3px;">
        <span>Filas analizadas:</span>
        <span style="color: #f8fafc; font-weight: 700;">
          {{ new Intl.NumberFormat('es-CO').format(store.recordCount) }}
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

const userInitials = computed(() => {
  const name = store.currentUser?.name || 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

function toggleCurrency() {
  store.activeTable.currencyFormat = !store.activeTable.currencyFormat;
}

function onChartStyleChange(styleId) {
  store.chartStyle = styleId;
  store.activeChart.chartType = styleId;
}
</script>
