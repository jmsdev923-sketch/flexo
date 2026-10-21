<template>
  <div class="multi-table-nav-bar">
    <!-- Chart Tabs List -->
    <div class="table-tabs-list">
      <div
        v-for="c in store.charts"
        :key="c.id"
        class="table-tab-item"
        :class="{ active: c.id === store.activeChartId }"
        @click="handleSelectChart(c.id)"
        title="Haz clic para seleccionar y vincular este gráfico al panel lateral"
      >
        <span style="font-size: 13px;">{{ chartIcons[c.chartType] || '📈' }}</span>

        <input
          v-if="editingId === c.id"
          type="text"
          v-model="editingTitle"
          style="background: white; color: #0f172a; border: 1px solid #3b82f6; border-radius: 3px; font-size: 11.5px; padding: 1px 4px; outline: none; max-width: 140px;"
          autofocus
          @click.stop
          @blur="finishRename(c.id)"
          @keydown.enter="finishRename(c.id)"
        />
        <span
          v-else
          @dblclick.stop="startRename(c)"
          style="user-select: none;"
        >
          {{ c.title }}
        </span>

        <span class="table-tab-badge">
          {{ isBlank(c) ? 'En Blanco' : (c.slice?.rows?.[0] ? `${c.slice.rows[0]}` : 'Activo') }}
        </span>

        <button
          v-if="store.charts.length > 1"
          type="button"
          class="table-tab-close"
          @click.stop="confirmDelete(c)"
          title="Eliminar este gráfico"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Multi-Chart View Switcher (All in Grid Panel vs Single Chart Active) -->
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="display: flex; gap: 2px; background: #1e293b; padding: 2px; border-radius: 6px; border: 1px solid #334155;">
        <button
          type="button"
          class="btn"
          :class="store.chartLayoutView === 'grid' ? 'btn-primary' : 'btn-secondary'"
          style="padding: 4px 10px; font-size: 11px; font-weight: 600;"
          @click="store.chartLayoutView = 'grid'"
          title="Ver todos los gráficos simultáneamente en el panel analítico"
        >
          🔲 Ver Todos ({{ store.charts.length }})
        </button>
        <button
          type="button"
          class="btn"
          :class="store.chartLayoutView === 'single' ? 'btn-primary' : 'btn-secondary'"
          style="padding: 4px 10px; font-size: 11px; font-weight: 600;"
          @click="store.chartLayoutView = 'single'"
          title="Ver únicamente el gráfico activo seleccionado"
        >
          📈 Solo Activo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

const chartIcons = {
  bar_vertical: '📊',
  bar_horizontal: '📊',
  line_curve: '📈',
  area_stacked: '🌊',
  donut_pie: '🍩',
  radar_polar: '🕸️'
};

const editingId = ref(null);
const editingTitle = ref('');

function isBlank(c) {
  const r = c.slice?.rows?.length || 0;
  const m = c.slice?.measures?.length || 0;
  return r === 0 && m === 0;
}

function handleSelectChart(id) {
  store.activeChartId = id;
  const el = document.getElementById('chart-card-' + id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function startRename(c) {
  editingId.value = c.id;
  editingTitle.value = c.title;
}

function finishRename(id) {
  if (editingTitle.value.trim()) {
    store.renameChart(id, editingTitle.value.trim());
  }
  editingId.value = null;
}

function confirmDelete(c) {
  if (window.confirm(`¿Eliminar el gráfico "${c.title}"?`)) {
    store.deleteChart(c.id);
  }
}
</script>
