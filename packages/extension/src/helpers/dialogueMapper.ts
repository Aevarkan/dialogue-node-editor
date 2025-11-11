// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { Button, ButtonData, Scene, SceneData } from "@workspace/common";

function fromSceneData(rawScene: SceneData): Scene {
  const parsedScene: Scene = {
    sceneId: rawScene.scene_tag,
    // empty string if not there
    npcName: rawScene.npc_name ?? "",
    sceneText: rawScene.text ?? "",
    // empty array if no buttons/commands
    buttons: rawScene.buttons?.map(btn => fromButtonData(btn)) ?? [],
    openCommands: rawScene.on_open_commands ?? [],
    closeCommands: rawScene.on_close_commands ?? []
  }
  return parsedScene
}

function fromButtonData(rawButton: ButtonData): Button {
  const parsedButton: Button = {
    displayName: rawButton.name,
    commands: rawButton.commands
  }
  return parsedButton
}

function toSceneData(scene: Scene): SceneData {
  // undefined so the JSON data won't have empty objects
  const npcName = scene.npcName === "" ? undefined : scene.npcName
  const sceneText = scene.sceneText === "" ? undefined : scene.sceneText
  const openCommands = scene.openCommands.length === 0 ? undefined : scene.openCommands
  const closeCommands = scene.closeCommands.length === 0 ? undefined : scene.closeCommands

  const buttons = scene.buttons.length === 0 ? undefined : scene.buttons.map(btn => toButtonData(btn))

  const dataScene: SceneData = {
    scene_tag: scene.sceneId,
    npc_name: npcName,
    text: sceneText,
    on_open_commands: openCommands,
    on_close_commands: closeCommands,
    buttons: buttons
  }
  return dataScene
}

function toButtonData(button: Button): ButtonData {
  const dataButton: ButtonData = {
    name: button.displayName,
    commands: button.commands
  }
  return dataButton
}

export { fromSceneData, toSceneData, fromButtonData, toButtonData }
