const vscode = require('vscode');

// Data type definitions with descriptions
const dataTypes = {
    'text': {
        description: 'Creates standart text component',
        detail: 'Text Component'
    },
    'image': {
        description: 'Creates image upload component',
        detail: 'Image Upload Component'
    },
    'dropdown': {
        description: 'Creates dropdown selection box. It should used with choices dict.',
        detail: 'Dropdown Component'
    },
    'area': {
        description: 'Provides custom field view and is used to create HTML editor. It is mandatory to have a display field with it.',
        detail: 'HTML Editor Component'
    },
    'nested': {
        description: 'It is mandatory to use in nested structures and data_type value of the outermost(root) object must be nested.',
        detail: 'Nested Structure Component'
    }
};

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
        validateDataTypes(jsonContent, document, diagnostics);
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

function validateDataTypes(obj, document, diagnostics) {
    const validDataTypes = Object.keys(dataTypes);
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            if (value.data_type && !validDataTypes.includes(value.data_type)) {
                const text = document.getText();
                const position = findPropertyPosition(text, 'data_type', value.data_type);
                
                const diagnostic = new vscode.Diagnostic(
                    position,
                    `Invalid data_type. Expected one of: ${validDataTypes.join(', ')}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
            
            if (value.schema) {
                validateDataTypes(value.schema, document, diagnostics);
            }
        }
    }
}

function validateKeysEqualPropertyNames(obj, document, diagnostics) {
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            if (value.key && value.key !== key) {
                // Key property doesn't match object name
                const text = document.getText();
                const position = findKeyValuePosition(text, value.key);
                
                const diagnostic = new vscode.Diagnostic(
                    position,
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

function findPropertyPosition(text, propertyName, propertyValue = null) {
    const lines = text.split('\n');
    let lineIndex = 0;
    let startChar = 0;
    let endChar = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (propertyValue) {
            if (line.includes(`"${propertyName}"`) && line.includes(`"${propertyValue}"`)) {
                lineIndex = i;
                startChar = line.indexOf(`"${propertyValue}"`);
                endChar = startChar + propertyValue.length + 2;
                break;
            }
        } else if (line.includes(`"${propertyName}"`)) {
            lineIndex = i;
            startChar = line.indexOf(`"${propertyName}"`);
            endChar = startChar + propertyName.length + 2;
            break;
        }
    }
    
    return new vscode.Range(
        new vscode.Position(lineIndex, startChar),
        new vscode.Position(lineIndex, endChar)
    );
}

function findKeyValuePosition(text, keyValue) {
    const lines = text.split('\n');
    let lineIndex = 0;
    let startChar = 0;
    let endChar = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(`"key"`) && line.includes(`"${keyValue}"`)) {
            lineIndex = i;
            startChar = line.indexOf(`"${keyValue}"`);
            endChar = startChar + keyValue.length + 2;
            break;
        }
    }
    
    return new vscode.Range(
        new vscode.Position(lineIndex, startChar),
        new vscode.Position(lineIndex, endChar)
    );
}

function activate(context) {
    console.log('Congratulations, "akinon-schema" extension is now active!');

    // Register completion provider for data_type
    const dataTypeCompletionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'json' },
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                
                if (linePrefix.trim().endsWith('"data_type":')) {
                    return Object.entries(dataTypes).map(([type, info]) => {
                        const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.EnumMember);
                        item.detail = info.detail;
                        item.documentation = new vscode.MarkdownString(info.description);
                        item.insertText = `"${type}"`;
                        return item;
                    });
                }
                return undefined;
            }
        },
        ':' // Trigger completion after colon
    );

    // Register completion provider for widget template
    const widgetCompletionProvider = vscode.languages.registerCompletionItemProvider(
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
        dataTypeCompletionProvider,
        widgetCompletionProvider,
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