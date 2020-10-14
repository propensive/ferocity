# Ferocity: a Fury extension for Visual Studio Code 

## Installation

### Clone the repository and change directory
```sh
git clone git@github.com:propensive/ferocity.git
cd ./ferocity
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
vsce package -o ./ferocity.vsix
```

It will publish the extension to the current directory.

### Install from VSIX
```
code --install-extension ./ferocity.vsix
```
