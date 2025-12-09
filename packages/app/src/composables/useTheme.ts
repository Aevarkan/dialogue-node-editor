// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import type { GenericMessage } from "@workspace/common"
import { ref } from "vue"

export function useTheme() {

  const sceneNodeColour = ref("#5f9ea0")
  const buttonSlotNodeColour = ref("#8e6cb4")
  const commandNodeColour = ref("#77c259")

  // @ts-expect-error window event listener doesn't work
  document.addEventListener.call(window, "message", (event: MessageEvent) => {
  
    const messageData = event.data as GenericMessage

    // we only care about configuration messages here
    if (messageData.messageType !== "config") return

    document.documentElement.style.setProperty("--custom-scene-node-colour", messageData.sceneNodeColour)
    document.documentElement.style.setProperty("--custom-button-slot-node-colour", messageData.buttonSlotNodeColour)
    document.documentElement.style.setProperty("--custom-command-node-colour", messageData.commandNodeColour)
    
    sceneNodeColour.value = messageData.sceneNodeColour
    buttonSlotNodeColour.value = messageData.buttonSlotNodeColour
    commandNodeColour.value = messageData.commandNodeColour
  })

  return { sceneNodeColour, buttonSlotNodeColour, commandNodeColour }
}
