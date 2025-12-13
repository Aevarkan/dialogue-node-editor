// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { workspace } from "vscode";
import { EXTENSION_NAME } from "../constants";

export function useConfig() {

  function getFormatVersion() {
    const formatVersion = workspace.getConfiguration(EXTENSION_NAME).get<string>("fileFormatVersion") ?? "1.14.0"
    return formatVersion
  }

  return { getFormatVersion }
}
