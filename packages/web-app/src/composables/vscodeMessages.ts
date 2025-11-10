// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

interface VsCodeApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage: (message: any) => void
}

let vscodeApi: VsCodeApi | null = null

function getVsCodeApi(): VsCodeApi | null {
  if (!vscodeApi) {
    // @ts-expect-error this only works in the VSCode webview container
    const checkApi = acquireVsCodeApi() as VsCodeApi | undefined
    if (checkApi) {
      vscodeApi = checkApi
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

  return { postMessage, inWebview }
}