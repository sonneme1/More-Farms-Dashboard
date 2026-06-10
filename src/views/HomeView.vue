<script setup lang="ts">
import SampleChart from '../components/SampleChart.vue'
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Dashboard</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="4">
        <v-card prepend-icon="mdi-tractor" title="Active Farms" subtitle="Connected">
          <v-card-text class="text-h3">12</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card prepend-icon="mdi-sprout" title="Fields" subtitle="In rotation">
          <v-card-text class="text-h3">48</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card prepend-icon="mdi-weather-sunny" title="Avg Temp" subtitle="Today">
          <v-card-text class="text-h3">72°F</v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card title="Harvest by Month">
          <v-card-text>
            <SampleChart />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
