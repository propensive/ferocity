import fetch from 'node-fetch';
import * as fs from 'fs';
import { pipeline } from 'stream';

export default function download(url: string, outputFile: string): Promise<string> {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error while downloading file from ${url}`);
      }
      return new Promise<string>((resolve, reject) => {
        pipeline(
          response.body,
          fs.createWriteStream(outputFile)
            .on('close', () => {
              resolve('File download succeeded: ' + outputFile);
            }),
          error => {
            if (error) {
              reject(error);
            }
          }
        );
      });
    })
    .then(() => outputFile);
}
