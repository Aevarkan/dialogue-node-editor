// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { Scene } from "./types"

export type SceneMessage = GenericSceneMessage | DeleteSceneMessage

interface BaseMessage {
  /**
   * The scene identifier.
   * 
   * @remarks
   * Is the `scene_tag` in JSON definition.
   */
  sceneId: string
}

export interface GenericSceneMessage extends BaseMessage {
  messageType: "createScene" | "updateScene"
  /**
   * Scene object.
   */
  sceneData: Scene
}

export interface DeleteSceneMessage extends BaseMessage {
  messageType: "deleteScene"
}