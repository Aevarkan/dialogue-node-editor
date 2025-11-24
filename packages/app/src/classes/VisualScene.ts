// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import type { SceneCommandSlot, VisualSceneCommand, VisualSlot } from "@/types";
import { SCENE_MAX_BUTTONS, type Button, type Scene } from "@workspace/common";
import { v4 as uuidv4 } from 'uuid'
import deepEqual from 'fast-deep-equal'

export class VisualScene implements Scene {
  
  /**
   * Map of button slots to their node ids.
   * 
   * @remarks
   * First slot has index 0.
   */
  private buttonMap: Map<number, VisualSlot>
  private commandMap: Map<SceneCommandSlot, VisualSceneCommand>

  private constructor(
    public buttons: Button[],
    public closeCommands: string[],
    public npcName: string,
    public openCommands: string[],
    public sceneId: string,
    public sceneText: string,
    commandMap: Map<SceneCommandSlot, VisualSceneCommand>,
    buttonMap: Map<number, VisualSlot>
  ) {
    this.buttonMap = buttonMap
    this.commandMap = commandMap
  }

  /**
   * Creates a new visual scene from a scene.
   * @param scene The raw scene.
   * @returns A new visual scene.
   * 
   * @remarks
   * This must not be used to update an existing scene.
   */
  public static fromScene(scene: Scene): VisualScene {
    // making ids for the buttons
    const buttonMap = new Map<number, VisualSlot>()
    const buttons = scene.buttons
    buttons.forEach((button, index) => {
      const uuid = uuidv4()
      const buttonSlot: VisualSlot = {
        index,
        button,
        parentSceneId: scene.sceneId,
        id: uuid
      }
      buttonMap.set(index, buttonSlot)
    })

    // now for the open/close commands
    const commandMap = new Map<SceneCommandSlot, VisualSceneCommand>()
    const openCommand: VisualSceneCommand = {
      commands: scene.openCommands,
      id: uuidv4(),
      parentSceneId: scene.sceneId,
      type: "open"
    }
    const closeCommand: VisualSceneCommand = {
      commands: scene.closeCommands,
      id: uuidv4(),
      parentSceneId: scene.sceneId,
      type: "close"
    }
    commandMap.set("close", closeCommand)
    commandMap.set("open", openCommand)

    // now that all the ids are made, we can create the visual scene
    const visualScene = new VisualScene(
      scene.buttons,
      scene.closeCommands,
      scene.npcName,
      scene.openCommands,
      scene.sceneId,
      scene.sceneText,
      commandMap,
      buttonMap
    )
    return visualScene
  }

  /**
   * Creates a new updated scene from an old version.
   * @param oldScene The old scene.
   * @param updatedScene The updated scene.
   * @throws Throws if the scene ids are not the same.
   */
  public static updateScene(oldScene: VisualScene, updatedScene: Scene): VisualScene {
    if (oldScene.sceneId !== updatedScene.sceneId) {
      throw new Error(`Cannot update scene: IDs do not match (${oldScene.sceneId} !== ${updatedScene.sceneId})`);
    }

    /** This is the FULL slot map, not just changed slots. Does not include deleted slots. */
    const updatedButtonMap = new Map<number, VisualSlot>()
    const changedButtons: number[] = []
    for (let index = 0; index < SCENE_MAX_BUTTONS; index++) {
      // check if the buttons have changed
      const oldButton = oldScene.buttons[index]
      const newButton = updatedScene.buttons[index]
      const isEqual = deepEqual(oldButton, newButton)
      if (!isEqual) {
        changedButtons.push(index)
      }
      
      // once this happens, it is purely for checking deletions
      if (!newButton) continue
      
      // create the new button using the old uuid if possible
      // FIXME: not sure if this works for changing buttons around
      const buttonUuid = oldScene.buttonMap.get(index)?.id ?? uuidv4()
      const newSlot: VisualSlot = {
        id: buttonUuid,
        index,
        parentSceneId: updatedScene.sceneId,
        button: newButton
      }
      updatedButtonMap.set(index, newSlot)
    }

    // now the commands
    const updatedCommandMap = new Map<SceneCommandSlot, VisualSceneCommand>()
    const changedCommands: SceneCommandSlot[] = []

    // open commands
    const newOpenCommandsArray = updatedScene.openCommands
    const isOpenCommandEqual = (deepEqual(oldScene.openCommands, newOpenCommandsArray))
    // if the incoming scene has opening commands, then add them
    if (newOpenCommandsArray.length > 0) {
      const openCommandId = oldScene.commandMap.get("open")?.id ?? uuidv4()
      const openCommand: VisualSceneCommand = {
        commands: newOpenCommandsArray,
        id: openCommandId,
        parentSceneId: updatedScene.sceneId,
        type: "open"
      }
      updatedCommandMap.set("open", openCommand)
    }
    if (!isOpenCommandEqual) {
      changedCommands.push("open")
    }

    // now close commands
    const newCloseCommandsArray = updatedScene.closeCommands
    const isCloseCommandEqual = (deepEqual(oldScene.closeCommands, newCloseCommandsArray))
    // if the incoming scene has opening commands, then add them
    if (newCloseCommandsArray.length > 0) {
      const closeCommandId = oldScene.commandMap.get("close")?.id ?? uuidv4()
      const closeCommand: VisualSceneCommand = {
        commands: newCloseCommandsArray,
        id: closeCommandId,
        parentSceneId: updatedScene.sceneId,
        type: "close"
      }
      updatedCommandMap.set("close", closeCommand)
    }
    if (!isCloseCommandEqual) {
      changedCommands.push("close")
    }
    
    
    // now the new scene can be constructed
    const updatedVisualScene = new VisualScene(
      updatedScene.buttons,
      updatedScene.closeCommands,
      updatedScene.npcName,
      updatedScene.openCommands,
      updatedScene.sceneId,
      updatedScene.sceneText,
      updatedCommandMap,
      updatedButtonMap
    )
    // TODO: add changed info here
    return updatedVisualScene
  }
  
}
