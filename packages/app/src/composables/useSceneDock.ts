// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { computed, ref } from "vue"
import { useLayoutData } from "./useLayoutData"

export function useSceneDock() {

  const { addDockedScene, removeDockedScene, getDockedScenes } = useLayoutData()

  const dockedScenes = ref(new Set<string>())
  // initialised from state
  for (const dockedScene of getDockedScenes()) {
    dockedScenes.value.add(dockedScene)
  }
  
  const listeners = {
    onDockScene: [] as ((sceneId: string) => void)[],
    onUndockScene: [] as ((sceneId: string) => void)[]
  }

  function dockScene(sceneId: string) {
    const alreadyDocked = (dockedScenes.value.has(sceneId))
    if (alreadyDocked) return

    addDockedScene(sceneId)
    dockedScenes.value.add(sceneId)
    listeners.onDockScene.forEach(fn => fn(sceneId))
  }

  function undockScene(sceneId: string) {
    const wasDeleted = dockedScenes.value.delete(sceneId)
    if (!wasDeleted) return

    removeDockedScene(sceneId)
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
