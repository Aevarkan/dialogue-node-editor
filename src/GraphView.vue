<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { ControlButton, Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { initialEdges, initialNodes } from './initial-elements.js'
import { Moon, RotateCcw, Sun } from 'lucide-vue-next'

/**
 * `useVueFlow` provides:
 * 1. a set of methods to interact with the VueFlow instance (like `fitView`, `setViewport`, `addEdges`, etc)
 * 2. a set of event-hooks to listen to VueFlow events (like `onInit`, `onNodeDragStop`, `onConnect`, etc)
 * 3. the internal state of the VueFlow instance (like `nodes`, `edges`, `viewport`, etc)
 */
const { onInit, onNodeDragStop, onConnect, addEdges, setViewport } = useVueFlow()

const nodes = ref(initialNodes)

const edges = ref(initialEdges)

// our dark mode toggle flag
const dark = ref(false)

/**
 * This is a Vue Flow event-hook which can be listened to from anywhere you call the composable, instead of only on the main component
 * Any event that is available as `@event-name` on the VueFlow component is also available as `onEventName` on the composable and vice versa
 *
 * onInit is called when the VueFlow viewport is initialized
 */
onInit((vueFlowInstance) => {
  // instance is the same as the return of `useVueFlow`
  vueFlowInstance.fitView()
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
</script>

<template>
  <!-- it always fills up its parent container -->
  <VueFlow
    style="width: 100%; height: 100%;"
    :nodes="nodes"
    :edges="edges"
    :class="{ dark }"
    :default-viewport="{ zoom: 1.5 }"
    :min-zoom="0.2"
    :max-zoom="4"
  >
    <Background pattern-color="#aaa" :gap="16" />

    <MiniMap />

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

