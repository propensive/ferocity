# Fury extension for Visual Studio Code 

## Installation

### Clone the repository
```sh
git clone git@github.com:propensive/fury-vscode.git
```

### Install Typescript
The extension needs the TypeScript compiler (`tsc`) to build.
```sh
npm install -g typescript
```

### Package the extension
The extension needs to be packaged with [vsce](https://github.com/microsoft/vscode-vsce). You can install it with `npm`:
```sh
npm install -g vsce
```

and then:
```sh
vsce package -o ./fury.vsix
```

It will publish the extension to the current directory.

### Install from VSIX
```
code --install-extension ./fury.vsix
```
