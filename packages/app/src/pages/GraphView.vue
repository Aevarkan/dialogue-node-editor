<script setup lang="ts">
import { VueFlow, useVueFlow, type GraphNode } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { useDialogueData } from '@/composables/dialogueData.js'
import { useVsCode } from '@/composables/vscodeMessages'
import type { Button, ReadyMessage, Scene } from '@workspace/common'
import SceneNode from '@/components/SceneNode.vue'
import ButtonSlotNode from '@/components/ButtonSlotNode.vue'
import { LogicalScene } from '@/classes/LogicalScene'
import SceneCommandNode from '@/components/SceneCommandNode.vue'
import { toCommandNode, toSceneNode, toSlotNode } from '@/helpers/nodes'
import type { DataChangeCategory, SceneCommandSlot, SceneFunctionSlot, VisualScene, VisualSceneCommand, VisualSlot } from '@/types'
import { useViewportPan } from '@/composables/viewportPanDrag'
import { useLayoutData } from '@/composables/useLayoutData'
import { makeChildEdge } from '@/helpers/edges'
import { ref } from 'vue'
import { useNodeLayout } from '@/composables/useNodeLayout'
import { MiniMap } from '@vue-flow/minimap'
import { MapMinus, MapPlus, Plus } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useSceneDock } from '@/composables/useSceneDock'

const { createScene, deleteScene, onSceneCreate, onSceneDelete, onSceneUpdate, updateScene, getScene } = useDialogueData()
const { inWebview, postMessage } = useVsCode()
const { getNodePosition, getViewportState, setViewportState, setNodePosition } = useLayoutData()
const { arrangeAroundScene } = useNodeLayout()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const colours = useTheme()
const { dockScene, onDockScene, undockScene, onUndockScene, isSceneDocked, dockedSceneIds, deleteScene: deleteDockedScene } = useSceneDock()

const { onInit, onConnect, addEdges, addNodes, updateNodeData, removeNodes, findNode, updateNode, viewport, setCenter, onViewportChangeEnd } = useVueFlow()

onSceneCreate((sceneId, scene) => {
  if (isSceneDocked(sceneId)) return

  addNewScene(scene)
})

onUndockScene(sceneId => {
  const scene = getScene(sceneId)
  if (!scene) {
    throw new Error(`Could not undock scene '${sceneId}'. LogicalScene not found!`)
  }

  addNewScene(scene)
})

onSceneUpdate((sceneId, scene) => {
  if (isSceneDocked(sceneId)) return
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
      const edge = makeChildEdge(command.parentSceneId, command.id)
      addEdges(edge)
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
      const edge = makeChildEdge(slot.parentSceneId, slot.id)
      addEdges(edge)
      break
    case 'modified':
      updateNodeData(slot.id, slot)
      break
  }
}

function addNewScene(newScene: LogicalScene) {
  const sceneNodePosition = getNodePosition(newScene.sceneId, { nodeType: "scene" }) ?? { x: 0, y: 0 }
  const positions = arrangeAroundScene(newScene, sceneNodePosition)
  const sceneNode = toSceneNode(newScene.getVisualScene(), sceneNodePosition)
  addNodes(sceneNode)

  newScene.getSlots().forEach((slot) => {
    const slotNodePosition = getNodePosition(newScene.sceneId, { nodeType: "button", slot: slot.index}) ?? positions[slot.id]
    const slotNode = toSlotNode(slot, slotNodePosition)
    addNodes(slotNode)
    const slotEdge = makeChildEdge(newScene.sceneId, slot.id)
    addEdges(slotEdge)
  })
  newScene.getCommands().forEach(cmd => {
    const commandNodePosition = getNodePosition(newScene.sceneId, { nodeType: "command", slot: cmd.type}) ?? positions[cmd.id]
    const commandNode = toCommandNode(cmd, commandNodePosition)
    addNodes(commandNode)
    const commandEdge = makeChildEdge(newScene.sceneId, cmd.id)
    addEdges(commandEdge)
  })
}

onDockScene(sceneId => {
  const scene = getScene(sceneId)
  if (!scene) {
    throw new Error(`Could not dock scene '${sceneId}'. LogicalScene not found!`)
  }

  const children = scene.getChildNodeIds()
  removeNodes([sceneId, ...children])
})

onSceneDelete((sceneId, children) => {
  removeNodes([sceneId, ...children])
  deleteDockedScene(sceneId)
})

///////////////////
// FROM TEMPLATE //
///////////////////

onInit((vueFlowInstance) => {
  // instance is the same as the return of `useVueFlow`
  vueFlowInstance.fitView()

  // saved position
  vueFlowInstance.setViewport(getViewportState())
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

onViewportChangeEnd((viewportTransform) => {
  setViewportState(viewportTransform)
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
    addEdges(makeChildEdge(sceneId, sceneCommand.id))
  // button slot
  } else {
    const emptyButton: Button = { commands: [], displayName: "" }
    const sceneButtonSlot = scene.addSlot(emptyButton)
    const slotNode = toSlotNode(sceneButtonSlot.newSlot)
    addNodes(slotNode)
    addEdges(makeChildEdge(sceneId, sceneButtonSlot.newSlot.id))
    const highestIndexChange = sceneButtonSlot.highestIndexChange
    if (highestIndexChange) {
      updateNodeData<VisualSlot>(highestIndexChange.id, { highestIndex: false })
    }
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
    // `as boolean` works as `null` is only for `deleted`
    updateNodeData<VisualSlot>(change.id, { index: change.index, highestIndex: change.highestIndex as boolean })
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

function handleIndexSwap(parentSceneId: string, currentIndex: number, targetIndex: number) {
  const scene = getScene(parentSceneId)
  if (!scene) return

  const newSlots = scene.swapSlots(currentIndex, targetIndex)
  console.log(newSlots)
  newSlots.forEach(slot => {
    updateNodeData<VisualSlot>(slot.id, { ...slot })
    // assertion is valid, the node must exist as the id does too
    const nodePosition = findNode(slot.id)!.computedPosition
    setNodePosition(parentSceneId, { x: nodePosition.x, y: nodePosition.y }, { nodeType: "button", slot: slot.index })
  })

  // update the scene as well
  updateNodeData<VisualScene>(scene.sceneId, { ...scene.getVisualScene() })
  updateScene(scene)
}

// viewport custom drag handler
const viewportDrag = useViewportPan()


///////////////////////////////////////
//        ADD SCENE BUTTON           //
// TOO SMALL TO PUT IN OWN COMPONENT //
///////////////////////////////////////

const newSceneName = ref('')
function handleAddNewSceneButton() {
  const existingScene = getScene(newSceneName.value)
  if (existingScene) return

  // no empty scene name is allowed
  if (newSceneName.value === "") return

  const newScene: Scene = {
    sceneId: newSceneName.value,
    npcName: "",
    sceneText: "",
    buttons: [],
    closeCommands: [],
    openCommands: [],
  }
  const logicalScene = LogicalScene.fromScene(newScene)
  createScene(logicalScene)
  // addNewScene(logicalScene)

  // empty the string
  newSceneName.value = ""
}

function canAddNewScene(): boolean {
  const existingScene = getScene(newSceneName.value)
  if (existingScene) return false
  // no empty scene name is allowed
  if (newSceneName.value === "") return false
  return true
}

// GROUP AROUND SCENE BUTTON
function groupNodesAroundScene(sceneId: string) {
  // We don't question how or why this works
  // Not having this means you have to press the button two times for the positions to save
  setTimeout(doubleDouble, 1, sceneId)
  setTimeout(doubleDouble, 2, sceneId)
}

function doubleDouble(sceneId: string) {
  const scene = getScene(sceneId)
  const sceneNode = findNode(sceneId)
  if (!scene || !sceneNode) return

  const positions = arrangeAroundScene(scene, sceneNode.computedPosition)
  for (const [id, pos] of Object.entries(positions)) {
    updateNode(id, { position: pos })
    
    // update node positions in state too
    const node = findNode(id) as GraphNode<VisualSlot> | GraphNode<VisualSceneCommand>
    switch (node.data.type) {
      case 'buttonSlot':
        setNodePosition(sceneId, node.computedPosition, { nodeType: "button", slot: node.data.index })
        break

      case 'open':
        setNodePosition(sceneId, node.computedPosition, { nodeType: "command", slot: "open" })
        break

      case 'close':
        setNodePosition(sceneId, node.computedPosition, { nodeType: "command", slot: "close" })
        break

    }
  }
}

// minimap toggle
const showMiniMap = ref(false)

function toggleMiniMap() {
  showMiniMap.value = !showMiniMap.value
}

</script>

<template>
  <!-- it always fills up its parent container -->
  <div class="wrapper" @mousedown="viewportDrag.onMouseDown">
    <VueFlow
      style="width: 100%; height: 100%;"
      :default-viewport="{ zoom: 1.5 }"
      :min-zoom="0.2"
      :max-zoom="4"
    >
      <Background pattern-color="#aaa" :gap="16" />
  
      <template v-if="showMiniMap">
        <MiniMap />
      </template>

      <template #node-scene="props">
        <SceneNode
          v-bind="props"
          @edit-npc-name="handleEditNpcName"
          @edit-scene-text="handleEditSceneText"
          @select-node="handleSelectNode"
          @add-scene-slot="handleAddSceneSlot"
          @delete-scene="deleteScene"
          @collect-scene-nodes="groupNodesAroundScene"
          @dock-scene="dockScene"
        />
      </template>
  
      <template #node-button-slot="props">
        <ButtonSlotNode v-bind="props" @edit-button="handleButtonEdit" @select-node="handleSelectNode" @delete-slot-node="handleDeleteSlotNode" @swap-index="handleIndexSwap" />
      </template>
  
      <template #node-command-slot="props">
        <SceneCommandNode v-bind="props" @edit-command="handleEditCommand" @select-node="handleSelectNode" @delete-command-node="handleDeleteCommandNode" />
      </template>
  
    </VueFlow>

    <div class="overlay-wrapper">
      <!-- New Scene Button -->
      <div id="new-scene-button-wrapper">
        <button v-if="canAddNewScene()" @click="handleAddNewSceneButton" @mousedown.stop>
          <Plus />
        </button>
        <button v-else disabled @mousedown.stop>
          <Plus />
        </button>
        <input v-model="newSceneName" placeholder="steve_intro_scene" @mousedown.stop />
      </div>

      <!-- MiniMap Button -->
      <div>
        <button @click="toggleMiniMap" @mousedown.stop>
          <MapMinus v-if="showMiniMap" />
          <MapPlus v-else />
        </button>
      </div>

      <!-- Scene Dock -->
      <div>
        <div v-for="sceneId in dockedSceneIds" :key="sceneId" >
          {{ sceneId }}
          <button @click="undockScene(sceneId)">Undock</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: inline-block;
}

.overlay-wrapper {
  position: absolute;
  top: 4ch;
  left: 4ch;
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
}

#new-scene-button-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

input::placeholder {
  user-select: none;
  pointer-events: none;
}

button {
  aspect-ratio: 1 / 1;
  border-radius: 5px;
}
</style>