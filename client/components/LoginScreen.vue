<template>
  <div class="login-wrapper">
    <div class="login-card">
      <!-- Brand / Company Logo Header -->
      <div class="login-brand">
        <img
          v-if="store.branding?.logoUrl"
          :src="store.branding.logoUrl"
          :alt="store.branding.companyName"
          style="max-height: 55px; max-width: 200px; object-fit: contain; margin-bottom: 8px;"
        />
        <div v-else class="login-logo-badge">FA</div>

        <h2 class="login-title">{{ store.branding?.companyName || 'flex_analytics' }}</h2>
        <p class="login-subtitle">
          {{ store.branding?.subtitle || 'Plataforma Analítica Multidimensional & Tablas Dinámicas' }}
        </p>
      </div>

      <div v-if="error" class="login-error-alert">
        ⚠️ {{ error }}
      </div>

      <!-- Credentials Form -->
      <form @submit.prevent="handleSubmit" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="input-group">
          <label style="font-size: 12px; font-weight: 600;">Usuario o Correo:</label>
          <input
            type="text"
            class="input-control"
            placeholder="ej. admin o mmorales"
            v-model="username"
            autofocus
          />
        </div>

        <div class="input-group">
          <label style="font-size: 12px; font-weight: 600;">Contraseña:</label>
          <input
            type="password"
            class="input-control"
            placeholder="••••••••"
            v-model="password"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          style="width: 100%; padding: 10px; font-size: 14px; justify-content: center; margin-top: 6px;"
          :disabled="loading"
        >
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <!-- Quick Demo Logins -->
      <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <div style="font-size: 11px; color: #64748b; text-align: center; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          Acceso Rápido para Pruebas:
        </div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
          <button
            type="button"
            class="quick-login-btn"
            @click="handleQuickLogin('admin')"
          >
            <div>
              <strong>🛡️ Juan Pérez</strong> <span style="font-size: 10px; color: #92400e;">(Admin Total)</span>
            </div>
            <span style="font-size: 11px; color: #2563eb;">Entrar →</span>
          </button>

          <button
            type="button"
            class="quick-login-btn"
            @click="handleQuickLogin('analista_ventas')"
          >
            <div>
              <strong>📊 Laura Gómez</strong> <span style="font-size: 10px; color: #3730a3;">(Analista Ventas)</span>
            </div>
            <span style="font-size: 11px; color: #2563eb;">Entrar →</span>
          </button>

          <button
            type="button"
            class="quick-login-btn"
            @click="handleQuickLogin('analista_bi')"
          >
            <div>
              <strong>📊 Carlos Ruiz</strong> <span style="font-size: 10px; color: #3730a3;">(Analista BI)</span>
            </div>
            <span style="font-size: 11px; color: #2563eb;">Entrar →</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';
import { loginUser } from '~/services/api';

const store = useAnalyticsStore();

const username = ref('admin');
const password = ref('••••••••');
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  if (!username.value.trim()) {
    error.value = 'Por favor ingresa tu usuario';
    return;
  }

  try {
    loading.value = true;
    error.value = '';
    const res = await loginUser(username.value.trim());
    if (res.success) {
      await store.login(res.user);
    }
  } catch (err) {
    error.value = err.message || 'Credenciales incorrectas';
  } finally {
    loading.value = false;
  }
}

async function handleQuickLogin(uname) {
  username.value = uname;
  try {
    loading.value = true;
    error.value = '';
    const res = await loginUser(uname);
    if (res.success) {
      await store.login(res.user);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
