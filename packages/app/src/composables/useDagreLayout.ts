// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import type { LogicalScene } from "@/classes/LogicalScene";
import { graphlib, layout } from "@dagrejs/dagre";
import type { XYPosition } from "@vue-flow/core";

export function useDagreLayout() {

  function groupAroundScene(scene: LogicalScene, scenePosition: XYPosition, scale: number = 5) {
    const BUTTON_OFFSET = 60
    const buttonLayout = new graphlib.Graph()
    const commandLayout = new graphlib.Graph()
    buttonLayout.setGraph({ rankdir: "TB" })
    commandLayout.setGraph({ rankdir: "TB" })
    buttonLayout.setDefaultEdgeLabel(() => ({}))
    commandLayout.setDefaultEdgeLabel(() => ({}))

    // scene node (the parent)
    buttonLayout.setNode(scene.sceneId, { width: 10, height: 10})
    commandLayout.setNode(scene.sceneId, { width: 10, height: 10})

    // buttons
    for (const buttonSlot of scene.getSlots()) {
      buttonLayout.setNode(buttonSlot.id, { width: 10, height: 10})
      buttonLayout.setEdge(scene.sceneId, buttonSlot.id)
    }

    // commands
    const commands = scene.getCommands()
    for (const command of commands) {
      commandLayout.setNode(command.id, { width: 10, height: 10})
      commandLayout.setEdge(scene.sceneId, command.id)
    }

    layout(buttonLayout)
    layout(commandLayout)

    // button nodes
    const dagreParent = buttonLayout.node(scene.sceneId)
    const buttonDx = scenePosition.x - dagreParent.x
    const buttonDy = scenePosition.y - dagreParent.y
    const buttonPositions: Record<string, XYPosition> = {}

    for (const id of buttonLayout.nodes()) {
      const n = buttonLayout.node(id)
      buttonPositions[id] = { x: n.x + buttonDx, y: n.y + buttonDy }
    }

    // command nodes
    const dagreCommandParent = commandLayout.node(scene.sceneId)
    const commandDx = scenePosition.x - dagreCommandParent.x
    const commandDy = scenePosition.y - dagreParent.y
    const commandPositions: Record<string, XYPosition> = {}

    for (const id of commandLayout.nodes()) {
      const n = commandLayout.node(id)
      commandPositions[id] = { x: n.x + commandDx, y: n.y + commandDy }
    }

    // if not command nodes, then just return buttons
    if (commands.length === 0) {
      return buttonPositions

    // otherwise move buttons down
    } else {
      const combinedPositions: Record<string, XYPosition> = {}

      const parentSceneOffset: XYPosition = {
        x: commandLayout.node(scene.sceneId).x - buttonLayout.node(scene.sceneId).x,
        y: commandLayout.node(scene.sceneId).y - buttonLayout.node(scene.sceneId).y
      }
      
      for (const buttonId in buttonPositions) {
        // includes parent scene position
        const originalPosition = buttonPositions[buttonId]!
        const buttonPosition: XYPosition = {
          x: (originalPosition.x + parentSceneOffset.x) * scale,
          y: (originalPosition.y + parentSceneOffset.y + BUTTON_OFFSET) * scale
        }

        // do not add the parent scene's position, as it'll be shifted
        if (buttonId === scene.sceneId) continue

        combinedPositions[buttonId] = buttonPosition
      }

      for (const commandId in commandPositions) {
        combinedPositions[commandId] = {
          x: commandPositions[commandId]!.x * scale,
          y: commandPositions[commandId]!.y * scale
        }
      }
      return combinedPositions

    }
  }

  return { groupAroundScene }
  
}
