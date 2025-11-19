import { CancellationToken, CustomTextEditorProvider, Disposable, ExtensionContext, TextDocument, WebviewPanel, window, workspace } from 'vscode';
import { fromDialogue, parseRawDialogue } from './helpers/dialogueParser';
import dialogueStore from './stores/dialogueStore';
import { StoreUpdateSource } from './storeMessages';
import { getWebviewContent } from './helpers/webviewHelper';


export class VisualDialogueEditor implements CustomTextEditorProvider {
  
  /**
   * Register the provider for this extension.
   * @param context The extension's context.
   * @returns The disposable for the registration.
   */
  public static register(context: ExtensionContext): Disposable {
    const providerInstance = new VisualDialogueEditor(context)
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

    // allow scripts (quite important)
    webviewPanel.webview.options = {
      enableScripts: true
    }

    // initialise
    const webviewContent = getWebviewContent(webviewPanel.webview, this.extensionContext.extensionUri)

    webviewPanel.webview.html = webviewContent

    // changes to our document
    workspace.onDidChangeTextDocument(event => {
      // check if it's our one
      const newDocument = event.document
      const isSelectedDocument = (newDocument.uri.toString() === document.uri.toString())
      if (!isSelectedDocument) {
        return
      }

      // try to parse it
      const documentText = newDocument.getText()
      const maybeParsedText = parseRawDialogue(documentText)

      if (!maybeParsedText) {
        // TODO: throw an error here too, or something that says the parsing failed
        return
      }
      const parsedText = maybeParsedText

      // now we have real scenes
      const scenes = fromDialogue(parsedText)
      scenes.forEach(scene => dialogueStore.upsertScene(StoreUpdateSource.Extension, scene))

    })
  }
}