// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import type { ButtonSlotDataChange, SceneCommandDataChange, SceneCommandSlot, VisualSceneCommand, LogicalSceneDataChange, VisualSlot } from "@/types";
import { SCENE_MAX_BUTTONS, type Button, type Scene } from "@workspace/common";
import { v4 as uuidv4 } from 'uuid'
import deepEqual from 'fast-deep-equal'

export class LogicalScene {
  
  /**
   * Map of button slots to their node ids.
   * 
   * @remarks
   * First slot has index 0.
   */
  private buttonMap: Map<number, VisualSlot>
  private commandMap: Map<SceneCommandSlot, VisualSceneCommand>
  /**
   * The button slots that were last changed from the `updateScene` factory method.
   */
  private lastButtonChanges: ButtonSlotDataChange[] = []
  /**
   * The commands that were last changed from the `updateScene` factory method.
   */
  private lastCommandChanges: SceneCommandDataChange[] = []
  /**
   * The stored scene.
   */
  private scene: Scene
  public readonly sceneId: string

  private constructor(
    scene: Scene,
    commandMap: Map<SceneCommandSlot, VisualSceneCommand>,
    buttonMap: Map<number, VisualSlot>
  ) {
    this.buttonMap = buttonMap
    this.commandMap = commandMap
    this.scene = scene
    this.sceneId = scene.sceneId
  }

  /**
   * Creates a new logical scene from a scene.
   * @param scene The raw scene.
   * @returns A new logical scene.
   * 
   * @remarks
   * This must not be used to update an existing scene.
   */
  public static fromScene(scene: Scene): LogicalScene {
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
    if (scene.openCommands.length > 0) {
      const openCommand: VisualSceneCommand = {
        commands: scene.openCommands,
        id: uuidv4(),
        parentSceneId: scene.sceneId,
        type: "open"
      }
      commandMap.set("open", openCommand)
    }
    if (scene.closeCommands.length > 0) {
      const closeCommand: VisualSceneCommand = {
        commands: scene.closeCommands,
        id: uuidv4(),
        parentSceneId: scene.sceneId,
        type: "close"
      }
      commandMap.set("close", closeCommand)
    }

    // now that all the ids are made, we can create the logical scene
    const visualScene = new LogicalScene(
      scene,
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
  public static updateScene(oldScene: LogicalScene, updatedScene: Scene): LogicalScene {
    const rawOldScene = oldScene.scene
    if (rawOldScene.sceneId !== updatedScene.sceneId) {
      throw new Error(`Cannot update scene: IDs do not match (${rawOldScene.sceneId} !== ${updatedScene.sceneId})`);
    }

    /** This is the FULL slot map, not just changed slots. Does not include deleted slots. */
    const updatedButtonMap = new Map<number, VisualSlot>()
    const updatedButtons = new Map<number, ButtonSlotDataChange>()
    for (let index = 0; index < SCENE_MAX_BUTTONS; index++) {
      // check if the buttons have changed
      const oldButton = rawOldScene.buttons[index]
      const newButton = updatedScene.buttons[index]
      const isEqual = deepEqual(oldButton, newButton)
      const buttonUuid = oldScene.buttonMap.get(index)?.id ?? uuidv4()
      if (!isEqual) {
        const buttonModifiedChange: ButtonSlotDataChange = {
          id: buttonUuid, // won't be the correct uuid if this is actually a creation. shouldn't be a problem though
          index,
          kind: "button",
          change: "modified"
        }
        updatedButtons.set(index, buttonModifiedChange)
      }
      
      // if there's a new button, but not an old one, then that's a creation
      if (!oldButton && newButton) {
        const buttonCreatedChange: ButtonSlotDataChange = {
          id: buttonUuid,
          index,
          kind: "button",
          change: "created"
        }
        updatedButtons.set(index, buttonCreatedChange)
      }
      
      // once this happens, it is purely for checking deletions
      if (!newButton) {
        if (oldButton) {
          const buttonDeletedChange: ButtonSlotDataChange = {
            id: buttonUuid,
            index,
            kind: "button",
            change: "deleted"
          }
          updatedButtons.set(index, buttonDeletedChange)
        }
        continue
      }
      
      // create the new button using the old uuid if possible
      // FIXME: not sure if this works for changing buttons around
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
    const updatedCommands = new Map<SceneCommandSlot, SceneCommandDataChange>()

    // open commands
    const newOpenCommandsArray = updatedScene.openCommands
    const oldOpenCommandsArray = rawOldScene.openCommands
    const isOpenCommandEqual = (deepEqual(oldOpenCommandsArray, newOpenCommandsArray))
    // if the incoming scene has opening commands, then add them
    const openCommandId = oldScene.commandMap.get("open")?.id ?? uuidv4()
    if (newOpenCommandsArray.length > 0) {
      const openCommand: VisualSceneCommand = {
        commands: newOpenCommandsArray,
        id: openCommandId,
        parentSceneId: updatedScene.sceneId,
        type: "open"
      }
      updatedCommandMap.set("open", openCommand)
    }
    if (!isOpenCommandEqual) {
      const commandDataChange: SceneCommandDataChange = {
        change: "modified",
        kind: "sceneCommand",
        id: openCommandId, // won't be correct if this is actually a creation, but this is resolved in the if statement
        type: "open"
      }
      updatedCommands.set("open", commandDataChange)
      // must be a creation
      if (newOpenCommandsArray.length > 0 && oldOpenCommandsArray.length === 0) {
        const addDataChange: SceneCommandDataChange = {
          change: "created",
          kind: "sceneCommand",
          id: openCommandId,
          type: "open"
        }
        updatedCommands.set("open", addDataChange)
      // this must be a deletion
      } else if (oldOpenCommandsArray.length > 0 && newOpenCommandsArray.length === 0) {
        const removeDataChange: SceneCommandDataChange = {
          change: "deleted",
          kind: "sceneCommand",
          id: openCommandId,
          type: "open"
        }
        updatedCommands.set("open", removeDataChange)
      }
    }

    // now close commands
    const newCloseCommandsArray = updatedScene.closeCommands
    const oldCloseCommandsArray = rawOldScene.closeCommands
    const isCloseCommandEqual = (deepEqual(oldCloseCommandsArray, newCloseCommandsArray))
    // if the incoming scene has closing commands, then add them
    const closeCommandId = oldScene.commandMap.get("close")?.id ?? uuidv4()
    if (newCloseCommandsArray.length > 0) {
      const closeCommand: VisualSceneCommand = {
        commands: newCloseCommandsArray,
        id: closeCommandId,
        parentSceneId: updatedScene.sceneId,
        type: "close"
      }
      updatedCommandMap.set("close", closeCommand)
    }
    if (!isCloseCommandEqual) {
      const commandDataChange: SceneCommandDataChange = {
        change: "modified",
        kind: "sceneCommand",
        id: closeCommandId, // won't be correct if this is actually a creation, but this is resolved in the if statement
        type: "close"
      }
      updatedCommands.set("close", commandDataChange)
      // must be a creation
      if (newCloseCommandsArray.length > 0 && oldCloseCommandsArray.length === 0) {
        const addDataChange: SceneCommandDataChange = {
          change: "created",
          kind: "sceneCommand",
          id: closeCommandId,
          type: "close"
        }
        updatedCommands.set("close", addDataChange)
      // this must be a deletion
      } else if (oldCloseCommandsArray.length > 0 && newCloseCommandsArray.length === 0) {
        const removeDataChange: SceneCommandDataChange = {
          change: "deleted",
          kind: "sceneCommand",
          id: closeCommandId,
          type: "close"
        }
        updatedCommands.set("close", removeDataChange)
      }
    }
    
    
    // now the new scene can be constructed
    const updatedVisualScene = new LogicalScene(
      updatedScene,
      updatedCommandMap,
      updatedButtonMap
    )
    // tracking info
    updatedVisualScene.lastButtonChanges = Array.from(updatedButtons.values())
    updatedVisualScene.lastCommandChanges = Array.from(updatedCommands.values())
    return updatedVisualScene
  }

  /**
   * Get the slots and commands that were updated since the last `updateScene` factory method.
   * @param clearAfter Whether to clear the update info after reading. Defaults to `false`.
   */
  public getLastDataChanges(clearAfter = false): LogicalSceneDataChange[] {
    const slots = this.getUpdatedSlots(clearAfter)
    const commands = this.getUpdatedCommands(clearAfter)
    return [...slots, ...commands]
  }

  /**
   * Get the slots that were updated since the last `updateScene` factory method.
   * @param clearAfter Whether to clear the update info after reading.
   */
  private getUpdatedSlots(clearAfter = false): ButtonSlotDataChange[] {
    const result = [...this.lastButtonChanges]
    if (clearAfter) {
      this.lastButtonChanges = []
    }
    return result
  }

  /**
   * Get the slots that were updated since the last `updateScene` factory method.
   * @param clearAfter Whether to clear the update info after reading.
   */
  private getUpdatedCommands(clearAfter = false): SceneCommandDataChange[] {
    const result = [...this.lastCommandChanges]
    if (clearAfter) {
      this.lastCommandChanges = []
    }
    return result
  }
  
  /**
   * The text displayed in the NPC dialogue.
   */
  public get sceneText() {
    return this.scene.sceneText
  }

  /**
   * The text displayed in the NPC dialogue.
   */
  public set sceneText(sceneText: string) {
    this.scene.sceneText = sceneText
  }

  /**
   * The name of the NPC in the dialogue view.
   * 
   * @remarks
   * Is `npc_name` in JSON definition.
   */
  public get npcName() {
   return this.scene.npcName
  }
  
  /**
   * The name of the NPC in the dialogue view.
   * 
   * @remarks
   * Is `npc_name` in JSON definition.
   */
  public set npcName(npcName: string) {
    this.scene.npcName = npcName
  }

  /**
   * Updates the button in the specified slot.
   * @param slotIndex The button slot index.
   * @param newButton The updated button.
   * 
   * @returns Returns the updated slot.
   * 
   * @throws Throws if the slot hasn't been created.
   */
  public updateSlot(slotIndex: number, newButton: Button): VisualSlot {
    const targetedSlot = this.buttonMap.get(slotIndex)
    if (!targetedSlot) {
      throw new Error(`Scene "${this.sceneId}" does not have a slot for index ${slotIndex} already created.`)
    }
    targetedSlot.button = newButton
    this.scene.buttons[slotIndex] = newButton
    return targetedSlot
  }

  /**
   * Adds a button to a new scene slot.
   * @param newButton The new button.
   * @returns The newly created slot.
   */
  public addSlot(newButton: Button): VisualSlot {
    const currentSlots = this.scene.buttons.length
    if (currentSlots >= SCENE_MAX_BUTTONS) {
      throw new Error(`Cannot add more than maximum number of ${SCENE_MAX_BUTTONS} slots.`)
    }
    const newTargetIndex = currentSlots + 1
    const newSlot: VisualSlot = {
      id: uuidv4(),
      index: newTargetIndex,
      parentSceneId: this.sceneId,
      button: newButton
    }
    this.buttonMap.set(newTargetIndex, newSlot)
    this.scene.buttons.push(newButton)
    return newSlot
  }

  /**
   * Swaps the slots in the provided indices.
   * @returns The slot now in the first index, and the slot now in the second index.
   * 
   * @throws Throws if one or both slots are not created.
   * 
   * @throws Throws if the first and second index are the same.
   */
  public swapSlots(firstIndex: number, secondIndex: number): [VisualSlot, VisualSlot] {
    if (firstIndex === secondIndex) {
      throw new Error("Cannot swap the same slots.")
    }
    const firstSlot = this.buttonMap.get(firstIndex)
    const secondSlot = this.buttonMap.get(secondIndex)
    const firstButton = this.scene.buttons[firstIndex]
    const secondButton = this.scene.buttons[secondIndex]
    if (!firstSlot || !secondSlot || !firstButton || !secondButton) {
      throw new Error(`Cannot swap slots ${firstIndex} and ${secondIndex} for scene ${this.sceneId}. One or both slots are empty!`)
    }
    // swap the indices themselves
    firstSlot.index = secondIndex
    secondSlot.index = firstIndex

    // swap in map
    this.buttonMap.set(firstIndex, secondSlot)
    this.buttonMap.set(secondIndex, firstSlot)
    // swap in array
    this.scene.buttons[firstIndex] = secondSlot.button
    this.scene.buttons[secondIndex] = firstSlot.button
    return [secondSlot, firstSlot]
  }

  public getSlot(slotIndex: number) {
    return this.buttonMap.get(slotIndex) ?? null
  }

  public getSlots() {
    return [...this.buttonMap.values()]
  }

  /**
   * Sets the scene command in a slot, creating it if it doesn't already exist.
   * @param commandSlot The slot to set the command in.
   * @param newCommands The new set of commands.
   * @returns The updated scene command.
   */
  public setCommand(commandSlot: SceneCommandSlot, newCommands: string[]) {
    let command = this.commandMap.get(commandSlot)
    if (command) {
      command.commands = newCommands
    // create a new one if it doesn't exist
    } else {
      command = {
        id: uuidv4(),
        commands: newCommands,
        parentSceneId: this.sceneId,
        type: commandSlot
      }
      this.commandMap.set(commandSlot, command)
    }
    // set it in the actual underlying scene
    if (commandSlot === "open") {
      this.scene.openCommands = newCommands
    } else {
      this.scene.closeCommands = newCommands
    }

    return command
  }

  public getCommand(commandSlot: SceneCommandSlot) {
    return this.commandMap.get(commandSlot) ?? null
  }

  public getCommands() {
    return [...this.commandMap.values()]
  }

  /**
   * Returns the raw scene data of the logical scene.
   */
  public toScene(): Scene {
    const rawScene: Scene = {
      ...this.scene
    }
    return rawScene
  }
  
}
