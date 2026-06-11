<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js'
import metrics from '../data/metrics.json'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
)

type Crop = 'Corn' | 'Soybeans'
interface Field {
  id: string
  name: string
  crop: Crop
  acres: number
  bushelsHarvested: number
  yieldBuPerAcre: number
  yield2024: number
  yield5YearAvg: number
}
interface Bin {
  id: string
  name: string
  crop: Crop
  capacityBushels: number
  currentBushels: number
  fillPercent: number
  moisturePercent: number
  temperatureF: number
  daysInStorage: number
}

const CORN_COLOR = '#F9A825'
const SOY_COLOR = '#2E7D32'

const fields = metrics.fields as Field[]
const bins = metrics.bins as Bin[]
const priceHistory = metrics.marketPrices.priceHistory
const cornCashPrice = metrics.marketPrices.corn.cashPrice
const soyCashPrice = metrics.marketPrices.soybeans.cashPrice
const cornFutures = metrics.marketPrices.corn.futuresPrice
const soyFutures = metrics.marketPrices.soybeans.futuresPrice
const cornBasis = metrics.marketPrices.corn.basis
const soyBasis = metrics.marketPrices.soybeans.basis
const fin = metrics.financialSnapshot

const cropOptions = ['All', 'Corn', 'Soybeans'] as const
const cropFilter = ref<'All' | Crop>('All')
const fieldFilter = ref<string>('All Fields')

const { width } = useDisplay()
const isCompact = computed(() => width.value <= 768)
const filterMenuOpen = ref(false)

const fieldOptions = computed(() => {
  const valid =
    cropFilter.value === 'All'
      ? fields
      : fields.filter((f) => f.crop === cropFilter.value)
  return ['All Fields', ...valid.map((f) => f.name)]
})

watch(cropFilter, () => {
  if (!fieldOptions.value.includes(fieldFilter.value)) {
    fieldFilter.value = 'All Fields'
  }
})

const filteredFields = computed(() =>
  fields.filter((f) => {
    const cropMatch = cropFilter.value === 'All' || f.crop === cropFilter.value
    const fieldMatch =
      fieldFilter.value === 'All Fields' || f.name === fieldFilter.value
    return cropMatch && fieldMatch
  }),
)

const filteredBins = computed(() =>
  bins.filter((b) => cropFilter.value === 'All' || b.crop === cropFilter.value),
)

// 90-day price change for KPI deltas (proxy for prior-period comparison)
const cornPrice90 = priceHistory[0].corn
const soyPrice90 = priceHistory[0].soybeans
const cornPriceChangePct = ((cornCashPrice - cornPrice90) / cornPrice90) * 100
const soyPriceChangePct = ((soyCashPrice - soyPrice90) / soyPrice90) * 100

// Aggregates
const totalBushelsInStorage = computed(() =>
  filteredBins.value.reduce((s, b) => s + b.currentBushels, 0),
)

const inventoryValue = computed(() =>
  filteredBins.value.reduce((s, b) => {
    const price = b.crop === 'Corn' ? cornCashPrice : soyCashPrice
    return s + b.currentBushels * price
  }, 0),
)

function weightedAvgYield(fs: Field[]): number {
  const totalBu = fs.reduce((s, f) => s + f.bushelsHarvested, 0)
  const totalAc = fs.reduce((s, f) => s + f.acres, 0)
  return totalAc === 0 ? 0 : totalBu / totalAc
}
function weightedAvg2024(fs: Field[]): number {
  const num = fs.reduce((s, f) => s + f.yield2024 * f.acres, 0)
  const den = fs.reduce((s, f) => s + f.acres, 0)
  return den === 0 ? 0 : num / den
}

const cornFilteredFields = computed(() =>
  filteredFields.value.filter((f) => f.crop === 'Corn'),
)
const soyFilteredFields = computed(() =>
  filteredFields.value.filter((f) => f.crop === 'Soybeans'),
)

const cornAvgYield = computed(() => weightedAvgYield(cornFilteredFields.value))
const soyAvgYield = computed(() => weightedAvgYield(soyFilteredFields.value))
const cornAvgYield2024 = computed(() => weightedAvg2024(cornFilteredFields.value))
const soyAvgYield2024 = computed(() => weightedAvg2024(soyFilteredFields.value))
const cornYieldChangePct = computed(() =>
  cornAvgYield2024.value === 0
    ? 0
    : ((cornAvgYield.value - cornAvgYield2024.value) /
        cornAvgYield2024.value) *
      100,
)
const soyYieldChangePct = computed(() =>
  soyAvgYield2024.value === 0
    ? 0
    : ((soyAvgYield.value - soyAvgYield2024.value) / soyAvgYield2024.value) *
      100,
)

const showCorn = computed(
  () => cropFilter.value === 'All' || cropFilter.value === 'Corn',
)
const showSoy = computed(
  () => cropFilter.value === 'All' || cropFilter.value === 'Soybeans',
)

// Yield chart (grouped: 2025 actual vs 5-year average per field)
const yieldChartData = computed(() => {
  const fs = filteredFields.value
  return {
    labels: fs.map((f) => f.name),
    datasets: [
      {
        label: '2025 Actual',
        backgroundColor: fs.map((f) =>
          f.crop === 'Corn' ? CORN_COLOR : SOY_COLOR,
        ),
        borderRadius: 4,
        data: fs.map((f) => f.yieldBuPerAcre),
      },
      {
        label: '5-Year Average',
        backgroundColor: fs.map((f) =>
          f.crop === 'Corn' ? '#F9A82555' : '#2E7D3255',
        ),
        borderColor: fs.map((f) =>
          f.crop === 'Corn' ? CORN_COLOR : SOY_COLOR,
        ),
        borderWidth: 1,
        borderRadius: 4,
        data: fs.map((f) => f.yield5YearAvg),
      },
    ],
  }
})

const yieldChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const, labels: { usePointStyle: true } },
    tooltip: {
      callbacks: {
        afterLabel: (ctx: any) => {
          const f = filteredFields.value[ctx.dataIndex]
          if (!f) return ''
          if (ctx.dataset.label === '2025 Actual') {
            const yoy = ((f.yieldBuPerAcre - f.yield2024) / f.yield2024) * 100
            return [
              `Crop: ${f.crop}`,
              `2024: ${f.yield2024} bu/ac`,
              `YoY: ${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%`,
              `Acres: ${f.acres.toLocaleString()}`,
            ]
          }
          return ''
        },
      },
    },
  },
  scales: {
    y: {
      title: { display: true, text: 'Yield (bu/ac)' },
      beginAtZero: true,
      grid: { color: '#0000000A' },
    },
    x: { grid: { display: false } },
  },
}))

// Price chart
const priceChartData = computed(() => {
  const lastIdx = priceHistory.length - 1
  return {
    labels: priceHistory.map((p) => p.date),
    datasets: [
      {
        label: 'Corn ($/bu)',
        borderColor: CORN_COLOR,
        backgroundColor: CORN_COLOR + '22',
        data: priceHistory.map((p) => p.corn),
        pointRadius: priceHistory.map((_, i) => (i === lastIdx ? 6 : 0)),
        pointHoverRadius: 6,
        pointBackgroundColor: CORN_COLOR,
        yAxisID: 'yCorn',
        tension: 0.25,
        borderWidth: 2,
      },
      {
        label: 'Soybeans ($/bu)',
        borderColor: SOY_COLOR,
        backgroundColor: SOY_COLOR + '22',
        data: priceHistory.map((p) => p.soybeans),
        pointRadius: priceHistory.map((_, i) => (i === lastIdx ? 6 : 0)),
        pointHoverRadius: 6,
        pointBackgroundColor: SOY_COLOR,
        yAxisID: 'ySoy',
        tension: 0.25,
        borderWidth: 2,
      },
    ],
  }
})

const priceChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { position: 'top' as const, labels: { usePointStyle: true } },
    tooltip: {
      callbacks: {
        title: (items: any[]) => {
          const d = new Date(items[0].label)
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        },
        label: (ctx: any) => {
          const value = ctx.parsed.y
          const ds = ctx.dataset
          const first = ds.data[0]
          const change = ((value - first) / first) * 100
          const sign = change >= 0 ? '+' : ''
          return `${ds.label}: $${value.toFixed(2)}  (${sign}${change.toFixed(1)}% over period)`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        maxTicksLimit: 8,
        callback: function (this: any, val: any) {
          const lbl = this.getLabelForValue(val) as string
          const d = new Date(lbl)
          return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        },
      },
    },
    yCorn: {
      type: 'linear' as const,
      position: 'left' as const,
      title: { display: true, text: 'Corn ($/bu)', color: CORN_COLOR },
      ticks: { color: CORN_COLOR, callback: (v: any) => `$${Number(v).toFixed(2)}` },
      grid: { color: '#0000000A' },
    },
    ySoy: {
      type: 'linear' as const,
      position: 'right' as const,
      title: { display: true, text: 'Soybeans ($/bu)', color: SOY_COLOR },
      ticks: { color: SOY_COLOR, callback: (v: any) => `$${Number(v).toFixed(2)}` },
      grid: { drawOnChartArea: false },
    },
  },
}))

// Helpers
function fillColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct > 90) return 'error'
  if (pct >= 75) return 'warning'
  return 'success'
}
function moistureColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct > 15) return 'error'
  if (pct >= 14) return 'warning'
  return 'success'
}
function fmtCurrency(n: number, fractionDigits = 0) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}
function fmtNum(n: number, fractionDigits = 0) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

// Total revenue from sales filtered by crop
const totalRevenueFiltered = computed(() => {
  if (cropFilter.value === 'Corn') return fin.corn.totalRevenueFromSales
  if (cropFilter.value === 'Soybeans') return fin.soybeans.totalRevenueFromSales
  return fin.totalRevenueToDate
})
</script>

<template>
  <v-app-bar color="primary" elevation="1" height="72">
    <template #prepend>
      <v-icon icon="mdi-sprout" size="28" class="ml-2" />
    </template>
    <v-app-bar-title class="font-weight-bold app-title">
      More Family Farm Operations
    </v-app-bar-title>
    <v-spacer />
    <div
      v-if="!isCompact"
      class="d-flex align-center ga-3 pr-4"
      style="min-width: 360px"
    >
      <v-select
        v-model="cropFilter"
        :items="cropOptions as unknown as string[]"
        label="Crop"
        density="compact"
        variant="solo-filled"
        bg-color="surface"
        flat
        hide-details
        prepend-inner-icon="mdi-corn"
        style="max-width: 170px"
      />
      <v-select
        v-model="fieldFilter"
        :items="fieldOptions"
        label="Field"
        density="compact"
        variant="solo-filled"
        bg-color="surface"
        flat
        hide-details
        prepend-inner-icon="mdi-map-marker-outline"
        style="max-width: 200px"
      />
    </div>

    <v-menu
      v-if="isCompact"
      v-model="filterMenuOpen"
      :close-on-content-click="false"
      location="bottom end"
      offset="8"
    >
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-menu"
          variant="text"
          aria-label="Open filters"
          class="mr-2"
        />
      </template>
      <v-card min-width="260" class="pa-4" elevation="3">
        <div class="text-overline text-medium-emphasis mb-2">Filters</div>
        <v-select
          v-model="cropFilter"
          :items="cropOptions as unknown as string[]"
          label="Crop"
          density="comfortable"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-corn"
          class="mb-3"
        />
        <v-select
          v-model="fieldFilter"
          :items="fieldOptions"
          label="Field"
          density="comfortable"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-map-marker-outline"
        />
        <div class="d-flex justify-end mt-4">
          <v-btn
            variant="text"
            color="primary"
            size="small"
            @click="filterMenuOpen = false"
          >
            Done
          </v-btn>
        </div>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-main class="bg-background">
    <v-container fluid class="pa-4 pa-md-6" style="max-width: 1600px">
      <!-- Row 1: KPI Summary Cards -->
      <v-row dense>
        <!-- Corn Cash Price -->
        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-caption text-medium-emphasis text-uppercase letter-spacing-1">
              Corn Cash Price
            </div>
            <div
              class="text-h4 font-weight-bold mt-1"
              style="color: #2C2C2C"
            >
              ${{ cornCashPrice.toFixed(2) }}
            </div>
            <div class="text-caption text-medium-emphasis">per bushel</div>
            <div
              class="text-caption mt-2 d-flex align-center"
              :class="cornPriceChangePct >= 0 ? 'text-success' : 'text-error'"
            >
              <v-icon
                :icon="cornPriceChangePct >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                size="small"
                class="mr-1"
              />
              {{ Math.abs(cornPriceChangePct).toFixed(1) }}% vs 90 days ago
            </div>
          </v-card>
        </v-col>

        <!-- Soybean Cash Price -->
        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-caption text-medium-emphasis text-uppercase letter-spacing-1">
              Soybean Cash Price
            </div>
            <div
              class="text-h4 font-weight-bold mt-1"
              style="color: #2C2C2C"
            >
              ${{ soyCashPrice.toFixed(2) }}
            </div>
            <div class="text-caption text-medium-emphasis">per bushel</div>
            <div
              class="text-caption mt-2 d-flex align-center"
              :class="soyPriceChangePct >= 0 ? 'text-success' : 'text-error'"
            >
              <v-icon
                :icon="soyPriceChangePct >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                size="small"
                class="mr-1"
              />
              {{ Math.abs(soyPriceChangePct).toFixed(1) }}% vs 90 days ago
            </div>
          </v-card>
        </v-col>

        <!-- Total Bushels in Storage -->
        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-caption text-medium-emphasis text-uppercase letter-spacing-1">
              Total Bushels in Storage
            </div>
            <div class="text-h4 font-weight-bold mt-1" style="color: #2C2C2C">
              {{ fmtNum(totalBushelsInStorage) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              across {{ filteredBins.length }} bin{{ filteredBins.length === 1 ? '' : 's' }}
            </div>
          </v-card>
        </v-col>

        <!-- Estimated Inventory Value -->
        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-caption text-medium-emphasis text-uppercase letter-spacing-1">
              Est. Inventory Value
            </div>
            <div class="text-h4 font-weight-bold mt-1" style="color: #2C2C2C">
              {{ fmtCurrency(inventoryValue) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              at current cash prices
            </div>
          </v-card>
        </v-col>

        <!-- Avg Yield Corn -->
        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-caption text-medium-emphasis text-uppercase letter-spacing-1">
              Avg Yield — Corn
            </div>
            <div
              class="text-h4 font-weight-bold mt-1"
              style="color: #2C2C2C"
            >
              {{ cornAvgYield > 0 ? cornAvgYield.toFixed(1) : '—' }}
              <span class="text-body-1 text-medium-emphasis">bu/ac</span>
            </div>
            <div
              v-if="cornAvgYield > 0"
              class="text-caption mt-2 d-flex align-center"
              :class="cornYieldChangePct >= 0 ? 'text-success' : 'text-error'"
            >
              <v-icon
                :icon="cornYieldChangePct >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                size="small"
                class="mr-1"
              />
              {{ Math.abs(cornYieldChangePct).toFixed(1) }}% vs 2024
            </div>
            <div v-else class="text-caption text-medium-emphasis mt-2">
              No matching fields
            </div>
          </v-card>
        </v-col>

        <!-- Avg Yield Soybeans -->
        <v-col cols="12" sm="6" md="4" lg="2">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="text-caption text-medium-emphasis text-uppercase letter-spacing-1">
              Avg Yield — Soybeans
            </div>
            <div
              class="text-h4 font-weight-bold mt-1"
              style="color: #2C2C2C"
            >
              {{ soyAvgYield > 0 ? soyAvgYield.toFixed(1) : '—' }}
              <span class="text-body-1 text-medium-emphasis">bu/ac</span>
            </div>
            <div
              v-if="soyAvgYield > 0"
              class="text-caption mt-2 d-flex align-center"
              :class="soyYieldChangePct >= 0 ? 'text-success' : 'text-error'"
            >
              <v-icon
                :icon="soyYieldChangePct >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                size="small"
                class="mr-1"
              />
              {{ Math.abs(soyYieldChangePct).toFixed(1) }}% vs 2024
            </div>
            <div v-else class="text-caption text-medium-emphasis mt-2">
              No matching fields
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Row 2: Yield Performance -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card elevation="1" class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <div class="text-h6 font-weight-bold">Yield Performance by Field</div>
                <div class="text-caption text-medium-emphasis">
                  2025 actual vs. 5-year average (bu/ac)
                </div>
              </div>
              <div class="d-flex align-center ga-2">
                <v-chip color="secondary" size="small" variant="flat">Corn</v-chip>
                <v-chip color="primary" size="small" variant="flat">Soybeans</v-chip>
                <v-icon icon="mdi-chart-bar" color="primary" class="ml-1" />
              </div>
            </div>
            <div v-if="filteredFields.length === 0" class="text-center py-12 text-medium-emphasis">
              No fields match the current filters.
            </div>
            <div v-else style="height: 360px">
              <Bar :data="yieldChartData" :options="yieldChartOptions" />
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Row 3: Grain Bin Inventory -->
      <v-row class="mt-4">
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between mb-2 px-1">
            <div>
              <div class="text-h6 font-weight-bold">Grain Bin Inventory</div>
              <div class="text-caption text-medium-emphasis">
                Fill level, moisture, and storage conditions
              </div>
            </div>
            <v-icon icon="mdi-silo" color="primary" />
          </div>
        </v-col>
        <template v-if="filteredBins.length === 0">
          <v-col cols="12">
            <v-card class="pa-8 text-center text-medium-emphasis" elevation="1">
              No bins match the current crop filter.
            </v-card>
          </v-col>
        </template>
        <v-col
          v-for="bin in filteredBins"
          :key="bin.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card class="pa-4 h-100" elevation="1">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-h6 font-weight-bold">{{ bin.name }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ bin.crop }} · {{ fmtNum(bin.capacityBushels) }} bu capacity
                </div>
              </div>
              <v-chip
                :color="bin.crop === 'Corn' ? 'secondary' : 'primary'"
                size="small"
                variant="flat"
              >
                {{ bin.crop }}
              </v-chip>
            </div>

            <div class="d-flex align-baseline mt-4">
              <div class="text-h5 font-weight-bold">
                {{ bin.fillPercent.toFixed(0) }}%
              </div>
              <div class="text-caption text-medium-emphasis ml-2">
                {{ fmtNum(bin.currentBushels) }} bu
              </div>
            </div>

            <v-progress-linear
              :model-value="bin.fillPercent"
              :color="fillColor(bin.fillPercent)"
              height="14"
              rounded
              class="mt-2"
            />

            <v-row dense class="mt-3">
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Moisture</div>
                <v-chip
                  :color="moistureColor(bin.moisturePercent)"
                  size="small"
                  variant="tonal"
                  class="mt-1 font-weight-medium"
                >
                  <v-icon icon="mdi-water-percent" start size="small" />
                  {{ bin.moisturePercent.toFixed(1) }}%
                </v-chip>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Temperature</div>
                <div class="text-body-2 font-weight-medium mt-1">
                  <v-icon icon="mdi-thermometer" size="small" class="mr-1" />
                  {{ bin.temperatureF }}°F
                </div>
              </v-col>
              <v-col cols="12" class="mt-2">
                <div class="text-caption text-medium-emphasis">
                  <v-icon icon="mdi-calendar-clock" size="small" class="mr-1" />
                  {{ bin.daysInStorage }} days in storage
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <!-- Row 4: Market Price Trends -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card elevation="1" class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-3">
              <div>
                <div class="text-h6 font-weight-bold">Market Price Trends</div>
                <div class="text-caption text-medium-emphasis">
                  90-day cash price history — current price highlighted
                </div>
              </div>
              <div class="d-flex ga-4 flex-wrap">
                <div class="text-right">
                  <div class="text-caption text-medium-emphasis">Corn Futures</div>
                  <div class="text-body-2 font-weight-medium">
                    ${{ cornFutures.toFixed(2) }}
                    <span class="text-caption text-medium-emphasis">
                      basis {{ cornBasis.toFixed(2) }}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-caption text-medium-emphasis">Soybean Futures</div>
                  <div class="text-body-2 font-weight-medium">
                    ${{ soyFutures.toFixed(2) }}
                    <span class="text-caption text-medium-emphasis">
                      basis {{ soyBasis.toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div style="height: 380px">
              <Line :data="priceChartData" :options="priceChartOptions" />
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Row 5: Financial Snapshot -->
      <v-row class="mt-4">
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between mb-2 px-1">
            <div>
              <div class="text-h6 font-weight-bold">Financial Snapshot</div>
              <div class="text-caption text-medium-emphasis">
                Break-even vs. market, profit estimates, and revenue to date
              </div>
            </div>
            <v-icon icon="mdi-finance" color="primary" />
          </div>
        </v-col>

        <!-- Corn financials -->
        <v-col v-if="showCorn" cols="12" md="6" lg="4">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="d-flex align-center mb-3">
              <v-icon icon="mdi-corn" :color="CORN_COLOR" class="mr-2" />
              <div class="text-h6 font-weight-bold">Corn</div>
              <v-spacer />
              <v-chip
                :color="fin.corn.estimatedProfitPerBushel >= 0 ? 'success' : 'error'"
                size="small"
                variant="tonal"
                class="font-weight-medium"
              >
                {{ fin.corn.estimatedProfitPerBushel >= 0 ? 'Profitable' : 'Below break-even' }}
              </v-chip>
            </div>

            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Break-even</div>
              <div class="text-body-1 font-weight-medium">
                ${{ fin.corn.breakEvenPrice.toFixed(2) }}/bu
              </div>
            </div>
            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Current market</div>
              <div class="text-body-1 font-weight-medium" :style="{ color: CORN_COLOR }">
                ${{ fin.corn.currentMarketPrice.toFixed(2) }}/bu
              </div>
            </div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Margin per bushel</div>
              <div
                class="text-body-1 font-weight-bold"
                :class="fin.corn.estimatedProfitPerBushel >= 0 ? 'text-success' : 'text-error'"
              >
                <v-icon
                  :icon="fin.corn.estimatedProfitPerBushel >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                  size="small"
                />
                ${{ fin.corn.estimatedProfitPerBushel.toFixed(2) }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Est. profit (stored)</div>
              <div
                class="text-body-1 font-weight-bold"
                :class="fin.corn.estimatedTotalProfit >= 0 ? 'text-success' : 'text-error'"
              >
                {{ fmtCurrency(fin.corn.estimatedTotalProfit) }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Input cost / acre</div>
              <div class="text-body-2 font-weight-medium">
                {{ fmtCurrency(fin.corn.inputCostPerAcre, 2) }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-baseline">
              <div class="text-body-2 text-medium-emphasis">Sold to date</div>
              <div class="text-body-2 font-weight-medium">
                {{ fmtNum(fin.corn.bushelsSold) }} bu @
                {{ fmtCurrency(fin.corn.averageSalePrice, 2) }}
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- Soybean financials -->
        <v-col v-if="showSoy" cols="12" md="6" lg="4">
          <v-card class="pa-4 h-100" elevation="1">
            <div class="d-flex align-center mb-3">
              <v-icon icon="mdi-leaf" :color="SOY_COLOR" class="mr-2" />
              <div class="text-h6 font-weight-bold">Soybeans</div>
              <v-spacer />
              <v-chip
                :color="fin.soybeans.estimatedProfitPerBushel >= 0 ? 'success' : 'error'"
                size="small"
                variant="tonal"
                class="font-weight-medium"
              >
                {{ fin.soybeans.estimatedProfitPerBushel >= 0 ? 'Profitable' : 'Below break-even' }}
              </v-chip>
            </div>

            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Break-even</div>
              <div class="text-body-1 font-weight-medium">
                ${{ fin.soybeans.breakEvenPrice.toFixed(2) }}/bu
              </div>
            </div>
            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Current market</div>
              <div class="text-body-1 font-weight-medium" :style="{ color: SOY_COLOR }">
                ${{ fin.soybeans.currentMarketPrice.toFixed(2) }}/bu
              </div>
            </div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Margin per bushel</div>
              <div
                class="text-body-1 font-weight-bold"
                :class="fin.soybeans.estimatedProfitPerBushel >= 0 ? 'text-success' : 'text-error'"
              >
                <v-icon
                  :icon="fin.soybeans.estimatedProfitPerBushel >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                  size="small"
                />
                ${{ fin.soybeans.estimatedProfitPerBushel.toFixed(2) }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Est. profit (stored)</div>
              <div
                class="text-body-1 font-weight-bold"
                :class="fin.soybeans.estimatedTotalProfit >= 0 ? 'text-success' : 'text-error'"
              >
                {{ fmtCurrency(fin.soybeans.estimatedTotalProfit) }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-baseline mb-2">
              <div class="text-body-2 text-medium-emphasis">Input cost / acre</div>
              <div class="text-body-2 font-weight-medium">
                {{ fmtCurrency(fin.soybeans.inputCostPerAcre, 2) }}
              </div>
            </div>
            <div class="d-flex justify-space-between align-baseline">
              <div class="text-body-2 text-medium-emphasis">Sold to date</div>
              <div class="text-body-2 font-weight-medium">
                {{ fmtNum(fin.soybeans.bushelsSold) }} bu @
                {{ fmtCurrency(fin.soybeans.averageSalePrice, 2) }}
              </div>
            </div>
          </v-card>
        </v-col>

        <!-- Total revenue -->
        <v-col cols="12" md="12" lg="4">
          <v-card class="pa-4 h-100 d-flex flex-column" elevation="1" color="primary">
            <div class="text-caption text-uppercase letter-spacing-1" style="opacity: 0.85">
              Total Revenue from Sales
              <span v-if="cropFilter !== 'All'">— {{ cropFilter }}</span>
            </div>
            <div class="text-h3 font-weight-bold mt-2">
              {{ fmtCurrency(totalRevenueFiltered) }}
            </div>
            <div class="text-caption mt-1" style="opacity: 0.85">
              Year to date · {{ metrics.meta.cropYear }} crop
            </div>
            <v-divider class="my-4" :thickness="1" style="opacity: 0.25" />
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span style="opacity: 0.85">Corn revenue</span>
              <span class="font-weight-medium">
                {{ fmtCurrency(fin.corn.totalRevenueFromSales) }}
              </span>
            </div>
            <div class="d-flex justify-space-between text-body-2">
              <span style="opacity: 0.85">Soybean revenue</span>
              <span class="font-weight-medium">
                {{ fmtCurrency(fin.soybeans.totalRevenueFromSales) }}
              </span>
            </div>
            <v-spacer />
            <div class="text-caption mt-4" style="opacity: 0.75">
              Data as of {{ metrics.meta.asOfDate }}
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<style scoped>
.letter-spacing-1 {
  letter-spacing: 0.06em;
}

.app-title {
  flex: 0 1 auto;
  min-width: 0;
}
.app-title :deep(.v-toolbar-title__placeholder) {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}
</style>
