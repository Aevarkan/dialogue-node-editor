// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { SCENE_MAX_BUTTONS, type Button, type DeleteSceneMessage, type GenericSceneMessage, type Scene, type SceneMessage } from "@workspace/common"
import { useVsCode } from "./vscodeMessages";
import type { VisualScene } from "@/types";
import { toVisualScene } from "@/helpers/dataMapper";

// type SceneDelete = (sceneId: string) => void
// type SceneGeneric = (sceneId: string, scene: Scene) => void

export function useDialogueData() {

  const { inWebview, postMessage } = useVsCode()

  // event listeners
  const listeners = {
    onSceneCreate: [] as ((sceneId: string, scene: VisualScene) => void)[],
    onSceneUpdate: [] as ((sceneId: string, scene: VisualScene) => void)[],
    onSceneDelete: [] as ((sceneId: string) => void)[],
    onSlotUpdate: [] as ((sceneId: string, index: number, button?: Button) => void)[]
  }

  /**
   * Sends a new scene to VSCode.
   */
  function createScene(scene: Scene | VisualScene) {
    if (inWebview()) {
      const createSceneMessage: GenericSceneMessage = {
        sceneId: scene.sceneId,
        messageType: "createScene",
        sceneData: scene
      }
      postMessage(createSceneMessage)
    }
  }

  /**
   * Sends updated scene to VSCode.
   */
  function updateScene(scene: Scene | VisualScene) {
    if (inWebview()) {
      const updateSceneMessage: GenericSceneMessage = {
        sceneId: scene.sceneId,
        messageType: "updateScene",
        sceneData: scene
      }
      postMessage(updateSceneMessage)
    }
  }

  /**
   * Sends scene deletion data to VSCode.
   */
  function deleteScene(sceneId: string) {
    if (inWebview()) {
      const deleteSceneMessage: DeleteSceneMessage = {
        messageType: "deleteScene",
        sceneId: sceneId
      }
      postMessage(deleteSceneMessage)
    }
  }

  function onSlotUpdate(callback: (parentSceneId: string, index: number, button?: Button) => void) {
    listeners.onSlotUpdate.push(callback)
  }

  function onSceneCreate(callback: (sceneId: string, scene: VisualScene) => void) {
    listeners.onSceneCreate.push(callback)
  }

  function onSceneUpdate(callback: (sceneId: string, scene: VisualScene) => void) {
    listeners.onSceneUpdate.push(callback)
  }

  function onSceneDelete(callback: (sceneId: string) => void) {
    listeners.onSceneDelete.push(callback)
  }

  // listening to messages from vscode
  // @ts-expect-error hacky work-around that works
  document.addEventListener.call(window, "message", (event: MessageEvent) => {

    const messageData = event.data as SceneMessage

    // check the message type, then send it
    switch (messageData.messageType) {
      case "createScene":
        listeners.onSceneCreate.forEach(fn => fn(messageData.sceneId, toVisualScene(messageData.sceneData)))
        break
      case "updateScene":
        listeners.onSceneUpdate.forEach(fn => fn(messageData.sceneId, toVisualScene(messageData.sceneData)))
        listeners.onSlotUpdate.forEach(fn => {
          for (let index = 0; index < SCENE_MAX_BUTTONS; index++) {
            const slotButton = messageData.sceneData.buttons[index] ?? undefined
            fn(messageData.sceneId, index, slotButton)
          }
        })
        break
      case "deleteScene":
        listeners.onSceneDelete.forEach(fn => fn(messageData.sceneId))
        break
    }
  })

  return { onSceneDelete, onSceneCreate, onSceneUpdate, deleteScene, createScene, updateScene, onSlotUpdate }
}
