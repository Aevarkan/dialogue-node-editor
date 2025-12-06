<script setup lang="ts">
import { useNodeDrag } from '@/composables/manualDrag';
import type { SceneCommandSlot, VisualSceneCommand } from '@/types';
import { type NodeProps } from '@vue-flow/core'
import { ArrowUpLeft, Trash2 } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<NodeProps<VisualSceneCommand>>()

const drag = useNodeDrag(props.id, props.data.parentSceneId, { nodeType: "command", slot: props.data.type })

const commandsRef = computed({
  get: () => props.data.commands.join("\n"),
  set: (newCommandText: string) => {
    emit('editCommand', props.data.parentSceneId, props.data.id, props.data.type, newCommandText.split("\n"))
  }
})

function deleteCommandNode() {
  emit("deleteCommandNode", props.data.parentSceneId, props.data.type, props.data.id)
}

// select parent
function selectParent() {
  emit("selectNode", props.data.parentSceneId)
}

const emit = defineEmits<{
  (event: 'editCommand', parentSceneId: string, nodeId: string, commandType: SceneCommandSlot, newCommands: string[]): void
  (event: "selectNode", nodeId: string): void
  (event: "deleteCommandNode", parentSceneId: string, commandType: SceneCommandSlot, nodeId: string): void
}>()

// uuids
const sceneUuid = `scene-id-${props.data.id}`
const indexUuid = `button-index-${props.data.id}`
const commandTextUuid = `button-commands-${props.data.id}`
</script>

<template>
  <div class="command-node-container" @mousedown="drag.onMouseDown">
    <div class="command-node-header">
      <div>
        <button @click="selectParent" @mousedown.stop>
          <ArrowUpLeft />
        </button>
        <button @click="deleteCommandNode" @mousedown.stop>
          <Trash2 />
        </button>
        <label :for=sceneUuid>
          Parent Scene:
        </label>
      </div>
      <span :id=sceneUuid>
        {{ props.data.parentSceneId }}
      </span>
  
      <label :for=indexUuid>
        Runs On:
      </label>
      <span :id=indexUuid>
        {{ props.data.type }}
      </span>
    </div>

    <div class="command-text">
      <label :for="commandTextUuid">
        Commands
      </label>
      <textarea :id="commandTextUuid" v-model="commandsRef" @mousedown.stop />
    </div>
  </div>
</template>

<style scoped>
.command-node-container {
  background-color: rgb(119, 194, 89);
  display: flex;
  align-content: center;
  flex-direction: column;
  padding: 2ch;
}

.command-node-header {
  display: grid;
  grid-template-columns: fit-content(100px) 1fr;
  row-gap: 10px;  /* vertical spacing between rows */
  column-gap: 10px;
  align-items: center;
}

.command-text {
  display: flex;
  column-gap: 10px;
  align-items: center;
  flex-direction: column;
}
</style>