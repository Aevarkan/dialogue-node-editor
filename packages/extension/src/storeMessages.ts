// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { Scene } from "@workspace/common";

/**
 * The source of the store update.
 */
export enum StoreUpdateSource {
  /**
   * The store was updated from the extension.
   */
  Extension,
  /**
   * The store was updated from the webview.
   */
  Webview
}

/**
 * Messages emitted from the dialogue store.
 */
export type DialogueStoreMessage = DialogueStoreCreateMessage | DialogueStoreUpdateMessage | DialogueStoreDeleteMessage

export interface StoreScene {
  oldScene: Scene,
  updatedScene: Scene,
  updateInfo: StoreSceneUpdateInfo
}

export type StoreSceneUpdateInfo = {
  size: "major"
} | {
  size: "minor",
  /**
   * The specific element that changed.
   */
  changeId: string
} | {
  size: "none"
}

export interface DialogueStoreCreateMessage extends DialogueStoreBaseMessage {
  messageType: "createScene",
  sceneData: Scene
}

export interface DialogueStoreUpdateMessage extends DialogueStoreBaseMessage {
  messageType: "updateScene",
  sceneData: Scene
  updateInfo: StoreSceneUpdateInfo
}

export interface DialogueStoreDeleteMessage extends DialogueStoreBaseMessage {
  messageType: "deleteScene"
}

interface DialogueStoreBaseMessage {
  /**
   * The scene identifier.
   * 
   * @remarks
   * Is the `scene_tag` in JSON definition.
   */
  sceneId: string,
  /**
   * The source of the store update.
   */
  messageSource: StoreUpdateSource
}
