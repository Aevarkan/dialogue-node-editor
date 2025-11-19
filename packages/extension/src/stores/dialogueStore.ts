// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { Scene } from "@workspace/common"
import deepEqual from "fast-deep-equal"
import { DialogueStoreDeleteMessage, DialogueStoreGenericMessage, StoreUpdateSource } from "../storeMessages"
import { Disposable } from "vscode"

export class DialogueStore {
  private dialogueMap = new Map<string, Scene>()
  /**
   * Array of `sceneId`s. This is not a normal string, it is `scene_tag` in `json`.
   */
  private sceneTagOrder: string[] = []
  
  private listeners = {
    onSceneCreate: [] as ((storeMessage: DialogueStoreGenericMessage) => void)[],
    onSceneUpdate: [] as ((storeMessage: DialogueStoreGenericMessage) => void)[],
    onSceneDelete: [] as ((storeMessage: DialogueStoreDeleteMessage) => void)[]
  }

  public onSceneCreate(callback: (storeMessage: DialogueStoreGenericMessage) => void) {
    this.listeners.onSceneCreate.push(callback)
    return new Disposable(() => {
      this.listeners.onSceneCreate = this.listeners.onSceneCreate.filter(cb => cb !== callback)
    })
  }

  public onSceneUpdate(callback: (storeMessage: DialogueStoreGenericMessage) => void) {
    this.listeners.onSceneUpdate.push(callback)
    return new Disposable(() => {
      this.listeners.onSceneUpdate = this.listeners.onSceneUpdate.filter(cb => cb !== callback)
    })
  }

  public onSceneDelete(callback: (storeMessage: DialogueStoreDeleteMessage) => void) {
    this.listeners.onSceneDelete.push(callback)
    return new Disposable(() => {
      this.listeners.onSceneDelete = this.listeners.onSceneDelete.filter(cb => cb !== callback)
    })
  }

  /**
   * Resets the scenes for the store, resetting the order.
   * @param source The source of the information.
   * @param scenes The new complete scene array.
   */
  public setScenes(source: StoreUpdateSource, scenes: Scene[]) {

    // new scenes
    const newOrder: string[] = []
    for (const scene of scenes) {
      newOrder.push(scene.sceneId)
      this.upsertScene(source, scene)
    }
    const newIdSet = new Set(newOrder)
    
    // delete any scenes which are not in the new array, as this resets the store
    for (const [sceneTag] of this.dialogueMap) {
      const existsInBoth = (newIdSet.has(sceneTag))
      if (!existsInBoth) {
        this.deleteScene(source, sceneTag)
      }
    }

    // and set this to be the correct order (so the extension doesn't switch around the file structure)
    // done after everything else in case logic bugs slip through
    this.sceneTagOrder = newOrder
  }

  /**
   * Adds a scene to the store, updating it if it already exists.
   * @param source The source of the information.
   * @param scene The updated scene.
   * 
   * @remarks
   * Emits to `onSceneCreate`, or `onSceneUpdate` respectively.
   * 
   * The internal order array does not update if {@link StoreUpdateSource} is the extension.
   */
  public upsertScene(source: StoreUpdateSource, scene: Scene) {
    const sceneTag = scene.sceneId
    const existingScene = this.dialogueMap.get(sceneTag)

    const isNew = !existingScene
    const isIdentical = deepEqual(scene, existingScene)
    // don't emit anything if it's the same
    if (isIdentical) {
      return
    }

    // otherwise it'll be an update
    this.dialogueMap.set(sceneTag, scene)

    // it might be a completely new scene
    if (isNew) {
      const createSceneMessage: DialogueStoreGenericMessage = {
        messageSource: source,
        messageType: "createScene",
        sceneData: scene,
        sceneId: sceneTag
      }
      this.listeners.onSceneCreate.forEach(fn => fn(createSceneMessage))

      // update the internal array if the update is not from the extension
      if (source != StoreUpdateSource.Extension) {
        this.sceneTagOrder.push(sceneTag)
      }

    // or an old one
    } else {
      const updateSceneMessage: DialogueStoreGenericMessage = {
        messageSource: source,
        messageType: "updateScene",
        sceneData: scene,
        sceneId: sceneTag
      }
      this.listeners.onSceneUpdate.forEach(fn => fn(updateSceneMessage))
    }
  }

  /**
   * Deletes a scene from the store, emitting to `onSceneDelete` on sucessful deletion.
   * @param source The source of the information.
   * @param sceneTag The tag of the scene to be deleted from the store.
   * 
   * @remarks
   * The internal order array does not update if {@link StoreUpdateSource} is the extension.
   */
  public deleteScene(source: StoreUpdateSource, sceneTag: string) {
    const elementExisted = this.dialogueMap.delete(sceneTag)

    // don't emit if the scene wasn't even there
    if (!elementExisted) {
      return
    }

    // update the internal array if the message wasn't sent from the extension
    if (source != StoreUpdateSource.Extension) {
      this.sceneTagOrder = this.sceneTagOrder.filter(existingTag => existingTag !== sceneTag)
    }

    // send the message to listeners
    const deleteMessage: DialogueStoreDeleteMessage = {
      messageType: "deleteScene",
      sceneId: sceneTag,
      messageSource: source
    }
    this.listeners.onSceneDelete.forEach(fn => fn(deleteMessage))
  }

  /**
   * Returns the scenes stored according to the order set by `setScenes`.
   * 
   * @remarks
   * Order is sequential otherwise.
   * 
   * If internal order and internal map disagree, returns `null`, which should never happen.
   */
  public getScenes(): Scene[] | null {
    const orderedScenes: Scene[] = []

    // get scenes according to internal array
    // this is so the extension won't bounce around the data
    for (const id of this.sceneTagOrder) {
      const scene = this.dialogueMap.get(id)
      // this should never happen
      // returns null if a scene is in the array but not the map
      if (!scene) {
        return null
      }
      orderedScenes.push(scene)
    }

    return orderedScenes
  }

}
