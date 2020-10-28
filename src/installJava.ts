import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as os from 'os';
import * as path from 'path';
import * as pcp from 'promisify-child-process';
import download from './download';

export default function installJavaIfNeeded(): Promise<string> {
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
