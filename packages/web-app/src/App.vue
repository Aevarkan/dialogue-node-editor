<script setup lang="ts">
import GraphView from './pages/GraphView.vue';

</script>

<template>
  <div class="top-container">
    <h1>You did it!</h1>
    <p>
      Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
      documentation
    </p>
    <div class="page-container">
      <GraphView />
    </div>
  </div>
</template>

<style scoped>
.top-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-container {
  flex: 1;
  overflow: auto;
}
</style>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
