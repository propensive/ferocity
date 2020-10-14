import * as path from 'path';
import fetch from 'node-fetch';
import * as fs from 'fs';
import mkdirp = require('mkdirp');
import * as pcp from 'promisify-child-process';
import * as os from 'os';
import { promisify } from 'util';
import { pipeline } from 'stream';

const defaultJabbaVersion = "0.11.2";

function sleep(milliseconds: number) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

export default function installJava(javaVersion: string, jabbaVersion: string = defaultJabbaVersion): Promise<string> {
  const binDirectory = path.join(os.homedir(), '.ferocity', 'bin');

  const jabbaUrl = `https://github.com/shyiko/jabba/releases/download/${jabbaVersion}/jabba-${jabbaVersion}-${jabbaUrlSuffix()}`;
  const jabbaPath = path.join(binDirectory, jabbaBinaryName());

  // TODO: check if jabba is already installed and if Java
  return mkdirp(binDirectory)
    .then(() => download(jabbaUrl, jabbaPath))
    .then(() => {
      return pcp.exec(`${jabbaPath} ls-remote`);
    })
    .then(out => outputToString(out.stdout)
      .split("\n")
      .filter((str) => str.includes(javaVersion))[0]
      .trim())
    .then(java => pcp.spawn(`${jabbaPath}`, ['install', java], {})
      .then(() => pcp.exec(`${jabbaPath} which --home ${java}`))
      .then(e => outputToString(e.stdout).trim()));
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

function jabbaBinaryName(): string {
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    return 'jabba.exe';
  } else {
    return 'jabba';
  }
}

function download(url: string, outputFile: string): Promise<string> {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error while downloading Java from ${url}`);
      }
      return new Promise<string>((resolve, reject) => {
        pipeline(
          response.body,
          fs.createWriteStream(outputFile)
            .on('close', () => {
              fs.chmodSync(outputFile, 755);
              resolve('Jabba installation succeeded: ' + outputFile);
            }),
          error => {
            if (error !== undefined) {
              reject(error);
            }
          }
        );
      });
    })
    .then(() => outputFile);
}

function outputToString(out: Buffer | string | null | undefined): string {
  return out instanceof Buffer ? out.toString('utf8') : out ? <string>out : '';
};
