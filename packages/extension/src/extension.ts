// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import * as vscode from 'vscode';
import { VisualDialogueEditor } from './VisualDialogueEditor';
import { Command } from './classes/Command';
// import { setContext } from './stores/contextStore';

export function activate(context: vscode.ExtensionContext) {
  // setContext(context)
  console.log('Extension activated!');

  const editorDisposable = VisualDialogueEditor.register(context)
  context.subscriptions.push(editorDisposable)

  const openDialogueEditorCommand = Command.registerOpenDialogueEditor()
  context.subscriptions.push(openDialogueEditorCommand)
}

export function deactivate() {}
