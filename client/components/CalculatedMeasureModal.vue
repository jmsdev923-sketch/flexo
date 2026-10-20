<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-card" style="width: 650px;" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h3>✨ Crear Campo Calculado / Métrica</h3>
          <span style="font-size: 11px; color: #64748b;">
            Crea operaciones básicas (sumar, promedio, máximo, mínimo, contar) o fórmulas aritméticas
          </span>
        </div>
        <button class="modal-close-btn" @click="close">×</button>
      </div>

      <!-- Mode Tabs -->
      <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 0 16px;">
        <button
          type="button"
          class="btn"
          :class="calcMode === 'basic' ? 'btn-primary' : 'btn-light'"
          style="border-radius: 0; border-bottom: 2px solid;"
          :style="{ borderColor: calcMode === 'basic' ? '#2563eb' : 'transparent' }"
          @click="calcMode = 'basic'"
        >
          📊 Operación Básica (Suma, Promedio, Max, Min, Conteo)
        </button>
        <button
          type="button"
          class="btn"
          :class="calcMode === 'formula' ? 'btn-primary' : 'btn-light'"
          style="border-radius: 0; border-bottom: 2px solid;"
          :style="{ borderColor: calcMode === 'formula' ? '#2563eb' : 'transparent' }"
          @click="calcMode = 'formula'"
        >
          🧮 Fórmula Matemática entre Campos
        </button>
      </div>

      <div class="modal-body">
        <!-- MODE 1: BASIC OPERATION (Sum, Avg, Max, Min, Count) -->
        <div v-if="calcMode === 'basic'" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- 1. Select Field -->
          <div class="input-group">
            <label>1. Selecciona el Campo Base:</label>
            <select class="input-control" v-model="selectedField" @change="autoGenerateCaption">
              <option value="" disabled>-- Selecciona un campo --</option>
              <optgroup label="Campos Numéricos">
                <option v-for="f in numericFields" :key="'num-' + f.name" :value="f.name">
                  🔢 {{ f.name }}
                </option>
              </optgroup>
              <optgroup label="Campos de Texto / Dimensiones (para Conteo)">
                <option v-for="f in stringFields" :key="'str-' + f.name" :value="f.name">
                  🏷️ {{ f.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- 2. Select Basic Operation -->
          <div class="input-group">
            <label>2. Selecciona la Operación Básica:</label>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
              <button
                v-for="op in basicOperations"
                :key="op.id"
                type="button"
                class="btn"
                :class="selectedOperation === op.id ? 'btn-primary' : 'btn-light'"
                style="display: flex; flex-direction: column; align-items: center; padding: 10px 4px; gap: 4px;"
                @click="selectedOperation = op.id; autoGenerateCaption()"
              >
                <span style="font-size: 16px;">{{ op.icon }}</span>
                <span style="font-size: 11px; font-weight: 700;">{{ op.label }}</span>
                <span style="font-size: 9px; color: #64748b;">{{ op.desc }}</span>
              </button>
            </div>
          </div>

          <!-- 3. Custom Name / Caption -->
          <div class="input-group">
            <label>3. Nombre de la Métrica en la Tabla:</label>
            <input
              type="text"
              class="input-control"
              placeholder="ej. Promedio de Ventas"
              v-model="basicCaption"
            />
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 6px; font-size: 11.5px; color: #166534;">
            💡 <strong>Resultado:</strong> Se agregará la métrica <strong>"{{ basicCaption || 'Nueva Métrica' }}"</strong> aplicando la operación <strong>{{ currentOpLabel }}</strong> sobre el campo <strong>{{ selectedField || '...' }}</strong> en la tabla dinámica.
          </div>
        </div>

        <!-- MODE 2: FORMULA ARITHMETIC -->
        <div v-else style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Caption / Name -->
          <div class="input-group">
            <label>Nombre del Campo Calculado:</label>
            <input
              type="text"
              placeholder="ej. Margen Bruto ($) o Rentabilidad %"
              class="input-control"
              v-model="formulaCaption"
            />
          </div>

          <!-- Formula Textarea -->
          <div class="input-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="margin-bottom: 0;">Fórmula Aritmética:</label>
              <span style="font-size: 10px; color: #64748b;">Usa campos y operadores: +, -, *, /, ( )</span>
            </div>
            <textarea
              placeholder="ej. [valor_documento] - [costo_de_venta]"
              class="input-control"
              style="height: 60px; font-family: monospace; font-size: 12px;"
              v-model="formulaText"
            />
          </div>

          <!-- Math Operator Buttons -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button
              v-for="op in ['+', '-', '*', '/', '(', ')', '100', '0.19']"
              :key="op"
              type="button"
              class="btn btn-light"
              style="font-family: monospace; font-weight: bold; font-size: 12px; padding: 3px 10px;"
              @click="insertToken(op)"
            >
              {{ op }}
            </button>
          </div>

          <!-- Field Picker -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc;">
            <div style="font-size: 11px; font-weight: 600; color: #334155; margin-bottom: 6px;">
              Haz clic en un campo para insertarlo en la fórmula:
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; max-height: 100px; overflow-y: auto;">
              <button
                v-for="f in store.fields"
                :key="f.name"
                type="button"
                class="btn btn-light"
                style="font-size: 11px; padding: 3px 8px; border-radius: 12px; background: white;"
                @click="insertToken(`[${f.name}]`)"
              >
                {{ f.type === 'number' ? '🔢' : '🏷️' }} {{ f.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="close">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="calcMode === 'basic' ? !isBasicValid : !isFormulaValid"
          @click="handleSubmit"
        >
          ➕ Agregar a la Tabla Dinámica
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

const isOpen = computed(() => store.isCalculatedModalOpen);

function close() {
  store.isCalculatedModalOpen = false;
}

const calcMode = ref('basic'); // 'basic' | 'formula'

// Mode 1: Basic
const selectedField = ref('');
const selectedOperation = ref('sum');
const basicCaption = ref('');

const basicOperations = [
  { id: 'sum', label: 'Sumar', icon: '➕', desc: 'Suma total' },
  { id: 'avg', label: 'Promedio', icon: '➗', desc: 'Media' },
  { id: 'max', label: 'Máximo', icon: '📈', desc: 'Valor tope' },
  { id: 'min', label: 'Mínimo', icon: '📉', desc: 'Menor valor' },
  { id: 'count', label: 'Contar', icon: '🔢', desc: 'Recuento' }
];

const currentOpLabel = computed(() => {
  const found = basicOperations.find(o => o.id === selectedOperation.value);
  return found ? found.label.toUpperCase() : 'SUMA';
});

const numericFields = computed(() => store.fields.filter(f => f.type === 'number'));
const stringFields = computed(() => store.fields.filter(f => f.type !== 'number'));

function autoGenerateCaption() {
  if (!selectedField.value) return;
  const opObj = basicOperations.find(o => o.id === selectedOperation.value);
  const opLabel = opObj ? opObj.label : 'Suma';
  const cleanField = selectedField.value.replace(/_/g, ' ');
  basicCaption.value = `${opLabel} de ${cleanField}`;
}

// Mode 2: Formula
const formulaCaption = ref('');
const formulaText = ref('');

function insertToken(token) {
  const cur = formulaText.value || '';
  formulaText.value = cur ? `${cur} ${token}` : token;
}

const isBasicValid = computed(() => {
  return Boolean(selectedField.value && selectedOperation.value && basicCaption.value.trim());
});

const isFormulaValid = computed(() => {
  if (!formulaCaption.value.trim() || !formulaText.value.trim()) return false;
  const openP = (formulaText.value.match(/\(/g) || []).length;
  const closeP = (formulaText.value.match(/\)/g) || []).length;
  return openP === closeP;
});

watch(isOpen, (open) => {
  if (open) {
    if (numericFields.value.length > 0 && !selectedField.value) {
      selectedField.value = numericFields.value[0].name;
      autoGenerateCaption();
    }
  }
});

function handleSubmit() {
  if (calcMode.value === 'basic') {
    if (!isBasicValid.value) return;

    const measureKey = `${selectedOperation.value}_${selectedField.value}`;
    store.addCalculatedMeasure({
      name: selectedField.value,
      aggregation: selectedOperation.value,
      caption: basicCaption.value.trim()
    });
  } else {
    if (!isFormulaValid.value) return;

    const fieldKey = 'calc_' + formulaCaption.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    store.addCalculatedMeasure({
      name: fieldKey,
      aggregation: 'calc',
      caption: formulaCaption.value.trim(),
      formula: formulaText.value.trim()
    });
  }

  close();
}
</script>
