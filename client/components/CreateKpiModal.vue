<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-card kpi-modal-card" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="header-icon-badge">🎯</div>
          <div>
            <h3 class="header-title">Crear Tarjeta de Indicador KPI</h3>
            <span class="header-subtitle">
              Configura una métrica clave resumida en tiempo real para el tablero
            </span>
          </div>
        </div>
        <button class="modal-close-btn" @click="close" title="Cerrar">×</button>
      </div>

      <!-- Body -->
      <div class="kpi-modal-body">
        <div class="form-grid">
          <!-- Left: Configuration Form -->
          <div class="kpi-form-fields">
            <!-- Metric Field -->
            <div class="input-group">
              <label>Campo Métrico Numérico: <span style="color: #ef4444;">*</span></label>
              <select class="input-control" v-model="form.field" @change="onFieldChange">
                <option value="" disabled>Selecciona un campo numérico</option>
                <option
                  v-for="f in availableFields"
                  :key="f.name"
                  :value="f.name"
                >
                  {{ f.type === 'number' ? '🔢' : '🏷️' }} {{ f.name }}
                </option>
              </select>
            </div>

            <!-- Title & Subtitle -->
            <div class="form-row-2">
              <div class="input-group">
                <label>Título del KPI:</label>
                <input
                  type="text"
                  class="input-control"
                  placeholder="ej. Ventas Totales"
                  v-model="form.title"
                />
              </div>
              <div class="input-group">
                <label>Subtítulo / Contexto:</label>
                <input
                  type="text"
                  class="input-control"
                  placeholder="ej. Acumulado 2026"
                  v-model="form.subtitle"
                />
              </div>
            </div>

            <!-- Aggregation & Format -->
            <div class="form-row-2">
              <div class="input-group">
                <label>Operación de Agregación:</label>
                <select class="input-control" v-model="form.aggregation" @change="onAggChange">
                  <option value="sum">∑ Suma Total</option>
                  <option value="avg">x̄ Promedio</option>
                  <option value="max">↑ Valor Máximo</option>
                  <option value="min">↓ Valor Mínimo</option>
                  <option value="count"># Conteo de Registros</option>
                </select>
              </div>

              <div class="input-group">
                <label>Formato Visual:</label>
                <select class="input-control" v-model="form.format">
                  <option value="currency">💵 Moneda ($ COP)</option>
                  <option value="integer">🔢 Número Entero (1.234)</option>
                  <option value="decimal">⚖️ Decimal (1.234,56)</option>
                  <option value="percent">％ Porcentaje (0 - 100%)</option>
                </select>
              </div>
            </div>

            <!-- Icon & Color Picker -->
            <div class="form-row-2">
              <div class="input-group">
                <label>Ícono Visual:</label>
                <div class="icon-selector-row">
                  <button
                    v-for="ic in availableIcons"
                    :key="ic"
                    type="button"
                    class="icon-tile-btn"
                    :class="{ active: form.icon === ic }"
                    @click="form.icon = ic"
                  >
                    {{ ic }}
                  </button>
                </div>
              </div>

              <div class="input-group">
                <label>Color de Énfasis:</label>
                <div class="color-selector-row">
                  <button
                    v-for="c in colorOptions"
                    :key="c.color"
                    type="button"
                    class="color-circle-btn"
                    :style="{ background: c.color }"
                    :class="{ active: form.color === c.color }"
                    :title="c.label"
                    @click="form.color = c.color"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Live Preview Box -->
          <div class="kpi-preview-column">
            <span class="preview-label">👁️ Vista Previa en Vivo</span>
            <div class="kpi-live-card" :style="{ borderTopColor: form.color }">
              <div class="live-card-header">
                <span class="live-card-icon">{{ form.icon }}</span>
                <span class="live-card-agg-pill" :style="{ background: form.color + '20', color: form.color }">
                  {{ aggLabel(form.aggregation) }}
                </span>
              </div>
              <div class="live-card-title">{{ form.title || 'Título de Métrica' }}</div>
              <div class="live-card-value">
                {{ formatPreviewValue() }}
              </div>
              <div class="live-card-footer">
                <span>Campo: <strong>{{ form.field || 'N/A' }}</strong></span>
                <span v-if="form.subtitle" style="color: #94a3b8;">• {{ form.subtitle }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <button type="button" class="btn btn-light" @click="close">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          style="padding: 8px 20px; font-weight: 600;"
          :disabled="!form.field || isSubmitting"
          @click="handleSave"
        >
          {{ isSubmitting ? 'Creando...' : '✓ Crear Tarjeta KPI' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';
import { computePivot } from '~/services/api';

const store = useAnalyticsStore();

const isOpen = computed(() => store.isCreateKpiModalOpen);

function close() {
  store.isCreateKpiModalOpen = false;
  store.preselectedKpiField = null;
}

const isSubmitting = ref(false);
const previewValue = ref(null);
const isPreviewLoading = ref(false);

const availableIcons = ['🎯', '💰', '📈', '📦', '🏆', '⭐', '⚡', '🏢'];
const colorOptions = [
  { color: '#2563eb', label: 'Azul Real' },
  { color: '#059669', label: 'Verde Esmeralda' },
  { color: '#7c3aed', label: 'Púrpura' },
  { color: '#d97706', label: 'Ámbar' },
  { color: '#e11d48', label: 'Rosa Intenso' },
  { color: '#0891b2', label: 'Cian' }
];

const form = ref({
  field: '',
  title: '',
  subtitle: 'Resumen consolidado',
  aggregation: 'sum',
  format: 'currency',
  icon: '🎯',
  color: '#2563eb'
});

const availableFields = computed(() => {
  if (store.numberFields && store.numberFields.length > 0) {
    return store.numberFields;
  }
  return store.fields || [];
});

async function computePreview() {
  if (!form.value.field) {
    previewValue.value = null;
    return;
  }
  try {
    isPreviewLoading.value = true;
    const slice = {
      rows: [],
      columns: [],
      measures: [{ field: form.value.field, aggregation: form.value.aggregation, caption: 'preview_kpi' }],
      filters: []
    };
    const res = await computePivot(slice, store.sessionId);
    if (res && res.success && res.result) {
      previewValue.value = res.result.grandGrandTotals?.[0] ?? res.result.grandTotals?.[0] ?? 0;
    } else {
      previewValue.value = 0;
    }
  } catch (err) {
    console.error('Error computing preview KPI:', err);
    previewValue.value = 0;
  } finally {
    isPreviewLoading.value = false;
  }
}

watch(isOpen, async (open) => {
  if (open) {
    const pre = store.preselectedKpiField;
    const initialField = pre || (store.numberFields[0]?.name) || (store.fields[0]?.name) || '';
    form.value.field = initialField;
    updateDefaultTitle();
    await computePreview();
  }
});

function onFieldChange() {
  updateDefaultTitle();
  computePreview();
}

function onAggChange() {
  updateDefaultTitle();
  computePreview();
}

function updateDefaultTitle() {
  if (!form.value.field) return;
  const agg = aggLabel(form.value.aggregation);
  const cleanName = form.value.field.replace(/_/g, ' ');
  form.value.title = `${agg} de ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`;
}

function aggLabel(agg) {
  switch (agg) {
    case 'sum': return 'Suma Total';
    case 'avg': return 'Promedio';
    case 'max': return 'Máximo';
    case 'min': return 'Mínimo';
    case 'count': return 'Conteo';
    default: return 'Valor';
  }
}

function formatPreviewValue() {
  if (isPreviewLoading.value) return '⏳ Calculando...';
  if (previewValue.value === null || previewValue.value === undefined || isNaN(previewValue.value)) return '—';
  const num = Number(previewValue.value);

  if (form.value.format === 'currency') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(num);
  }

  if (form.value.format === 'percent') {
    return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(num)}%`;
  }

  if (form.value.format === 'decimal') {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num);
}

async function handleSave() {
  if (!form.value.field) return;
  try {
    isSubmitting.value = true;
    const newKpi = await store.addKpi({
      field: form.value.field,
      title: form.value.title.trim(),
      subtitle: form.value.subtitle.trim(),
      aggregation: form.value.aggregation,
      format: form.value.format,
      icon: form.value.icon,
      color: form.value.color,
      initialValue: previewValue.value
    });
    close();
  } catch (err) {
    alert(`Error al crear KPI: ${err.message}`);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

.kpi-modal-card {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 760px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.modal-header {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-icon-badge {
  font-size: 22px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.header-subtitle {
  font-size: 11.5px;
  color: #64748b;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
}

.modal-close-btn:hover {
  color: #0f172a;
}

.kpi-modal-body {
  padding: 20px;
  background: white;
}

.form-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.kpi-form-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group label {
  font-size: 11.5px;
  font-weight: 600;
  color: #334155;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input-control {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 12px;
  background: white;
  outline: none;
  transition: border-color 0.15s;
}

.input-control:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.icon-selector-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.icon-tile-btn {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.icon-tile-btn.active {
  background: #eff6ff;
  border-color: #2563eb;
  box-shadow: 0 0 0 1px #2563eb;
}

.color-selector-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 4px;
}

.color-circle-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid white;
  outline: 1px solid #cbd5e1;
  cursor: pointer;
  transition: transform 0.15s;
}

.color-circle-btn.active {
  outline: 2px solid #0f172a;
  transform: scale(1.15);
}

/* Preview column */
.kpi-preview-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px;
  border: 1px dashed #cbd5e1;
}

.preview-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.kpi-live-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-top: 4px solid #2563eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.live-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.live-card-icon {
  font-size: 24px;
}

.live-card-agg-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

.live-card-title {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.live-card-value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.live-card-footer {
  font-size: 11px;
  color: #64748b;
  border-top: 1px solid #f1f5f9;
  padding-top: 6px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.modal-footer {
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
