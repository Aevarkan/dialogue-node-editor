// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { Scene } from "@workspace/common"
import { Disposable, TextDocument } from "vscode"
import { DialogueDocument } from "../wrappers/DialogueDocument"
import { useConfig } from "../helpers/useConfig"
import { StoreSceneUpdateInfo } from "../storeMessages"
import { toDialogue } from "../helpers/dialogueParser"

const { getTabSize, getEditDelay, getFormatVersion } = useConfig()

export class DialogueDebouncer implements Disposable {
  private pendingChangeId: string | null = null
  private pendingDialogues: Scene[] | null = null
  private pendingTimer: NodeJS.Timeout | null = null
  private readonly dialogueTextDocument: TextDocument

  constructor(dialogueTextDocument: TextDocument) {
    this.dialogueTextDocument = dialogueTextDocument
  }
  
  public enqueueChange(newDialogues: Scene[], updateInfo: StoreSceneUpdateInfo) {
    const delayMilliseconds = getEditDelay()
    
    if (delayMilliseconds === 0 || updateInfo.size === "major") {
      // major changes reset everything and apply latest change
      this.clear()

      this.applyChange(newDialogues)
    } else if (updateInfo.size === "none") {
      // do nothing!

    // must be a minor change otherwise
    } else {
      // if changeId is the same, then reset the timer without any changes
      // OR if changeId is nothing - meaning this is a new change 
      if (updateInfo.changeId === this.pendingChangeId || this.pendingChangeId === null) {
        this.clear()
        this.pendingChangeId = updateInfo.changeId
        this.pendingDialogues = newDialogues
        this.pendingTimer = setTimeout(async () => {
          this.pendingTimer = null
          await this.flushChanges()
        }, delayMilliseconds)
      // must be a DIFFERENT changeId
      } else {
        this.flushChanges()

        this.pendingChangeId = updateInfo.changeId
        this.pendingDialogues = newDialogues
        this.pendingTimer = setTimeout(async () => {
          this.pendingTimer = null
          await this.flushChanges()
        }, delayMilliseconds)
      }

    }
  }

  /**
   * Immediately apply queued changes and clears the queue.
   */
  public async flushChanges() {
    const dialogues = this.pendingDialogues
    this.clear()
    if (dialogues) {
      await this.applyChange(dialogues)
    }
  }
  
  /**
   * Clear queued changes without applying them.
   */
  public clear() {
    this.pendingDialogues = null
    this.pendingChangeId = null
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer)
      this.pendingTimer = null
    }
  }

  public dispose() {
    this.clear()
  }


  private applyChange(dialogueScenes: Scene[]): Promise<boolean> {
    const dialogueFile = toDialogue(dialogueScenes, getFormatVersion())
    const dialogueDocument = new DialogueDocument(this.dialogueTextDocument, { prettify: true, indentationSize: getTabSize() })
    return dialogueDocument.setDialogueText(dialogueFile)
  }
}
