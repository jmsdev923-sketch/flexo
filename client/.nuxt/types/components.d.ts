
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  AdminPanelModal: typeof import("../../components/AdminPanelModal.vue")['default']
  AppSidebar: typeof import("../../components/AppSidebar.vue")['default']
  CalculatedMeasureModal: typeof import("../../components/CalculatedMeasureModal.vue")['default']
  ConditionalFormatModal: typeof import("../../components/ConditionalFormatModal.vue")['default']
  CreateKpiModal: typeof import("../../components/CreateKpiModal.vue")['default']
  DashboardCombinedView: typeof import("../../components/DashboardCombinedView.vue")['default']
  DataSourceModal: typeof import("../../components/DataSourceModal.vue")['default']
  DimensionFilterModal: typeof import("../../components/DimensionFilterModal.vue")['default']
  FieldsPanel: typeof import("../../components/FieldsPanel.vue")['default']
  KpiWidgetsBar: typeof import("../../components/KpiWidgetsBar.vue")['default']
  LoginScreen: typeof import("../../components/LoginScreen.vue")['default']
  MultiChartTabBar: typeof import("../../components/MultiChartTabBar.vue")['default']
  MultiTableTabBar: typeof import("../../components/MultiTableTabBar.vue")['default']
  PivotChart: typeof import("../../components/PivotChart.vue")['default']
  PivotGrid: typeof import("../../components/PivotGrid.vue")['default']
  SavedReportsModal: typeof import("../../components/SavedReportsModal.vue")['default']
  Toolbar: typeof import("../../components/Toolbar.vue")['default']
  TopStatusBar: typeof import("../../components/TopStatusBar.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page-placeholder")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyAdminPanelModal: LazyComponent<typeof import("../../components/AdminPanelModal.vue")['default']>
  LazyAppSidebar: LazyComponent<typeof import("../../components/AppSidebar.vue")['default']>
  LazyCalculatedMeasureModal: LazyComponent<typeof import("../../components/CalculatedMeasureModal.vue")['default']>
  LazyConditionalFormatModal: LazyComponent<typeof import("../../components/ConditionalFormatModal.vue")['default']>
  LazyCreateKpiModal: LazyComponent<typeof import("../../components/CreateKpiModal.vue")['default']>
  LazyDashboardCombinedView: LazyComponent<typeof import("../../components/DashboardCombinedView.vue")['default']>
  LazyDataSourceModal: LazyComponent<typeof import("../../components/DataSourceModal.vue")['default']>
  LazyDimensionFilterModal: LazyComponent<typeof import("../../components/DimensionFilterModal.vue")['default']>
  LazyFieldsPanel: LazyComponent<typeof import("../../components/FieldsPanel.vue")['default']>
  LazyKpiWidgetsBar: LazyComponent<typeof import("../../components/KpiWidgetsBar.vue")['default']>
  LazyLoginScreen: LazyComponent<typeof import("../../components/LoginScreen.vue")['default']>
  LazyMultiChartTabBar: LazyComponent<typeof import("../../components/MultiChartTabBar.vue")['default']>
  LazyMultiTableTabBar: LazyComponent<typeof import("../../components/MultiTableTabBar.vue")['default']>
  LazyPivotChart: LazyComponent<typeof import("../../components/PivotChart.vue")['default']>
  LazyPivotGrid: LazyComponent<typeof import("../../components/PivotGrid.vue")['default']>
  LazySavedReportsModal: LazyComponent<typeof import("../../components/SavedReportsModal.vue")['default']>
  LazyToolbar: LazyComponent<typeof import("../../components/Toolbar.vue")['default']>
  LazyTopStatusBar: LazyComponent<typeof import("../../components/TopStatusBar.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page-placeholder")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
