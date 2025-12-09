<script setup lang="ts">
import { useNodeDrag } from '@/composables/manualDrag';
import type { VisualSlot } from '@/types';
import { type NodeProps } from '@vue-flow/core'
import { useTextareaAutosize } from '@vueuse/core';
import type { Button } from '@workspace/common';
import { ArrowUpLeft, Minus, Plus, Trash2 } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';

const props = defineProps<NodeProps<VisualSlot>>()

// note that the index is NOT static for button slots
const drag = useNodeDrag(props.id, props.data.parentSceneId, { nodeType: "button", slot: props.data.index })

// update index
watch(
  () => props.data.index,
  (newIndex) => drag.updateNodeInfo({ nodeType: "button", slot: newIndex })
)

const buttonRef = ref<Button>({ ...props.data.button })

watch(
  () => props.data.button,
  (updatedButton) => {
    buttonRef.value = { ...updatedButton }
  },
  { deep: true, immediate: true }
)

const commandText = computed({
  get: () => buttonRef.value.commands.join("\n"),
  set: (newCommands) => {
    buttonRef.value.commands = newCommands.split("\n")
    update()
  }
})
const { textarea: textAreaRef } = useTextareaAutosize({ input: commandText })

const displayName = computed({
  get: () => buttonRef.value.displayName,
  set: (newName) => {
    buttonRef.value.displayName = newName
    update()
  }
})

function update() {
  emit(
      'editButton',
      props.data.parentSceneId,
      props.data.id,
      props.data.index,
      {
        ...buttonRef.value,
        // because the reactivity causes problems
        commands: [...buttonRef.value.commands]
      }
    )
}

function swapToIndex(targetIndex: number) {
  emit("swapIndex", props.data.parentSceneId, props.data.index, targetIndex)
}

function deleteSlotNode() {
  emit("deleteSlotNode", props.data.parentSceneId, props.data.index, props.data.id)
}

// select parent
function selectParent() {
  emit("selectNode", props.data.parentSceneId)
}

const emit = defineEmits<{
  (event: 'editButton', parentSceneId: string, nodeId: string, buttonIndex: number, button: Button): void
  (event: "selectNode", nodeId: string): void
  (event: "deleteSlotNode", parentSceneId: string, index: number, nodeId: string): void
  (event: "swapIndex", parentSceneId: string, currentIndex: number, targetIndex: number): void
}>()

// uuids
const sceneUuid = `scene-id-${props.data.id}`
const indexUuid = `button-index-${props.data.id}`
const nameUuid = `display-name-${props.data.id}`
const commandTextUuid = `button-commands-${props.data.id}`
</script>

<template>
  <div class="button-node-container" @mousedown="drag.onMouseDown">
    <div class="button-node-header">
      <div>
        <button @click="selectParent" @mousedown.stop>
          <ArrowUpLeft />
        </button>
        <button @click="deleteSlotNode" @mousedown.stop>
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
        Slot Index:
      </label>
      <div :id=indexUuid>
        <span>
          {{ props.data.index + 1 }}
        </span>
        <!-- change index buttons -->
        <!-- disabled if highest -->
        <button disabled v-if="props.data.highestIndex">
          <Plus />
        </button>
        <button v-else @click="swapToIndex(props.data.index + 1)">
          <Plus />
        </button>
        <!-- enabled if not index 0 -->
        <button v-if="props.data.index !== 0" @click="swapToIndex(props.data.index - 1)">
          <Minus />
        </button>
        <button disabled v-else>
          <Minus />
        </button>
      </div>
  
      <label :for=nameUuid>
        Display Name:
      </label>
      <input :id="nameUuid" v-model="displayName" @mousedown.stop />
    </div>

    <div class="button-commands">
      <label :for="commandTextUuid">
        Commands
      </label>
      <textarea :id="commandTextUuid" ref="textAreaRef" v-model="commandText" @mousedown.stop />
    </div>
  </div>
</template>

<style scoped>
.button-node-container {
  background-color: var(--custom-button-slot-node-colour, rgb(142, 108, 180));
  display: flex;
  align-content: center;
  flex-direction: column;
  padding: 2ch;
  border-color: var(--vscode-input-border);
  border-radius: 5px;
  border-width: 2px;
  border-style: solid;
}

.button-node-header {
  display: grid;
  grid-template-columns: fit-content(100px) 1fr;
  row-gap: 10px;  /* vertical spacing between rows */
  column-gap: 10px;
  align-items: center;
}

.button-commands {
  display: flex;
  column-gap: 10px;
  align-items: center;
  flex-direction: column;
}

textarea {
  min-width: 40ch;
  min-height: 2ch;
  -ms-overflow-style: none;
  scrollbar-width: none;
  resize: horizontal;
}

button {
  border-radius: 5px;
}
</style>