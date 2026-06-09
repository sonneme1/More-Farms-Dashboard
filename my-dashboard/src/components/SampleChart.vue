<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const chartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Bushels harvested (k)',
      backgroundColor: '#4CAF50',
      data: [40, 39, 10, 40, 39, 80],
    },
  ],
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
}
</script>

<template>
  <div style="height: 320px">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
