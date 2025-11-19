// Copyright (c) 2025 Aevarkan
// Licensed under the GPLv3 license

import { CancellationToken, CustomTextEditorProvider, Disposable, ExtensionContext, TextDocument, WebviewPanel, window } from 'vscode';
import dialogueMessageManager from '../managers/DialogueMessageManager';


export class DialogueEditor implements CustomTextEditorProvider {
  
  /**
   * Register the provider for this extension.
   * @param context The extension's context.
   * @returns The disposable for the registration.
   */
  public static register(context: ExtensionContext): Disposable {
    const providerInstance = new DialogueEditor(context)
    const registrationDisposable = window.registerCustomEditorProvider(this.viewType, providerInstance)
    return registrationDisposable
  }

  public static readonly viewType = "bedrockDialogueEditor.graphEditor"

  private readonly extensionContext: ExtensionContext

  private constructor(extensionContext: ExtensionContext) {
    this.extensionContext = extensionContext
  }
  
  public resolveCustomTextEditor(document: TextDocument, webviewPanel: WebviewPanel, token: CancellationToken): Thenable<void> | void {
    
    console.log("Opening!")

    dialogueMessageManager.initialiseConnection(this.extensionContext, document, webviewPanel)
    
  }
}
