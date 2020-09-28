# Fury extension for Visual Studio Code 

## Installation

### Clone the repository
```
git clone git@github.com:propensive/fury-vscode.git
```

### Package the extension
The extension needs to be packaged with [vsce](https://github.com/microsoft/vscode-vsce). You can install it with `npm`:

```
npm install -g vsce
```

and then:

```
vsce package -o ./fury.vsix
```

It will publish the extension to the current directory.

### Install from VSIX
```
code --install-extension ./fury.vsix
```