// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import type { LogicalSceneObject } from "@/classes/LogicalScene"
import type { FlowExportObject } from "@vue-flow/core"

interface VsCodeApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage: (message: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setState: (object: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any
}

interface VsCodeState {
  vueFlow?: FlowExportObject,
  dialogueData: LogicalSceneObject[]
}

let vscodeApi: VsCodeApi | null = null

function getVsCodeApi(): VsCodeApi | null {
  if (!vscodeApi) {
    try {
      // @ts-expect-error this only works in the VSCode webview container
      const checkApi = acquireVsCodeApi() as VsCodeApi | undefined
      if (!checkApi) {
        throw new Error()
      }
      vscodeApi = checkApi
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return null
    }
  }
  return vscodeApi
}

export function useVsCode() {

  const state = getVsCodeApi()?.getState() as VsCodeState ?? { dialogueData: [] } as VsCodeState
  console.log("state: ", state)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function postMessage(message: any) {
    const api = getVsCodeApi()
    if (api) {
      api.postMessage(message)
    } else {
      console.warn('Not running inside a VS Code Webview. Message not sent: ', message)
    }
  }

  function inWebview(): boolean {
    const api = getVsCodeApi()
    if (api) {
      return true
    } else {
      return false
    }
  }

  function updateFlowState(updatedFlow: FlowExportObject) {
    state.vueFlow = updatedFlow
    getVsCodeApi()?.setState(state)
  }

  function getFlowState(): FlowExportObject {
    return state.vueFlow ?? { edges: [], nodes: [], viewport: { x: 0, y: 0, zoom: 1 } } as unknown as FlowExportObject
  }

  function updateDialogueState(updatedScenes: LogicalSceneObject[]) {
    state.dialogueData = updatedScenes
    getVsCodeApi()?.setState(state)
  }

  function getDialogueState() {
    return state.dialogueData
  }

  return { postMessage, inWebview, getFlowState, getDialogueState, updateDialogueState, updateFlowState }
}
