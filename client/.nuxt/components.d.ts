
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


export const AdminPanelModal: typeof import("../components/AdminPanelModal.vue")['default']
export const AppSidebar: typeof import("../components/AppSidebar.vue")['default']
export const CalculatedMeasureModal: typeof import("../components/CalculatedMeasureModal.vue")['default']
export const ConditionalFormatModal: typeof import("../components/ConditionalFormatModal.vue")['default']
export const CreateKpiModal: typeof import("../components/CreateKpiModal.vue")['default']
export const DashboardCombinedView: typeof import("../components/DashboardCombinedView.vue")['default']
export const DataSourceModal: typeof import("../components/DataSourceModal.vue")['default']
export const DimensionFilterModal: typeof import("../components/DimensionFilterModal.vue")['default']
export const FieldsPanel: typeof import("../components/FieldsPanel.vue")['default']
export const KpiWidgetsBar: typeof import("../components/KpiWidgetsBar.vue")['default']
export const LoginScreen: typeof import("../components/LoginScreen.vue")['default']
export const MultiChartTabBar: typeof import("../components/MultiChartTabBar.vue")['default']
export const MultiTableTabBar: typeof import("../components/MultiTableTabBar.vue")['default']
export const PivotChart: typeof import("../components/PivotChart.vue")['default']
export const PivotGrid: typeof import("../components/PivotGrid.vue")['default']
export const SavedReportsModal: typeof import("../components/SavedReportsModal.vue")['default']
export const Toolbar: typeof import("../components/Toolbar.vue")['default']
export const TopStatusBar: typeof import("../components/TopStatusBar.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page-placeholder")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyAdminPanelModal: LazyComponent<typeof import("../components/AdminPanelModal.vue")['default']>
export const LazyAppSidebar: LazyComponent<typeof import("../components/AppSidebar.vue")['default']>
export const LazyCalculatedMeasureModal: LazyComponent<typeof import("../components/CalculatedMeasureModal.vue")['default']>
export const LazyConditionalFormatModal: LazyComponent<typeof import("../components/ConditionalFormatModal.vue")['default']>
export const LazyCreateKpiModal: LazyComponent<typeof import("../components/CreateKpiModal.vue")['default']>
export const LazyDashboardCombinedView: LazyComponent<typeof import("../components/DashboardCombinedView.vue")['default']>
export const LazyDataSourceModal: LazyComponent<typeof import("../components/DataSourceModal.vue")['default']>
export const LazyDimensionFilterModal: LazyComponent<typeof import("../components/DimensionFilterModal.vue")['default']>
export const LazyFieldsPanel: LazyComponent<typeof import("../components/FieldsPanel.vue")['default']>
export const LazyKpiWidgetsBar: LazyComponent<typeof import("../components/KpiWidgetsBar.vue")['default']>
export const LazyLoginScreen: LazyComponent<typeof import("../components/LoginScreen.vue")['default']>
export const LazyMultiChartTabBar: LazyComponent<typeof import("../components/MultiChartTabBar.vue")['default']>
export const LazyMultiTableTabBar: LazyComponent<typeof import("../components/MultiTableTabBar.vue")['default']>
export const LazyPivotChart: LazyComponent<typeof import("../components/PivotChart.vue")['default']>
export const LazyPivotGrid: LazyComponent<typeof import("../components/PivotGrid.vue")['default']>
export const LazySavedReportsModal: LazyComponent<typeof import("../components/SavedReportsModal.vue")['default']>
export const LazyToolbar: LazyComponent<typeof import("../components/Toolbar.vue")['default']>
export const LazyTopStatusBar: LazyComponent<typeof import("../components/TopStatusBar.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page-placeholder")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
