// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import Ajv, { JSONSchemaType } from 'ajv';
import looseSchema from '@workspace/common/schemas/dialogue.loose.schema.json'
import strictSchema from '@workspace/common/schemas/dialogue.strict.schema.json'
import { DialogueData, Scene } from '@workspace/common';
import { fromSceneData, toSceneData } from './dialogueMapper';

// might be used for diagnostics later, so show all errors
const ajv = new Ajv({ allErrors: true })

// loose one will cause errors, use the strict one instead
// kept here in case it may be used in the future
const looseDialogueSchema: JSONSchemaType<DialogueData> = looseSchema as any
const strictDialogueSchema: JSONSchemaType<DialogueData> = strictSchema as any

// by default it is strict, which is neccessary for the data
/**
 * Checks if the dialogue file is a valid JSON object.
 */
const validateDialogue = ajv.compile(strictDialogueSchema)

// for parsing the data too
/**
 * Parses the raw dialogue file to {@link DialogueData}, or `null` if invalid.
 * @param plainDialogueText The dialogue file's raw text.
 */
function parseRawDialogue(plainDialogueText: string): DialogueData | null {
    try {
    const data = JSON.parse(plainDialogueText)
    return validateDialogue(data) ? data : null
  } catch {
    return null
  }
}

// the big stuff!

function fromDialogue(dialogueData: DialogueData): Scene[] {
  const sceneData = dialogueData["minecraft:npc_dialogue"].scenes
  const parsedScenes = sceneData.map(scn => fromSceneData(scn))
  return parsedScenes
}

function toDialogue(allScenes: Scene[], formatVersion: string): DialogueData {
  const dataScenes = allScenes.map(scn => toSceneData(scn))
  const dialogueFile: DialogueData = {
    format_version: formatVersion,
    "minecraft:npc_dialogue": { scenes: dataScenes }
  }
  return dialogueFile
}

export { validateDialogue, parseRawDialogue, fromDialogue, toDialogue }
