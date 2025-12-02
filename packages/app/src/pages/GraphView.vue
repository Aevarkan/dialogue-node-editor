<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
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

const { onInit, onConnect, addEdges, addNodes, updateNodeData, removeNodes, findNode, updateNode, viewport, setCenter } = useVueFlow()

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

///////////////////
// FROM TEMPLATE //
///////////////////

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
 * onConnect is called when a new connection is created.
 *
 * You can add additional properties to your new edge (like a type or label) or block the creation altogether by not calling `addEdges`
 */
onConnect((connection) => {
  addEdges(connection)
})


//////////////////
// END TEMPLATE //
//////////////////

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
  // @ts-expect-error this works!
  updateNode(nodeId, { selected: true })
  
  const nodeToSelect = findNode(nodeId)
  if (!nodeToSelect) return
  // zoom to the new node
  const newX = nodeToSelect.computedPosition.x
  const newY = nodeToSelect.computedPosition.y

  setCenter(newX, newY, { duration: 100, zoom: viewport.value.zoom })
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

function handleDeleteSlotNode(parentSceneId: string, index: number, nodeId: string) {
  const scene = getScene(parentSceneId)
  if (!scene) return
  removeNodes(nodeId)
  const deletionInfo = scene.deleteSlot(index)
  deletionInfo.forEach(change => {
    // don't delete the node, we did that already
    if (change.change === "deleted") return

    // only change is the indexes
    updateNodeData<VisualSlot>(change.id, { index: change.index })
  })

  // update the scene node's data
  updateNodeData<VisualScene>(scene.sceneId, { ...scene.getVisualScene() })
  updateScene(scene)
}

function handleDeleteCommandNode(parentSceneId: string, commandType: SceneCommandSlot, nodeId: string) {
  const scene = getScene(parentSceneId)
  if (!scene) return
  scene.deleteCommand(commandType)
  removeNodes(nodeId)

  // update the scene node's data
  updateNodeData<VisualScene>(scene.sceneId, { ...scene.getVisualScene() })
  updateScene(scene)
}

// viewport custom drag handler
const viewportDrag = useViewportPan()

</script>

<template>
  <!-- it always fills up its parent container -->
  <div style="width: 100%; height: 100%;" @mousedown="viewportDrag.onMouseDown">
    <VueFlow
      style="width: 100%; height: 100%;"
      :default-viewport="{ zoom: 1.5 }"
      :min-zoom="0.2"
      :max-zoom="4"
    >
      <Background pattern-color="#aaa" :gap="16" />
  
      <template #node-scene="props">
        <SceneNode v-bind="props" @edit-npc-name="handleEditNpcName" @edit-scene-text="handleEditSceneText" @select-node="handleSelectNode" @add-scene-slot="handleAddSceneSlot" />
      </template>
  
      <template #node-button-slot="props">
        <ButtonSlotNode v-bind="props" @edit-button="handleButtonEdit" @select-node="handleSelectNode" @delete-slot-node="handleDeleteSlotNode" />
      </template>
  
      <template #node-command-slot="props">
        <SceneCommandNode v-bind="props" @edit-command="handleEditCommand" @select-node="handleSelectNode" @delete-command-node="handleDeleteCommandNode" />
      </template>
  
    </VueFlow>
  </div>
</template>

