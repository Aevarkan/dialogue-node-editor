// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

interface VsCodeApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage: (message: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setState: (object: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function setState(object: any) {
    const api = getVsCodeApi()
    if (api) {
      api.setState(object)
    } else {
      console.warn('Not running inside a VS Code Webview. State not saved: ', object)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getState(): any | undefined {
    const api = getVsCodeApi()
    if (api) {
      return api.getState()
    } else {
      return undefined
    }
  }

  return { postMessage, inWebview, setState, getState }
}