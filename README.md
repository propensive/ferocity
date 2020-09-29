# Fury extension for Visual Studio Code 

## Installation

### Clone the repository and change directory
```sh
git clone git@github.com:propensive/fury-vscode.git
cd ./fury-vscode
```

### Install Typescript
The extension needs the TypeScript compiler (`tsc`) to build.
```sh
npm install -g typescript
```

### Install dependencies and package the extension
The extension needs to be packaged with [vsce](https://github.com/microsoft/vscode-vsce).
```sh
npm install -g vsce
```

and then:
```sh
npm install
vsce package -o ./fury.vsix
```

It will publish the extension to the current directory.

### Install from VSIX
```
code --install-extension ./fury.vsix
```
