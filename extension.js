const vscode = require('vscode');

// Widget template
const widgetTemplate = {
    "sliders": {
        "multi": true,
        "schema": {
            "name": {
                "data_type": "text",
                "key": "name",
                "label": "Name"
            },
            "slug": {
                "data_type": "text",
                "key": "slug",
                "label": "Slug"
            }
        },
        "data_type": "nested",
        "key": "sliders",
        "label": "Sliders"
    }
};

// Diagnostic collection
const diagnosticCollection = vscode.languages.createDiagnosticCollection('akinon-schema');

// Schema validation functions
function validateSchema(document) {
    const text = document.getText();
    const diagnostics = [];
    
    try {
        const jsonContent = JSON.parse(text);
        validateKeysEqualPropertyNames(jsonContent, document, diagnostics);
        validateRequiredProperties(jsonContent, document, diagnostics);
    } catch (e) {
        // JSON parse error
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 1),
            'Invalid JSON format: ' + e.message,
            vscode.DiagnosticSeverity.Error
        );
        diagnostics.push(diagnostic);
    }

    diagnosticCollection.set(document.uri, diagnostics);
}

function validateKeysEqualPropertyNames(obj, document, diagnostics) {
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            if (value.key && value.key !== key) {
                // Key property doesn't match object name
                const text = document.getText();
                const keyPosition = findPropertyPosition(text, key, value.key);
                
                const diagnostic = new vscode.Diagnostic(
                    keyPosition,
                    `Keys should equal object names! Expected: "${key}", Found: "${value.key}"`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
            
            // Check nested objects
            if (value.schema) {
                validateKeysEqualPropertyNames(value.schema, document, diagnostics);
            }
        }
    }
}

function validateRequiredProperties(obj, document, diagnostics) {
    const requiredProps = ['data_type', 'key', 'label'];
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            const missingProps = requiredProps.filter(prop => !value.hasOwnProperty(prop));
            
            if (missingProps.length > 0) {
                const text = document.getText();
                const objPosition = findPropertyPosition(text, key);
                
                const diagnostic = new vscode.Diagnostic(
                    objPosition,
                    `Missing required properties: ${missingProps.join(', ')}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
            
            // Check nested objects
            if (value.schema) {
                validateRequiredProperties(value.schema, document, diagnostics);
            }
        }
    }
}

function findPropertyPosition(text, propertyName, keyValue = null) {
    const lines = text.split('\n');
    let lineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (keyValue) {
            if (line.includes(`"key"`) && line.includes(`"${keyValue}"`)) {
                lineIndex = i;
                break;
            }
        } else if (line.includes(`"${propertyName}"`)) {
            lineIndex = i;
            break;
        }
    }
    
    return new vscode.Range(
        new vscode.Position(lineIndex, 0),
        new vscode.Position(lineIndex, lines[lineIndex].length)
    );
}

function activate(context) {
    console.log('Congratulations, "akinon-schema" extension is now active!');

    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'json' },
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                
                if (linePrefix.includes('widget')) {
                    const snippetCompletion = new vscode.CompletionItem('widget-template');
                    snippetCompletion.insertText = JSON.stringify(widgetTemplate, null, 4);
                    snippetCompletion.detail = 'Widget template';
                    snippetCompletion.documentation = 'Adds standard widget template';
                    return [snippetCompletion];
                }
                return undefined;
            }
        }
    );

    // Listen for document changes
    const diagnosticsProvider = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'json') {
            validateSchema(event.document);
        }
    });

    // When active editor changes
    const activeEditorProvider = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'json') {
            validateSchema(editor.document);
        }
    });

    context.subscriptions.push(
        completionProvider,
        diagnosticsProvider,
        activeEditorProvider,
        diagnosticCollection
    );
}

function deactivate() {
    diagnosticCollection.clear();
    diagnosticCollection.dispose();
}

module.exports = {
    activate,
    deactivate
} 