<template>
  <div class="dashboard-360-container">
    <!-- 1. Executive Dashboard Header Bar -->
    <div class="dashboard-header-bar">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">🖥️</span>
        <div>
          <h2 style="margin: 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">
            Tablero Analítico Ejecutivo (Dashboard 360°)
          </h2>
          <span style="font-size: 11px; color: #64748b;">
            Lienzo integral modelado en tiempo real con Segmentadores, KPIs, gráficos analíticos y tablas multidimensionales.
          </span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <!-- Global Filter Badge (if any active) -->
        <div v-if="activeFilterCount > 0" class="active-filters-summary">
          <span>🔍 {{ activeFilterCount }} filtro(s) activo(s)</span>
          <button
            type="button"
            class="clear-mini-btn"
            @click="store.clearAllGlobalFilters()"
            title="Limpiar todos los segmentadores y mostrar datos consolidados"
          >
            ✕ Limpiar
          </button>
        </div>

        <!-- Metric Counters -->
        <span class="dashboard-counter-pill">
          🎯 {{ store.kpis.length }} KPIs
        </span>
        <span class="dashboard-counter-pill">
          📈 {{ store.charts.length }} Gráficos
        </span>
        <span class="dashboard-counter-pill">
          📊 {{ store.tables.length }} Tablas
        </span>

        <!-- Toggle Slicers Sidebar -->
        <button
          type="button"
          class="btn btn-light"
          style="font-size: 11px; padding: 4px 10px; font-weight: 600;"
          :class="{ active: isSlicersOpen }"
          @click="isSlicersOpen = !isSlicersOpen"
          title="Mostrar u ocultar los segmentadores de datos laterales"
        >
          <span>🎛️</span>
          <span>{{ isSlicersOpen ? 'Ocultar Slicers' : 'Ver Slicers' }}</span>
        </button>

        <!-- 1-Click Executive Model Template Button -->
        <button
          type="button"
          class="btn-executive-preset"
          :disabled="isApplyingPreset"
          @click="applyExecutivePreset"
          title="Generar automáticamente el diseño de tablero comercial con KPIs, gráficos y tablas del archivo activo"
        >
          <span>⚡</span>
          <span>{{ isApplyingPreset ? 'Modelando Tablero...' : 'Cargar Modelo Ejecutivo Comercial' }}</span>
        </button>
      </div>
    </div>

    <!-- 2. Workspace Body: Slicers + Canvas -->
    <div class="dashboard-split-layout">
      <!-- A. Slicers Sidebar (Segmentadores de datos estilo PowerBI) -->
      <aside v-if="isSlicersOpen" class="dashboard-slicers-sidebar">
        <div class="slicers-sidebar-header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 14px;">🎛️</span>
            <span style="font-size: 12px; font-weight: 700; color: #1e293b;">Segmentadores</span>
          </div>
          <button
            v-if="activeFilterCount > 0"
            type="button"
            class="slicers-clear-btn"
            @click="store.clearAllGlobalFilters()"
            title="Limpiar todos los filtros"
          >
            🧹 Limpiar
          </button>
        </div>

        <div class="slicers-scroll-content">
          <!-- SLICER 1: VENDEDOR -->
          <div class="slicer-card">
            <div class="slicer-card-title">
              <span>👤 Vendedor</span>
              <span v-if="getSelectedFilter('vendedor').length > 0" class="slicer-badge-count">
                ({{ getSelectedFilter('vendedor').length }})
              </span>
            </div>
            <input
              type="text"
              class="slicer-search-input"
              placeholder="Buscar vendedor..."
              v-model="searchVendedor"
            />
            <div class="slicer-items-list">
              <button
                v-for="v in filteredVendedores"
                :key="v"
                type="button"
                class="slicer-item-chip"
                :class="{ selected: isFilterSelected('vendedor', v) }"
                @click="store.toggleGlobalFilter('vendedor', v)"
                :title="v"
              >
                <span class="slicer-check-icon">{{ isFilterSelected('vendedor', v) ? '✓' : '○' }}</span>
                <span class="slicer-chip-label">{{ v }}</span>
              </button>
            </div>
          </div>

          <!-- SLICER 2: GRUPO / CATEGORÍA -->
          <div class="slicer-card">
            <div class="slicer-card-title">
              <span>🏷️ Grupo / Categoría</span>
              <span v-if="getSelectedFilter('grupo').length > 0" class="slicer-badge-count">
                ({{ getSelectedFilter('grupo').length }})
              </span>
            </div>
            <input
              type="text"
              class="slicer-search-input"
              placeholder="Buscar categoría..."
              v-model="searchGrupo"
            />
            <div class="slicer-items-list">
              <button
                v-for="g in filteredGrupos"
                :key="g"
                type="button"
                class="slicer-item-chip"
                :class="{ selected: isFilterSelected('grupo', g) }"
                @click="store.toggleGlobalFilter('grupo', g)"
                :title="g"
              >
                <span class="slicer-check-icon">{{ isFilterSelected('grupo', g) ? '✓' : '○' }}</span>
                <span class="slicer-chip-label">{{ g }}</span>
              </button>
            </div>
          </div>

          <!-- SLICER 3: CIUDAD -->
          <div class="slicer-card">
            <div class="slicer-card-title">
              <span>📍 Ciudad</span>
              <span v-if="getSelectedFilter('ciudad').length > 0" class="slicer-badge-count">
                ({{ getSelectedFilter('ciudad').length }})
              </span>
            </div>
            <input
              type="text"
              class="slicer-search-input"
              placeholder="Buscar ciudad..."
              v-model="searchCiudad"
            />
            <div class="slicer-items-list">
              <button
                v-for="c in filteredCiudades"
                :key="c"
                type="button"
                class="slicer-item-chip"
                :class="{ selected: isFilterSelected('ciudad', c) }"
                @click="store.toggleGlobalFilter('ciudad', c)"
                :title="c"
              >
                <span class="slicer-check-icon">{{ isFilterSelected('ciudad', c) ? '✓' : '○' }}</span>
                <span class="slicer-chip-label">{{ c }}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- B. Main Canvas (KPIs + Charts + Tables) -->
      <div class="dashboard-scrollable-body">
        <!-- SECTION 1: EXECUTIVE KPI METRICS (Maintaining strict 2.2:1 aspect ratio) -->
        <section class="dashboard-section">
          <div class="section-title-row">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">🎯</span>
              <span class="section-heading">Indicadores Clave de Desempeño (KPIs)</span>
              <span class="section-count-badge">({{ store.kpis.length }})</span>
            </div>
            <span style="font-size: 11px; color: #64748b;">
              Métricas ejecutivas consolidadas en tiempo real • Relación de aspecto 2.2:1
            </span>
          </div>

          <!-- Populated State: KPI Cards Grid -->
          <div v-if="store.kpis.length > 0" class="kpi-dashboard-grid">
            <div
              v-for="kpi in store.kpis"
              :key="kpi.id"
              class="kpi-dashboard-card"
              :style="{ borderTopColor: kpi.color || '#2563eb' }"
            >
              <div class="kpi-card-header">
                <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
                  <span class="kpi-icon">{{ kpi.icon || '🎯' }}</span>
                  <span class="kpi-title" :title="kpi.title">{{ kpi.title }}</span>
                </div>

                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                  <span
                    class="kpi-agg-pill"
                    :style="{ background: (kpi.color || '#2563eb') + '18', color: kpi.color || '#2563eb' }"
                  >
                    {{ aggLabel(kpi.aggregation) }}
                  </span>
                  <button
                    type="button"
                    class="kpi-delete-btn"
                    @click.stop="store.deleteKpi(kpi.id)"
                    title="Eliminar este KPI del tablero"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div class="kpi-card-body">
                <div v-if="kpi.loading" class="kpi-loading">
                  <span class="spin-mini">⏳</span> Calculando...
                </div>
                <div v-else class="kpi-value">
                  {{ formatKpiValue(kpi.value, kpi.format) }}
                </div>
              </div>

              <div class="kpi-card-footer">
                <span class="kpi-field-tag">
                  Campo: <strong>{{ kpi.field }}</strong>
                </span>
                <span v-if="kpi.subtitle" class="kpi-subtext" :title="kpi.subtitle">
                  • {{ kpi.subtitle }}
                </span>
              </div>
            </div>

            <!-- Add New KPI card button -->
            <button
              type="button"
              class="kpi-add-card-btn"
              @click="store.isCreateKpiModalOpen = true"
              title="Crear otra tarjeta KPI para este tablero"
            >
              <span style="font-size: 20px;">➕</span>
              <span style="font-size: 11px; font-weight: 700;">+ Agregar KPI</span>
            </button>
          </div>

          <!-- Zero State for KPIs -->
          <div v-else class="dashboard-empty-card" style="padding: 18px 16px;">
            <span style="font-size: 24px;">🎯</span>
            <div style="font-size: 12px; font-weight: 600; color: #475569;">No hay tarjetas KPI en el tablero aún</div>
            <div style="font-size: 11px; color: #94a3b8;">Usa el botón superior "⚡ Cargar Modelo Ejecutivo" o "+ Crear KPI" en el panel izquierdo.</div>
          </div>
        </section>

        <!-- SECTION 2: CHARTS GRID (Maintaining strict 16:9 aspect ratio with Corporate Blue Headers) -->
        <section class="dashboard-section">
          <div class="section-title-row">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">📈</span>
              <span class="section-heading">Gráficos Analíticos</span>
              <span class="section-count-badge">({{ store.charts.length }})</span>
            </div>
            <span style="font-size: 11px; color: #64748b;">
              Relación de aspecto 16:9 preservada • Diseño geométrico adaptativo
            </span>
          </div>

          <!-- Populated State: Charts Grid -->
          <div v-if="store.charts.length > 0" class="charts-dashboard-grid">
            <div
              v-for="chr in store.charts"
              :key="chr.id"
              :id="`dash-chart-${chr.id}`"
              class="dashboard-widget-card chart-widget"
              :class="{ 'is-active-widget': chr.id === store.activeChartId }"
              @click="store.activeChartId = chr.id"
            >
              <!-- Executive Corporate Blue Header -->
              <div class="widget-executive-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 13px;">📈</span>
                  <span class="widget-header-title">{{ chr.title }}</span>
                </div>
                <span class="widget-header-tag" :class="{ current: chr.id === store.activeChartId }">
                  {{ chr.id === store.activeChartId ? '🎯 Activo' : '⚪ Seleccionar' }}
                </span>
              </div>

              <PivotChart
                :chart-id="chr.id"
                :title="chr.title"
                :slice="chr.slice"
                :chart-type="chr.chartType"
                :pivot-result="chr.result"
                :currency-format="chr.currencyFormat"
                :fields="store.fields"
                :loading="chr.loading"
                :can-delete="store.charts.length > 1"
                @title-change="store.renameChart(chr.id, $event)"
                @slice-change="store.computePivotForChart(chr.id, $event)"
                @chart-type-change="chr.chartType = $event; store.chartStyle = $event"
                @toggle-currency="chr.currencyFormat = !chr.currencyFormat"
                @clear-chart="store.clearChart($event)"
                @duplicate-chart="store.duplicateChart($event)"
                @delete-chart="store.deleteChart($event)"
              />
            </div>
          </div>

          <!-- Zero State for Charts -->
          <div v-else class="dashboard-empty-card">
            <span style="font-size: 24px;">📈</span>
            <div style="font-size: 12px; font-weight: 600; color: #475569;">No hay gráficos modelados en este tablero aún</div>
            <div style="font-size: 11px; color: #94a3b8;">Usa el botón "+ Crear Gráfico" en el panel izquierdo o carga el modelo ejecutivo.</div>
          </div>
        </section>

        <!-- SECTION 3: TABLES SECTION (Structured Grid with In-Cell Data Bars) -->
        <section class="dashboard-section">
          <div class="section-title-row">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px;">📊</span>
              <span class="section-heading">Tablas Dinámicas y Rankings</span>
              <span class="section-count-badge">({{ store.tables.length }})</span>
            </div>
            <span style="font-size: 11px; color: #64748b;">
              Cuadrículas multidimensionales y rankings con barras de datos en celda
            </span>
          </div>

          <div v-if="store.tables.length > 0" class="tables-dashboard-grid">
            <div
              v-for="tbl in store.tables"
              :key="tbl.id"
              :id="`dash-table-${tbl.id}`"
              class="dashboard-widget-card table-widget"
              :class="{ 'is-active-widget': tbl.id === store.activeTableId }"
              @click="store.activeTableId = tbl.id"
            >
              <!-- Executive Corporate Blue Header -->
              <div class="widget-executive-header">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 13px;">📊</span>
                  <span class="widget-header-title">{{ tbl.title }}</span>
                </div>
                <span class="widget-header-tag" :class="{ current: tbl.id === store.activeTableId }">
                  {{ tbl.id === store.activeTableId ? '🎯 Activa' : '⚪ Seleccionar' }}
                </span>
              </div>

              <PivotGrid
                :table-id="tbl.id"
                :title="tbl.title"
                :slice="tbl.slice"
                :pivot-result="tbl.result"
                :currency-format="tbl.currencyFormat"
                :conditional-rules="store.conditionalRules"
                :table-style="tbl.tableStyle"
                :fields="store.fields"
                :loading="tbl.loading"
                :can-delete="store.tables.length > 1"
                @title-change="store.renameTable(tbl.id, $event)"
                @slice-change="store.computePivotForTable(tbl.id, $event)"
                @table-style-change="tbl.tableStyle = $event"
                @toggle-currency="tbl.currencyFormat = !tbl.currencyFormat"
                @clear-table="store.clearTable($event)"
                @duplicate-table="store.duplicateTable($event)"
                @delete-table="store.deleteTable($event)"
              />
            </div>
          </div>

          <!-- Zero State for Tables -->
          <div v-else class="dashboard-empty-card">
            <span style="font-size: 24px;">📊</span>
            <div style="font-size: 12px; font-weight: 600; color: #475569;">No hay tablas en el tablero</div>
            <div style="font-size: 11px; color: #94a3b8;">Usa el botón "+ Crear Tabla" en el panel izquierdo o carga el modelo ejecutivo.</div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

const isSlicersOpen = ref(true);
const isApplyingPreset = ref(false);

const searchVendedor = ref('');
const searchGrupo = ref('');
const searchCiudad = ref('');

onMounted(async () => {
  // Pre-fetch distinct options for slicers
  await Promise.all([
    store.loadSlicerOptions('vendedor'),
    store.loadSlicerOptions('grupo'),
    store.loadSlicerOptions('ciudad')
  ]);
});

const activeFilterCount = computed(() => {
  return store.globalFilters.reduce((acc, f) => acc + (f.values?.length || 0), 0);
});

function getSelectedFilter(field) {
  const f = store.globalFilters.find(item => item.field === field);
  return f?.values || [];
}

function isFilterSelected(field, val) {
  const selected = getSelectedFilter(field);
  return selected.includes(val);
}

const filteredVendedores = computed(() => {
  const list = store.slicerDistinctMap['vendedor'] || [];
  if (!searchVendedor.value.trim()) return list.slice(0, 30);
  const q = searchVendedor.value.toLowerCase().trim();
  return list.filter(v => String(v).toLowerCase().includes(q)).slice(0, 30);
});

const filteredGrupos = computed(() => {
  const list = store.slicerDistinctMap['grupo'] || [];
  if (!searchGrupo.value.trim()) return list.slice(0, 30);
  const q = searchGrupo.value.toLowerCase().trim();
  return list.filter(g => String(g).toLowerCase().includes(q)).slice(0, 30);
});

const filteredCiudades = computed(() => {
  const list = store.slicerDistinctMap['ciudad'] || [];
  if (!searchCiudad.value.trim()) return list.slice(0, 30);
  const q = searchCiudad.value.toLowerCase().trim();
  return list.filter(c => String(c).toLowerCase().includes(q)).slice(0, 30);
});

async function applyExecutivePreset() {
  try {
    isApplyingPreset.value = true;
    await store.buildExecutiveSalesDashboard();
  } catch (err) {
    alert(`Error al aplicar modelo comercial: ${err.message}`);
  } finally {
    isApplyingPreset.value = false;
  }
}

function aggLabel(agg) {
  switch (agg) {
    case 'sum': return 'SUMA';
    case 'avg': return 'PROM';
    case 'max': return 'MÁX';
    case 'min': return 'MÍN';
    case 'count': return 'CONTEO';
    default: return 'VALOR';
  }
}

function formatKpiValue(val, format) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const num = Number(val);

  if (format === 'currency') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(num);
  }

  if (format === 'percent') {
    return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(num)}%`;
  }

  if (format === 'decimal') {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  // Integer / Default
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num);
}
</script>

<style scoped>
.dashboard-360-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #f1f5f9;
}

.dashboard-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  background: white;
  border-bottom: 1.5px solid #cbd5e1;
  flex-shrink: 0;
  gap: 12px;
  flex-wrap: wrap;
}

.dashboard-counter-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.active-filters-summary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #1d4ed8;
}

.clear-mini-btn {
  background: none;
  border: none;
  font-size: 10px;
  color: #ef4444;
  cursor: pointer;
  padding: 0 4px;
  font-weight: 700;
}

.clear-mini-btn:hover {
  text-decoration: underline;
}

.btn-executive-preset {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 11.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  transition: all 0.15s ease;
}

.btn-executive-preset:hover:not(:disabled) {
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}

.btn-executive-preset:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Two-column layout */
.dashboard-split-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Left Slicers Sidebar */
.dashboard-slicers-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1.5px solid #cbd5e1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.slicers-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.slicers-clear-btn {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.slicers-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slicer-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slicer-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 700;
  color: #1e293b;
}

.slicer-badge-count {
  font-size: 10px;
  color: #2563eb;
  font-weight: 800;
}

.slicer-search-input {
  width: 100%;
  padding: 3px 6px;
  font-size: 10.5px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: white;
  outline: none;
}

.slicer-search-input:focus {
  border-color: #2563eb;
}

.slicer-items-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 140px;
  overflow-y: auto;
  padding-right: 2px;
}

.slicer-item-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  font-size: 10.5px;
  color: #334155;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: all 0.12s ease;
}

.slicer-item-chip:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.slicer-item-chip.selected {
  background: #1e40af;
  color: white;
  border-color: #1e3a8a;
  font-weight: 600;
}

.slicer-check-icon {
  font-size: 10px;
  font-weight: 800;
  width: 12px;
}

.slicer-chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Right Main Canvas */
.dashboard-scrollable-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1.5px solid #cbd5e1;
}

.section-heading {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}

.section-count-badge {
  font-size: 11.5px;
  font-weight: 700;
  color: #2563eb;
}

/* KPI Dashboard Section Grid */
.kpi-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.kpi-dashboard-card {
  background: white;
  border: 1px solid #cbd5e1;
  border-top: 3.5px solid #2563eb;
  border-radius: 6px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  aspect-ratio: 2.2 / 1;
  min-height: 95px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kpi-dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.kpi-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.kpi-icon {
  font-size: 16px;
}

.kpi-title {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-agg-pill {
  font-size: 9px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.kpi-delete-btn {
  background: none;
  border: none;
  font-size: 16px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 2px;
  border-radius: 3px;
  transition: color 0.1s ease;
}

.kpi-delete-btn:hover {
  color: #ef4444;
}

.kpi-card-body {
  margin: 2px 0;
}

.kpi-value {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.15;
}

.kpi-loading {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 6px;
}

.kpi-card-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #64748b;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.kpi-field-tag {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 3px;
  color: #334155;
}

.kpi-subtext {
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-add-card-btn {
  aspect-ratio: 2.2 / 1;
  min-height: 95px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.kpi-add-card-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
  transform: translateY(-2px);
}

/* Charts & Tables Sections */
.charts-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 18px;
  align-items: start;
}

.tables-dashboard-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-widget-card {
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  transition: all 0.2s ease;
  background: white;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.dashboard-widget-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.09);
}

.dashboard-widget-card.is-active-widget {
  border-color: #2563eb;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
}

/* Signature Executive Blue Card Header */
.widget-executive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  background: linear-gradient(90deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
}

.widget-header-title {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: white;
}

.widget-header-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  color: #dbeafe;
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: all 0.15s ease;
}

.widget-header-tag.current {
  background: #ffffff;
  color: #1e3a8a;
  border-color: #ffffff;
}

.dashboard-empty-card {
  background: white;
  border: 1.5px dashed #cbd5e1;
  border-radius: 6px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}
</style>
