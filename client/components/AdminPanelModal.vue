<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-card" style="width: 880px;" @click.stop>
      <div class="modal-header">
        <div>
          <h3>Panel de Administración (Roles, Permisos Visuales & Marca)</h3>
          <span style="font-size: 11px; color: #64748b;">
            Control de acceso basado en roles para fuentes de datos, estilos de gráficos y tablas
          </span>
        </div>
        <button class="modal-close-btn" @click="close">×</button>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 0 20px;">
        <button
          type="button"
          class="btn"
          :class="activeTab === 'users' ? 'btn-primary' : 'btn-light'"
          style="border-radius: 0; border-bottom: 2px solid;"
          :style="{ borderColor: activeTab === 'users' ? '#2563eb' : 'transparent' }"
          @click="activeTab = 'users'"
        >
          👥 Usuarios y Permisos Visuales
        </button>
        <button
          type="button"
          class="btn"
          :class="activeTab === 'sources' ? 'btn-primary' : 'btn-light'"
          style="border-radius: 0; border-bottom: 2px solid;"
          :style="{ borderColor: activeTab === 'sources' ? '#2563eb' : 'transparent' }"
          @click="activeTab = 'sources'"
        >
          🗄️ Catálogo de Fuentes
        </button>
        <button
          type="button"
          class="btn"
          :class="activeTab === 'branding' ? 'btn-primary' : 'btn-light'"
          style="border-radius: 0; border-bottom: 2px solid;"
          :style="{ borderColor: activeTab === 'branding' ? '#2563eb' : 'transparent' }"
          @click="activeTab = 'branding'"
        >
          🏢 Logo & Marca de la Empresa
        </button>
      </div>

      <div class="modal-body">
        <div v-if="feedback" style="background: #ecfdf5; color: #065f46; padding: 8px 12px; border-radius: 6px; font-size: 12px;">
          ✓ {{ feedback }}
        </div>

        <!-- TAB 1: USERS & PERMISSIONS -->
        <div v-if="activeTab === 'users'" style="display: flex; flex-direction: column; gap: 20px;">
          <form @submit.prevent="handleCreateUser" style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">
              + Crear Nuevo Usuario y Definir Permisos
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
              <div class="input-group">
                <label>Nombre Completo:</label>
                <input
                  type="text"
                  placeholder="ej. Mateo Morales"
                  class="input-control"
                  v-model="newUser.name"
                />
              </div>
              <div class="input-group">
                <label>Nombre de Usuario (Login):</label>
                <input
                  type="text"
                  placeholder="mmorales"
                  class="input-control"
                  v-model="newUser.username"
                />
              </div>
              <div class="input-group">
                <label>Rol de Acceso:</label>
                <select class="input-control" v-model="newUser.role">
                  <option value="analyst">Analista (Solo opciones permitidas)</option>
                  <option value="admin">Administrador (Acceso total & Gestión)</option>
                </select>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                Guardar Usuario
              </button>
            </div>
          </form>

          <div>
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">
              Matriz de Permisos por Usuario (Fuentes, Gráficos y Tablas):
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div
                v-for="u in users"
                :key="u.id"
                style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div>
                    <strong>{{ u.name }}</strong> <span style="color: #64748b; font-size: 11px;">@{{ u.username }}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span
                      style="padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;"
                      :style="{
                        background: u.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                        color: u.role === 'admin' ? '#92400e' : '#3730a3'
                      }"
                    >
                      {{ u.role === 'admin' ? '🛡️ Administrador' : '📊 Analista' }}
                    </span>
                    <button
                      v-if="u.id !== 'usr-1'"
                      type="button"
                      class="zone-remove-btn"
                      title="Eliminar usuario"
                      @click="handleDeleteUser(u.id)"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div v-if="u.role === 'admin'" style="font-size: 11px; color: #059669; font-weight: 500;">
                  ✓ Acceso total e irrestricto a todas las fuentes, tipos de gráficos y estilos de tablas.
                </div>

                <div v-else style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 8px; font-size: 11px;">
                  <!-- 1. Sources -->
                  <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
                    <div style="font-weight: 600; color: #334155; margin-bottom: 4px;">
                      Fuentes Autorizadas:
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                      <label v-for="s in store.availableSources" :key="s.id" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input
                          type="checkbox"
                          :checked="u.allowedSources && u.allowedSources.includes(s.id)"
                          @change="handleToggleSourcePermission(u, s.id)"
                        />
                        <span>{{ s.name }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- 2. Chart Styles -->
                  <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
                    <div style="font-weight: 600; color: #334155; margin-bottom: 4px;">
                      Estilos de Gráficos Permitidos:
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                      <label v-for="cs in catalogStyles.chartStyles" :key="cs.id" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input
                          type="checkbox"
                          :checked="(u.allowedChartStyles && u.allowedChartStyles.includes('*')) || (u.allowedChartStyles && u.allowedChartStyles.includes(cs.id))"
                          @change="handleToggleStylePermission(u, 'chart', cs.id)"
                        />
                        <span>{{ cs.name }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- 3. Table Styles -->
                  <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
                    <div style="font-weight: 600; color: #334155; margin-bottom: 4px;">
                      Estilos de Tablas Permitidos:
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                      <label v-for="ts in catalogStyles.tableStyles" :key="ts.id" style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                        <input
                          type="checkbox"
                          :checked="(u.allowedTableStyles && u.allowedTableStyles.includes('*')) || (u.allowedTableStyles && u.allowedTableStyles.includes(ts.id))"
                          @change="handleToggleStylePermission(u, 'table', ts.id)"
                        />
                        <span>{{ ts.name }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: SOURCES CATALOG -->
        <div v-else-if="activeTab === 'sources'" style="display: flex; flex-direction: column; gap: 16px;">
          <form @submit.prevent="handleCreateSource" style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">
              + Registrar Nueva Fuente en el Catálogo Corporativo
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
              <div class="input-group">
                <label>Nombre de la Fuente:</label>
                <input
                  type="text"
                  placeholder="ej. ERP Ventas Colombia"
                  class="input-control"
                  v-model="newSource.name"
                />
              </div>
              <div class="input-group">
                <label>Categoría:</label>
                <input
                  type="text"
                  placeholder="ej. Relacional / Archivo / OLAP"
                  class="input-control"
                  v-model="newSource.category"
                />
              </div>
              <div class="input-group">
                <label>Tipo:</label>
                <select class="input-control" v-model="newSource.type">
                  <option value="sql">SQL Relacional</option>
                  <option value="file">Archivo CSV / Excel</option>
                  <option value="olap">OLAP Cube / XMLA</option>
                  <option value="nosql">NoSQL / MongoDB</option>
                </select>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                Registrar Fuente
              </button>
            </div>
          </form>

          <div>
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #1e293b;">
              Fuentes en el Catálogo ({{ store.availableSources.length }}):
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div
                v-for="s in store.availableSources"
                :key="s.id"
                style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 6px;"
              >
                <div>
                  <div style="font-weight: 600; font-size: 13px; color: #0f172a;">{{ s.name }}</div>
                  <div style="font-size: 11px; color: #64748b;">
                    ID: {{ s.id }} • Categoría: {{ s.category || 'General' }} • Tipo: {{ s.type }}
                  </div>
                </div>
                <button
                  v-if="s.id !== 'demo'"
                  type="button"
                  class="zone-remove-btn"
                  title="Eliminar fuente"
                  @click="handleDeleteSource(s.id)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: BRANDING -->
        <div v-else-if="activeTab === 'branding'" style="display: flex; flex-direction: column; gap: 16px;">
          <form @submit.prevent="handleSaveBranding" style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: #1e293b;">
              Personalización de Marca & Logotipo
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div class="input-group">
                <label>Nombre de la Empresa / Plataforma:</label>
                <input
                  type="text"
                  class="input-control"
                  v-model="brandingForm.companyName"
                />
              </div>

              <div class="input-group">
                <label>Subtítulo o Eslogan:</label>
                <input
                  type="text"
                  class="input-control"
                  v-model="brandingForm.subtitle"
                />
              </div>

              <div class="input-group">
                <label>Logotipo de la Empresa (Subir archivo de imagen):</label>
                <input
                  type="file"
                  accept="image/*"
                  class="input-control"
                  @change="handleLogoFileUpload"
                />
              </div>

              <div class="input-group">
                <label>O ingresar URL de Imagen:</label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/logo.png"
                  class="input-control"
                  v-model="brandingForm.logoUrl"
                />
              </div>

              <div v-if="brandingForm.logoUrl" style="margin-top: 8px;">
                <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 4px;">Vista previa:</span>
                <img
                  :src="brandingForm.logoUrl"
                  alt="Logo preview"
                  style="max-height: 50px; max-width: 180px; object-fit: contain; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px; background: white;"
                />
              </div>

              <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  Guardar Marca y Logotipo
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="close">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  createDataSource,
  deleteDataSource,
  updateBranding,
  fetchCatalogStyles,
  fetchSupportedSources
} from '~/services/api';

const store = useAnalyticsStore();

const isOpen = computed(() => store.isAdminPanelOpen);

function close() {
  store.isAdminPanelOpen = false;
}

const activeTab = ref('users');
const users = ref([]);
const catalogStyles = ref({ chartStyles: [], tableStyles: [] });
const loading = ref(false);
const feedback = ref('');

const brandingForm = ref({
  companyName: store.branding?.companyName || 'flex_analytics',
  subtitle: store.branding?.subtitle || 'Plataforma Analítica Multidimensional',
  logoUrl: store.branding?.logoUrl || ''
});

const newUser = ref({
  username: '',
  name: '',
  role: 'analyst',
  allowedSources: ['demo'],
  allowedChartStyles: ['bar_vertical', 'bar_horizontal', 'line_curve', 'donut_pie'],
  allowedTableStyles: ['classic_grid', 'striped_zebra', 'clean_minimal']
});

const newSource = ref({
  id: '',
  name: '',
  category: 'Relacional',
  type: 'sql',
  description: ''
});

async function loadData() {
  try {
    loading.value = true;
    const [usersRes, stylesRes] = await Promise.all([
      fetchUsers(),
      fetchCatalogStyles()
    ]);
    if (usersRes.success) users.value = usersRes.users;
    if (stylesRes.success) {
      catalogStyles.value = {
        chartStyles: stylesRes.chartStyles || [],
        tableStyles: stylesRes.tableStyles || []
      };
    }
  } catch (err) {
    feedback.value = `Error: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

watch(isOpen, (open) => {
  if (open) {
    loadData();
    feedback.value = '';
    brandingForm.value = {
      companyName: store.branding?.companyName || '',
      subtitle: store.branding?.subtitle || '',
      logoUrl: store.branding?.logoUrl || ''
    };
  }
});

function handleLogoFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      brandingForm.value.logoUrl = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

async function handleSaveBranding() {
  try {
    loading.value = true;
    const res = await updateBranding(brandingForm.value);
    if (res.success) {
      feedback.value = '¡Identidad y logotipo de la empresa actualizados correctamente!';
      store.branding = res.branding;
    }
  } catch (err) {
    alert(`Error al guardar marca: ${err.message}`);
  } finally {
    loading.value = false;
  }
}

async function handleCreateUser() {
  if (!newUser.value.username || !newUser.value.name) {
    alert('Por favor ingresa usuario y nombre');
    return;
  }
  try {
    loading.value = true;
    await createUser(newUser.value);
    newUser.value = {
      username: '',
      name: '',
      role: 'analyst',
      allowedSources: ['demo'],
      allowedChartStyles: ['bar_vertical', 'bar_horizontal', 'line_curve', 'donut_pie'],
      allowedTableStyles: ['classic_grid', 'striped_zebra', 'clean_minimal']
    };
    feedback.value = 'Usuario creado exitosamente';
    await loadData();
  } catch (err) {
    alert(`Error al crear usuario: ${err.message}`);
  } finally {
    loading.value = false;
  }
}

async function handleToggleSourcePermission(user, sourceId) {
  if (user.role === 'admin') return;
  let nextAllowed = [...(user.allowedSources || [])];
  if (nextAllowed.includes(sourceId)) {
    nextAllowed = nextAllowed.filter(s => s !== sourceId);
  } else {
    nextAllowed.push(sourceId);
  }
  try {
    await updateUser(user.id, { allowedSources: nextAllowed });
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

async function handleToggleStylePermission(user, styleType, styleId) {
  if (user.role === 'admin') return;
  const key = styleType === 'chart' ? 'allowedChartStyles' : 'allowedTableStyles';
  let current = [...(user[key] || [])];
  if (current.includes(styleId)) {
    current = current.filter(id => id !== styleId);
  } else {
    current.push(styleId);
  }
  try {
    await updateUser(user.id, { [key]: current });
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteUser(userId) {
  if (!window.confirm('¿Eliminar este usuario?')) return;
  try {
    await deleteUser(userId);
    await loadData();
  } catch (err) {
    alert(err.message);
  }
}

async function handleCreateSource() {
  if (!newSource.value.name) {
    alert('Por favor especifica el nombre de la fuente');
    return;
  }
  try {
    loading.value = true;
    await createDataSource({
      ...newSource.value,
      id: newSource.value.id || `src-${Date.now()}`
    });
    newSource.value = { id: '', name: '', category: 'Relacional', type: 'sql', description: '' };
    feedback.value = 'Fuente registrada en el catálogo';
    const sRes = await fetchSupportedSources(store.currentUser?.username || 'admin');
    if (sRes.success) store.availableSources = sRes.sources;
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    loading.value = false;
  }
}

async function handleDeleteSource(sourceId) {
  if (!window.confirm('¿Eliminar esta fuente del catálogo corporativo?')) return;
  try {
    await deleteDataSource(sourceId);
    const sRes = await fetchSupportedSources(store.currentUser?.username || 'admin');
    if (sRes.success) store.availableSources = sRes.sources;
  } catch (err) {
    alert(err.message);
  }
}
</script>
