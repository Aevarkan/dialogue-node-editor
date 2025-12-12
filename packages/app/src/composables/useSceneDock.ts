// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { computed, ref } from "vue"

export function useSceneDock() {

  const dockedScenes = ref(new Set<string>())
  const listeners = {
    onDockScene: [] as ((sceneId: string) => void)[],
    onUndockScene: [] as ((sceneId: string) => void)[]
  }

  function dockScene(sceneId: string) {
    const alreadyDocked = (dockedScenes.value.has(sceneId))
    if (alreadyDocked) return

    dockedScenes.value.add(sceneId)
    listeners.onDockScene.forEach(fn => fn(sceneId))
  }

  function undockScene(sceneId: string) {
    const wasDeleted = dockedScenes.value.delete(sceneId)
    if (!wasDeleted) return

    listeners.onUndockScene.forEach(fn => fn(sceneId))
  }

  function onDockScene(callback: (sceneId: string) => void) {
    listeners.onDockScene.push(callback)
  }

  function onUndockScene(callback: (sceneId: string) => void) {
    listeners.onUndockScene.push(callback)
  }

  function deleteScene(sceneId: string): boolean {
    return dockedScenes.value.delete(sceneId)
  }

  function isSceneDocked(sceneId: string) {
    return dockedScenes.value.has(sceneId)
  }

  const dockedSceneIds = computed(() => Array.from(dockedScenes.value))


  return { dockScene, undockScene, onDockScene, onUndockScene, isSceneDocked, dockedSceneIds, deleteScene }
}
