const vscode = require('vscode');

// Widget şablonu
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

function activate(context) {
    console.log('Tebrikler, "akinon-schema" uzantınız aktif!');

    // Otomatik tamamlama sağlayıcısını kaydet
    const provider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'json' },
        {
            provideCompletionItems(document, position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                
                // "widget" kelimesi yazıldığında
                if (linePrefix.includes('widget')) {
                    const snippetCompletion = new vscode.CompletionItem('widget-template');
                    snippetCompletion.insertText = JSON.stringify(widgetTemplate, null, 4);
                    snippetCompletion.detail = 'Widget şablonu';
                    snippetCompletion.documentation = 'Standart widget şablonunu ekler';
                    return [snippetCompletion];
                }
                return undefined;
            }
        }
    );

    context.subscriptions.push(provider);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
} 