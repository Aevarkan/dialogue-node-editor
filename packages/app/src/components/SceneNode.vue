<script setup lang="ts">
import { type NodeProps } from '@vue-flow/core'
import { computed } from 'vue';
import { v4 as uuidv4 } from 'uuid'
import type { SceneButtonSlot, SceneFunctionSlot, VisualScene } from '@/types';
import { SCENE_MAX_BUTTONS } from '@workspace/common';
import { ArrowUpLeft, Plus, Trash2, X, Shrink } from 'lucide-vue-next';
import { useNodeDrag } from '@/composables/manualDrag';
import { useTextareaAutosize } from '@vueuse/core';

const props = defineProps<NodeProps<VisualScene>>()

const drag = useNodeDrag(props.id, props.data.sceneId, { nodeType: "scene" })

// sceneId change means deleting the scene
// no need to track it

// text area autosizing
const sceneTextRef = computed({
  get: () => props.data.sceneText,
  set: (newSceneText: string) => emit('editSceneText', props.data.sceneId, newSceneText)
})
const { textarea: textAreaRef } = useTextareaAutosize({ input: sceneTextRef })


const npcNameRef = computed({
  get: () => props.data.npcName,
  set: (newNpcName: string) => emit('editNpcName', props.data.sceneId, newNpcName)
})

const emit = defineEmits<{
  (event: 'editNpcName', sceneId: string, newNpcName: string): void
  (event: 'editSceneText', sceneId: string, newSceneText: string): void
  (event: "selectNode", nodeId: string): void
  (event: "addSceneSlot", sceneId: string, sceneSlot: SceneFunctionSlot): void
  (event: "deleteScene", sceneId: string): void
  (event: "collectSceneNodes", sceneId: string): void
}>()

function collectSceneNodes() {
  emit("collectSceneNodes", props.data.sceneId)
}

function deleteScene() {
  emit("deleteScene", props.data.sceneId)
}

function addSceneSlot(sceneSlot: SceneFunctionSlot) {
  emit("addSceneSlot", props.data.sceneId, sceneSlot)
}

function selectButtonSlot(index: number) {
  const nodeId = props.data.buttonNodes[index]
  if (nodeId) {
    emit('selectNode', nodeId)
  }
}

function selectOpenCommand() {
  const openCommandId = props.data.openCommandNode
  if (openCommandId) {
    emit("selectNode", openCommandId)
  }
}

function selectCloseCommand() {
  const closeCommandId = props.data.closeCommandNode
  if (closeCommandId) {
    emit("selectNode", closeCommandId)
  }
}

const localUuid = uuidv4()
const sceneUuid = `scene-id-${localUuid}`
const npcUuid = `npc-name-${localUuid}`
const openUuid = `open-command-${localUuid}`
const closeUuid = `close-command-${localUuid}`
const buttonsUuid = `buttons-${localUuid}`
const sceneTextUuid = `scene-text-${localUuid}`
</script>

<template>
  <div class="scene-node-container" @mousedown="drag.onMouseDown">
    <div>
      <button @click="deleteScene" @mousedown.stop>
        <Trash2 />
      </button>
      <button @click="collectSceneNodes" @mousedown.stop>
        <Shrink />
      </button>
    </div>
    <div class="scene-node-header">
      <label :for=sceneUuid>
        Scene ID:
      </label>
      <span :id=sceneUuid>
        {{ props.data.sceneId }}
      </span>

      <label :for=npcUuid>
        NPC Name:
      </label>
      <input :id=npcUuid v-model="npcNameRef" @mousedown.stop />

      <span :id="openUuid">
        Open Command:
      </span>
      <div v-if="props.data.openCommandNode">
        <button class="command-button" :aria-labelledby="openUuid" @click="selectOpenCommand" @mousedown.stop>
          <ArrowUpLeft />
        </button>
      </div>
      <div v-else>
        <button class="command-button" :aria-labelledby="openUuid" @click="addSceneSlot('open')" @mousedown.stop>
          <Plus />
        </button>
      </div>

      <span :id="closeUuid">
        Close Command:
      </span>
      <div v-if="props.data.closeCommandNode">
        <button class="command-button" :aria-labelledby="closeUuid" @click="selectCloseCommand" @mousedown.stop>
          <ArrowUpLeft />
        </button>
      </div>
      <div v-else>
        <button class="command-button" :aria-labelledby="closeUuid" @click="addSceneSlot('close')" @mousedown.stop>
          <Plus />
        </button>
      </div>

    </div>

    <div class="scene-buttons">
      <label :for="buttonsUuid">
        Buttons
      </label>
      <div :id="buttonsUuid" class="button-grid">
        <template v-for="(slot, index) in SCENE_MAX_BUTTONS" :key="index">
            <button v-if="props.data.buttonNodes[index]" @click="selectButtonSlot(index)" @mousedown.stop>
              {{ slot }}
            </button>
            <button v-else-if="index === props.data.buttonNodes.length" @click="addSceneSlot(slot.toString() as SceneButtonSlot)" @mousedown.stop>
              <Plus />
            </button>
            <button v-else disabled class="disabled-button" @mousedown.stop>
              <X />
            </button>
        </template>
      </div>
    </div>

    <div class="scene-text">
      <label :for=sceneTextUuid>
        Scene Text
      </label>
      <textarea
        :id=sceneTextUuid
        ref="textAreaRef"
        v-model="sceneTextRef"
        @mousedown.stop
      />
    </div>
  </div>
</template>

<style scoped>
.scene-node-container {
  background-color: var(--custom-scene-node-colour, cadetblue);
  display: flex;
  align-content: center;
  flex-direction: column;
  padding: 2ch;
  border-color: var(--vscode-input-border);
  border-radius: 5px;
  border-width: 2px;
  border-style: solid;
}
.scene-node-header {
  display: grid;
  grid-template-columns: fit-content(100px) 1fr;
  row-gap: 10px;  /* vertical spacing between rows */
  column-gap: 10px;
  align-items: center;
}

.scene-buttons {
  display: flex;
  column-gap: 10px;
  align-items: center;
  flex-direction: column;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 3 columns */
  grid-template-rows: repeat(2, auto);    /* 2 rows */
  gap: 8px;                               /* spacing */
  width: 100%;
}

button {
  border-radius: 5px;
}

.command-button {
  width: 100%;
  height: 40px;
}

.button-grid button,
.button-grid .disabled-button {
  width: 100%;
  height: 40px; /* adjust as needed */
}

.scene-text {
  display: flex;
  column-gap: 10px;
  align-items: center;
  flex-direction: column;
}

textarea {
  min-width: 50ch;
  min-height: 2ch;
  -ms-overflow-style: none;
  scrollbar-width: none;
  resize: horizontal;
}
</style>