const vscode = require('vscode');

// Data type definitions with descriptions
const dataTypes = {
    'text': {
        description: 'Creates standart text component\n\nThe type of the input or sidebar setting. This value determines the type of field that gets rendered into the editor.',
        detail: 'Text Input Field'
    },
    'image': {
        description: 'Creates image upload component\n\nProvides an interface for uploading and managing images. Includes preview and file selection capabilities.',
        detail: 'Image Upload Field'
    },
    'dropdown': {
        description: 'Creates dropdown selection box\n\nIt should be used with choices dict. Provides a selectable list of predefined options.\n\n[Click to add example choices](command:akinon-schema.addDropdownWithChoices)',
        detail: 'Dropdown Selection Field',
        example: {
            "choices": [
                {
                    "value": "left",
                    "label": "Align left"
                },
                {
                    "value": "right",
                    "label": "Align right"
                }
            ]
        }
    },
    'area': {
        description: 'Provides custom field view and HTML editor\n\nIt is mandatory to have a display field with it. Offers rich text editing capabilities.\n\n[Click to add HTML editor](command:akinon-schema.addHtmlEditor)',
        detail: 'HTML Editor Field',
        example: {
            "display": "html-editor"
        }
    },
    'nested': {
        description: 'Used for nested structures\n\nIt is mandatory to use in nested structures and data_type value of the outermost(root) object must be nested.',
        detail: 'Nested Structure Field'
    }
};

// Widget template
const widgetTemplates = {
    'widget-template': {
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
    },
    'widget-slider': {
        "sliders": {
            "multi": true,
            "schema": {
                "title": {
                    "data_type": "text",
                    "key": "title",
                    "label": "Title"
                },
                "description": {
                    "data_type": "text",
                    "key": "description",
                    "label": "Description"
                },
                "image": {
                    "data_type": "image",
                    "key": "image",
                    "label": "Image"
                },
                "image_mobile": {
                    "data_type": "image",
                    "key": "image_mobile",
                    "label": "Image Mobile"
                },
                "url": {
                    "data_type": "text",
                    "key": "url",
                    "label": "Url"
                }
            },
            "data_type": "nested",
            "key": "sliders",
            "label": "Sliders"
        }
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
        validateHtmlEditorUsage(jsonContent, document, diagnostics);
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

// HTML editor validation function
function validateHtmlEditorUsage(obj, document, diagnostics) {
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            // Check if display is html-editor but data_type is not area
            if (value.display === 'html-editor' && value.data_type !== 'area') {
                const text = document.getText();
                const position = findPropertyPosition(text, 'display', 'html-editor');
                
                const diagnostic = new vscode.Diagnostic(
                    position,
                    'data_type area is required for display html editor!',
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            }
            
            // Check nested objects
            if (value.schema) {
                validateHtmlEditorUsage(value.schema, document, diagnostics);
            }
        }
    }
}

function activate(context) {
    console.log('Congratulations, "akinon-schema" extension is now active!');

    // Register command for adding dropdown with choices
    const addDropdownWithChoices = vscode.commands.registerCommand('akinon-schema.addDropdownWithChoices', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const position = editor.selection.active;
        
        try {
            // Mevcut satırın girintisini al
            const currentLine = document.lineAt(position.line);
            const indent = currentLine.text.match(/^\s*/)[0];
            
            // Sonraki satırları kontrol et
            let hasMoreProperties = false;
            for (let i = position.line + 1; i < document.lineCount; i++) {
                const line = document.lineAt(i).text.trim();
                if (line === '}' || line === '},') {
                    break;
                }
                if (line.includes('"')) {
                    hasMoreProperties = true;
                    break;
                }
            }
            
            // Dropdown ve choices'ı hazırla
            const dropdownText = '"dropdown",\n' + 
                indent + JSON.stringify(dataTypes.dropdown.example, null, 4)
                    .split('\n')
                    .map(line => indent + line.trimEnd())
                    .filter(line => line.trim() !== '')
                    .join('\n')
                    .replace(/^\s*{/, '')
                    .replace(/}\s*$/, '')
                    .trim() + (hasMoreProperties ? ',' : '');
            
            // Dropdown ve choices'ı ekle
            await editor.edit(editBuilder => {
                editBuilder.insert(position, dropdownText);
            });
            
        } catch (e) {
            vscode.window.showErrorMessage('Error adding choices: ' + e.message);
        }
    });

    // Register command for adding HTML editor
    const addHtmlEditor = vscode.commands.registerCommand('akinon-schema.addHtmlEditor', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const position = editor.selection.active;
        
        try {
            // Mevcut satırın girintisini al
            const currentLine = document.lineAt(position.line);
            const indent = currentLine.text.match(/^\s*/)[0];
            
            // Sonraki satırları kontrol et
            let hasMoreProperties = false;
            for (let i = position.line + 1; i < document.lineCount; i++) {
                const line = document.lineAt(i).text.trim();
                if (line === '}' || line === '},') {
                    break;
                }
                if (line.includes('"')) {
                    hasMoreProperties = true;
                    break;
                }
            }
            
            // HTML editor özelliğini hazırla
            const htmlEditorText = '"area",\n' + 
                indent + JSON.stringify(dataTypes.area.example, null, 4)
                    .split('\n')
                    .map(line => indent + line.trimEnd())
                    .filter(line => line.trim() !== '')
                    .join('\n')
                    .replace(/^\s*{/, '')
                    .replace(/}\s*$/, '')
                    .trim() + (hasMoreProperties ? ',' : '');
            
            // HTML editor özelliğini ekle
            await editor.edit(editBuilder => {
                editBuilder.insert(position, htmlEditorText);
            });
            
        } catch (e) {
            vscode.window.showErrorMessage('Error adding HTML editor: ' + e.message);
        }
    });

    // Register completion provider for data_type
    const dataTypeCompletionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', pattern: '**/schema.json' },
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                
                if (linePrefix.trim().endsWith('"data_type":')) {
                    return Object.entries(dataTypes).map(([type, info]) => {
                        const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.EnumMember);
                        
                        // Set detail as a short description
                        item.detail = info.detail;
                        
                        // Create a detailed documentation with markdown
                        const documentation = new vscode.MarkdownString();
                        documentation.isTrusted = true;
                        documentation.supportHtml = true;
                        
                        // Add description with formatting
                        documentation.appendMarkdown(`## ${type}\n\n`);
                        documentation.appendMarkdown(`${info.description}\n\n`);
                        documentation.appendMarkdown('---\n\n');
                        documentation.appendMarkdown(`**Type:** \`${type}\``);
                        
                        item.documentation = documentation;
                        item.insertText = `"${type}"`;
                        
                        // Add kind-specific icon
                        switch(type) {
                            case 'text':
                                item.kind = vscode.CompletionItemKind.Text;
                                break;
                            case 'image':
                                item.kind = vscode.CompletionItemKind.File;
                                break;
                            case 'dropdown':
                                item.kind = vscode.CompletionItemKind.Enum;
                                break;
                            case 'area':
                                item.kind = vscode.CompletionItemKind.Editor;
                                break;
                            case 'nested':
                                item.kind = vscode.CompletionItemKind.Module;
                                break;
                        }
                        
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
        { scheme: 'file', pattern: '**/schema.json' },
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                
                if (linePrefix.includes('widget')) {
                    return Object.entries(widgetTemplates).map(([name, template]) => {
                        const snippetCompletion = new vscode.CompletionItem(name);
                        snippetCompletion.insertText = JSON.stringify(template, null, 4);
                        snippetCompletion.detail = name === 'widget-template' ? 'Basic widget template' : 'Slider widget template';
                        snippetCompletion.documentation = new vscode.MarkdownString(`Template for ${name}`);
                        return snippetCompletion;
                    });
                }
                return undefined;
            }
        }
    );

    // Listen for document changes
    const diagnosticsProvider = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.fileName.endsWith('schema.json')) {
            validateSchema(event.document);
        }
    });

    // When active editor changes
    const activeEditorProvider = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.fileName.endsWith('schema.json')) {
            validateSchema(editor.document);
        }
    });

    // Helper function to find parent object containing current position
    function findParentObject(jsonContent, text, position) {
        const lines = text.split('\n');
        let currentObj = null;
        let depth = 0;
        let inObject = false;
        let objectStart = -1;

        for (let i = 0; i <= position.line; i++) {
            const line = lines[i].trim();
            
            if (line.includes('{')) {
                depth++;
                if (depth === 1) {
                    objectStart = i;
                }
                inObject = true;
            }
            if (line.includes('}')) {
                depth--;
                if (depth === 0) {
                    inObject = false;
                    currentObj = null;
                    objectStart = -1;
                }
            }
            
            if (inObject && line.includes('"data_type":')) {
                const match = line.match(/"data_type":\s*"([^"]+)"/);
                if (match) {
                    currentObj = { 
                        data_type: match[1],
                        startLine: objectStart
                    };
                }
            }
        }
        
        return currentObj;
    }

    // Helper function to find position to insert choices
    function findInsertPosition(document, position) {
        const text = document.getText();
        const lines = text.split('\n');
        let currentLine = position.line;
        let depth = 0;
        let foundStart = false;
        
        // İlk önce başlangıç noktasını bul
        for (let i = currentLine; i >= 0; i--) {
            const line = lines[i];
            if (line.includes('{')) {
                foundStart = true;
                depth++;
            }
            if (line.includes('}')) {
                if (!foundStart) {
                    depth--;
                }
            }
        }
        
        // Şimdi bitiş noktasını bul
        for (let i = currentLine; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('{')) {
                depth++;
            }
            if (line.includes('}')) {
                depth--;
                if (depth === 0) {
                    // Son kapanış parantezinden önce ekle
                    return new vscode.Position(i, line.indexOf('}'));
                }
            }
        }
        
        return position;
    }

    context.subscriptions.push(
        addDropdownWithChoices,
        addHtmlEditor,
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