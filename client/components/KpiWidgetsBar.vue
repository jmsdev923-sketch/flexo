<template>
  <section class="kpi-section-container">
    <!-- 1. Populated State: Horizontal Grid of KPI Cards -->
    <div v-if="store.kpis.length > 0" class="kpi-grid">
      <div
        v-for="kpi in store.kpis"
        :key="kpi.id"
        class="kpi-card"
        :style="{ borderTopColor: kpi.color || '#2563eb' }"
      >
        <div class="kpi-card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="kpi-icon">{{ kpi.icon || '🎯' }}</span>
            <span class="kpi-title" :title="kpi.title">{{ kpi.title }}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 4px;">
            <span
              class="kpi-agg-pill"
              :style="{ background: (kpi.color || '#2563eb') + '18', color: kpi.color || '#2563eb' }"
            >
              {{ aggLabel(kpi.aggregation) }}
            </span>
            <button
              type="button"
              class="kpi-delete-btn"
              @click="store.deleteKpi(kpi.id)"
              title="Eliminar este KPI"
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
            {{ formatValue(kpi.value, kpi.format) }}
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

      <!-- Add New KPI Quick Button Card -->
      <button
        type="button"
        class="kpi-add-card-btn"
        @click="store.isCreateKpiModalOpen = true"
        title="Crear otra tarjeta KPI"
      >
        <span style="font-size: 20px;">➕</span>
        <span style="font-size: 11px; font-weight: 700;">+ Agregar KPI</span>
      </button>
    </div>

    <!-- 2. Zero State (When source is connected but no KPIs yet) -->
    <div
      v-else-if="store.fields.length > 0"
      class="kpi-empty-strip"
    >
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">🎯</span>
        <div>
          <strong style="font-size: 12px; color: #1e293b; display: block;">
            Tarjetas de Indicadores Clave (KPI)
          </strong>
          <span style="font-size: 11px; color: #64748b;">
            Resume totales, promedios o conteos ejecutivos de tu archivo o base de datos en tiempo real.
          </span>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-primary"
        style="font-size: 11px; padding: 5px 12px; font-weight: 600;"
        @click="store.isCreateKpiModalOpen = true"
      >
        🎯 + Crear Primer KPI
      </button>
    </div>
  </section>
</template>

<script setup>
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

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

function formatValue(val, format) {
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
.kpi-section-container {
  padding: 12px 16px 4px 16px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.kpi-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-top: 3.5px solid #2563eb;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}

.kpi-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-icon {
  font-size: 16px;
}

.kpi-title {
  font-size: 11.5px;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}

.kpi-agg-pill {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

.kpi-delete-btn {
  background: none;
  border: none;
  font-size: 15px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.kpi-delete-btn:hover {
  color: #ef4444;
}

.kpi-card-body {
  margin: 2px 0;
}

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.1;
  font-feature-settings: "tnum";
}

.kpi-loading {
  font-size: 12px;
  color: #d97706;
  font-weight: 600;
}

.kpi-card-footer {
  font-size: 10px;
  color: #64748b;
  border-top: 1px solid #f1f5f9;
  padding-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-field-tag {
  color: #475569;
}

.kpi-subtext {
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Quick Add Button Card */
.kpi-add-card-btn {
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #64748b;
  cursor: pointer;
  padding: 12px;
  min-height: 95px;
  transition: all 0.15s ease;
}

.kpi-add-card-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #2563eb;
}

/* Empty strip */
.kpi-empty-strip {
  background: white;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
