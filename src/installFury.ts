import * as decompress from 'decompress';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as os from 'os';
import * as path from 'path';
import download from './download';

export default function installFuryIfNeeded(): Promise<string> {
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
