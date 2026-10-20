<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-card" style="width: 600px;" @click.stop>
      <div class="modal-header">
        <div>
          <h3>🎨 Reglas de Formato Condicional (Semáforos)</h3>
          <span style="font-size: 11px; color: #64748b;">
            Resalta valores críticos en la tabla según metas y umbrales
          </span>
        </div>
        <button class="modal-close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <!-- New Rule Form -->
        <form @submit.prevent="handleAddRule" style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">
            + Agregar Nueva Condición de Color
          </div>

          <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 10px;">
            <div class="input-group">
              <label>Métrica:</label>
              <select class="input-control" v-model="selectedField">
                <option v-for="m in activeMeasures" :key="m.field" :value="m.field">
                  {{ m.caption || m.field }}
                </option>
              </select>
            </div>

            <div class="input-group">
              <label>Condición:</label>
              <select class="input-control" v-model="operator">
                <option value="lt">Menor que (&lt;)</option>
                <option value="gt">Mayor que (&gt;)</option>
                <option value="lte">Menor o igual (&le;)</option>
                <option value="gte">Mayor o igual (&ge;)</option>
              </select>
            </div>

            <div class="input-group">
              <label>Valor Umbral:</label>
              <input
                type="number"
                class="input-control"
                v-model.number="thresholdValue"
              />
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; font-weight: 600;">Color de resalte:</span>
              <select
                class="input-control"
                style="font-size: 12px; padding: 4px 8px;"
                v-model="colorPreset"
              >
                <option value="red">🔴 Alerta (Rojo)</option>
                <option value="green">🟢 Éxito (Verde)</option>
                <option value="yellow">🟡 Advertencia (Amarillo)</option>
                <option value="blue">🔵 Destacado (Azul)</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary">
              Guardar Regla
            </button>
          </div>
        </form>

        <!-- Active Rules List -->
        <div>
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #1e293b;">
            Reglas Activas ({{ store.conditionalRules.length }}):
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div
              v-for="r in store.conditionalRules"
              :key="r.id"
              style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 12px;"
              :style="{ backgroundColor: r.bgColor, color: r.textColor }"
            >
              <div>
                {{ r.measureField }} {{ r.operator === 'lt' ? '<' : r.operator === 'gt' ? '>' : r.operator === 'lte' ? '<=' : '>=' }} {{ r.value }}
              </div>
              <button
                type="button"
                style="background: none; border: none; cursor: pointer; font-size: 14px;"
                :style="{ color: r.textColor }"
                @click="handleRemoveRule(r.id)"
              >
                ×
              </button>
            </div>

            <div v-if="store.conditionalRules.length === 0" style="color: #94a3b8; font-size: 12px; font-style: italic;">
              No hay reglas de formato condicional configuradas.
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-primary" @click="close">
          Aplicar y Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

const isOpen = computed(() => store.isConditionalModalOpen);

function close() {
  store.isConditionalModalOpen = false;
}

const colorPresets = {
  red: { name: '🔴 Alerta (Rojo suave)', bg: '#fee2e2', text: '#991b1b' },
  green: { name: '🟢 Éxito (Verde suave)', bg: '#dcfce7', text: '#166534' },
  yellow: { name: '🟡 Precaución (Amarillo)', bg: '#fef3c7', text: '#92400e' },
  blue: { name: '🔵 Destacado (Azul)', bg: '#dbeafe', text: '#1e40af' }
};

const activeMeasures = computed(() => store.activeTable.slice?.measures || []);

const selectedField = ref(activeMeasures.value[0]?.field || 'valor_documento');
const operator = ref('lt');
const thresholdValue = ref(5000);
const colorPreset = ref('red');

function handleAddRule() {
  if (!selectedField.value) return;

  const chosenColors = colorPresets[colorPreset.value];
  const newRule = {
    id: `rule-${Date.now()}`,
    measureField: selectedField.value,
    operator: operator.value,
    value: Number(thresholdValue.value),
    bgColor: chosenColors.bg,
    textColor: chosenColors.text
  };

  store.conditionalRules.push(newRule);
}

function handleRemoveRule(ruleId) {
  store.conditionalRules = store.conditionalRules.filter(r => r.id !== ruleId);
}
</script>
