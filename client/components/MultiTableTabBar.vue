<template>
  <div class="multi-table-nav-bar">
    <!-- Table Tabs List -->
    <div class="table-tabs-list">
      <div
        v-for="t in store.tables"
        :key="t.id"
        class="table-tab-item"
        :class="{ active: t.id === store.activeTableId }"
        @click="handleSelectTable(t.id)"
        title="Haz clic para seleccionar y vincular esta tabla al panel lateral"
      >
        <span style="font-size: 13px;">📊</span>

        <input
          v-if="editingId === t.id"
          type="text"
          v-model="editingTitle"
          style="background: white; color: #0f172a; border: 1px solid #3b82f6; border-radius: 3px; font-size: 11.5px; padding: 1px 4px; outline: none; max-width: 140px;"
          autofocus
          @click.stop
          @blur="finishRename(t.id)"
          @keydown.enter="finishRename(t.id)"
        />
        <span
          v-else
          @dblclick.stop="startRename(t)"
          style="user-select: none;"
        >
          {{ t.title }}
        </span>

        <span class="table-tab-badge">
          {{ isBlank(t) ? 'En Blanco' : `${t.slice?.rows?.length || 0}F × ${t.slice?.columns?.length || 0}C | ${t.slice?.measures?.length || 0}V` }}
        </span>

        <button
          v-if="store.tables.length > 1"
          type="button"
          class="table-tab-close"
          @click.stop="confirmDelete(t)"
          title="Eliminar esta tabla"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Multi-Table View Switcher (All in Grid Canvas vs Single Table Active) -->
    <div style="display: flex; align-items: center; gap: 8px;">
      <div style="display: flex; gap: 2px; background: #1e293b; padding: 2px; border-radius: 6px; border: 1px solid #334155;">
        <button
          type="button"
          class="btn"
          :class="store.tableLayoutView === 'grid' ? 'btn-primary' : 'btn-secondary'"
          style="padding: 4px 10px; font-size: 11px; font-weight: 600;"
          @click="store.tableLayoutView = 'grid'"
          title="Ver todas las tablas simultáneamente en el lienzo de trabajo"
        >
          🔲 Ver Todas ({{ store.tables.length }})
        </button>
        <button
          type="button"
          class="btn"
          :class="store.tableLayoutView === 'single' ? 'btn-primary' : 'btn-secondary'"
          style="padding: 4px 10px; font-size: 11px; font-weight: 600;"
          @click="store.tableLayoutView = 'single'"
          title="Ver únicamente la tabla activa seleccionada"
        >
          📑 Solo Activa
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

const editingId = ref(null);
const editingTitle = ref('');

function isBlank(t) {
  const r = t.slice?.rows?.length || 0;
  const c = t.slice?.columns?.length || 0;
  const m = t.slice?.measures?.length || 0;
  return r === 0 && c === 0 && m === 0;
}

function handleSelectTable(id) {
  store.activeTableId = id;
  const el = document.getElementById('table-card-' + id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function startRename(t) {
  editingId.value = t.id;
  editingTitle.value = t.title;
}

function finishRename(id) {
  if (editingTitle.value.trim()) {
    store.renameTable(id, editingTitle.value.trim());
  }
  editingId.value = null;
}

function confirmDelete(t) {
  if (window.confirm(`¿Eliminar la tabla "${t.title}"?`)) {
    store.deleteTable(t.id);
  }
}
</script>
