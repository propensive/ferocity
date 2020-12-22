import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    RequestType,
    ServerOptions
} from 'vscode-languageclient';

export const moduleTypeSuggestions = new RequestType<void, string[], void>('fury/moduleTypeSuggestions');

export function createClient(context: vscode.ExtensionContext): LanguageClient {
    const serverPath = context.asAbsolutePath(path.join('media', 'fury-lsp.jar'));
    const serverOptions: ServerOptions = {
        run: {
            command: 'java',
            args: ['-cp', serverPath, 'fury.lsp.Lsp']
        },
        debug: {
            command: 'java',
            args: ['-cp', serverPath, 'fury.lsp.Lsp']
        }
    };

    const clientOptions: LanguageClientOptions = {};

    return new LanguageClient(
        'ferocity',
        'Ferocity',
        serverOptions,
        clientOptions
    );
}