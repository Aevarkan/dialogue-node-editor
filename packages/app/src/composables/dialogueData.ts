// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { type DeleteSceneMessage, type GenericSceneMessage, type SceneMessage } from "@workspace/common"
import { useVsCode } from "./vscodeMessages";
import { LogicalScene } from "@/classes/LogicalScene";

// type SceneDelete = (sceneId: string) => void
// type SceneGeneric = (sceneId: string, scene: Scene) => void

export function useDialogueData() {

  const { inWebview, postMessage } = useVsCode()

  // this composable stores current logical scenes
  const scenesMap = new Map<string, LogicalScene>()

  // event listeners
  const listeners = {
    onSceneCreate: [] as ((sceneId: string, scene: LogicalScene) => void)[],
    onSceneUpdate: [] as ((sceneId: string, scene: LogicalScene) => void)[],
    onSceneDelete: [] as ((sceneId: string, children: string[]) => void)[]
  }

  /**
   * Gets the currently stored scene from a unique id.
   */
  function getScene(sceneId: string) {
    return scenesMap.get(sceneId) ?? null
  }

  /**
   * Creates a scene, relaying the creation to VSCode.
   */
  function createScene(scene: LogicalScene) {
    scenesMap.set(scene.sceneId, scene)
    if (inWebview()) {
      const createSceneMessage: GenericSceneMessage = {
        sceneId: scene.sceneId,
        messageType: "createScene",
        sceneData: scene.toScene()
      }
      postMessage(createSceneMessage)
    }
    listeners.onSceneCreate.forEach(fn => fn(scene.sceneId, scene))
  }

  /**
   * Updates the scene, relaying the update to VSCode.
   */
  function updateScene(scene: LogicalScene) {
    scenesMap.set(scene.sceneId, scene)
    if (inWebview()) {
      const updateSceneMessage: GenericSceneMessage = {
        sceneId: scene.sceneId,
        messageType: "updateScene",
        sceneData: scene.toScene()
      }
      postMessage(updateSceneMessage)
    }
  }

  /**
   * Deletes the scene, relaying the message to VSCode.
   */
  function deleteScene(sceneId: string) {
    scenesMap.delete(sceneId)
    if (inWebview()) {
      const deleteSceneMessage: DeleteSceneMessage = {
        messageType: "deleteScene",
        sceneId: sceneId
      }
      postMessage(deleteSceneMessage)
    }
  }

  // NOTE: These event listeners only fire from updates from VS Code
  // maybe they will fire for more than that, but I don't really need to add that functionality yet.
  function onSceneCreate(callback: (sceneId: string, scene: LogicalScene) => void) {
    listeners.onSceneCreate.push(callback)
  }

  function onSceneUpdate(callback: (sceneId: string, scene: LogicalScene) => void) {
    listeners.onSceneUpdate.push(callback)
  }

  /**
   * Callback runs with `sceneId` to be deleted, along with any child nodes.
   */
  function onSceneDelete(callback: (sceneId: string, children: string[]) => void) {
    listeners.onSceneDelete.push(callback)
  }

  // listening to messages from vscode
  // @ts-expect-error hacky work-around that works
  document.addEventListener.call(window, "message", (event: MessageEvent) => {

    const messageData = event.data as SceneMessage

    // check the message type, then send it
    switch (messageData.messageType) {
      // don't actually listen to it, we store our own scenes to check
      case "createScene":
      case "updateScene":
        const existingScene = scenesMap.get(messageData.sceneId)
        // a new scene
        if (!existingScene) {
          const newScene = LogicalScene.fromScene(messageData.sceneData)
          listeners.onSceneCreate.forEach(fn => fn(newScene.sceneId, newScene))
          scenesMap.set(newScene.sceneId, newScene)
        // otherwise it must be an update
        } else {
          const updatedScene = LogicalScene.updateScene(existingScene, messageData.sceneData)
          listeners.onSceneUpdate.forEach(fn => fn(updatedScene.sceneId, updatedScene))
          scenesMap.set(updatedScene.sceneId, updatedScene)
        }
        break

      case "deleteScene":
        const sceneToDelete = scenesMap.get(messageData.sceneId)
        if (!sceneToDelete) break // already deleted

        const commandIds = sceneToDelete.getCommands().map(cmd => cmd.id)
        const buttonsIds = sceneToDelete.getSlots().map(slot => slot.id)
        const childIds = [...commandIds, ...buttonsIds]
        listeners.onSceneDelete.forEach(fn => fn(messageData.sceneId, childIds))
        scenesMap.delete(messageData.sceneId)
        break
    }
  })

  return { onSceneDelete, onSceneCreate, onSceneUpdate, deleteScene, createScene, updateScene, getScene }
}
