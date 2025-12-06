// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { ref } from 'vue'
import { useGetPointerPosition, useVueFlow } from '@vue-flow/core'
import { useLayout } from './useLayout'
import type { NodeStateOptions } from '@/types'

export function useNodeDrag(nodeId: string, sceneId: string, nodeInfo: NodeStateOptions) {
  const { updateNodePositions, findNode } = useVueFlow()
  const getPointerPosition = useGetPointerPosition()
  const dragging = ref(false)
  let startPointer = { x: 0, y: 0 }
  let startPosition = { x: 0, y: 0 }

  let nodeInformation = nodeInfo

  const { setNodePosition } = useLayout()

  function updateNodeInfo(nodeInfo: NodeStateOptions) {
    console.log(nodeId, sceneId, nodeInfo)
    nodeInformation = nodeInfo
  }

  function onMouseDown(event: MouseEvent) {
    event.stopPropagation() // prevent viewport pan
    dragging.value = true
    startPointer = getPointerPosition(event)

    const node = findNode(nodeId)
    if (!node) return

    startPosition = { ...node.position }

    // @ts-expect-error hacky work-around that works
    document.addEventListener.call(window, "mousemove", onMouseMove)
    document.addEventListener.call(window, "mouseup", onMouseUp)
  }

  function onMouseMove(event: MouseEvent) {
    if (!dragging.value) return
    const pointerPos = getPointerPosition(event)
    const dx = pointerPos.x - startPointer.x
    const dy = pointerPos.y - startPointer.y
    const newPosition = { x: startPosition.x + dx, y: startPosition.y + dy }

    updateNodePositions([
      { id: nodeId, position: newPosition, distance: { x: 0, y: 0 }, from: { ...startPosition }, dimensions: { width: 0, height: 0 } }
    ], true, true)
    setNodePosition(sceneId, newPosition, nodeInformation)
    console.log(sceneId, newPosition, nodeInformation)
  }

  function onMouseUp() {
    dragging.value = false
    // @ts-expect-error hacky work-around that works
    document.removeEventListener.call(window, 'mousemove', onMouseMove)
    document.removeEventListener.call(window, 'mouseup', onMouseUp)
  }

  return { onMouseDown, dragging, updateNodeInfo }
}