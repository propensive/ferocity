import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as pcp from 'promisify-child-process';
import * as decompress from 'decompress';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import download from './download';

function jabbaUrlSuffix(): string {
  const runnerOs = process.platform;
  switch (runnerOs.toLowerCase()) {
    case 'linux':
      return 'linux-amd64';
    case 'darwin':
      return 'darwin-amd64';
    case 'win32':
      return 'windows-amd64.exe';
    default:
      throw new Error(`unknown runner OS: ${runnerOs}, expected one of Linux, macOS or Windows.`);
  }
}

function jabbaBinaryName(): string {
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    return 'jabba.exe';
  } else {
    return 'jabba';
  }
}

function outputToString(out: Buffer | string | null | undefined): string {
  return out instanceof Buffer ? out.toString('utf8') : out ? <string>out : '';
};

function installJavaIfNeeded(): Promise<string> {
  const ferocityDirectory = path.join(os.homedir(), '.ferocity');

  const javaVersion = 'adopt@1.8';
  const javaDirectory = path.join(ferocityDirectory, 'java');

  const jabbaVersion = '0.11.2';
  const jabbaUrl = `https://github.com/shyiko/jabba/releases/download/${jabbaVersion}/jabba-${jabbaVersion}-${jabbaUrlSuffix()}`;
  const jabbaDirectory = path.join(ferocityDirectory, 'jabba', 'bin');
  const jabbaBinPath = path.join(jabbaDirectory, jabbaBinaryName());

  if (fs.existsSync(javaDirectory)) {
    console.log('Java already installed.');
    return Promise.resolve(javaDirectory);
  } else {
    return mkdirp(jabbaDirectory)
      .then(() => {
        if (fs.existsSync(jabbaBinPath)) {
          console.log('Jabba already installed.');
          return Promise.resolve(jabbaBinPath);
        } else {
          return download(jabbaUrl, jabbaBinPath);
        }
      })
      .then(() => fs.chmodSync(jabbaBinPath, 755))
      .then(() => pcp.exec(`${jabbaBinPath} ls-remote`))
      .then(output => outputToString(output.stdout)
        .split("\n")
        .filter((str) => str.includes(javaVersion))[0]
        .trim())
      .then(java => pcp.spawn(`${jabbaBinPath}`, ['install', java, '-o', javaDirectory], {}))
      .then(() => javaDirectory);
  }
}

function installFuryIfNeeded(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const furyUrl = 'https://gateway.pinata.cloud/ipfs/QmP8PFjpKsbAP3P9EGhkYqLEGrhxg7WfXu536cTjAFNm1b';
    const furyDirectory = path.join(os.homedir(), '.ferocity', 'fury');
    const furyArchivePath = path.join(furyDirectory, 'fury.tar');

    if (fs.existsSync(furyDirectory)) {
      console.log('Fury already installed.');
      resolve(furyDirectory);
    } else {
      return mkdirp(furyDirectory)
        .then(() => download(furyUrl, furyArchivePath))
        .then(path => decompress(path, furyDirectory).then(() => resolve(furyDirectory)))
        .finally(() => fs.unlinkSync(furyArchivePath))
        .catch(reject);
    }
  });
}

export function setUpFerocity(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Setting up Ferocity`,
      cancellable: true,
    }, () => Promise.all([installJavaIfNeeded(), installFuryIfNeeded()])
      .then(result => {
        const [javaPath, furyPath] = result;
        console.log('Java installation succeeded: ' + javaPath);
        console.log('Fury installation succeeded: ' + furyPath);
        resolve();
      })
      .catch(error => {
        console.log('Setting up failed: ' + error);
        reject();
      }));
  });
}
