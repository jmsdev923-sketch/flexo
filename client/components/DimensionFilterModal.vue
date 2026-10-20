<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-card" style="width: 450px;" @click.stop>
      <div class="modal-header">
        <div>
          <h3>🔍 Filtrar Miembros: {{ fieldName }}</h3>
          <span style="font-size: 11px; color: #64748b;">
            Incluye o excluye valores individuales para esta dimensión
          </span>
        </div>
        <button class="modal-close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <input
          type="text"
          placeholder="Buscar valor..."
          class="input-control"
          v-model="searchTerm"
        />

        <div style="display: flex; gap: 8px; font-size: 11px;">
          <button type="button" class="btn btn-light" style="padding: 3px 8px;" @click="selectAll">
            Seleccionar Todo
          </button>
          <button type="button" class="btn btn-light" style="padding: 3px 8px;" @click="clearAll">
            Deseleccionar Todo
          </button>
          <span style="margin-left: auto; color: #64748b; align-self: center;">
            {{ selected.length }} de {{ values.length }} seleccionados
          </span>
        </div>

        <div style="max-height: 220px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; display: flex; flex-direction: column; gap: 4px;">
          <div v-if="loading" style="text-align: center; padding: 20px; color: #94a3b8;">
            Cargando valores...
          </div>

          <template v-else>
            <label
              v-for="val in filteredList"
              :key="val"
              style="display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 12.5px;"
              :style="{ background: selected.includes(val) ? '#f0fdf4' : 'transparent' }"
            >
              <input
                type="checkbox"
                :checked="selected.includes(val)"
                @change="toggleValue(val)"
              />
              <span>{{ val }}</span>
            </label>

            <div v-if="filteredList.length === 0" style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">
              No se encontraron valores coincidentes
            </div>
          </template>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="close">
          Cancelar
        </button>
        <button type="button" class="btn btn-primary" @click="handleApply">
          Aplicar Filtro
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';
import { fetchDistinctValues } from '~/services/api';

const store = useAnalyticsStore();

const isOpen = computed(() => Boolean(store.filterModalField));
const fieldName = computed(() => store.filterModalField || '');

function close() {
  store.filterModalField = null;
}

const values = ref([]);
const selected = ref([]);
const searchTerm = ref('');
const loading = ref(false);

watch(fieldName, async (newField) => {
  if (newField) {
    try {
      loading.value = true;
      const res = await fetchDistinctValues(newField, store.sessionId);
      if (res.success) {
        values.value = res.values || [];
        const currentFilter = store.activeTable.slice?.filters?.find(f => f.field === newField);
        if (currentFilter && currentFilter.include?.length > 0) {
          selected.value = [...currentFilter.include];
        } else {
          selected.value = [...(res.values || [])];
        }
      }
    } catch (err) {
      console.error('Error fetching distinct values:', err);
    } finally {
      loading.value = false;
    }
  }
});

const filteredList = computed(() => {
  const q = searchTerm.value.toLowerCase().trim();
  if (!q) return values.value;
  return values.value.filter(v => String(v).toLowerCase().includes(q));
});

function toggleValue(val) {
  if (selected.value.includes(val)) {
    selected.value = selected.value.filter(item => item !== val);
  } else {
    selected.value.push(val);
  }
}

function selectAll() {
  selected.value = [...values.value];
}

function clearAll() {
  selected.value = [];
}

function handleApply() {
  store.applyFilter(fieldName.value, selected.value);
  close();
}
</script>
