<script setup lang="ts">
import GraphView from './pages/GraphView.vue';

</script>

<template>
  <div class="top-container">
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
  overflow: hidden;
}
</style>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

button:disabled {
  opacity: 50%;
}
/* VS CODE COLOURS */
button {
  background-color: var(--vscode-button-background);
  border-color: var(--vscode-button-border);
  color: var(--vscode-button-foreground);
}

input,
textarea {
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border-color: var(--vscode-input-border);
}

span,
div,
label {
  color: var(--vscode-editor-foreground);
}
</style>
