import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as decompress from 'decompress';
import mkdirp = require('mkdirp');
import download from './download';

export default function installFury(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const furyUrl = 'https://gateway.pinata.cloud/ipfs/QmP8PFjpKsbAP3P9EGhkYqLEGrhxg7WfXu536cTjAFNm1b';
    const furyArchiveDirectory = path.join(os.homedir(), '.ferocity', 'fury');
    const furyArchive = path.join(furyArchiveDirectory, 'fury.tar');
    const furyDestination = path.join(furyArchiveDirectory, 'fury');

    return mkdirp(furyArchiveDirectory)
      .then(() => download(furyUrl, furyArchive))
      .then(path => decompress(path, furyDestination).then(() => resolve(furyDestination)))
      .finally(() => fs.unlinkSync(furyArchive))
      .catch(reject);
  });
}
