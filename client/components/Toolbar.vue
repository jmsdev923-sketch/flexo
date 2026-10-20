<template>
  <header class="toolbar">
    <!-- Brand & Identity with Custom Company Logo -->
    <div class="brand">
      <img
        v-if="store.branding?.logoUrl"
        :src="store.branding.logoUrl"
        :alt="store.branding.companyName || 'Company Logo'"
        style="max-height: 34px; max-width: 140px; object-fit: contain; border-radius: 4px; background: white; padding: 2px 6px;"
      />
      <div v-else class="brand-logo">FA</div>

      <div style="display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="brand-title">{{ store.branding?.companyName || 'flex_analytics' }}</span>
          <span class="brand-badge">PRO v1.5 (Nuxt 3)</span>
        </div>
        <span v-if="store.branding?.subtitle" style="font-size: 10px; color: #94a3b8; line-height: 1;">
          {{ store.branding.subtitle }}
        </span>
      </div>
    </div>

    <!-- User Session Profile & Controls -->
    <div style="display: flex; align-items: center; gap: 8px; background: #1e293b; padding: 4px 10px; border-radius: 6px; border: 1px solid #334155;">
      <div style="display: flex; flex-direction: column;">
        <span style="font-size: 11px; color: #f8fafc; font-weight: 600;">
          {{ store.currentUser?.name || 'Usuario' }}
        </span>
        <span style="font-size: 9.5px; color: #94a3b8;">
          @{{ store.currentUser?.username || 'user' }}
        </span>
      </div>

      <span
        style="font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600;"
        :style="{
          background: store.isAdmin ? '#fef3c7' : '#e0e7ff',
          color: store.isAdmin ? '#92400e' : '#3730a3'
        }"
      >
        {{ store.isAdmin ? 'ADMIN' : 'ANALISTA' }}
      </span>

      <!-- Admin Panel button - ONLY visible for Admin -->
      <button
        v-if="store.isAdmin"
        class="btn btn-secondary"
        style="padding: 3px 8px; font-size: 11px; background: #2563eb; color: white; border-color: #1d4ed8;"
        @click="store.isAdminPanelOpen = true"
        title="Administrar usuarios, asignar fuentes y configurar logo"
      >
        ⚙️ Panel Admin
      </button>

      <button
        class="btn btn-secondary"
        style="padding: 3px 8px; font-size: 11px; color: #f87171;"
        @click="store.logout()"
        title="Cerrar sesión actual"
      >
        🚪 Salir
      </button>
    </div>

    <!-- Main Actions -->
    <div class="toolbar-actions">
      <!-- SOURCE ACCESS CONTROL -->
      <button
        v-if="store.isAdmin"
        class="btn btn-primary"
        style="background: #059669; border-color: #047857;"
        @click="store.isSourceModalOpen = true"
        title="Configurar y conectar servidores y bases de datos (Exclusivo Administrador)"
      >
        <span>🔌 Configurar Fuentes</span>
      </button>

      <div
        v-else
        style="display: flex; align-items: center; gap: 5px; background: #0f172a; padding: 3px 8px; border-radius: 6px; border: 1px solid #334155;"
      >
        <span style="font-size: 11px; color: #38bdf8; font-weight: 600;">📊 Mis Fuentes:</span>
        <select
          class="input-control"
          style="background: #1e293b; color: #f8fafc; border-color: #475569; font-size: 11.5px; padding: 3px 6px;"
          :value="store.activeSourceId"
          @change="store.switchAssignedSource($event.target.value)"
          title="Fuentes autorizadas por el administrador para tu cuenta"
        >
          <option v-for="s in store.userPermittedSources" :key="s.id" :value="s.id">
            {{ s.name }}
          </option>
          <option v-if="store.userPermittedSources.length === 0" value="">
            Sin fuentes asignadas
          </option>
        </select>
      </div>

      <!-- Table Style Selector (Filtered by RBAC) -->
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 11px; color: #94a3b8;">Estilo:</span>
        <select
          class="input-control"
          style="background: #1e293b; color: #f8fafc; border-color: #334155; font-size: 11.5px; padding: 4px 8px;"
          :value="store.activeTable.tableStyle"
          @change="onTableStyleChange($event.target.value)"
          title="Estilos de tabla permitidos para tu cuenta"
        >
          <option v-for="ts in store.permittedTableStyles" :key="ts.id" :value="ts.id">
            {{ ts.name }}
          </option>
        </select>
      </div>

      <!-- Chart Style Selector (Filtered by RBAC) -->
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 11px; color: #94a3b8;">Gráfico:</span>
        <select
          class="input-control"
          style="background: #1e293b; color: #f8fafc; border-color: #334155; font-size: 11.5px; padding: 4px 8px;"
          :value="store.chartStyle"
          @change="onChartStyleChange($event.target.value)"
          title="Tipos de gráfico permitidos para tu cuenta"
        >
          <option v-for="cs in store.permittedChartStyles" :key="cs.id" :value="cs.id">
            {{ cs.name }}
          </option>
        </select>
      </div>

      <div style="height: 20px; width: 1px; background-color: #334155; margin: 0 4px;" />

      <!-- Reports & Modals -->
      <button
        class="btn btn-secondary"
        @click="store.isReportsModalOpen = true"
        title="Guardar o cargar reportes y plantillas analíticas"
      >
        <span>📁 Reportes</span>
      </button>

      <button
        class="btn btn-secondary"
        @click="store.isConditionalModalOpen = true"
        title="Definir reglas de color y formato condicional"
      >
        <span>🎨 Semáforos</span>
      </button>

      <button
        class="btn"
        :class="store.isSidebarOpen ? 'btn-active' : 'btn-secondary'"
        @click="store.isSidebarOpen = !store.isSidebarOpen"
        title="Mostrar / Ocultar panel de campos y zonas pivot"
      >
        <span>📑 Campos</span>
      </button>

      <button
        class="btn btn-secondary"
        @click="toggleCurrency"
        title="Alternar formato: Peso Colombiano (COP $) / Numérico estándar"
      >
        <span>{{ store.activeTable.currencyFormat ? '💵 COP ($)' : '🔢 (Num)' }}</span>
      </button>

      <div style="height: 20px; width: 1px; background-color: #334155; margin: 0 4px;" />

      <!-- View Switcher: Combined Dashboard vs Table vs Single Chart -->
      <div style="display: flex; gap: 2px; background: #1e293b; padding: 2px; border-radius: 6px;">
        <button
          class="btn"
          :class="store.currentView === 'combined' ? 'btn-primary' : 'btn-secondary'"
          style="padding: 5px 8px; font-size: 11.5px;"
          @click="store.currentView = 'combined'"
        >
          🖥️ 360°
        </button>
        <button
          class="btn"
          :class="store.currentView === 'grid' ? 'btn-primary' : 'btn-secondary'"
          style="padding: 5px 8px; font-size: 11.5px;"
          @click="store.currentView = 'grid'"
        >
          📊 Tabla
        </button>
        <button
          class="btn"
          :class="store.currentView === 'chart' ? 'btn-primary' : 'btn-secondary'"
          style="padding: 5px 8px; font-size: 11.5px;"
          @click="store.currentView = 'chart'"
        >
          📈 Gráfico
        </button>
      </div>

      <div style="height: 20px; width: 1px; background-color: #334155; margin: 0 4px;" />

      <!-- Export Actions -->
      <button class="btn btn-secondary" @click="store.exportCSV()" title="Exportar vista a CSV">
        <span>📥 CSV</span>
      </button>
      <button class="btn btn-secondary" @click="store.exportJSON()" title="Exportar resultado a JSON">
        <span>💾 JSON</span>
      </button>
      <button class="btn btn-secondary" @click="store.printView()" title="Imprimir / Exportar a PDF">
        <span>🖨️ PDF</span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

function onTableStyleChange(newStyle) {
  store.activeTable.tableStyle = newStyle;
}

function onChartStyleChange(newStyle) {
  store.chartStyle = newStyle;
  store.activeChart.chartType = newStyle;
}

function toggleCurrency() {
  store.activeTable.currencyFormat = !store.activeTable.currencyFormat;
}
</script>
