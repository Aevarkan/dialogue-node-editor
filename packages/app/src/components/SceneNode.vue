<script setup lang="ts">
import { type NodeProps } from '@vue-flow/core'
import { computed } from 'vue';
import { v4 as uuidv4 } from 'uuid'
import type { VisualScene } from '@/types';
import { SCENE_MAX_BUTTONS } from '@workspace/common';
import { ArrowUpLeft, Plus, X } from 'lucide-vue-next';

const props = defineProps<NodeProps<VisualScene>>()

// sceneId change means deleting the scene
// no need to track it

const sceneTextRef = computed({
  get: () => props.data.sceneText,
  set: (newSceneText: string) => emit('editSceneText', props.data.sceneId, newSceneText)
})

const npcNameRef = computed({
  get: () => props.data.npcName,
  set: (newNpcName: string) => emit('editNpcName', props.data.sceneId, newNpcName)
})

const emit = defineEmits<{
  (event: 'editNpcName', sceneId: string, newNpcName: string): void
  (event: 'editSceneText', sceneId: string, newSceneText: string): void
}>()

const localUuid = uuidv4()
const sceneUuid = `scene-id-${localUuid}`
const npcUuid = `npc-name-${localUuid}`
const openUuid = `open-command-${localUuid}`
const closeUuid = `close-command-${localUuid}`
const buttonsUuid = `buttons-${localUuid}`
const sceneTextUuid = `scene-text-${localUuid}`
</script>

<template>
  <div class="scene-node-container">
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
      <input :id=npcUuid v-model="npcNameRef" />

      <span :id="openUuid">
        Open Command:
      </span>
      <button class="command-button" :aria-labelledby="openUuid">
        <div v-if="props.data.openCommandNode">
          <ArrowUpLeft />
        </div>
        <div v-else>
          <Plus />
        </div>
      </button>

      <span :id="closeUuid">
        Close Command:
      </span>
      <button class="command-button" :aria-labelledby="closeUuid">
        <div v-if="props.data.closeCommandNode">
          <ArrowUpLeft />
        </div>
        <div v-else>
          <Plus />
        </div>
      </button>

    </div>

    <div class="scene-buttons">
      <label :for="buttonsUuid">
        Buttons
      </label>
      <div :id="buttonsUuid" class="button-grid">
        <template v-for="(slot, index) in SCENE_MAX_BUTTONS" :key="index">
            <button v-if="props.data.buttonNodes[index]">
              {{ slot }}
            </button>
            <button v-else-if="index === props.data.buttonNodes.length">
              <Plus />
            </button>
            <button disabled class="disabled-button" v-else>
              <X />
            </button>
        </template>
      </div>
    </div>

    <div class="scene-text">
      <label :for=sceneTextUuid>
        Scene Text
      </label>
      <textarea :id=sceneTextUuid v-model="sceneTextRef" />
    </div>
  </div>
</template>

<style scoped>
.scene-node-container {
  background-color: cadetblue;
  display: flex;
  align-content: center;
  flex-direction: column;
  padding: 2ch;
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
  border-radius: 5%;
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
  min-width: 10ch;
  min-height: 2ch;
}
</style>