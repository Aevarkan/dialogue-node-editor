// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { SceneMessage } from "@workspace/common";

export class MessageQueue {
  /**
   * Message queue, where the key is the scene id.
   */
  private queue = new Map<string, SceneMessage>()
  /**
   * Whether it's safe to send messages.
   */
  private isReady = false
  private sendMessage: (message: SceneMessage) => void

  /**
   * Creates an unready message queue.
   * @param messageFunction 
   */
  public constructor(messageFunction: (message: SceneMessage) => void) {
    this.sendMessage = messageFunction
  }

  /**
   * Sets the ready state of the queue.
   * 
   * @remarks Setting ready to `true` will flush all messages.
   */
  public setReady(readyState: boolean) {
    this.isReady = readyState

    // send all messages if we're now ready
    if (this.isReady) {
      this.flushMessages()
    }
  }

  /**
   * Adds a message to the queue, or sends it if ready.
   * 
   * @remarks
   * Overrides any previous messages for the same scene.
   */
  public enqueueMessage(message: SceneMessage) {
    if (this.isReady) {
      this.sendMessage(message)
    } else {
      // if the creation message hasn't yet been sent, then an update message is still a creation message
      const existingMessage = this.queue.get(message.sceneId)
      if (existingMessage?.messageType === "createScene" && message.messageType === "updateScene") {
        message.messageType = "createScene"
      }

      this.queue.set(message.sceneId, message)
    }
  }

  /**
   * Sends all queued messages.
   */
  private flushMessages() {
    const messages = this.queue.values()
    for (const message of messages) {
      this.sendMessage(message)
    }
  }

  /**
   * Empties the message queue.
   */
  public clear() {
    this.queue = new Map()
  }

}
