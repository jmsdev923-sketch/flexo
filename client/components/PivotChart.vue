<template>
  <div class="table-container style-classic_grid" style="margin-bottom: 24px;">
    <!-- 1. Interactive Chart Header & Builder Toolbar -->
    <div class="table-builder-card">
      <div class="builder-header-row">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">{{ currentChartIcon }}</span>
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
            title="Haz clic para renombrar este gráfico"
            style="cursor: pointer;"
          >
            {{ title }} ✏️
          </span>
          <span style="font-size: 11px; color: #64748b;">
            ({{ slice.rows?.length || 0 }} Categorías × {{ slice.columns?.length || 0 }} Series | {{ slice.measures?.length || 0 }} Valores)
          </span>
          <span v-if="loading" style="font-size: 11px; color: #f59e0b; font-weight: 600;">
            • Graficando...
          </span>
        </div>

        <!-- Chart Actions Toolbar -->
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

          <!-- Chart Type Selector -->
          <select
            class="input-control"
            style="font-size: 11px; padding: 2px 6px; height: 26px;"
            :value="chartType"
            @change="emitChartTypeChange($event.target.value)"
            title="Seleccionar tipo de gráfico visual"
          >
            <option v-for="opt in chartOptions" :key="opt.id" :value="opt.id">
              {{ opt.label }}
            </option>
          </select>

          <button
            type="button"
            class="btn btn-light"
            style="font-size: 11px; padding: 3px 8px;"
            @click="emitClearChart"
            title="Limpiar configuración y dejar en blanco"
          >
            🧹 Limpiar
          </button>

          <button
            type="button"
            class="btn btn-light"
            style="font-size: 11px; padding: 3px 8px;"
            @click="emitDuplicateChart"
            title="Duplicar este gráfico en una nueva pestaña"
          >
            📋 Duplicar
          </button>

          <button
            v-if="canDelete"
            type="button"
            class="btn btn-light"
            style="font-size: 11px; padding: 3px 8px; color: #ef4444;"
            @click="emitDeleteChart"
            title="Eliminar este gráfico"
          >
            🗑️
          </button>
        </div>
      </div>

      <!-- Mini Drop Zones for this Chart -->
      <div class="builder-zones-strip">
        <!-- ZONE 1: X-AXIS / CATEGORIES -->
        <div
          class="builder-zone-box"
          :class="{ 'drag-over': dragOverZone === 'rows' }"
          @dragover.prevent="handleDragOver('rows')"
          @dragleave="handleDragLeave('rows')"
          @drop.prevent="handleDrop('rows')"
          title="Arrastra dimensiones aquí para el Eje X / Categorías del gráfico"
        >
          <div class="builder-zone-header">
            <span>🏷️ Eje X / Categorías ({{ slice.rows?.length || 0 }})</span>
            <span style="font-size: 9px; color: #2563eb; font-weight: 600;">Eje X</span>
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
              Suelta dimensión aquí
            </span>
          </div>
        </div>

        <!-- ZONE 2: SERIES BREAKDOWN -->
        <div
          class="builder-zone-box"
          :class="{ 'drag-over': dragOverZone === 'columns' }"
          @dragover.prevent="handleDragOver('columns')"
          @dragleave="handleDragLeave('columns')"
          @drop.prevent="handleDrop('columns')"
          title="Arrastra dimensiones aquí para desglosar en series múltiples"
        >
          <div class="builder-zone-header">
            <span>↔ Desglose / Series ({{ slice.columns?.length || 0 }})</span>
            <span style="font-size: 9px; color: #94a3b8;">Opcional</span>
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
              Opcional
            </span>
          </div>
        </div>

        <!-- ZONE 3: VALUES / METRICS -->
        <div
          class="builder-zone-box"
          :class="{ 'drag-over': dragOverZone === 'measures' }"
          @dragover.prevent="handleDragOver('measures')"
          @dragleave="handleDragLeave('measures')"
          @drop.prevent="handleDrop('measures')"
          title="Arrastra métricas numéricas aquí y decide el cálculo a graficar"
        >
          <div class="builder-zone-header">
            <span>∑ Métrica / Valores ({{ slice.measures?.length || 0 }})</span>
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
              Suelta métrica aquí
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Blank Chart Interactive Canvas -->
    <div v-if="isBlank" class="blank-chart-canvas">
      <div class="blank-canvas-icon">📈</div>
      <div class="blank-canvas-title">Gráfico Analítico en Blanco</div>
      <div class="blank-canvas-desc">
        Arrastra los campos desde el panel <strong>Campos Disponibles</strong> para configurar este gráfico:
      </div>

      <div class="blank-cards-grid" style="max-width: 650px;">
        <!-- Eje X Drop Card -->
        <div
          class="blank-drop-card"
          :class="{ 'drag-over': dragOverZone === 'rows' }"
          @dragover.prevent="handleDragOver('rows')"
          @dragleave="handleDragLeave('rows')"
          @drop.prevent="handleDrop('rows')"
        >
          <div class="blank-drop-card-icon">🏷️</div>
          <div class="blank-drop-card-title">1. Eje X / Categorías</div>
          <div class="blank-drop-card-hint">Suelta aquí dimensiones para las barras o curvas</div>
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

        <!-- Valores Drop Card -->
        <div
          class="blank-drop-card"
          :class="{ 'drag-over': dragOverZone === 'measures' }"
          @dragover.prevent="handleDragOver('measures')"
          @dragleave="handleDragLeave('measures')"
          @drop.prevent="handleDrop('measures')"
        >
          <div class="blank-drop-card-icon">∑</div>
          <div class="blank-drop-card-title">2. Valores y Cálculos</div>
          <div class="blank-drop-card-hint">Suelta aquí métricas numéricas para graficar</div>
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

    <!-- 3. Waiting Data State -->
    <div v-else-if="matrix.length === 0" class="blank-chart-canvas" style="min-height: 220px;">
      <div class="blank-canvas-icon">⏳</div>
      <div class="blank-canvas-title">Esperando Datos / Métricas</div>
      <div class="blank-canvas-desc">
        {{ slice.measures?.length === 0
          ? 'Agrega al menos una métrica a "Métrica / Valores" para calcular y graficar las alturas.'
          : 'No se encontraron datos que coincidan con la dimensión seleccionada.' }}
      </div>
    </div>

    <!-- 4. Rendered SVG Visual Chart -->
    <div v-else style="padding: 16px;">
      <!-- Legend -->
      <div style="display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; width: 100%;">
        <div
          v-for="(sLabel, idx) in seriesLabels"
          :key="idx"
          style="display: flex; align-items: center; gap: 6px; font-size: 12px;"
        >
          <span
            style="width: 12px; height: 12px; border-radius: 3px;"
            :style="{ backgroundColor: colors[idx % colors.length] }"
          />
          <span style="font-weight: 500; color: #334155;">{{ sLabel }}</span>
        </div>
      </div>

      <!-- 1. BARRAS VERTICALES -->
      <div v-if="chartType === 'bar_vertical'" style="width: 100%; height: 340px;">
        <svg width="100%" height="100%" viewBox="0 0 800 320" preserveAspectRatio="none">
          <g v-for="(pct, i) in [0, 0.25, 0.5, 0.75, 1]" :key="i">
            <line
              x1="60"
              :y1="280 - pct * 240"
              x2="780"
              :y2="280 - pct * 240"
              stroke="#e2e8f0"
              stroke-dasharray="3 3"
            />
            <text x="50" :y="280 - pct * 240 + 4" fill="#94a3b8" font-size="10" text-anchor="end">
              {{ formatChartVal(Math.round(maxVal * pct)) }}
            </text>
          </g>
          <line x1="60" y1="280" x2="780" y2="280" stroke="#cbd5e1" stroke-width="1.5" />

          <g v-for="(r, rIdx) in chartRows" :key="rIdx">
            <text
              :x="getGroupX(rIdx) + (getGroupWidth() - 20) / 2"
              y="300"
              fill="#475569"
              font-size="11"
              text-anchor="middle"
              font-weight="500"
            >
              {{ labels[rIdx]?.length > 14 ? `${labels[rIdx].slice(0, 12)}...` : labels[rIdx] }}
            </text>

            <rect
              v-for="(_, sIdx) in seriesCount"
              :key="sIdx"
              :x="getGroupX(rIdx) + sIdx * getBarWidth()"
              :y="280 - Math.max(((r.values?.[sIdx] || 0) / maxVal) * 240, 2)"
              :width="Math.max(getBarWidth() - 2, 4)"
              :height="Math.max(((r.values?.[sIdx] || 0) / maxVal) * 240, 2)"
              :fill="colors[sIdx % colors.length]"
              rx="2"
            >
              <title>{{ `${seriesLabels[sIdx]}: ${r.values?.[sIdx] || 0}` }}</title>
            </rect>
          </g>
        </svg>
      </div>

      <!-- 2. BARRAS HORIZONTALES -->
      <div v-else-if="chartType === 'bar_horizontal'" style="width: 100%; height: 360px;">
        <svg width="100%" height="100%" viewBox="0 0 800 340">
          <line x1="160" y1="20" x2="160" y2="310" stroke="#cbd5e1" stroke-width="1.5" />
          <g v-for="(r, rIdx) in chartRows" :key="rIdx">
            <text
              x="150"
              :y="getHBarStartY(rIdx) + getHRowHeight() / 2"
              fill="#475569"
              font-size="11"
              text-anchor="end"
              font-weight="500"
            >
              {{ labels[rIdx]?.length > 16 ? `${labels[rIdx].slice(0, 14)}...` : labels[rIdx] }}
            </text>

            <g v-for="(_, sIdx) in seriesCount" :key="sIdx">
              <rect
                x="160"
                :y="getHBarStartY(rIdx) + sIdx * getHBarHeight()"
                :width="Math.max(((r.values?.[sIdx] || 0) / maxVal) * 580, 3)"
                :height="Math.max(getHBarHeight() - 2, 4)"
                :fill="colors[sIdx % colors.length]"
                rx="2"
              >
                <title>{{ `${seriesLabels[sIdx]} (${labels[rIdx]}): ${r.values?.[sIdx] || 0}` }}</title>
              </rect>
              <text
                :x="166 + Math.max(((r.values?.[sIdx] || 0) / maxVal) * 580, 3)"
                :y="getHBarStartY(rIdx) + sIdx * getHBarHeight() + getHBarHeight() - 3"
                fill="#64748b"
                font-size="9.5"
                font-weight="600"
              >
                {{ formatChartVal(r.values?.[sIdx] || 0) }}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <!-- 3. LÍNEAS / TENDENCIA -->
      <div v-else-if="chartType === 'line_curve'" style="width: 100%; height: 340px;">
        <svg width="100%" height="100%" viewBox="0 0 800 320" preserveAspectRatio="none">
          <line x1="60" y1="280" x2="780" y2="280" stroke="#cbd5e1" stroke-width="1.5" />
          <g v-for="(_, sIdx) in seriesCount" :key="sIdx">
            <polyline
              fill="none"
              :stroke="colors[sIdx % colors.length]"
              stroke-width="3"
              :points="getLinePoints(sIdx)"
            />
            <circle
              v-for="(r, rIdx) in chartRows"
              :key="rIdx"
              :cx="getGroupPointX(rIdx)"
              :cy="280 - ((r.values?.[sIdx] || 0) / maxVal) * 240"
              r="4"
              :fill="colors[sIdx % colors.length]"
              stroke="#fff"
              stroke-width="2"
            >
              <title>{{ `${labels[rIdx]}: ${r.values?.[sIdx] || 0}` }}</title>
            </circle>
          </g>
        </svg>
      </div>

      <!-- 4. ÁREA APILADA / SOMBREADA -->
      <div v-else-if="chartType === 'area_stacked'" style="width: 100%; height: 340px;">
        <svg width="100%" height="100%" viewBox="0 0 800 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradientNuxt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2563eb" stop-opacity="0.5" />
              <stop offset="100%" stop-color="#2563eb" stop-opacity="0.05" />
            </linearGradient>
          </defs>
          <line x1="60" y1="280" x2="780" y2="280" stroke="#cbd5e1" stroke-width="1.5" />
          <path :d="getAreaPath()" fill="url(#areaGradientNuxt)" />
          <polyline fill="none" stroke="#2563eb" stroke-width="3" :points="getLinePoints(0)" />
        </svg>
      </div>

      <!-- 5. DONUT / CIRCULAR -->
      <div v-else-if="chartType === 'donut_pie'" style="display: flex; flex-direction: column; alignItems: center; width: 100%; gap: 20px;">
        <div style="position: relative; width: 260px; height: 260px;">
          <svg width="260" height="260" viewBox="0 0 260 260">
            <circle
              v-for="(sliceItem, idx) in donutSlices"
              :key="idx"
              cx="130"
              cy="130"
              r="90"
              fill="transparent"
              :stroke="sliceItem.color"
              stroke-width="36"
              :stroke-dasharray="sliceItem.strokeDasharray"
              :stroke-dashoffset="sliceItem.strokeDashoffset"
              style="transition: all 0.3s ease;"
            >
              <title>{{ `${sliceItem.label}: ${sliceItem.val} (${sliceItem.percentage}%)` }}</title>
            </circle>
          </svg>
          <!-- Center Total -->
          <div
            style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none;"
          >
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">TOTAL</div>
            <div style="font-size: 16px; color: #0f172a; font-weight: 800;">
              {{ formatChartVal(totalPieVal) }}
            </div>
          </div>
        </div>

        <!-- Legend Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; width: 100%;">
          <div
            v-for="(sliceItem, idx) in pieData"
            :key="idx"
            style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <span
                style="width: 12px; height: 12px; border-radius: 50%;"
                :style="{ backgroundColor: sliceItem.color }"
              />
              <span style="font-weight: 600; color: #1e293b; font-size: 12px;">{{ sliceItem.label }}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
              <span style="font-weight: 800; fontSize: 14px; color: #0f172a;">
                {{ Math.round((sliceItem.val / totalPieVal) * 100) }}%
              </span>
              <span style="font-size: 10px; color: #64748b;">{{ formatChartVal(sliceItem.val) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. RADAR / SPIDER PLOT -->
      <div v-else-if="chartType === 'radar_polar'" style="width: 100%; height: 340px; display: flex; justify-content: center;">
        <svg width="340" height="340" viewBox="0 0 340 340">
          <circle
            v-for="(scale, i) in [0.25, 0.5, 0.75, 1]"
            :key="i"
            cx="170"
            cy="170"
            :r="130 * scale"
            fill="none"
            stroke="#e2e8f0"
            stroke-dasharray="3 3"
          />
          <g v-for="(r, idx) in chartRows" :key="idx">
            <line
              x1="170"
              y1="170"
              :x2="getRadarAxisX(idx)"
              :y2="getRadarAxisY(idx)"
              stroke="#e2e8f0"
            />
            <text
              :x="getRadarLabelX(idx)"
              :y="getRadarLabelY(idx)"
              fill="#475569"
              font-size="10"
              font-weight="500"
              text-anchor="middle"
              alignment-baseline="middle"
            >
              {{ labels[idx]?.length > 10 ? `${labels[idx].slice(0, 8)}..` : labels[idx] }}
            </text>
          </g>
          <polygon
            :points="getRadarPolygonPoints()"
            fill="rgba(37, 99, 235, 0.3)"
            stroke="#2563eb"
            stroke-width="2"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  chartId: { type: String, default: 'chart-default' },
  title: { type: String, default: 'Gráfico Analítico' },
  slice: {
    type: Object,
    default: () => ({ rows: [], columns: [], measures: [], filters: [] })
  },
  chartType: { type: String, default: 'bar_vertical' },
  pivotResult: { type: Object, default: null },
  currencyFormat: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: false },
  fields: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits([
  'titleChange',
  'sliceChange',
  'chartTypeChange',
  'toggleCurrency',
  'clearChart',
  'duplicateChart',
  'deleteChart'
]);

const chartOptions = [
  { id: 'bar_vertical', label: '📊 Columnas' },
  { id: 'bar_horizontal', label: '📊 Barras H.' },
  { id: 'line_curve', label: '📈 Líneas' },
  { id: 'area_stacked', label: '🌊 Área' },
  { id: 'donut_pie', label: '🍩 Donut' },
  { id: 'radar_polar', label: '🕸️ Radar' }
];

const aggOptions = [
  { id: 'sum', label: '∑ Suma' },
  { id: 'avg', label: 'AVG Promedio' },
  { id: 'count', label: '123 Conteo' },
  { id: 'min', label: 'MIN Mínimo' },
  { id: 'max', label: 'MAX Máximo' },
  { id: 'distinct_count', label: '≠ Únicos' }
];

const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'];

const isEditingTitle = ref(false);
const tempTitle = ref(props.title);
const dragOverZone = ref(null);

watch(() => props.title, (newTitle) => {
  tempTitle.value = newTitle;
});

const currentChartIcon = computed(() => {
  const map = {
    bar_vertical: '📊',
    bar_horizontal: '📊',
    line_curve: '📈',
    area_stacked: '🌊',
    donut_pie: '🍩',
    radar_polar: '🕸️'
  };
  return map[props.chartType] || '📈';
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

function emitChartTypeChange(val) {
  emit('chartTypeChange', val);
}

function emitClearChart() {
  emit('clearChart', props.chartId);
}

function emitDuplicateChart() {
  emit('duplicateChart', props.chartId);
}

function emitDeleteChart() {
  emit('deleteChart', props.chartId);
}

function updateSlice(newSlice) {
  emit('sliceChange', newSlice);
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

  if (sourceZone === 'rows') nextRows = nextRows.filter(r => r !== name);
  if (sourceZone === 'columns') nextColumns = nextColumns.filter(c => c !== name);
  if (sourceZone === 'measures') nextMeasures = nextMeasures.filter(m => m.field !== name);

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
  }

  updateSlice({
    ...props.slice,
    rows: nextRows,
    columns: nextColumns,
    measures: nextMeasures
  });
}

function removeFieldFromZone(zoneName, fieldName) {
  if (zoneName === 'rows') {
    updateSlice({ ...props.slice, rows: (props.slice.rows || []).filter(r => r !== fieldName) });
  } else if (zoneName === 'columns') {
    updateSlice({ ...props.slice, columns: (props.slice.columns || []).filter(c => c !== fieldName) });
  } else if (zoneName === 'measures') {
    updateSlice({ ...props.slice, measures: (props.slice.measures || []).filter(m => m.field !== fieldName) });
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

// Chart calculations
const matrix = computed(() => props.pivotResult?.matrix || []);
const columnDefinitions = computed(() => props.pivotResult?.columnDefinitions || []);
const isBlank = computed(() => (!props.slice.rows || props.slice.rows.length === 0) && (!props.slice.measures || props.slice.measures.length === 0));

const chartRows = computed(() => matrix.value.slice(0, 10));
const labels = computed(() => chartRows.value.map(r => r.rowParts?.join(' / ') || ''));

const seriesCount = computed(() => Math.max(Math.min(columnDefinitions.value.length, 6), 1));
const seriesLabels = computed(() => {
  if (columnDefinitions.value.length === 0) return ['Serie 1'];
  return columnDefinitions.value.slice(0, seriesCount.value).map(c => c.headerLabel || c.measureCaption || 'Valor');
});

const maxVal = computed(() => {
  let m = 0;
  chartRows.value.forEach(r => {
    for (let i = 0; i < seriesCount.value; i++) {
      const v = r.values?.[i];
      if (typeof v === 'number' && v > m) m = v;
    }
  });
  return m === 0 ? 100 : m;
});

const stringFields = computed(() => props.fields.filter(f => f.type !== 'number'));
const numericFields = computed(() => props.fields.filter(f => f.type === 'number'));
const nonIdNumbers = computed(() => numericFields.value.filter(f => !/^(cod|id|nit|num)/i.test(f.name)));

function formatChartVal(val) {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'number') {
    if (props.currencyFormat) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(val);
    }
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(val);
  }
  return val;
}

// Vertical Bar positioning
function getGroupWidth() {
  return 720 / (chartRows.value.length || 1);
}
function getBarWidth() {
  return Math.max((getGroupWidth() - 20) / seriesCount.value, 6);
}
function getGroupX(rIdx) {
  return 60 + rIdx * getGroupWidth() + 10;
}

// Horizontal Bar positioning
function getHRowHeight() {
  return 280 / (chartRows.value.length || 1);
}
function getHBarHeight() {
  return Math.max((getHRowHeight() - 10) / seriesCount.value, 6);
}
function getHBarStartY(rIdx) {
  return 25 + rIdx * getHRowHeight();
}

// Line / Area positioning
function getGroupPointX(rIdx) {
  const groupWidth = 720 / (chartRows.value.length || 1);
  return 60 + rIdx * groupWidth + groupWidth / 2;
}

function getLinePoints(sIdx) {
  return chartRows.value.map((r, rIdx) => {
    const val = r.values?.[sIdx] || 0;
    const x = getGroupPointX(rIdx);
    const y = 280 - (val / maxVal.value) * 240;
    return `${x},${y}`;
  }).join(' ');
}

function getAreaPath() {
  const groupWidth = 720 / (chartRows.value.length || 1);
  const points = chartRows.value.map((r, rIdx) => {
    const val = r.values?.[0] || 0;
    const x = 60 + rIdx * groupWidth + groupWidth / 2;
    const y = 280 - (val / maxVal.value) * 240;
    return `${x},${y}`;
  });
  const firstX = 60 + groupWidth / 2;
  const lastX = 60 + (chartRows.value.length - 1) * groupWidth + groupWidth / 2;
  return `M ${firstX},280 L ${points.join(' L ')} L ${lastX},280 Z`;
}

// Donut calculation
const pieData = computed(() => {
  return chartRows.value.map((r, i) => ({
    label: labels.value[i] || `Item ${i}`,
    val: typeof r.values?.[0] === 'number' ? r.values[0] : 0,
    color: colors[i % colors.length]
  }));
});

const totalPieVal = computed(() => {
  const sum = pieData.value.reduce((acc, curr) => acc + curr.val, 0);
  return sum || 1;
});

const donutSlices = computed(() => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return pieData.value.map(sliceItem => {
    const ratio = sliceItem.val / totalPieVal.value;
    const strokeDasharray = `${ratio * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += ratio * circumference;

    return {
      ...sliceItem,
      percentage: Math.round(ratio * 100),
      strokeDasharray,
      strokeDashoffset
    };
  });
});

// Radar calculation
function getRadarAngle(idx) {
  return (idx / (chartRows.value.length || 1)) * 2 * Math.PI - Math.PI / 2;
}
function getRadarAxisX(idx) {
  return 170 + Math.cos(getRadarAngle(idx)) * 130;
}
function getRadarAxisY(idx) {
  return 170 + Math.sin(getRadarAngle(idx)) * 130;
}
function getRadarLabelX(idx) {
  return 170 + Math.cos(getRadarAngle(idx)) * 150;
}
function getRadarLabelY(idx) {
  return 170 + Math.sin(getRadarAngle(idx)) * 150;
}
function getRadarPolygonPoints() {
  return chartRows.value.map((r, idx) => {
    const val = r.values?.[0] || 0;
    const dist = (val / maxVal.value) * 130;
    const angle = getRadarAngle(idx);
    const x = 170 + Math.cos(angle) * dist;
    const y = 170 + Math.sin(angle) * dist;
    return `${x},${y}`;
  }).join(' ');
}
</script>
