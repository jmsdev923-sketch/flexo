<template>
  <div v-if="!pivotResult || !pivotResult.matrix || pivotResult.matrix.length === 0" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #64748b; gap: 8px;">
    <div style="font-size: 32px;">📊</div>
    <div style="font-weight: 600;">No hay datos suficientes para el Dashboard</div>
    <div style="font-size: 12px;">Selecciona al menos una dimensión y una métrica en el panel de campos.</div>
  </div>

  <div v-else class="dashboard-scrollable-container">
    <div class="dashboard-control-bar">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 13px; font-weight: 700; color: #1e293b;">
          🖥️ Lienzo Dashboard 360° Personalizable
        </span>
        <span style="font-size: 11px; color: #64748b;">
          (Arrastra cualquier tarjeta desde el tirador <strong>⠿</strong> para cambiar su posición)
        </span>
      </div>
      <button
        type="button"
        class="btn btn-light"
        style="font-size: 11px; padding: 3px 8px;"
        @click="resetLayout"
        title="Restaurar orden predeterminado de los widgets"
      >
        🔄 Restablecer Orden
      </button>
    </div>

    <div class="dashboard-grid-12">
      <div
        v-for="(widget, index) in widgets"
        :key="widget.id"
        class="dashboard-card-wrapper"
        :class="{ 'widget-drag-over': dragOverIndex === index }"
        :style="{ gridColumn: widget.colSpan }"
        @dragover.prevent="handleWidgetDragOver(index)"
        @dragleave="handleWidgetDragLeave"
        @drop.prevent="handleWidgetDrop(index)"
      >
        <div
          class="dashboard-card-header"
          draggable="true"
          @dragstart="handleWidgetDragStart($event, index)"
          title="Haz clic y arrastra para reubicar este widget en el dashboard"
        >
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="widget-drag-handle" title="Arrastra para mover">⠿</span>
            <span style="font-weight: 600; font-size: 13px; color: #1e293b;">
              {{ widget.title }}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <button
              type="button"
              class="widget-size-btn"
              @click="toggleWidgetSpan(widget.id)"
              :title="widget.colSpan === 'span 12' ? 'Cambiar a media pantalla' : 'Expandir a pantalla completa'"
            >
              {{ widget.colSpan === 'span 12' ? '⤡ Mitad' : '⤢ Completo' }}
            </button>
          </div>
        </div>

        <div class="dashboard-card-body">
          <!-- Widget: KPIs -->
          <div v-if="widget.id === 'kpis'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
            <div class="kpi-subcard">
              <div class="kpi-label">{{ measures[0] ? `Total ${measures[0].caption || measures[0].field}` : 'Métrica 1' }}</div>
              <div class="kpi-value" style="color: #1e293b;">
                {{ formatNumber(grandGrandTotals[0] || 0, measures[0]) }}
              </div>
            </div>
            <div v-if="measures[1]" class="kpi-subcard">
              <div class="kpi-label">{{ `Total ${measures[1].caption || measures[1].field}` }}</div>
              <div class="kpi-value" style="color: #10b981;">
                {{ formatNumber(grandGrandTotals[1] || 0, measures[1]) }}
              </div>
            </div>
            <div class="kpi-subcard">
              <div class="kpi-label">Registros Analizados</div>
              <div class="kpi-value" style="color: #2563eb;">{{ rowCount }}</div>
            </div>
            <div class="kpi-subcard">
              <div class="kpi-label">Matriz Activa</div>
              <div class="kpi-value" style="color: #8b5cf6;">
                {{ matrix.length }} filas × {{ columnDefinitions.length }} cols
              </div>
            </div>
          </div>

          <!-- Widget: Table -->
          <div v-else-if="widget.id === 'table'" style="width: 100%;">
            <PivotGrid
              :title="tableTitle"
              :slice="slice"
              :pivot-result="pivotResult"
              :currency-format="currencyFormat"
              :conditional-rules="conditionalRules"
              :table-style="tableStyle"
              :fields="fields"
              @slice-change="$emit('sliceChange', $event)"
              @clear-table="$emit('clearTable', $event)"
              @duplicate-table="$emit('duplicateTable', $event)"
            />
          </div>

          <!-- Widget: Main Chart -->
          <div v-else-if="widget.id === 'main_chart' || widget.id === 'bar'" style="width: 100%;">
            <PivotChart
              :pivot-result="pivotResult"
              :chart-type="chartStyle"
              :currency-format="currencyFormat"
              :slice="slice"
              @chart-type-change="$emit('chartStyleChange', $event)"
            />
          </div>

          <!-- Widget: Line -->
          <div v-else-if="widget.id === 'line'" style="width: 100%; height: 220px;">
            <svg width="100%" height="100%" viewBox="0 0 500 220" preserveAspectRatio="none">
              <line x1="40" y1="180" x2="480" y2="180" stroke="#cbd5e1" stroke-width="1" />
              <polyline fill="none" stroke="#10b981" stroke-width="3" :points="getLinePoints()" />
              <circle
                v-for="(r, rIdx) in chartRows"
                :key="rIdx"
                :cx="getPointX(rIdx)"
                :cy="180 - ((r.values?.[0] || 0) / maxVal) * 150"
                r="4"
                fill="#10b981"
                stroke="#fff"
                stroke-width="2"
              >
                <title>{{ `${labels[rIdx]}: ${r.values?.[0] || 0}` }}</title>
              </circle>
            </svg>
          </div>

          <!-- Widget: Donut -->
          <div v-else-if="widget.id === 'donut'" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
            <div
              v-for="(sliceItem, idx) in pieSlices.slice(0, 6)"
              :key="idx"
              style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 12px;"
            >
              <div style="display: flex; align-items: center; gap: 8px;">
                <span
                  style="width: 10px; height: 10px; border-radius: 50%;"
                  :style="{ backgroundColor: sliceItem.color }"
                />
                <span style="color: #334155; font-weight: 500;">{{ sliceItem.label }}</span>
              </div>
              <div style="font-weight: 700; color: #0f172a;">
                {{ sliceItem.percentage }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  pivotResult: { type: Object, default: null },
  currencyFormat: { type: Boolean, default: true },
  conditionalRules: { type: Array, default: () => [] },
  tableStyle: { type: String, default: 'classic_grid' },
  chartStyle: { type: String, default: 'bar_vertical' },
  slice: { type: Object, default: () => ({ rows: [], columns: [], measures: [], filters: [] }) },
  fields: { type: Array, default: () => [] },
  tableTitle: { type: String, default: 'Tabla Dinámica' }
});

const emit = defineEmits([
  'chartStyleChange',
  'sliceChange',
  'clearTable',
  'duplicateTable'
]);

const chartTitles = {
  bar_vertical: 'Columnas / Barras Verticales',
  bar_horizontal: 'Barras Horizontales',
  line_curve: 'Líneas & Tendencia',
  area_stacked: 'Área Sombreada',
  donut_pie: 'Circular / Donut',
  radar_polar: 'Radar / Spider Plot'
};

const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const initialWidgets = [
  { id: 'kpis', title: '📈 Resumen Ejecutivo de Métricas (KPIs)', colSpan: 'span 12' },
  { id: 'table', title: '📋 Tabla Dinámica Multidimensional', colSpan: 'span 12' },
  { id: 'main_chart', title: `📊 Gráfico Principal (${chartTitles[props.chartStyle] || 'Gráfico'})`, colSpan: 'span 12' },
  { id: 'donut', title: '🍩 Participación Porcentual (%)', colSpan: 'span 6' },
  { id: 'line', title: '📈 Curva de Tendencia / Evolución', colSpan: 'span 6' }
];

const widgets = ref([...initialWidgets]);

watch(() => props.chartStyle, (newStyle) => {
  widgets.value = widgets.value.map(w => {
    if (w.id === 'main_chart' || w.id === 'bar') {
      return {
        ...w,
        id: 'main_chart',
        title: `📊 Gráfico Principal (${chartTitles[newStyle] || 'Gráfico'})`
      };
    }
    return w;
  });
});

const draggedWidgetIndex = ref(null);
const dragOverIndex = ref(null);

function handleWidgetDragStart(e, index) {
  draggedWidgetIndex.value = index;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(index));
}

function handleWidgetDragOver(index) {
  dragOverIndex.value = index;
}

function handleWidgetDragLeave() {
  dragOverIndex.value = null;
}

function handleWidgetDrop(targetIndex) {
  dragOverIndex.value = null;
  if (draggedWidgetIndex.value === null || draggedWidgetIndex.value === targetIndex) return;

  const updated = [...widgets.value];
  const [movedItem] = updated.splice(draggedWidgetIndex.value, 1);
  updated.splice(targetIndex, 0, movedItem);

  widgets.value = updated;
  draggedWidgetIndex.value = null;
}

function toggleWidgetSpan(id) {
  widgets.value = widgets.value.map(w => {
    if (w.id === id) {
      return {
        ...w,
        colSpan: w.colSpan === 'span 12' ? 'span 6' : 'span 12'
      };
    }
    return w;
  });
}

function resetLayout() {
  widgets.value = [...initialWidgets];
}

// Data helpers
const matrix = computed(() => props.pivotResult?.matrix || []);
const columnDefinitions = computed(() => props.pivotResult?.columnDefinitions || []);
const grandGrandTotals = computed(() => props.pivotResult?.grandGrandTotals || []);
const measures = computed(() => props.pivotResult?.measures || []);
const rowCount = computed(() => props.pivotResult?.rowCount || 0);

const chartRows = computed(() => matrix.value.slice(0, 8));
const labels = computed(() => chartRows.value.map(r => r.rowParts?.join(' / ') || ''));

const maxVal = computed(() => {
  let max = 0;
  chartRows.value.forEach(r => {
    const v = r.values?.[0];
    if (typeof v === 'number' && v > max) max = v;
  });
  return max || 100;
});

function formatNumber(val, measure) {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'number') {
    if (measure?.caption?.includes('%') || measure?.field?.includes('pct')) {
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
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(val);
  }
  return val;
}

// Donut data
const pieData = computed(() => {
  return chartRows.value.map((r, i) => ({
    label: labels.value[i] || `Item ${i}`,
    val: typeof r.values?.[0] === 'number' ? r.values[0] : 0,
    color: colors[i % colors.length]
  }));
});

const totalPieVal = computed(() => pieData.value.reduce((acc, curr) => acc + curr.val, 0) || 1);

const pieSlices = computed(() => {
  return pieData.value.map(slice => ({
    ...slice,
    percentage: Math.round((slice.val / totalPieVal.value) * 100)
  }));
});

function getPointX(rIdx) {
  const groupWidth = 440 / (chartRows.value.length || 1);
  return 40 + rIdx * groupWidth + groupWidth / 2;
}

function getLinePoints() {
  return chartRows.value.map((r, rIdx) => {
    const val = r.values?.[0] || 0;
    const x = getPointX(rIdx);
    const y = 180 - (val / maxVal.value) * 150;
    return `${x},${y}`;
  }).join(' ');
}
</script>
