import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as pcp from 'promisify-child-process';
import * as decompress from 'decompress';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as settings from './settings';
import download from './download';

export function setUpFerocity(): Promise<void> {
  console.log('Setting up Ferocity...');

  return new Promise<void>((resolve, reject) => {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Setting up Ferocity`,
        cancellable: true,
      },
      () => Promise.all([installJavaIfNeeded(), installFuryIfNeeded()])
        .then(result => {
          setUpSucceeded(result);
          resolve();
        })
        .catch(error => {
          setUpFailed(error);
          reject();
        }));
  });
}

function installJavaIfNeeded(): Promise<string> {
  if (fs.existsSync(settings.javaDirectory)) {
    console.log('Java is already installed.');
    return Promise.resolve(settings.javaDirectory);
  } else {
    return installJava();
  }
}

function installJava(): Promise<string> {
  const javaVersion = 'adopt@1.8';
  const jabbaVersion = '0.11.2';
  const jabbaUrl = `https://github.com/shyiko/jabba/releases/download/${jabbaVersion}/jabba-${jabbaVersion}-${jabbaUrlSuffix()}`;
  const jabbaBin = path.join(settings.jabbaDirectory, 'bin', jabbaBinaryName());

  return mkdirp(settings.jabbaDirectory)
    .then(() => {
      if (fs.existsSync(jabbaBin)) {
        console.log('Jabba is already installed.');
        return Promise.resolve(jabbaBin);
      } else {
        return download(jabbaUrl, jabbaBin);
      }
    })
    .then(() => fs.chmodSync(jabbaBin, 755))
    .then(() => pcp.exec(`${jabbaBin} ls-remote`))
    .then(output => outputToString(output.stdout)
      .split("\n")
      .filter((str) => str.includes(javaVersion))[0]
      .trim())
    .then(java => pcp.spawn(`${jabbaBin}`, ['install', java, '-o', settings.javaDirectory], {}))
    .then(() => settings.javaDirectory);
}

function jabbaBinaryName(): string {
  const isWindows = process.platform === 'win32';
  return isWindows ? 'jabba.exe' : 'jabba';
}

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

function installFuryIfNeeded(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const furyUrl = 'https://gateway.pinata.cloud/ipfs/QmP8PFjpKsbAP3P9EGhkYqLEGrhxg7WfXu536cTjAFNm1b';
    const furyArchivePath = path.join(settings.furyDirectory, 'fury.tar');

    if (fs.existsSync(settings.furyDirectory)) {
      console.log('Fury is already installed.');
      resolve(settings.furyDirectory);
    } else {
      return mkdirp(settings.furyDirectory)
        .then(() => download(furyUrl, furyArchivePath))
        .then(path => decompress(path, settings.furyDirectory).then(() => resolve(settings.furyDirectory)))
        .finally(() => fs.unlinkSync(furyArchivePath))
        .catch(reject);
    }
  });
}

function outputToString(out: Buffer | string | null | undefined): string {
  return out instanceof Buffer ? out.toString('utf8') : out ? <string>out : '';
};

function setUpSucceeded(result: any) {
  const [javaPath, furyPath] = result;
  console.log('Java installation succeeded: ' + javaPath);
  console.log('Fury installation succeeded: ' + furyPath);
}

function setUpFailed(error: string) {
  console.log('Set up failed: ' + error);
}
