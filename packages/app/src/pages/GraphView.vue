<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow, type Node, type XYPosition } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { ControlButton, Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Moon, RotateCcw, Sun } from 'lucide-vue-next'
import { nodeTypes } from '@/components/index.js'
import { useDialogueData } from '@/composables/dialogueData.js'
import { useVsCode } from '@/composables/vscodeMessages'
import type { ReadyMessage } from '@workspace/common'
import SceneNode from '@/components/SceneNode.vue'
import type { VisualScene } from '@/types'

const { createScene, deleteScene, onSceneCreate, onSceneDelete, onSceneUpdate, onSlotUpdate, updateScene } = useDialogueData()
const { inWebview, postMessage } = useVsCode()

const { onInit, onNodeDragStop, onConnect, addEdges, setViewport, addNodes, updateNodeData, removeNodes, findNode } = useVueFlow()

// the key is sceneId
const sceneMap = new Map<string, VisualScene>()

onSceneCreate((sceneId, scene) => {
  sceneMap.set(sceneId, scene)
  const position: XYPosition = {
    x: 0,
    y: 0
  }
  const newSceneNode: Node = {
    id: sceneId,
    position: position,
    data: scene,
    type: "scene"
  }
  addNodes(newSceneNode)
})

onSceneUpdate((sceneId, scene) => {
  sceneMap.set(sceneId, scene)
  // console.log("update", sceneId, scene)
  // check if the node exists first
  const node = findNode(sceneId)
  if (!node) {
    const position: XYPosition = {
      x: 0,
      y: 0
    }
    const newSceneNode: Node = {
      id: sceneId,
      position: position,
      data: scene,
      type: "scene"
    }
    addNodes(newSceneNode)
  } else {
    updateNodeData(sceneId, scene)
  }
})

onSceneDelete((sceneId) => {
  sceneMap.delete(sceneId)
  removeNodes(sceneId)
})

// our dark mode toggle flag
const dark = ref(false)

onInit((vueFlowInstance) => {
  // instance is the same as the return of `useVueFlow`
  vueFlowInstance.fitView()
  console.log("In webview: ", inWebview())
  if (inWebview()) {
    const readyMessage: ReadyMessage = {
      messageType: "ready",
      isReadyStatus: true
    }
    postMessage(readyMessage)
  }
})

/**
 * onNodeDragStop is called when a node is done being dragged
 *
 * Node drag events provide you with:
 * 1. the event object
 * 2. the nodes array (if multiple nodes are dragged)
 * 3. the node that initiated the drag
 * 4. any intersections with other nodes
 */
onNodeDragStop(({ event, nodes, node }) => {
  console.log('Node Drag Stop', { event, nodes, node })
})

/**
 * onConnect is called when a new connection is created.
 *
 * You can add additional properties to your new edge (like a type or label) or block the creation altogether by not calling `addEdges`
 */
onConnect((connection) => {
  addEdges(connection)
})

// /**
//  * To update a node or multiple nodes, you can
//  * 1. Mutate the node objects *if* you're using `v-model`
//  * 2. Use the `updateNode` method (from `useVueFlow`) to update the node(s)
//  * 3. Create a new array of nodes and pass it to the `nodes` ref
//  */
// function updatePos() {
//   nodes.value = nodes.value.map((node) => {
//     return {
//       ...node,
//       position: {
//         x: Math.random() * 400,
//         y: Math.random() * 400,
//       },
//     }
//   })
// }

// /**
//  * toObject transforms your current graph data to an easily persist-able object
//  */
// function logToObject() {
//   console.log(toObject())
// }

/**
 * Resets the current viewport transformation (zoom & pan)
 */
function resetTransform() {
  setViewport({ x: 0, y: 0, zoom: 1 })
}

function toggleDarkMode() {
  dark.value = !dark.value
}

function handleEditNpcName(sceneId: string, newName: string) {
  const existingScene = sceneMap.get(sceneId)
  // should never happen
  if (!existingScene) {
    throw new Error("handleEditNpcName no scene")
  }
  existingScene.npcName = newName
  updateScene(existingScene)
}

function handleEditSceneText(sceneId: string, newText: string) {
  const existingScene = sceneMap.get(sceneId)
  // should never happen
  if (!existingScene) {
    throw new Error("handleEditSceneText no scene")
  }
  existingScene.sceneText = newText
  updateScene(existingScene)
}
</script>

<template>
  <!-- it always fills up its parent container -->
  <VueFlow
    style="width: 100%; height: 100%;"
    :node-types="nodeTypes"
    :class="{ dark }"
    :default-viewport="{ zoom: 1.5 }"
    :min-zoom="0.2"
    :max-zoom="4"
  >
    <Background pattern-color="#aaa" :gap="16" />

    <MiniMap />

    <template #node-scene="props">
      <SceneNode v-bind="props" @edit-npc-name="handleEditNpcName" @edit-scene-text="handleEditSceneText" />
    </template>

    <Controls position="top-left">
      <ControlButton title="Reset Transform" @click="resetTransform">
        <RotateCcw />
      </ControlButton>

      <!-- <ControlButton title="Shuffle Node Positions" @click="updatePos">
        <Icon name="update" />
      </ControlButton> -->

      <ControlButton title="Toggle Dark Mode" @click="toggleDarkMode">
        <Sun v-if="dark"/>
        <Moon v-else/>
      </ControlButton>

      <!-- <ControlButton title="Log `toObject`" @click="logToObject">
        <Icon name="log" />
      </ControlButton> -->
    </Controls>
  </VueFlow>
</template>

