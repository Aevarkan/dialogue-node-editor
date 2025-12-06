// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import type { ViewportTransform, XYPosition } from "@vue-flow/core";
import { useVsCode } from "./vscodeMessages";
import type { NodeStateOptions } from "@/types";

interface LayoutState {
  state: SceneState[],
  viewPort: ViewportTransform
}

interface SceneState {
  sceneId: string,
  sceneNodePosition: XYPosition,
  openCommandNodePosition?: XYPosition
  closeCommandNodePosition?: XYPosition
  buttonPositions: XYPosition[]
}

export function useLayout() {

  const { setState, getState } = useVsCode()
  
  const layoutMap = new Map<string, SceneState>()
  let currentViewport: ViewportTransform = { x: 0, y: 0, zoom: 1 }

  // initialised from saved state
  const savedState = getState() as LayoutState | undefined
  if (savedState) {
    for (const savedScene of savedState.state) {
      layoutMap.set(savedScene.sceneId, savedScene)
    }
    currentViewport = savedState.viewPort
  }

  function saveState() {
    const stateArray = Array.from(layoutMap.values())
    const stateObject: LayoutState = {
      state: stateArray,
      viewPort: currentViewport
    }
    setState(stateObject)
  }

  function setNodePosition(sceneId: string, position: XYPosition, nodeStateOptions: NodeStateOptions) {
    // ensure there is a state
    let sceneState = layoutMap.get(sceneId)
    if (!sceneState) {
      sceneState = {
        sceneId,
        buttonPositions: [],
        sceneNodePosition: { x: 0, y: 0 },
      }
    }

    switch (nodeStateOptions.nodeType) {
      case "button":
        sceneState.buttonPositions[nodeStateOptions.slot] = position
        break

      case "command": 
        if (nodeStateOptions.slot === "close") {
          sceneState.closeCommandNodePosition = position
        } else if (nodeStateOptions.slot === "open") {
          sceneState.openCommandNodePosition = position
        } else {
          throw new Error("useLayout setPosition error")
        }
        break

      case "scene":
        sceneState.sceneNodePosition = position
        break
    }

    // then update
    layoutMap.set(sceneId, sceneState)
    saveState()
  }

  function getNodePosition(sceneId: string, nodeStateOptions: NodeStateOptions) {
    const sceneState = layoutMap.get(sceneId)
    if (!sceneState) {
      return
    }

    switch (nodeStateOptions.nodeType) {
      case "button":
        return sceneState.buttonPositions[nodeStateOptions.slot]

      case "command": 
        if (nodeStateOptions.slot === "close") {
          return sceneState.closeCommandNodePosition
        } else if (nodeStateOptions.slot === "open") {
          return sceneState.openCommandNodePosition
        } else {
          throw new Error("useLayout getPosition error")
        }

      case "scene":
        return sceneState.sceneNodePosition
    }
  }

  function setViewportState(transform: ViewportTransform) {
    currentViewport = transform
    saveState()
  }

  function getViewportState() {
    return currentViewport
  }

  return { setNodePosition, getNodePosition, setViewportState, getViewportState }

}
