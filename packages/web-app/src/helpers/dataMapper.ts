// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import type { VisualButton, VisualScene } from "@/types";
import type { Button, Scene } from "@workspace/common";
import { v4 as uuidv4 } from 'uuid'


export function toVisualScene(scene: Scene): VisualScene {
  const visualScene: VisualScene = {
    ...scene,
    buttons: scene.buttons.map(button => toVisualButton(button, scene.sceneId))
  }
  return visualScene
}

export function toVisualButton(button: Button, parentSceneId: string): VisualButton {
  const visualButton: VisualButton = {
    ...button,
    id: uuidv4(),
    parentSceneId: parentSceneId
  }
  return visualButton
}
