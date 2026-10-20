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

          <!-- Executive KPI Cards Strip -->
          <KpiWidgetsBar />

          <!-- 1. TABLE VIEW -->
          <div v-if="store.currentView === 'grid'" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <div style="flex: 1; overflow-y: auto; padding: 16px;">
              <PivotGrid
                :table-id="store.activeTable.id"
                :title="store.activeTable.title"
                :slice="store.activeTable.slice"
                :pivot-result="store.activeTable.result"
                :currency-format="store.activeTable.currencyFormat"
                :conditional-rules="store.conditionalRules"
                :table-style="store.activeTable.tableStyle"
                :fields="store.fields"
                :loading="store.activeTable.loading"
                :can-delete="store.tables.length > 1"
                @title-change="store.renameTable(store.activeTable.id, $event)"
                @slice-change="store.computePivotForTable(store.activeTable.id, $event)"
                @table-style-change="store.activeTable.tableStyle = $event"
                @toggle-currency="store.activeTable.currencyFormat = !store.activeTable.currencyFormat"
                @clear-table="store.clearTable($event)"
                @duplicate-table="store.duplicateTable($event)"
                @delete-table="store.deleteTable($event)"
              />
            </div>
          </div>

          <!-- 2. CHART VIEW -->
          <div v-else-if="store.currentView === 'chart'" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
            <div style="flex: 1; overflow-y: auto; padding: 16px;">
              <PivotChart
                :chart-id="store.activeChart.id"
                :title="store.activeChart.title"
                :slice="store.activeChart.slice"
                :chart-type="store.activeChart.chartType"
                :pivot-result="store.activeChart.result"
                :currency-format="store.activeChart.currencyFormat"
                :fields="store.fields"
                :loading="store.activeChart.loading"
                :can-delete="store.charts.length > 1"
                @title-change="store.renameChart(store.activeChart.id, $event)"
                @slice-change="store.computePivotForChart(store.activeChart.id, $event)"
                @chart-type-change="store.activeChart.chartType = $event; store.chartStyle = $event"
                @toggle-currency="store.activeChart.currencyFormat = !store.activeChart.currencyFormat"
                @clear-chart="store.clearChart($event)"
                @duplicate-chart="store.duplicateChart($event)"
                @delete-chart="store.deleteChart($event)"
              />
            </div>
          </div>

          <!-- 3. COMBINED 360° DASHBOARD VIEW -->
          <div v-else-if="store.currentView === 'combined'" style="flex: 1; overflow: hidden;">
            <DashboardCombinedView
              :pivot-result="store.activeTable.result"
              :currency-format="store.activeTable.currencyFormat"
              :conditional-rules="store.conditionalRules"
              :table-style="store.activeTable.tableStyle"
              :chart-style="store.chartStyle"
              :slice="store.activeTable.slice"
              :fields="store.fields"
              :table-title="store.activeTable.title"
              @chart-style-change="store.chartStyle = $event; store.activeChart.chartType = $event"
              @slice-change="store.computePivotForTable(store.activeTable.id, $event)"
              @clear-table="store.clearTable($event)"
              @duplicate-table="store.duplicateTable($event)"
            />
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
