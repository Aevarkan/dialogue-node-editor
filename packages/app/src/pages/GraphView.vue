<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow, type GraphNode, type Node } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { ControlButton, Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Moon, RotateCcw, Sun } from 'lucide-vue-next'
import { useDialogueData } from '@/composables/dialogueData.js'
import { useVsCode } from '@/composables/vscodeMessages'
import type { Button, ReadyMessage } from '@workspace/common'
import SceneNode from '@/components/SceneNode.vue'
import ButtonSlotNode from '@/components/ButtonSlotNode.vue'
import type { LogicalScene } from '@/classes/LogicalScene'
import SceneCommandNode from '@/components/SceneCommandNode.vue'
import { toCommandNode, toSceneNode, toSlotNode } from '@/helpers/nodes'
import type { DataChangeCategory, SceneCommandSlot, SceneFunctionSlot, VisualScene, VisualSceneCommand, VisualSlot } from '@/types'
import { useViewportPan } from '@/composables/viewportPanDrag'

const { createScene, deleteScene, onSceneCreate, onSceneDelete, onSceneUpdate, updateScene, getScene } = useDialogueData()
const { inWebview, postMessage } = useVsCode()

const { onInit, onNodeDragStop, onConnect, addEdges, setViewport, addNodes, updateNodeData, removeNodes, findNode, updateNode, viewport, setCenter } = useVueFlow()

onSceneCreate((_sceneId, scene) => {
  addNewScene(scene)
})

onSceneUpdate((sceneId, scene) => {
  // console.log("update", sceneId, scene)
  // check if the node exists first
  const node = findNode(sceneId)
  if (!node) {
    console.warn("scene update was actually a creation!")
    addNewScene(scene)
  // actually updating!
  } else {
    updateNodeData<VisualScene>(sceneId, { ...scene.getVisualScene() })
    // now the slots
    const updates = scene.getLastDataChanges(true)
    updates.forEach(update => {
      switch (update.change) {
        case 'created':
        case 'modified':
          if (update.kind === "button") {
            // created/modified means it'll be there
            handleButtonSlotUpdate(update.change, scene.getSlot(update.index)!)
          } else {
            // created/modified means it'll be there
            handleCommandSlotUpdate(update.change, scene.getCommand(update.type)!)
          }
          break

        case 'deleted':
          removeNodes(update.id)
          break
      }
    })
  }
})

function handleCommandSlotUpdate(update: Exclude<DataChangeCategory, "deleted">, command: VisualSceneCommand) {
  switch (update) {
    case 'created':
      addNodes(toCommandNode(command))
      break
    case 'modified':
      updateNodeData(command.id, command)
      break
  }
}

function handleButtonSlotUpdate(update: Exclude<DataChangeCategory, "deleted">, slot: VisualSlot) {
    switch (update) {
    case 'created':
      addNodes(toSlotNode(slot))
      break
    case 'modified':
      updateNodeData(slot.id, slot)
      break
  }
}

function addNewScene(newScene: LogicalScene) {
  const sceneNode = toSceneNode(newScene.getVisualScene())
  addNodes(sceneNode)

  newScene.getSlots().forEach((slot) => {
    const slotNode = toSlotNode(slot)
    addNodes(slotNode)
  })
  newScene.getCommands().forEach(cmd => {
    const commandNode = toCommandNode(cmd)
    addNodes(commandNode)
  })
}

onSceneDelete((sceneId, children) => {
  removeNodes([sceneId, ...children])
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

function handleButtonEdit(parentSceneId: string, nodeId: string, buttonIndex: number, button: Button) {
  updateNodeData<VisualSlot>(nodeId, { button })

  const existingScene = getScene(parentSceneId)
  // should never happen
  if (!existingScene) {
    throw new Error("handleButtonEdit no scene")
  }

  existingScene.updateSlot(buttonIndex, button)
  updateScene(existingScene)
}

function handleEditNpcName(sceneId: string, newName: string) {
  const existingScene = getScene(sceneId)
  // should never happen
  if (!existingScene) {
    throw new Error("handleEditNpcName no scene")
  }
  // update for vueflow
  updateNodeData<VisualScene>(sceneId, { npcName: newName })

  existingScene.npcName = newName
  updateScene(existingScene)
}

function handleEditSceneText(sceneId: string, newText: string) {
  const existingScene = getScene(sceneId)
  // should never happen
  if (!existingScene) {
    throw new Error("handleEditSceneText no scene")
  }
  // update for vueflow
  updateNodeData<VisualScene>(sceneId, { sceneText: newText })

  existingScene.sceneText = newText
  updateScene(existingScene)
}

function handleEditCommand(parentSceneId: string, nodeId: string, commandType: SceneCommandSlot, newCommands: string[]) {
  updateNodeData<VisualSceneCommand>(nodeId, { commands: newCommands })

  const existingScene = getScene(parentSceneId)
  if (!existingScene) {
    throw new Error("handleEditCommand no scene")
  }

  existingScene.setCommand(commandType, newCommands)
  updateScene(existingScene)
}

function handleSelectNode(nodeId: string) {
  // buggy
  // deselect all other nodes
  // const selectedNodes = getSelectedNodes.value
  // console.log(selectedNodes)
  // this function is buggy
  // addSelectedNodes
  
  // @ts-expect-error this works!
  updateNode(nodeId, { selected: true })
  
  const nodeToSelect = findNode(nodeId)
  if (!nodeToSelect) return
  // zoom to the new node
  const newX = nodeToSelect.computedPosition.x
  const newY = nodeToSelect.computedPosition.y

  setCenter(newX, newY, { duration: 100, zoom: viewport.value.zoom })

  // setViewport(
  //   { x: newX, y: newY, zoom: viewport.value.zoom },
  //   { duration: 100, interpolate: "smooth" }
  // )
}

function handleAddSceneSlot(sceneId: string, slot: SceneFunctionSlot) {
  const scene = getScene(sceneId)
  if (!scene) return
  // command slot
  if (slot === "close" || slot === "open") {
    const sceneCommand = scene.setCommand(slot, [])
    const commandNode = toCommandNode(sceneCommand)
    addNodes(commandNode)
  // button slot
  } else {
    const emptyButton: Button = { commands: [], displayName: "" }
    const sceneButtonSlot = scene.addSlot(emptyButton)
    const slotNode = toSlotNode(sceneButtonSlot)
    addNodes(slotNode)
  }
  // send the update
  updateScene(scene)
  updateNodeData<VisualScene>(scene.sceneId, { ...scene.getVisualScene() })
}

// viewport custom drag handler
const viewportDrag = useViewportPan()

</script>

<template>
  <!-- it always fills up its parent container -->
  <div style="width: 100%; height: 100%;" @mousedown="viewportDrag.onMouseDown">
    <VueFlow
      style="width: 100%; height: 100%;"
      :class="{ dark }"
      :default-viewport="{ zoom: 1.5 }"
      :min-zoom="0.2"
      :max-zoom="4"
    >
      <Background pattern-color="#aaa" :gap="16" />
  
      <template #node-scene="props">
        <SceneNode v-bind="props" @edit-npc-name="handleEditNpcName" @edit-scene-text="handleEditSceneText" @select-node="handleSelectNode" @add-scene-slot="handleAddSceneSlot" />
      </template>
  
      <template #node-button-slot="props">
        <ButtonSlotNode v-bind="props" @edit-button="handleButtonEdit" />
      </template>
  
      <template #node-command-slot="props">
        <SceneCommandNode v-bind="props" @edit-command="handleEditCommand" />
      </template>
  
    </VueFlow>
  </div>
</template>

