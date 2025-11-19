// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { commands, TextDocumentShowOptions, TextEditor, ViewColumn, workspace } from "vscode";
import { EXTENSION_NAME } from "../constants";
import { VisualDialogueEditor } from "../VisualDialogueEditor";

export class Command {

  private static openDialogueEditorCommand = "bedrockDialogueEditor.openGraphEditor"

  public static registerOpenDialogueEditor() {

    const commandHandler = (textEditor: TextEditor) => {

      const configuration = workspace.getConfiguration(EXTENSION_NAME)
      // default setting is true in package.json
      const focusSetting = configuration.get<boolean>("switchFocusOnOpen") ?? true

      // default setting is "beside" defined in package.json
      const openSetting = configuration.get<"active" | "beside">("editorOpenLocation") ?? "beside"
      let viewColumnSetting: ViewColumn
      if (openSetting === "beside") {
        viewColumnSetting = ViewColumn.Beside
      } else {
        viewColumnSetting = ViewColumn.Active
      }
      // console.log(openSetting)

      const openOptions: TextDocumentShowOptions = {
        viewColumn: viewColumnSetting,
        // logical inverse
        preserveFocus: !focusSetting
      }

      commands.executeCommand(
        "vscode.openWith",
        textEditor.document.uri,
        VisualDialogueEditor.viewType,
        openOptions
      )

    }

    const disposable = commands.registerTextEditorCommand(
      this.openDialogueEditorCommand,
      commandHandler
    )
    return disposable
  }

}
