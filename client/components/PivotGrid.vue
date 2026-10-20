<template>
  <div class="table-container" :class="`style-${tableStyle}`" style="margin-bottom: 24px;">
    <!-- 1. Interactive Table Header & Builder Toolbar -->
    <div class="table-builder-card">
      <div class="builder-header-row">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">📊</span>
          <input
            v-if="isEditingTitle"
            type="text"
            class="builder-title-input"
            style="border: 1px solid #3b82f6; background: white;"
            v-model="tempTitle"
            autofocus
            @blur="handleTitleSubmit"
            @keydown.enter="handleTitleSubmit"
          />
          <span
            v-else
            class="builder-title-input"
            @click="isEditingTitle = true; tempTitle = title;"
            title="Haz clic para renombrar esta tabla"
            style="cursor: pointer;"
          >
            {{ title }} ✏️
          </span>
          <span style="font-size: 11px; color: #64748b;">
            ({{ rows.length }} Filas × {{ columns.length }} Cols | {{ measures.length }} Métricas)
          </span>
          <span v-if="loading" style="font-size: 11px; color: #f59e0b; font-weight: 600;">
            • Calculando...
          </span>
        </div>

        <!-- Table Actions Toolbar -->
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <button
            type="button"
            class="btn btn-light"
            style="font-size: 11px; padding: 3px 8px;"
            @click="emitToggleCurrency"
            title="Alternar formato: Peso Colombiano ($) / Numérico"
          >
            {{ currencyFormat ? '💵 COP ($)' : '🔢 Num' }}
          </button>

          <select
            class="input-control"
            style="font-size: 11px; padding: 2px 6px; height: 26px;"
            :value="tableStyle"
            @change="emitTableStyleChange($event.target.value)"
            title="Estilo visual de esta tabla"
          >
            <option value="classic_grid">Cuadrícula Clásica</option>
            <option value="striped_zebra">Filas Cebradas</option>
            <option value="clean_minimal">Minimalista</option>
            <option value="heatmap_intensity">Mapa de Calor</option>
            <option value="dark_contrast">Modo Oscuro</option>
          </select>

          <!-- View Mode: Tree vs Tabular -->
          <div style="display: flex; gap: 2px; background: #e2e8f0; padding: 2px; border-radius: 4px;">
            <button
              type="button"
              class="btn"
              :class="viewMode === 'tree' ? 'btn-primary' : 'btn-light'"
              style="padding: 2px 6px; font-size: 10px;"
              @click="viewMode = 'tree'"
              title="Vista en Árbol Jerárquico con niveles expandibles"
            >
              🌳 Árbol
            </button>
            <button
              type="button"
              class="btn"
              :class="viewMode === 'tabular' ? 'btn-primary' : 'btn-light'"
              style="padding: 2px 6px; font-size: 10px;"
              @click="viewMode = 'tabular'"
              title="Vista Tabular tradicional plana (todas las columnas de dimensiones visibles)"
            >
              📑 Tabular
            </button>
          </div>

          <!-- Tree controls (Expand / Collapse all) -->
          <div v-if="viewMode === 'tree' && rows.length > 1" style="display: flex; gap: 2px;">
            <button
              type="button"
              class="btn btn-light"
              style="font-size: 10px; padding: 2px 6px;"
              @click="expandAll"
              title="Expandir todos los nodos del árbol"
            >
              + Expandir
            </button>
            <button
              type="button"
              class="btn btn-light"
              style="font-size: 10px; padding: 2px 6px;"
              @click="collapseAll"
              title="Colapsar todos los nodos"
            >
              - Colapsar
            </button>
          </div>

          <button
            type="button"
            class="btn btn-light"
            style="font-size: 11px; padding: 3px 8px; color: #166534; font-weight: 600;"
            @click="store.isCalculatedModalOpen = true"
            title="Crear métrica calculada"
          >
            + Métrica
          </button>

          <button
            type="button"
            class="btn btn-primary"
            style="font-size: 11px; padding: 3px 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;"
            @click="handleSaveProgress"
            title="Guardar los avances de esta tabla para verlos luego"
          >
            <span>💾</span>
            <span>Guardar Avance</span>
          </button>

          <button
            type="button"
            class="btn btn-light"
            style="font-size: 11px; padding: 3px 8px;"
            @click="emitClearTable"
            title="Limpiar configuración y dejar en blanco"
          >
            🧹 Limpiar
          </button>

          <button
            type="button"
            class="btn btn-light"
            style="font-size: 11px; padding: 3px 8px;"
            @click="emitDuplicateTable"
            title="Duplicar esta tabla como una nueva pestaña"
          >
            📋 Duplicar
          </button>

          <button
            v-if="canDelete"
            type="button"
            class="btn btn-light"
            style="font-size: 11px; padding: 3px 8px; color: #ef4444;"
            @click="emitDeleteTable"
            title="Eliminar esta tabla"
          >
            🗑️
          </button>
        </div>
      </div>

      <!-- Mini Drop Zones for this Table -->
      <div class="builder-zones-strip">
        <!-- ZONE 1: ROWS -->
        <div
          class="builder-zone-box"
          :class="{ 'drag-over': dragOverZone === 'rows' }"
          @dragover.prevent="handleDragOver('rows')"
          @dragleave="handleDragLeave('rows')"
          @drop.prevent="handleDrop('rows')"
          title="Arrastra dimensiones aquí para agrupar en filas"
        >
          <div class="builder-zone-header">
            <span>↓ Filas ({{ slice.rows?.length || 0 }})</span>
            <span style="font-size: 9px; color: #94a3b8;">Jerarquía</span>
          </div>
          <div class="builder-chips-wrap">
            <div
              v-for="rName in slice.rows"
              :key="rName"
              class="builder-chip draggable-chip"
              draggable="true"
              @dragstart="handleDragStart($event, { name: rName, sourceZone: 'rows' })"
            >
              <span style="cursor: grab; color: #94a3b8;">⠿</span>
              <span>{{ rName }}</span>
              <button
                type="button"
                class="builder-chip-remove"
                @click="removeFieldFromZone('rows', rName)"
              >
                ×
              </button>
            </div>
            <span v-if="!slice.rows || slice.rows.length === 0" class="builder-placeholder">
              Suelta filas aquí
            </span>
          </div>
        </div>

        <!-- ZONE 2: COLUMNS -->
        <div
          class="builder-zone-box"
          :class="{ 'drag-over': dragOverZone === 'columns' }"
          @dragover.prevent="handleDragOver('columns')"
          @dragleave="handleDragLeave('columns')"
          @drop.prevent="handleDrop('columns')"
          title="Arrastra dimensiones aquí para crear columnas dinámicas"
        >
          <div class="builder-zone-header">
            <span>↔ Columnas ({{ slice.columns?.length || 0 }})</span>
            <span style="font-size: 9px; color: #94a3b8;">Pivote</span>
          </div>
          <div class="builder-chips-wrap">
            <div
              v-for="cName in slice.columns"
              :key="cName"
              class="builder-chip draggable-chip"
              draggable="true"
              @dragstart="handleDragStart($event, { name: cName, sourceZone: 'columns' })"
            >
              <span style="cursor: grab; color: #94a3b8;">⠿</span>
              <span>{{ cName }}</span>
              <button
                type="button"
                class="builder-chip-remove"
                @click="removeFieldFromZone('columns', cName)"
              >
                ×
              </button>
            </div>
            <span v-if="!slice.columns || slice.columns.length === 0" class="builder-placeholder">
              Suelta columnas aquí
            </span>
          </div>
        </div>

        <!-- ZONE 3: MEASURES -->
        <div
          class="builder-zone-box"
          :class="{ 'drag-over': dragOverZone === 'measures' }"
          @dragover.prevent="handleDragOver('measures')"
          @dragleave="handleDragLeave('measures')"
          @drop.prevent="handleDrop('measures')"
          title="Arrastra métricas numéricas aquí y decide el cálculo"
        >
          <div class="builder-zone-header">
            <span>∑ Valores ({{ slice.measures?.length || 0 }})</span>
            <span style="font-size: 9px; color: #166534; font-weight: 600;">Cálculo</span>
          </div>
          <div class="builder-chips-wrap">
            <div
              v-for="(m, mIdx) in slice.measures"
              :key="`${m.field}-${mIdx}`"
              class="builder-chip measure draggable-chip"
              draggable="true"
              @dragstart="handleDragStart($event, { name: m.field, sourceZone: 'measures' })"
            >
              <span style="cursor: grab; color: #86efac;">⠿</span>
              <span style="font-weight: 600;">{{ m.caption || m.field }}</span>
              <select
                class="measure-agg-select"
                :value="m.aggregation || 'sum'"
                @change="updateMeasureAggregation(mIdx, $event.target.value)"
                title="Selecciona la función de cálculo"
              >
                <option v-for="opt in aggOptions" :key="opt.id" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
              <button
                type="button"
                class="builder-chip-remove"
                @click="removeFieldFromZone('measures', m.field)"
              >
                ×
              </button>
            </div>
            <span v-if="!slice.measures || slice.measures.length === 0" class="builder-placeholder">
              Suelta métricas aquí
            </span>
          </div>
        </div>

        <!-- ZONE 4: FILTERS -->
        <div
          class="builder-zone-box"
          :class="{ 'drag-over': dragOverZone === 'filters' }"
          @dragover.prevent="handleDragOver('filters')"
          @dragleave="handleDragLeave('filters')"
          @drop.prevent="handleDrop('filters')"
          title="Filtros específicos para esta tabla"
        >
          <div class="builder-zone-header">
            <span>🔍 Filtros ({{ slice.filters?.length || 0 }})</span>
            <span style="font-size: 9px; color: #94a3b8;">Filtros</span>
          </div>
          <div class="builder-chips-wrap">
            <div
              v-for="f in slice.filters"
              :key="f.field"
              class="builder-chip filter draggable-chip"
              draggable="true"
              @dragstart="handleDragStart($event, { name: f.field, sourceZone: 'filters' })"
            >
              <span style="cursor: grab; color: #94a3b8;">⠿</span>
              <span>{{ f.field }}</span>
              <button
                type="button"
                style="background: none; border: none; cursor: pointer; font-size: 11px; padding: 0 2px;"
                title="Configurar miembros filtrados"
                @click="store.filterModalField = f.field"
              >
                ⚙️
              </button>
              <button
                type="button"
                class="builder-chip-remove"
                @click="removeFieldFromZone('filters', f.field)"
              >
                ×
              </button>
            </div>
            <span v-if="!slice.filters || slice.filters.length === 0" class="builder-placeholder">
              Suelta filtros aquí
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Blank Canvas Interactive Drop State -->
    <div v-if="isBlank" class="blank-table-canvas">
      <div class="blank-canvas-icon">📊</div>
      <div class="blank-canvas-title">Construye tu Tabla Dinámica desde Cero</div>
      <div class="blank-canvas-desc">
        Arrastra los campos desde el panel lateral <strong>Campos & Zonas</strong> o usa los botones <strong>+ Fila</strong>, <strong>+ Col</strong> y <strong>+ Valor</strong>.
        Guarda tus avances en cualquier momento usando el botón <strong>💾 Guardar Avance</strong> para consultarlos posteriormente.
      </div>

      <div class="blank-cards-grid">
        <!-- Filas Drop Card -->
        <div
          class="blank-drop-card"
          :class="{ 'drag-over': dragOverZone === 'rows' }"
          @dragover.prevent="handleDragOver('rows')"
          @dragleave="handleDragLeave('rows')"
          @drop.prevent="handleDrop('rows')"
        >
          <div class="blank-drop-card-icon">↓</div>
          <div class="blank-drop-card-title">1. Filas / Jerarquías</div>
          <div class="blank-drop-card-hint">Suelta aquí las dimensiones de fila</div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; justify-content: center;">
            <button
              v-for="f in stringFields.slice(0, 3)"
              :key="f.name"
              type="button"
              class="btn btn-light"
              style="font-size: 10px; padding: 2px 6px;"
              @click="addSuggestedField('rows', f.name)"
            >
              + {{ f.name }}
            </button>
          </div>
        </div>

        <!-- Columnas Drop Card -->
        <div
          class="blank-drop-card"
          :class="{ 'drag-over': dragOverZone === 'columns' }"
          @dragover.prevent="handleDragOver('columns')"
          @dragleave="handleDragLeave('columns')"
          @drop.prevent="handleDrop('columns')"
        >
          <div class="blank-drop-card-icon">↔</div>
          <div class="blank-drop-card-title">2. Columnas</div>
          <div class="blank-drop-card-hint">Opcional: categorías horizontales</div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; justify-content: center;">
            <button
              v-for="f in stringFields.slice(3, 5)"
              :key="f.name"
              type="button"
              class="btn btn-light"
              style="font-size: 10px; padding: 2px 6px;"
              @click="addSuggestedField('columns', f.name)"
            >
              + {{ f.name }}
            </button>
          </div>
        </div>

        <!-- Valores Drop Card -->
        <div
          class="blank-drop-card"
          :class="{ 'drag-over': dragOverZone === 'measures' }"
          @dragover.prevent="handleDragOver('measures')"
          @dragleave="handleDragLeave('measures')"
          @drop.prevent="handleDrop('measures')"
        >
          <div class="blank-drop-card-icon">∑</div>
          <div class="blank-drop-card-title">3. Valores / Métricas</div>
          <div class="blank-drop-card-hint">Suelta aquí métricas numéricas</div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; justify-content: center;">
            <button
              v-for="f in nonIdNumbers.slice(0, 3)"
              :key="f.name"
              type="button"
              class="btn btn-light"
              style="font-size: 10px; padding: 2px 6px; color: #166534; font-weight: 600;"
              @click="addSuggestedMeasure(f.name)"
            >
              + {{ f.name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Rendered Pivot Grid Table when Data is Available -->
    <div v-else class="table-scroll">
      <!-- Search filter inside table -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 11.5px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>🔍 Filtrar filas:</span>
          <input
            type="text"
            placeholder="Buscar en la tabla..."
            class="input-control"
            style="font-size: 11px; padding: 2px 8px; width: 180px; height: 24px;"
            v-model="searchQuery"
          />
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #64748b;">
            Mostrando {{ startItem }} - {{ endItem }} de {{ totalItems }}
          </span>
          <select
            class="input-control"
            style="font-size: 11px; padding: 1px 4px; height: 24px;"
            v-model.number="pageSize"
          >
            <option :value="25">25 filas</option>
            <option :value="50">50 filas</option>
            <option :value="100">100 filas</option>
            <option :value="250">250 filas</option>
            <option :value="999999">Todas</option>
          </select>
        </div>
      </div>

      <table class="pivot-table">
        <thead>
          <!-- Top row for multi-level column headers -->
          <tr v-if="columns.length > 0">
            <th
              :colspan="viewMode === 'tree' ? 1 : rowDimensionsCount"
              style="background-color: var(--total-bg); border-right: 2px solid var(--border-strong);"
            >
              Dimensiones
            </th>
            <th
              v-for="colDef in columnDefinitions"
              :key="colDef.id"
              class="col-header"
              :title="colDef.colParts?.join(' / ')"
            >
              {{ colDef.colParts?.join(' / ') || 'Total' }}
            </th>
          </tr>

          <!-- Second Header Row: Measure captions / Metric names -->
          <tr>
            <template v-if="viewMode === 'tabular'">
              <th
                v-for="rName in (rows.length > 0 ? rows : ['Total General'])"
                :key="rName"
                class="row-header"
                style="background-color: var(--total-bg);"
              >
                {{ rName }}
              </th>
            </template>
            <th
              v-else
              class="row-header"
              style="min-width: 240px; background-color: var(--total-bg); border-right: 2px solid var(--border-strong);"
            >
              {{ rows.join(' / ') || 'Total General' }}
            </th>

            <th
              v-for="(colDef, cIdx) in columnDefinitions"
              :key="`metric-${colDef.id || cIdx}`"
              class="col-header"
              style="font-weight: 600; font-size: 11.5px;"
            >
              {{ colDef.measure?.caption || colDef.headerLabel || colDef.measureCaption || colDef.measureField }}
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- TREE MODE -->
          <template v-if="isTreeEffective">
            <tr
              v-for="node in visibleTreeNodes"
              :key="node.key"
              :class="{
                'total-row': node.isTotal,
                'subtotal-row': node.level < rows.length - 1
              }"
            >
              <td
                class="row-header"
                :style="{ paddingLeft: `${node.level * 18 + 10}px` }"
              >
                <div style="display: flex; align-items: center; gap: 6px;">
                  <button
                    v-if="node.hasChildren"
                    type="button"
                    class="tree-toggle-btn"
                    @click="toggleCollapse(node.key)"
                    title="Alternar expansión"
                  >
                    {{ collapsedKeys.has(node.key) ? '+' : '-' }}
                  </button>
                  <span v-else style="display: inline-block; width: 14px;" />

                  <span :style="{ fontWeight: node.level === 0 ? 700 : node.hasChildren ? 600 : 400 }">
                    {{ node.label }}
                  </span>
                </div>
              </td>

              <td
                v-for="(val, vIdx) in node.values"
                :key="vIdx"
                class="cell-val"
                :style="getCellStyle(val, columnDefinitions[vIdx]?.measureField)"
              >
                {{ formatValue(val, columnDefinitions[vIdx]) }}
              </td>
            </tr>
          </template>

          <!-- TABULAR MODE -->
          <template v-else>
            <tr
              v-for="(row, rIdx) in currentMatrixRows"
              :key="rIdx"
              :class="{ 'total-row': row.isTotal }"
            >
              <template v-if="viewMode === 'tabular' && rows.length > 1">
                <td
                  v-for="(part, pIdx) in row.rowParts"
                  :key="pIdx"
                  class="row-header"
                  :style="{
                    color: isDuplicateTabular(rIdx, pIdx) ? 'transparent' : 'inherit',
                    borderTop: isDuplicateTabular(rIdx, pIdx) ? 'none' : '1px solid var(--border)'
                  }"
                >
                  {{ part }}
                </td>
              </template>
              <td v-else class="row-header">
                {{ row.rowParts.join(' / ') || 'Total General' }}
              </td>

              <td
                v-for="(val, vIdx) in row.values"
                :key="vIdx"
                class="cell-val"
                :style="getCellStyle(val, columnDefinitions[vIdx]?.measureField)"
              >
                {{ formatValue(val, columnDefinitions[vIdx]) }}
              </td>
            </tr>
          </template>

          <!-- GRAND TOTALS ROW AT BOTTOM -->
          <tr v-if="grandTotals && grandTotals.length > 0" class="grand-total-row">
            <td
              :colspan="viewMode === 'tree' ? 1 : rowDimensionsCount"
              class="row-header"
              style="font-weight: 800; background-color: #cbd5e1;"
            >
              TOTAL GENERAL
            </td>
            <td
              v-for="(totVal, tIdx) in grandTotals"
              :key="`gt-${tIdx}`"
              class="cell-val"
              style="font-weight: 800; background-color: #cbd5e1;"
            >
              {{ formatValue(totVal, columnDefinitions[tIdx]) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination footer -->
      <div v-if="totalPages > 1" class="table-pagination-bar">
        <button
          type="button"
          class="btn btn-light"
          style="font-size: 11px; padding: 2px 8px;"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          ← Anterior
        </button>

        <span style="font-size: 11px; color: #475569;">
          Página <strong>{{ currentPage }}</strong> de <strong>{{ totalPages }}</strong>
        </span>

        <button
          type="button"
          class="btn btn-light"
          style="font-size: 11px; padding: 2px 8px;"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Siguiente →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const props = defineProps({
  tableId: { type: String, default: 'table-default' },
  title: { type: String, default: 'Tabla Dinámica' },
  slice: {
    type: Object,
    default: () => ({ rows: [], columns: [], measures: [], filters: [] })
  },
  pivotResult: { type: Object, default: null },
  currencyFormat: { type: Boolean, default: true },
  conditionalRules: { type: Array, default: () => [] },
  tableStyle: { type: String, default: 'classic_grid' },
  fields: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false }
});

const emit = defineEmits([
  'titleChange',
  'sliceChange',
  'tableStyleChange',
  'toggleCurrency',
  'clearTable',
  'duplicateTable',
  'deleteTable'
]);

const store = useAnalyticsStore();

const aggOptions = [
  { id: 'sum', label: '➕ Sumar' },
  { id: 'avg', label: '➗ Promedio' },
  { id: 'max', label: '📈 Máximo' },
  { id: 'min', label: '📉 Mínimo' },
  { id: 'count', label: '🔢 Contar' },
  { id: 'distinct_count', label: '≠ Únicos' }
];

const dragOverZone = ref(null);
const isEditingTitle = ref(false);
const tempTitle = ref(props.title);

const viewMode = ref('tree');
const collapsedKeys = ref(new Set());
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(50);

watch(() => props.title, (newTitle) => {
  tempTitle.value = newTitle;
});

function handleTitleSubmit() {
  isEditingTitle.value = false;
  if (tempTitle.value.trim()) {
    emit('titleChange', tempTitle.value.trim());
  }
}

function emitToggleCurrency() {
  emit('toggleCurrency');
}

function emitTableStyleChange(val) {
  emit('tableStyleChange', val);
}

function emitClearTable() {
  emit('clearTable', props.tableId);
}

function emitDuplicateTable() {
  emit('duplicateTable', props.tableId);
}

function emitDeleteTable() {
  emit('deleteTable', props.tableId);
}

function handleSaveProgress() {
  if (store.currentLoadedReport && store.canEditLoadedReport) {
    store.saveLoadedReportChanges()
      .then(rep => alert(`¡Avance guardado con éxito en "${rep.name}"!`))
      .catch(err => alert(err.message));
  } else {
    store.isReportsModalOpen = true;
  }
}

// Slice operations
function updateSlice(newSlice) {
  emit('sliceChange', newSlice);
}

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

function handleDrop(targetZone) {
  dragOverZone.value = null;
  const event = window.event;
  if (!event || !event.dataTransfer) return;

  const raw = event.dataTransfer.getData('application/json');
  let item = null;
  if (raw) {
    try { item = JSON.parse(raw); } catch { item = null; }
  }
  if (!item) {
    const text = event.dataTransfer.getData('text/plain');
    if (text) {
      const found = props.fields.find(f => f.name === text);
      item = { name: text, type: found?.type || 'string', sourceZone: 'available' };
    }
  }
  if (!item || !item.name) return;

  const { name, type, sourceZone } = item;
  let nextRows = [...(props.slice.rows || [])];
  let nextColumns = [...(props.slice.columns || [])];
  let nextMeasures = [...(props.slice.measures || [])];
  let nextFilters = [...(props.slice.filters || [])];

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
    ...props.slice,
    rows: nextRows,
    columns: nextColumns,
    measures: nextMeasures,
    filters: nextFilters
  });
}

function removeFieldFromZone(zoneName, fieldName) {
  if (zoneName === 'rows') {
    updateSlice({ ...props.slice, rows: (props.slice.rows || []).filter(r => r !== fieldName) });
  } else if (zoneName === 'columns') {
    updateSlice({ ...props.slice, columns: (props.slice.columns || []).filter(c => c !== fieldName) });
  } else if (zoneName === 'measures') {
    updateSlice({ ...props.slice, measures: (props.slice.measures || []).filter(m => m.field !== fieldName) });
  } else if (zoneName === 'filters') {
    updateSlice({ ...props.slice, filters: (props.slice.filters || []).filter(f => f.field !== fieldName) });
  }
}

function updateMeasureAggregation(mIdx, newAgg) {
  const nextMeasures = [...(props.slice.measures || [])];
  if (nextMeasures[mIdx]) {
    nextMeasures[mIdx] = { ...nextMeasures[mIdx], aggregation: newAgg };
    updateSlice({ ...props.slice, measures: nextMeasures });
  }
}

function addSuggestedField(zone, name) {
  if (zone === 'rows') {
    updateSlice({ ...props.slice, rows: [...(props.slice.rows || []), name] });
  } else if (zone === 'columns') {
    updateSlice({ ...props.slice, columns: [...(props.slice.columns || []), name] });
  }
}

function addSuggestedMeasure(name) {
  updateSlice({
    ...props.slice,
    measures: [
      ...(props.slice.measures || []),
      { field: name, aggregation: 'sum', caption: name.replace(/_/g, ' ') }
    ]
  });
}

// Tree operations
function toggleCollapse(key) {
  const next = new Set(collapsedKeys.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  collapsedKeys.value = next;
}

function expandAll() {
  collapsedKeys.value = new Set();
}

function collapseAll() {
  const treeNodes = props.pivotResult?.tree || [];
  const parentKeys = treeNodes.filter(n => n.hasChildren).map(n => n.key);
  collapsedKeys.value = new Set(parentKeys);
}

// Data extraction
const rows = computed(() => props.pivotResult?.rows || []);
const columns = computed(() => props.pivotResult?.columns || []);
const measures = computed(() => props.pivotResult?.measures || []);
const columnDefinitions = computed(() => props.pivotResult?.columnDefinitions || []);
const matrix = computed(() => props.pivotResult?.matrix || []);
const tree = computed(() => props.pivotResult?.tree || []);
const grandTotals = computed(() => props.pivotResult?.grandTotals || []);

const rowDimensionsCount = computed(() => Math.max(rows.value.length, 1));

const stringFields = computed(() => props.fields.filter(f => f.type !== 'number'));
const numericFields = computed(() => props.fields.filter(f => f.type === 'number'));
const nonIdNumbers = computed(() => numericFields.value.filter(f => !/^(cod|id|nit|num)/i.test(f.name)));

const hasSliceConfig = computed(() => {
  return (props.slice.rows && props.slice.rows.length > 0) ||
         (props.slice.columns && props.slice.columns.length > 0) ||
         (props.slice.measures && props.slice.measures.length > 0);
});

const hasMatrixData = computed(() => Boolean(matrix.value && matrix.value.length > 0));
const isBlank = computed(() => !hasSliceConfig.value && !hasMatrixData.value);

// Heatmap intensity calculation
const maxCellVal = computed(() => {
  if (!matrix.value || props.tableStyle !== 'heatmap_intensity') return 1;
  let max = 0;
  matrix.value.forEach(r => {
    (r.values || []).forEach(v => {
      if (typeof v === 'number' && v > max) max = v;
    });
  });
  return max || 1;
});

function formatValue(val, colDef) {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'number') {
    if (colDef?.measureCaption?.includes('%') || colDef?.measureField?.includes('pct')) {
      return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(val)}%`;
    }
    if (props.currencyFormat) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: val % 1 === 0 ? 0 : 2
      }).format(val);
    }
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val);
  }
  return val;
}

function getCellStyle(val, measureField) {
  if (typeof val === 'number' && props.conditionalRules && props.conditionalRules.length > 0) {
    for (const rule of props.conditionalRules) {
      if (rule.measureField === measureField) {
        let match = false;
        if (rule.operator === 'lt' && val < rule.value) match = true;
        if (rule.operator === 'gt' && val > rule.value) match = true;
        if (rule.operator === 'lte' && val <= rule.value) match = true;
        if (rule.operator === 'gte' && val >= rule.value) match = true;

        if (match) {
          return {
            backgroundColor: rule.bgColor,
            color: rule.textColor,
            fontWeight: 600
          };
        }
      }
    }
  }

  if (props.tableStyle === 'heatmap_intensity' && typeof val === 'number' && val > 0) {
    const intensity = Math.min(Math.max(val / maxCellVal.value, 0.08), 0.85);
    return {
      backgroundColor: `rgba(37, 99, 235, ${intensity})`,
      color: intensity > 0.5 ? '#ffffff' : '#0f172a',
      fontWeight: intensity > 0.4 ? 600 : 400
    };
  }

  return {};
}

// Tree pagination & visibility
const isTreeEffective = computed(() => viewMode.value === 'tree' && rows.value.length > 1);

const treeNodes = computed(() => tree.value || []);
const level0Nodes = computed(() => treeNodes.value.filter(n => n.level === 0));

const filteredRoots = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return level0Nodes.value;
  return level0Nodes.value.filter(r => {
    if (r.label.toLowerCase().includes(query)) return true;
    return treeNodes.value.some(n => n.key.startsWith(r.key + ' >>>> ') && n.label.toLowerCase().includes(query));
  });
});

const totalTreeRoots = computed(() => filteredRoots.value.length);
const totalTreePages = computed(() => Math.ceil(totalTreeRoots.value / pageSize.value) || 1);

const visibleTreeNodes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const currentRoots = filteredRoots.value.slice(start, start + pageSize.value);
  const currentRootKeys = new Set(currentRoots.map(r => r.key));

  const result = [];
  const collapsedPrefixes = new Set();

  for (const node of treeNodes.value) {
    const rootKey = node.rowParts[0];
    if (!currentRootKeys.has(rootKey)) continue;

    let isHidden = false;
    if (node.parentKey) {
      if (collapsedKeys.value.has(node.parentKey) || collapsedPrefixes.has(node.parentKey)) {
        isHidden = true;
        collapsedPrefixes.add(node.key);
      }
    }

    if (!isHidden) {
      result.push(node);
    }
  }
  return result;
});

// Tabular pagination & suppression
const filteredMatrix = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return matrix.value;
  return matrix.value.filter(r => (r.rowParts || []).some(p => String(p).toLowerCase().includes(query)));
});

const totalMatrixRows = computed(() => filteredMatrix.value.length);
const totalMatrixPages = computed(() => Math.ceil(totalMatrixRows.value / pageSize.value) || 1);

const currentMatrixRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredMatrix.value.slice(start, start + pageSize.value);
});

function isDuplicateTabular(rIdx, pIdx) {
  if (rIdx === 0) return false;
  const prevParts = currentMatrixRows.value[rIdx - 1]?.rowParts || [];
  const currParts = currentMatrixRows.value[rIdx]?.rowParts || [];
  for (let i = 0; i <= pIdx; i++) {
    if (prevParts[i] !== currParts[i]) return false;
  }
  return true;
}

const totalItems = computed(() => isTreeEffective.value ? totalTreeRoots.value : totalMatrixRows.value);
const totalPages = computed(() => isTreeEffective.value ? totalTreePages.value : totalMatrixPages.value);
const startItem = computed(() => totalItems.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1);
const endItem = computed(() => Math.min(currentPage.value * pageSize.value, totalItems.value));
</script>
