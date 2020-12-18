import fetch, { Response } from 'node-fetch';
import * as fs from 'fs';
import { pipeline } from 'stream';

export default function download(url: string, destination: string): Promise<string> {
  console.log(`Downloading from ${url} to ${destination}`);
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`File download from ${url} to ${destination} failed.`);
      }
      return save(url, response, destination);
    })
    .then(() => destination);
}

function save(url: string, response: Response, destination: string) {
  return new Promise<string>((resolve, reject) => {
    pipeline(
      response.body,
      fs.createWriteStream(destination)
        .on('close', () => {
          resolve(`File download from ${url} to ${destination} succeeded.`);
        }),
      error => {
        if (error) {
          reject(error);
        }
      }
    );
  });
}
