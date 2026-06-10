<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(true)
</script>

<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-app-bar-title>My Dashboard</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer">
      <v-list nav>
        <v-list-item
          to="/"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="home"
        />
        <v-list-item
          to="/about"
          prepend-icon="mdi-information-outline"
          title="About"
          value="about"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
