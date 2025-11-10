// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { useEventListener } from "@vueuse/core";
import { type DeleteSceneMessage, type GenericSceneMessage, type Scene, type SceneMessage } from "@workspace/common"
import { useVsCode } from "./vscodeMessages";

// type SceneDelete = (sceneId: string) => void
// type SceneGeneric = (sceneId: string, scene: Scene) => void

export function useDialogueData() {

  const { inWebview, postMessage } = useVsCode()

  // event listeners
  const listeners = {
    onSceneCreate: [] as ((sceneId: string, scene: Scene) => void)[],
    onSceneUpdate: [] as ((sceneId: string, scene: Scene) => void)[],
    onSceneDelete: [] as ((sceneId: string) => void)[]
  }

  /**
   * Sends a new scene to VSCode.
   */
  function createScene(scene: Scene) {
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
  function updateScene(scene: Scene) {
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

  function onSceneCreate(callback: (sceneId: string, scene: Scene) => void) {
    listeners.onSceneCreate.push(callback)
  }

  function onSceneUpdate(callback: (sceneId: string, scene: Scene) => void) {
    listeners.onSceneUpdate.push(callback)
  }

  function onSceneDelete(callback: (sceneId: string) => void) {
    listeners.onSceneDelete.push(callback)
  }

  // listening to messages from vscode
  useEventListener(window, "message", (event: MessageEvent) => {

    const messageData = event.data as SceneMessage

    // check the message type, then send it
    switch (messageData.messageType) {
      case "createScene":
        listeners.onSceneCreate.forEach(fn => fn(messageData.sceneId, messageData.sceneData))
        break
      case "updateScene":
        listeners.onSceneUpdate.forEach(fn => fn(messageData.sceneId, messageData.sceneData))
        break
      case "deleteScene":
        listeners.onSceneDelete.forEach(fn => fn(messageData.sceneId))
        break
    }
  })

  return { onSceneDelete, onSceneCreate, onSceneUpdate, deleteScene, createScene, updateScene }
}
