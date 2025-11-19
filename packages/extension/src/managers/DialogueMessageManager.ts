// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { ExtensionContext, TextDocument, WebviewPanel, window, workspace } from "vscode"
import { DialogueStore } from "../stores/dialogueStore"
import { getWebviewContent } from "../helpers/webviewHelper"
import { fromDialogue, parseRawDialogue, toDialogue } from "../helpers/dialogueParser"
import { DialogueStoreDeleteMessage, DialogueStoreGenericMessage, StoreUpdateSource } from "../storeMessages"
import { DeleteSceneMessage, GenericSceneMessage, SceneMessage } from "@workspace/common"
import { DialogueDocument, DialogueFileFormatSettings } from "../wrappers/DialogueDocument"
import { DIALOGUE_FILE_FORMAT_VERSION } from "../constants"

class DialogueMessageManager {

  private dialogueStoreMap = new Map<string, DialogueStore>()

  public initialiseConnection(context: ExtensionContext, dialogueTextDocument: TextDocument, webviewPanel: WebviewPanel) {

    // a store specifically for this file
    const store = this.getDialogueStore(dialogueTextDocument.uri.toString())

    // allow scripts (quite important)
    webviewPanel.webview.options = {
      enableScripts: true
    }

    // initialise
    const webviewContent = getWebviewContent(webviewPanel.webview, context.extensionUri)
    webviewPanel.webview.html = webviewContent


    /////////////////////
    // ROUTED TO STORE //
    /////////////////////

    // message sender for changes to our document
    const textDocumentListener = workspace.onDidChangeTextDocument(event => {
      // check if it's our one
      const newDocument = event.document
      const isSelectedDocument = (newDocument.uri.toString() === dialogueTextDocument.uri.toString())
      if (!isSelectedDocument) {
        return
      }

      // try to parse it
      const documentText = newDocument.getText()
      const maybeParsedText = parseRawDialogue(documentText)

      if (!maybeParsedText) {
        console.error("JSON parsing failed!!!")
        window.showErrorMessage("JSON parsing failed!!! From file `DialogueMessageManager`")
        throw new Error("JSON parsing failed!!!")
      }
      const parsedText = maybeParsedText

      // now we have real scenes
      const scenes = fromDialogue(parsedText)
      store.setScenes(StoreUpdateSource.Extension, scenes)
    })

    // message sender for webview messages
    const webviewListener = webviewPanel.webview.onDidReceiveMessage(message => {
      const webviewMessage = message as SceneMessage

      if (webviewMessage.messageType === "deleteScene") {
        store.deleteScene(StoreUpdateSource.Webview, webviewMessage.sceneId)
      } else {
        store.upsertScene(StoreUpdateSource.Webview, webviewMessage.sceneData)
      }
    })

    ///////////////////////
    // ROUTED FROM STORE //
    ///////////////////////

    // update message handler
    const handleCreateUpdateMessage = (storeMessage: DialogueStoreGenericMessage) => {
      const { messageSource, messageType, sceneData, sceneId } = storeMessage

      // send the message to webview
      // TODO: wait for READY message from webview
      if (messageSource === StoreUpdateSource.Extension) {
        const message: GenericSceneMessage = {
          messageType,
          sceneData,
          sceneId
        }
        webviewPanel.webview.postMessage(message)

      // otherwise it needs to be an update to the text document
      } else {

        // default tab size is 4
        const tabSizeSetting = workspace.getConfiguration("editor").get<number>("tabSize") ?? 4
        const setting: DialogueFileFormatSettings = {
          prettify: true,
          indentationSize: tabSizeSetting
        } 

        const dialogueDocument = new DialogueDocument(dialogueTextDocument, setting)
        const scenes = store.getScenes()

        if (!scenes) {
          console.error("NULL value was passed!!! THIS IS A BUG!!!")
          window.showErrorMessage("NULL value was passed!!! THIS IS A BUG!!! From file `DialogueMessageManager`")
          throw new Error("NULL value was passed!!! THIS IS A BUG!!!")
        }

        const dialogueData = toDialogue(scenes, DIALOGUE_FILE_FORMAT_VERSION)

        dialogueDocument.setDialogueText(dialogueData)
      }
    }

    // listeners
    const createListener = store.onSceneCreate(handleCreateUpdateMessage)
    const updateListener = store.onSceneUpdate(handleCreateUpdateMessage)

    // deletions
    const handleDeleteMessage = (storeMessage: DialogueStoreDeleteMessage) => {
      const { messageSource, sceneId, messageType } = storeMessage

      // send to webview
      // TODO: wait for READY message from webview
      if (messageSource === StoreUpdateSource.Extension) {
        const message: DeleteSceneMessage = {
          messageType,
          sceneId
        }
        webviewPanel.webview.postMessage(message)
      
      // otherwise update document
      } else {

        // default tab size is 4
        const tabSizeSetting = workspace.getConfiguration("editor").get<number>("tabSize") ?? 4
        const setting: DialogueFileFormatSettings = {
          prettify: true,
          indentationSize: tabSizeSetting
        } 

        const dialogueDocument = new DialogueDocument(dialogueTextDocument, setting)
        const scenes = store.getScenes()

        if (!scenes) {
          console.error("NULL value was passed!!! THIS IS A BUG!!!")
          window.showErrorMessage("NULL value was passed!!! THIS IS A BUG!!! From file `DialogueMessageManager`")
          throw new Error("NULL value was passed!!! THIS IS A BUG!!!")
        }

        const dialogueData = toDialogue(scenes, DIALOGUE_FILE_FORMAT_VERSION)

        dialogueDocument.setDialogueText(dialogueData)
      }
    }

    const deleteListener = store.onSceneDelete(handleDeleteMessage)

    //////////////////////
    ////// CLEAN UP //////
    //////////////////////

    webviewPanel.onDidDispose(() => {
      webviewListener.dispose()
      textDocumentListener.dispose()
      createListener.dispose()
      updateListener.dispose()
      deleteListener.dispose()
      this.queueDeleteDialogueStore(dialogueTextDocument.uri.toString())
    })
  }

  private queueDeleteDialogueStore(fileUri: string) {
    const exists = this.dialogueStoreMap.has(fileUri)
    if (exists) {
      return
    }

    // TODO: add queue functionality
    // low priority
    this.dialogueStoreMap.delete(fileUri)
  }

  /**
   * Gets a dialogue store, creating a new one if it doesn't exist.
   */
  private getDialogueStore(fileUri: string) {
    let dialogueStore = this.dialogueStoreMap.get(fileUri)
    
    // make a new one if it doesn't exist
    if (!dialogueStore) {
      dialogueStore = new DialogueStore()
      this.dialogueStoreMap.set(fileUri, dialogueStore)
    }
    return dialogueStore
  }

}

const dialogueMessageManager = new DialogueMessageManager()
export default dialogueMessageManager
