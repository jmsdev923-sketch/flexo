<template>
  <div class="app-container">
    <!-- Unauthenticated View -->
    <LoginScreen v-if="!store.isAuthenticated" />

    <!-- Authenticated Enterprise Pivot Workspace -->
    <template v-else>
      <!-- LEFT SIDEBAR: Brand, Login User Data, and Options Menu underneath -->
      <AppSidebar />

      <div class="app-main-layout">
        <!-- Collapsible Fields Panel & Pivot Drop Zones -->
        <FieldsPanel v-if="store.isSidebarOpen" />

        <!-- Main Analytics Workspace Area -->
        <main class="workspace-area">
          <!-- Top workspace status bar with breadcrumb and active filters -->
          <TopStatusBar />

          <!-- Executive KPI Cards Strip (Rendered on dedicated Grid/Chart views; in Combined Dashboard it is integrated) -->
          <KpiWidgetsBar v-if="store.currentView !== 'combined'" />

          <!-- 1. TABLE VIEW: Shows ALL tables created -->
          <div v-if="store.currentView === 'grid'" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <!-- Tab bar shown when 2 or more tables exist -->
            <MultiTableTabBar v-if="store.tables.length > 1" />

            <div class="multi-instances-scroll-container">
              <div
                v-for="tbl in (store.tableLayoutView === 'single' ? [store.activeTable] : store.tables)"
                :key="tbl.id"
                :id="`table-card-${tbl.id}`"
                class="instance-card-wrapper"
                :class="{ 'is-active-instance': tbl.id === store.activeTableId }"
                @click="store.activeTableId = tbl.id"
              >
                <!-- Active Header Tag when multiple tables exist -->
                <div v-if="store.tables.length > 1" class="instance-active-indicator-header">
                  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span
                        class="instance-badge-pill"
                        :class="{ current: tbl.id === store.activeTableId }"
                      >
                        {{ tbl.id === store.activeTableId ? '🎯 Tabla Seleccionada (Vinculada a Zonas de Arrastre)' : '⚪ Haz clic para editar esta tabla en el Panel Lateral' }}
                      </span>
                      <strong style="font-size: 12.5px; color: #1e293b;">{{ tbl.title }}</strong>
                    </div>

                    <span v-if="tbl.id === store.activeTableId" style="font-size: 11px; color: #2563eb; font-weight: 700;">
                      ✏️ Activa en Zonas de Arrastre
                    </span>
                  </div>
                </div>

                <PivotGrid
                  :table-id="tbl.id"
                  :title="tbl.title"
                  :slice="tbl.slice"
                  :pivot-result="tbl.result"
                  :currency-format="tbl.currencyFormat"
                  :conditional-rules="store.conditionalRules"
                  :table-style="tbl.tableStyle"
                  :fields="store.fields"
                  :loading="tbl.loading"
                  :can-delete="store.tables.length > 1"
                  @title-change="store.renameTable(tbl.id, $event)"
                  @slice-change="store.computePivotForTable(tbl.id, $event)"
                  @table-style-change="tbl.tableStyle = $event"
                  @toggle-currency="tbl.currencyFormat = !tbl.currencyFormat"
                  @clear-table="store.clearTable($event)"
                  @duplicate-table="store.duplicateTable($event)"
                  @delete-table="store.deleteTable($event)"
                />
              </div>
            </div>
          </div>

          <!-- 2. CHART VIEW: Shows ALL charts created -->
          <div v-else-if="store.currentView === 'chart'" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <!-- Tab bar shown when 2 or more charts exist -->
            <MultiChartTabBar v-if="store.charts.length > 1" />

            <div class="multi-instances-scroll-container">
              <div
                v-for="chr in (store.chartLayoutView === 'single' ? [store.activeChart] : store.charts)"
                :key="chr.id"
                :id="`chart-card-${chr.id}`"
                class="instance-card-wrapper"
                :class="{ 'is-active-instance': chr.id === store.activeChartId }"
                @click="store.activeChartId = chr.id"
              >
                <!-- Active Header Tag when multiple charts exist -->
                <div v-if="store.charts.length > 1" class="instance-active-indicator-header">
                  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span
                        class="instance-badge-pill"
                        :class="{ current: chr.id === store.activeChartId }"
                      >
                        {{ chr.id === store.activeChartId ? '🎯 Gráfico Seleccionado (Vinculado a Zonas de Arrastre)' : '⚪ Haz clic para editar este gráfico en el Panel Lateral' }}
                      </span>
                      <strong style="font-size: 12.5px; color: #1e293b;">{{ chr.title }}</strong>
                    </div>

                    <span v-if="chr.id === store.activeChartId" style="font-size: 11px; color: #2563eb; font-weight: 700;">
                      ✏️ Activo en Zonas de Arrastre
                    </span>
                  </div>
                </div>

                <PivotChart
                  :chart-id="chr.id"
                  :title="chr.title"
                  :slice="chr.slice"
                  :chart-type="chr.chartType"
                  :pivot-result="chr.result"
                  :currency-format="chr.currencyFormat"
                  :fields="store.fields"
                  :loading="chr.loading"
                  :can-delete="store.charts.length > 1"
                  @title-change="store.renameChart(chr.id, $event)"
                  @slice-change="store.computePivotForChart(chr.id, $event)"
                  @chart-type-change="chr.chartType = $event; store.chartStyle = $event"
                  @toggle-currency="chr.currencyFormat = !chr.currencyFormat"
                  @clear-chart="store.clearChart($event)"
                  @duplicate-chart="store.duplicateChart($event)"
                  @delete-chart="store.deleteChart($event)"
                />
              </div>
            </div>
          </div>

          <!-- 3. COMBINED 360° DASHBOARD VIEW -->
          <div v-else-if="store.currentView === 'combined'" style="flex: 1; overflow: hidden;">
            <DashboardCombinedView />
          </div>
        </main>
      </div>

      <!-- Modals Layer -->
      <DataSourceModal />
      <AdminPanelModal />
      <CalculatedMeasureModal />
      <ConditionalFormatModal />
      <DimensionFilterModal />
      <SavedReportsModal />
      <CreateKpiModal />
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAnalyticsStore } from '~/stores/analytics';

const store = useAnalyticsStore();

onMounted(() => {
  store.init();
});
</script>

<style scoped>
.multi-instances-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.instance-card-wrapper {
  border-radius: 8px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  border: 2px solid transparent;
}

.instance-card-wrapper.is-active-instance {
  border-color: #3b82f6;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.15);
}

.instance-active-indicator-header {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
}

.instance-badge-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 12px;
  background: #e2e8f0;
  color: #475569;
  border: 1px solid #cbd5e1;
  transition: all 0.15s ease;
}

.instance-badge-pill.current {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #93c5fd;
}
</style>
