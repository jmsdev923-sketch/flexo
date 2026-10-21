<template>
  <aside class="fields-sidebar">
    <!-- 1. Header with Connection Status & Toggle -->
    <div class="sidebar-top-section">
      <div class="sidebar-header-row">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">📑</span>
          <span class="sidebar-main-title">Campos & Zonas</span>
        </div>
        <button
          type="button"
          class="btn-close-sidebar"
          @click="store.isSidebarOpen = false"
          title="Ocultar panel lateral"
        >
          ×
        </button>
      </div>

      <!-- Source Connection Status Card -->
      <div v-if="store.fields.length > 0" class="connected-source-badge">
        <div class="source-info-line">
          <span class="live-dot-pulse" />
          <strong class="source-connected-name" :title="store.sourceName">
            {{ store.sourceName }}
          </strong>
        </div>
        <div class="source-meta-row">
          <span class="meta-pill">📊 {{ store.fields.length }} campos</span>
          <span class="meta-pill">📋 {{ new Intl.NumberFormat('es-CO').format(store.recordCount) }} filas</span>
          <button
            type="button"
            class="btn-switch-source"
            @click="store.isSourceModalOpen = true"
            title="Cambiar o configurar conexión"
          >
            ⚡ Cambiar
          </button>
        </div>
      </div>

      <!-- Disconnected State Banner -->
      <div v-else class="disconnected-source-badge">
        <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
          ⚠️ Sin fuente de datos conectada
        </div>
        <button
          type="button"
          class="btn btn-primary"
          style="width: 100%; font-size: 11px; padding: 6px; justify-content: center; font-weight: 600;"
          @click="store.isSourceModalOpen = true"
        >
          🔌 Conectar Fuente o Excel
        </button>
      </div>
    </div>

    <!-- 2. The 3 Primary Creation Buttons (Tabla, KPI, Gráfico) -->
    <div class="creator-buttons-grid">
      <button
        type="button"
        class="creator-btn table-creator"
        @click="handleCreateTable"
        title="Crear una nueva tabla dinámica"
      >
        <span class="btn-icon">📊</span>
        <span class="btn-text">+ Crear Tabla</span>
      </button>

      <button
        type="button"
        class="creator-btn kpi-creator"
        @click="handleCreateKpi"
        title="Crear una nueva tarjeta de indicador KPI"
      >
        <span class="btn-icon">🎯</span>
        <span class="btn-text">+ Crear KPI</span>
      </button>

      <button
        type="button"
        class="creator-btn chart-creator"
        @click="handleCreateChart"
        title="Crear un nuevo gráfico analítico"
      >
        <span class="btn-icon">📈</span>
        <span class="btn-text">+ Crear Gráfico</span>
      </button>
    </div>

    <!-- 3. Category Filter Tabs & Search -->
    <div class="fields-filter-toolbar">
      <div class="category-tabs-bar">
        <button
          type="button"
          class="cat-tab-btn"
          :class="{ active: activeCategory === 'all' }"
          @click="activeCategory = 'all'"
        >
          Todos ({{ store.fields.length }})
        </button>
        <button
          type="button"
          class="cat-tab-btn"
          :class="{ active: activeCategory === 'dims' }"
          @click="activeCategory = 'dims'"
        >
          Dimensiones ({{ dimensionCount }})
        </button>
        <button
          type="button"
          class="cat-tab-btn"
          :class="{ active: activeCategory === 'nums' }"
          @click="activeCategory = 'nums'"
        >
          Métricas ({{ metricCount }})
        </button>
      </div>

      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Buscar campos..."
          class="field-search-input"
          v-model="searchTerm"
        />
        <button
          v-if="searchTerm"
          type="button"
          class="search-clear-btn"
          @click="searchTerm = ''"
        >
          ×
        </button>
      </div>
    </div>

    <!-- 4. Available Fields Aesthetic Scrollable List -->
    <div class="fields-scroll-list">
      <div
        v-for="field in filteredFields"
        :key="field.name"
        class="field-aesthetic-card draggable-item"
        :class="field.type === 'number' ? 'field-metric' : 'field-dimension'"
        draggable="true"
        @dragstart="handleDragStart($event, { name: field.name, type: field.type, sourceZone: 'available' })"
        title="Arrastra este campo a Filas, Columnas o Valores"
      >
        <div class="field-info-side">
          <span class="drag-grip">⠿</span>
          <span
            class="field-type-pill"
            :class="field.type === 'number' ? 'type-num' : (isDateField(field.name) ? 'type-date' : 'type-str')"
          >
            {{ field.type === 'number' ? '#' : (isDateField(field.name) ? '📅' : 'Aa') }}
          </span>
          <span class="field-title" :title="field.name">
            {{ field.name }}
          </span>
        </div>

        <!-- Quick Insertion Buttons -->
        <div class="field-actions-side">
          <!-- Text / Date Dimensions: Add to Rows or Columns -->
          <template v-if="field.type !== 'number'">
            <button
              type="button"
              class="quick-add-btn dim"
              title="Añadir a Filas"
              @click="addFieldToZone('rows', field)"
            >
              + Fila
            </button>
            <button
              type="button"
              class="quick-add-btn dim"
              title="Añadir a Columnas"
              @click="addFieldToZone('columns', field)"
            >
              + Col
            </button>
          </template>

          <!-- Numbers / Measures: Add to Values or Create KPI directly -->
          <template v-else>
            <button
              type="button"
              class="quick-add-btn num"
              title="Añadir a Métricas / Valores"
              @click="addFieldToZone('measures', field)"
            >
              + Valor
            </button>
            <button
              type="button"
              class="quick-add-btn kpi-btn"
              title="Crear tarjeta KPI directa de este campo"
              @click="handleQuickKpiFromField(field)"
            >
              🎯 KPI
            </button>
          </template>
        </div>
      </div>

      <div v-if="filteredFields.length === 0" class="empty-fields-message">
        <span style="font-size: 20px;">🔍</span>
        <span>No se encontraron campos que coincidan.</span>
      </div>
    </div>

    <!-- 5. Interactive Pivot Drop Zones for Active Target -->
    <div class="pivot-zones-panel">
      <div class="zones-header-row">
        <div>
          <span class="zones-title">Zonas de Arrastre</span>
          <span style="font-size: 10px; color: #64748b; margin-left: 4px;">
            ({{ activeTargetTitle }})
          </span>
        </div>
        <button
          type="button"
          class="btn-clear-zones"
          @click="clearActiveSlice"
          title="Limpiar todas las zonas"
        >
          Limpiar
        </button>
      </div>

      <div class="zones-scroll-wrap">
        <!-- ZONE: ROWS -->
        <div
          class="drop-zone-box"
          :class="{ 'drag-over': dragOverZone === 'rows' }"
          @dragover.prevent="handleDragOver('rows')"
          @dragleave="handleDragLeave('rows')"
          @drop.prevent="handleDrop('rows')"
        >
          <div class="zone-bar-title">
            <span>↓ Filas ({{ currentSlice.rows?.length || 0 }})</span>
            <span class="zone-role-pill">Jerarquía</span>
          </div>
          <div class="zone-chips-container">
            <div
              v-for="r in currentSlice.rows"
              :key="r"
              class="zone-chip draggable-chip"
              draggable="true"
              @dragstart="handleDragStart($event, { name: r, sourceZone: 'rows' })"
            >
              <span class="chip-grip">⠿</span>
              <span class="chip-label">{{ r }}</span>
              <button
                type="button"
                class="chip-close-btn"
                @click="removeFieldFromZone('rows', r)"
              >
                ×
              </button>
            </div>
            <span v-if="!currentSlice.rows || currentSlice.rows.length === 0" class="empty-zone-hint">
              Suelta dimensiones de fila aquí
            </span>
          </div>
        </div>

        <!-- ZONE: COLUMNS -->
        <div
          class="drop-zone-box"
          :class="{ 'drag-over': dragOverZone === 'columns' }"
          @dragover.prevent="handleDragOver('columns')"
          @dragleave="handleDragLeave('columns')"
          @drop.prevent="handleDrop('columns')"
        >
          <div class="zone-bar-title">
            <span>↔ Columnas ({{ currentSlice.columns?.length || 0 }})</span>
            <span class="zone-role-pill">Pivote</span>
          </div>
          <div class="zone-chips-container">
            <div
              v-for="c in currentSlice.columns"
              :key="c"
              class="zone-chip draggable-chip"
              draggable="true"
              @dragstart="handleDragStart($event, { name: c, sourceZone: 'columns' })"
            >
              <span class="chip-grip">⠿</span>
              <span class="chip-label">{{ c }}</span>
              <button
                type="button"
                class="chip-close-btn"
                @click="removeFieldFromZone('columns', c)"
              >
                ×
              </button>
            </div>
            <span v-if="!currentSlice.columns || currentSlice.columns.length === 0" class="empty-zone-hint">
              Suelta columnas aquí
            </span>
          </div>
        </div>

        <!-- ZONE: MEASURES -->
        <div
          class="drop-zone-box"
          :class="{ 'drag-over': dragOverZone === 'measures' }"
          @dragover.prevent="handleDragOver('measures')"
          @dragleave="handleDragLeave('measures')"
          @drop.prevent="handleDrop('measures')"
        >
          <div class="zone-bar-title">
            <span>∑ Valores ({{ currentSlice.measures?.length || 0 }})</span>
            <span class="zone-role-pill metric">Cálculo</span>
          </div>
          <div class="zone-chips-container">
            <div
              v-for="(m, idx) in currentSlice.measures"
              :key="`${m.field}-${idx}`"
              class="zone-chip measure draggable-chip"
              draggable="true"
              @dragstart="handleDragStart($event, { name: m.field, sourceZone: 'measures' })"
            >
              <span class="chip-grip">⠿</span>
              <span class="chip-label">{{ m.caption || m.field }}</span>
              <select
                class="zone-agg-dropdown"
                :value="m.aggregation || 'sum'"
                @change="updateMeasureAggregation(idx, $event.target.value)"
              >
                <option v-for="opt in aggOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
              <button
                type="button"
                class="chip-close-btn"
                @click="removeFieldFromZone('measures', m.field)"
              >
                ×
              </button>
            </div>
            <span v-if="!currentSlice.measures || currentSlice.measures.length === 0" class="empty-zone-hint">
              Suelta valores numéricos aquí
            </span>
          </div>
        </div>

        <!-- ZONE: FILTERS -->
        <div
          class="drop-zone-box"
          :class="{ 'drag-over': dragOverZone === 'filters' }"
          @dragover.prevent="handleDragOver('filters')"
          @dragleave="handleDragLeave('filters')"
          @drop.prevent="handleDrop('filters')"
        >
          <div class="zone-bar-title">
            <span>🔍 Filtros ({{ currentSlice.filters?.length || 0 }})</span>
            <span class="zone-role-pill">Filtro</span>
          </div>
          <div class="zone-chips-container">
            <div
              v-for="f in currentSlice.filters"
              :key="f.field"
              class="zone-chip filter draggable-chip"
              draggable="true"
              @dragstart="handleDragStart($event, { name: f.field, sourceZone: 'filters' })"
            >
              <span class="chip-grip">⠿</span>
              <span class="chip-label">{{ f.field }}</span>
              <button
                type="button"
                class="chip-gear-btn"
                title="Configurar filtro"
                @click="store.filterModalField = f.field"
              >
                ⚙️
              </button>
              <button
                type="button"
                class="chip-close-btn"
                @click="removeFieldFromZone('filters', f.field)"
              >
                ×
              </button>
            </div>
            <span v-if="!currentSlice.filters || currentSlice.filters.length === 0" class="empty-zone-hint">
              Suelta filtros aquí
            </span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

const searchTerm = ref('');
const activeCategory = ref('all'); // 'all' | 'dims' | 'nums'
const dragOverZone = ref(null);

const aggOptions = [
  { id: 'sum', label: '➕ Sumar' },
  { id: 'avg', label: '➗ Promedio' },
  { id: 'max', label: '📈 Máximo' },
  { id: 'min', label: '📉 Mínimo' },
  { id: 'count', label: '🔢 Contar' },
  { id: 'distinct_count', label: '≠ Únicos' }
];

const dimensionCount = computed(() => {
  return (store.fields || []).filter(f => f.type !== 'number').length;
});

const metricCount = computed(() => {
  return (store.fields || []).filter(f => f.type === 'number').length;
});

const filteredFields = computed(() => {
  const query = searchTerm.value.toLowerCase().trim();
  let list = store.fields || [];

  if (activeCategory.value === 'dims') {
    list = list.filter(f => f.type !== 'number');
  } else if (activeCategory.value === 'nums') {
    list = list.filter(f => f.type === 'number');
  }

  if (!query) return list;
  return list.filter(f => f.name.toLowerCase().includes(query));
});

function isDateField(fieldName) {
  return /fecha|date|dia|mes|year|ano|periodo|time/i.test(fieldName);
}

const isChartMode = computed(() => {
  if (store.currentView === 'chart') return true;
  if (store.currentView === 'grid') return false;
  return store.lastFocusedWidgetType === 'chart';
});

const activeTargetTitle = computed(() => {
  return isChartMode.value ? store.activeChart.title : store.activeTable.title;
});

const currentSlice = computed(() => {
  return isChartMode.value ? store.activeChart.slice : store.activeTable.slice;
});

// Creator Button Handlers
function handleCreateTable() {
  store.addTable('blank');
  if (store.currentView !== 'combined') {
    store.currentView = 'grid';
  }
}

function handleCreateKpi() {
  store.preselectedKpiField = null;
  store.isCreateKpiModalOpen = true;
}

function handleCreateChart() {
  store.addChart('blank');
  if (store.currentView !== 'combined') {
    store.currentView = 'chart';
  }
}

function handleQuickKpiFromField(field) {
  store.preselectedKpiField = field.name;
  store.isCreateKpiModalOpen = true;
}

// Drag & Drop
function handleDragStart(e, itemData) {
  e.dataTransfer.setData('application/json', JSON.stringify(itemData));
  e.dataTransfer.setData('text/plain', itemData.name);
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(zoneName) {
  dragOverZone.value = zoneName;
}

function handleDragLeave(zoneName) {
  if (dragOverZone.value === zoneName) {
    dragOverZone.value = null;
  }
}

function updateSlice(newSlice) {
  if (isChartMode.value) {
    store.computePivotForChart(store.activeChartId, newSlice);
  } else {
    store.computePivotForTable(store.activeTableId, newSlice);
  }
}

function handleDrop(targetZone) {
  dragOverZone.value = null;
  const event = window.event;
  if (!event || !event.dataTransfer) return;

  const raw = event.dataTransfer.getData('application/json');
  if (!raw) return;

  try {
    const item = JSON.parse(raw);
    const { name, type, sourceZone } = item;

    let nextRows = [...(currentSlice.value.rows || [])];
    let nextColumns = [...(currentSlice.value.columns || [])];
    let nextMeasures = [...(currentSlice.value.measures || [])];
    let nextFilters = [...(currentSlice.value.filters || [])];

    if (sourceZone === 'rows') nextRows = nextRows.filter(r => r !== name);
    if (sourceZone === 'columns') nextColumns = nextColumns.filter(c => c !== name);
    if (sourceZone === 'measures') nextMeasures = nextMeasures.filter(m => m.field !== name);
    if (sourceZone === 'filters') nextFilters = nextFilters.filter(f => f.field !== name);

    if (targetZone === 'rows' && !nextRows.includes(name)) {
      nextRows.push(name);
    } else if (targetZone === 'columns' && !nextColumns.includes(name)) {
      nextColumns.push(name);
    } else if (targetZone === 'measures' && !nextMeasures.some(m => m.field === name)) {
      nextMeasures.push({
        field: name,
        aggregation: type === 'number' ? 'sum' : 'count',
        caption: name.replace(/_/g, ' ')
      });
    } else if (targetZone === 'filters' && !nextFilters.some(f => f.field === name)) {
      nextFilters.push({ field: name, include: [] });
    }

    updateSlice({
      ...currentSlice.value,
      rows: nextRows,
      columns: nextColumns,
      measures: nextMeasures,
      filters: nextFilters
    });
  } catch (err) {
    console.error('Drop error in FieldsPanel:', err);
  }
}

function addFieldToZone(zoneName, field) {
  const slice = currentSlice.value;
  if (zoneName === 'rows' && !slice.rows?.includes(field.name)) {
    updateSlice({ ...slice, rows: [...(slice.rows || []), field.name] });
  } else if (zoneName === 'columns' && !slice.columns?.includes(field.name)) {
    updateSlice({ ...slice, columns: [...(slice.columns || []), field.name] });
  } else if (zoneName === 'measures') {
    if (!slice.measures?.some(m => m.field === field.name)) {
      updateSlice({
        ...slice,
        measures: [
          ...(slice.measures || []),
          {
            field: field.name,
            aggregation: field.type === 'number' ? 'sum' : 'count',
            caption: field.name.replace(/_/g, ' ')
          }
        ]
      });
    }
  }
}

function removeFieldFromZone(zoneName, fieldName) {
  const slice = currentSlice.value;
  if (zoneName === 'rows') {
    updateSlice({ ...slice, rows: (slice.rows || []).filter(r => r !== fieldName) });
  } else if (zoneName === 'columns') {
    updateSlice({ ...slice, columns: (slice.columns || []).filter(c => c !== fieldName) });
  } else if (zoneName === 'measures') {
    updateSlice({ ...slice, measures: (slice.measures || []).filter(m => m.field !== fieldName) });
  } else if (zoneName === 'filters') {
    updateSlice({ ...slice, filters: (slice.filters || []).filter(f => f.field !== fieldName) });
  }
}

function updateMeasureAggregation(index, newAgg) {
  const measures = [...(currentSlice.value.measures || [])];
  if (measures[index]) {
    measures[index] = { ...measures[index], aggregation: newAgg };
    updateSlice({ ...currentSlice.value, measures });
  }
}

function clearActiveSlice() {
  if (isChartMode.value) {
    store.clearChart(store.activeChartId);
  } else {
    store.clearTable(store.activeTableId);
  }
}
</script>

<style scoped>
.fields-sidebar {
  width: 310px;
  min-width: 310px;
  max-width: 310px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
  user-select: none;
}

/* 1. Header & Source Badge */
.sidebar-top-section {
  padding: 12px 14px 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafafa;
}

.sidebar-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sidebar-main-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.btn-close-sidebar {
  background: none;
  border: none;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.btn-close-sidebar:hover {
  color: #0f172a;
}

.connected-source-badge {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.source-info-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.live-dot-pulse {
  width: 7px;
  height: 7px;
  background: #10b981;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
}

.source-connected-name {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-pill {
  font-size: 10px;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
}

.btn-switch-source {
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #2563eb;
  padding: 1px 6px;
  margin-left: auto;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-switch-source:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.disconnected-source-badge {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 8px 10px;
}

/* 2. Primary 3 Creation Buttons */
.creator-buttons-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 10px 12px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.creator-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s ease;
}

.creator-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-icon {
  font-size: 15px;
}

.btn-text {
  font-size: 10.5px;
  font-weight: 700;
  color: #334155;
}

.table-creator:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.table-creator:hover .btn-text {
  color: #1d4ed8;
}

.kpi-creator:hover {
  border-color: #10b981;
  background: #ecfdf5;
}

.kpi-creator:hover .btn-text {
  color: #047857;
}

.chart-creator:hover {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.chart-creator:hover .btn-text {
  color: #6d28d9;
}

/* 3. Toolbar & Tabs */
.fields-filter-toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-tabs-bar {
  display: flex;
  gap: 4px;
}

.cat-tab-btn {
  flex: 1;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 2px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}

.cat-tab-btn.active {
  background: #2563eb;
  color: white;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.field-search-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  padding: 5px 22px 5px 24px;
  font-size: 11px;
  outline: none;
  background: #f8fafc;
}

.field-search-input:focus {
  background: white;
  border-color: #2563eb;
}

.search-clear-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  font-size: 13px;
  color: #94a3b8;
  cursor: pointer;
}

/* 4. Scrollable List of Fields */
.fields-scroll-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 150px;
  max-height: 38vh;
  background: #fafafa;
}

.field-aesthetic-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.15s ease;
  cursor: grab;
}

.field-aesthetic-card:hover {
  border-color: #94a3b8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.field-metric {
  border-left: 3px solid #10b981;
}

.field-dimension {
  border-left: 3px solid #3b82f6;
}

.field-info-side {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  flex: 1;
}

.drag-grip {
  color: #cbd5e1;
  font-size: 12px;
}

.field-type-pill {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.type-num {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.type-str {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.type-date {
  background: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #ddd6fe;
}

.field-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-actions-side {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.quick-add-btn {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 3px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-add-btn.dim:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #1d4ed8;
}

.quick-add-btn.num:hover {
  background: #ecfdf5;
  border-color: #10b981;
  color: #047857;
}

.quick-add-btn.kpi-btn {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.quick-add-btn.kpi-btn:hover {
  background: #fde68a;
}

.empty-fields-message {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 11.5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

/* 5. Pivot Zones Panel */
.pivot-zones-panel {
  flex: 1;
  border-top: 1px solid #e2e8f0;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.zones-header-row {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  background: #fafafa;
}

.zones-title {
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
}

.btn-clear-zones {
  background: none;
  border: none;
  font-size: 10px;
  color: #ef4444;
  cursor: pointer;
  font-weight: 600;
}

.btn-clear-zones:hover {
  text-decoration: underline;
}

.zones-scroll-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drop-zone-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  padding: 6px 8px;
  transition: all 0.15s ease;
}

.drop-zone-box.drag-over {
  border-color: #2563eb;
  background: #eff6ff;
}

.zone-bar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
}

.zone-role-pill {
  font-size: 8.5px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: #e2e8f0;
  color: #475569;
}

.zone-role-pill.metric {
  background: #ecfdf5;
  color: #047857;
}

.zone-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 24px;
}

.zone-chip {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 600;
  color: #1e293b;
  cursor: grab;
}

.zone-chip.measure {
  border-color: #86efac;
  background: #f0fdf4;
}

.zone-chip.filter {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.chip-grip {
  color: #94a3b8;
  font-size: 10px;
}

.chip-label {
  white-space: nowrap;
}

.zone-agg-dropdown {
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  font-size: 9.5px;
  background: white;
  padding: 1px 2px;
  outline: none;
}

.chip-close-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.chip-close-btn:hover {
  color: #ef4444;
}

.chip-gear-btn {
  background: none;
  border: none;
  font-size: 10px;
  cursor: pointer;
}

.empty-zone-hint {
  font-size: 10px;
  color: #94a3b8;
  font-style: italic;
  line-height: 24px;
}
</style>
