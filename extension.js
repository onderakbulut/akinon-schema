const vscode = require('vscode');

function activate(context) {
    console.log('Tebrikler, "hello-world" uzantınız aktif!');

    let disposable = vscode.commands.registerCommand('hello-world.helloWorld', function () {
        vscode.window.showInformationMessage('Merhaba VS Code\'dan!');
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
} 